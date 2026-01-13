import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { User, UserRole } from '../entities/user.entity';
import { RegisterDto, LoginDto, GoogleAuthDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    private googleClient: OAuth2Client;

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {
        // Initialize Google OAuth client
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
        if (clientId && clientSecret) {
            this.googleClient = new OAuth2Client(clientId, clientSecret);
        }
    }

    async register(dto: RegisterDto) {
        // Normalize email (lowercase and trim)
        const normalizedEmail = dto.email.toLowerCase().trim();
        
        const existingUser = await this.userRepository.findOne({
            where: { email: normalizedEmail },
        });

        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = this.userRepository.create({
            ...dto,
            email: normalizedEmail,
            password: hashedPassword,
        });

        const savedUser = await this.userRepository.save(user);

        const { password, refreshToken, ...result } = savedUser;
        return result;
    }

    async login(dto: LoginDto) {
        // Find user by email (case-insensitive)
        const user = await this.userRepository.findOne({
            where: { 
                email: dto.email.toLowerCase().trim(), 
                isActive: true 
            },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Check if user has a password (not a Google-only account)
        if (!user.password) {
            throw new UnauthorizedException('Please sign in with Google for this account');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const tokens = await this.generateTokens(user);

        const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
        await this.userRepository.update(user.id, {
            refreshToken: hashedRefreshToken,
        });

        const { password, refreshToken, ...userResult } = user;

        return {
            user: userResult,
            ...tokens,
        };
    }

    async refreshTokens(refreshToken: string) {
        try {
            // Decode the refresh token to get user info
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });

            const userId = payload.sub;
            const user = await this.userRepository.findOne({ where: { id: userId } });

            if (!user || !user.refreshToken) {
                throw new UnauthorizedException('Access denied');
            }

            // Verify the refresh token matches the stored hash
            const tokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);

            if (!tokenMatches) {
                throw new UnauthorizedException('Access denied');
            }

            const tokens = await this.generateTokens(user);

            // Update stored refresh token
            const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
            await this.userRepository.update(user.id, {
                refreshToken: hashedRefreshToken,
            });

            return tokens;
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async logout(userId: number) {
        await this.userRepository.update(userId, { refreshToken: null });
        return { message: 'Logged out successfully' };
    }

    private async generateTokens(user: User) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: this.configService.get('JWT_EXPIRES_IN'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
            }),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }

    async validateUser(userId: number): Promise<User | null> {
        return this.userRepository.findOne({ where: { id: userId } });
    }

    async getProfile(userId: number) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        const { password, refreshToken, ...result } = user;
        return result;
    }

    async googleAuth(dto: GoogleAuthDto) {
        try {
            if (!this.googleClient) {
                throw new UnauthorizedException('Google OAuth is not configured');
            }

            // Verify the Google ID token
            const ticket = await this.googleClient.verifyIdToken({
                idToken: dto.token,
                audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
            });

            const payload = ticket.getPayload();
            if (!payload) {
                throw new UnauthorizedException('Invalid Google token');
            }

            const { sub: googleId, email, name, picture } = payload;

            if (!email) {
                throw new UnauthorizedException('Google account does not have an email');
            }

            // Normalize email
            const normalizedEmail = email.toLowerCase().trim();

            // Check if user exists by Google ID or email
            let user = await this.userRepository.findOne({
                where: [
                    { googleId },
                    { email: normalizedEmail },
                ],
            });

            if (user) {
                // Update Google ID if not set
                if (!user.googleId) {
                    user.googleId = googleId;
                    if (picture && !user.avatarUrl) {
                        user.avatarUrl = picture;
                    }
                    await this.userRepository.save(user);
                }
            } else {
                // Create new user
                user = this.userRepository.create({
                    email: normalizedEmail,
                    fullName: name || 'Google User',
                    googleId,
                    avatarUrl: picture || undefined,
                    password: '', // No password for Google users
                    role: UserRole.BUYER,
                    verified: true, // Google accounts are pre-verified
                    isActive: true,
                });
                user = await this.userRepository.save(user);
            }

            // Generate tokens
            const tokens = await this.generateTokens(user);

            // Update refresh token
            const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
            await this.userRepository.update(user.id, {
                refreshToken: hashedRefreshToken,
            });

            const { password, refreshToken, ...userResult } = user;

            return {
                user: userResult,
                ...tokens,
            };
        } catch (error) {
            console.error('Google auth error:', error);
            throw new UnauthorizedException('Google authentication failed');
        }
    }

    async ensureAdminExists() {
        const admin = await this.userRepository.findOne({
            where: { email: 'admin@admin.com' },
        });

        if (!admin) {
            const hashedPassword = await bcrypt.hash('123', 10);
            const adminUser = this.userRepository.create({
                email: 'admin@admin.com',
                password: hashedPassword,
                fullName: 'Administrator',
                role: UserRole.ADMIN,
                verified: true,
                isActive: true,
            });
            await this.userRepository.save(adminUser);
            console.log('✅ Admin account created: admin@admin.com / 123');
        } else if (admin.role !== UserRole.ADMIN) {
            admin.role = UserRole.ADMIN;
            admin.isActive = true;
            await this.userRepository.save(admin);
            console.log('✅ Admin account updated: admin@admin.com / 123');
        }
    }
}
