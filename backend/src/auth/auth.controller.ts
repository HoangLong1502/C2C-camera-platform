import { Controller, Post, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, GoogleAuthDto, UpdateProfileDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { getJwtUserId, type JwtAuthedRequest } from './types/jwt-user';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('refresh')
    refreshTokens(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshTokens(dto.refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    logout(@Req() req: JwtAuthedRequest) {
        const userId = getJwtUserId(req.user);
        return this.authService.logout(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getProfile(@Req() req: Request & { user: any }) {
        const userId = req.user.userId || req.user.sub;
        return this.authService.getProfile(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('profile')
    updateProfile(@Req() req: JwtAuthedRequest, @Body() dto: UpdateProfileDto) {
        const userId = getJwtUserId(req.user);
        return this.authService.updateProfile(userId, dto);
    }

    @Post('google')
    googleAuth(@Body() dto: GoogleAuthDto) {
        return this.authService.googleAuth(dto);
    }
}
