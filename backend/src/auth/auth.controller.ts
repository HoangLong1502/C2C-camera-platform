import { Controller, Post, Get, Body, UseGuards, Req, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, GoogleAuthDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

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
    async refreshTokens(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshTokens(dto.refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    logout(@Req() req: Request & { user: any }) {
        const userId = req.user.userId || req.user.sub;
        return this.authService.logout(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getProfile(@Req() req: Request & { user: any }) {
        const userId = req.user.userId || req.user.sub;
        return this.authService.getProfile(userId);
    }

    @Post('google')
    async googleAuth(@Body() dto: GoogleAuthDto) {
        return this.authService.googleAuth(dto);
    }
}
