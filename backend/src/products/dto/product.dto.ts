import { IsString, IsNumber, IsOptional, IsEnum, IsArray, Min } from 'class-validator';
import { ProductStatus, ProductCondition } from '../../entities/product.entity';

export class CreateProductDto {
    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsNumber()
    @IsOptional()
    categoryId?: number;

    @IsArray()
    @IsOptional()
    images?: string[];

    @IsEnum(ProductCondition)
    @IsOptional()
    condition?: ProductCondition;

    @IsNumber()
    @Min(0)
    @IsOptional()
    stock?: number;

    @IsString()
    @IsOptional()
    location?: string;
}

export class UpdateProductDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    price?: number;

    @IsArray()
    @IsOptional()
    images?: string[];

    @IsEnum(ProductCondition)
    @IsOptional()
    condition?: ProductCondition;

    @IsNumber()
    @Min(0)
    @IsOptional()
    stock?: number;

    @IsEnum(ProductStatus)
    @IsOptional()
    status?: ProductStatus;
}
