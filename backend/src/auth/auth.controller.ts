import { Controller, Post, Body, UseGuards, Req, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
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
    refreshTokens(@Body() dto: RefreshTokenDto) {
        // Extract user from token
        return this.authService.refreshTokens(1, dto.refreshToken); // Simplified
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    logout(@Req() req: Request & { user: any }) {
        return this.authService.logout(req.user.sub);
    }
}
