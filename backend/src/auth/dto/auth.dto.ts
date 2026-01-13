import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../entities/user.entity';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    fullName: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;
}

export class LoginDto {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @IsString()
    @MinLength(1, { message: 'Password is required' })
    password: string;
}

export class RefreshTokenDto {
    @IsString()
    refreshToken: string;
}

export class GoogleAuthDto {
    @IsString()
    token: string;
}
