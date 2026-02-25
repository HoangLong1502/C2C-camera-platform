import { IsEmail, IsString, MinLength, IsEnum, IsOptional, Matches, MaxLength, ValidateIf } from 'class-validator';
import { UserRole } from '../../entities/user.entity';

/** Số điện thoại Việt Nam: 10 số, bắt đầu 0 hoặc +84, tiếp theo 3/5/7/8/9 */
const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

export class UpdateProfileDto {
    @IsString()
    @IsOptional()
    @MaxLength(100)
    fullName?: string;

    @IsEmail({}, { message: 'Email không hợp lệ' })
    @IsOptional()
    email?: string;

    @IsOptional()
    @ValidateIf((_, v) => v != null && v !== '')
    @Matches(PHONE_REGEX, {
        message: 'Số điện thoại không hợp lệ. VD: 0912345678 hoặc +84912345678',
    })
    @IsString()
    phone?: string;
}

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
