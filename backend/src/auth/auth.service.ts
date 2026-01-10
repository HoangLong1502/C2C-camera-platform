import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async register(dto: RegisterDto) {
        const existingUser = await this.userRepository.findOne({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = this.userRepository.create({
            ...dto,
            password: hashedPassword,
        });

        const savedUser = await this.userRepository.save(user);

        const { password, refreshToken, ...result } = savedUser;
        return result;
    }

    async login(dto: LoginDto) {
        const user = await this.userRepository.findOne({
            where: { email: dto.email, isActive: true },
        });

        if (!user || !(await bcrypt.compare(dto.password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
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

    async refreshTokens(userId: number, refreshToken: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user || !user.refreshToken) {
            throw new UnauthorizedException('Access denied');
        }

        const tokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);

        if (!tokenMatches) {
            throw new UnauthorizedException('Access denied');
        }

        const tokens = await this.generateTokens(user);

        const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
        await this.userRepository.update(user.id, {
            refreshToken: hashedRefreshToken,
        });

        return tokens;
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
}
