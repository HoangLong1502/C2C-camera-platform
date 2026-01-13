import { IsString, IsNumber, IsOptional, IsEnum, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus, ProductCondition } from '../../entities/product.entity';

export class CreateProductDto {
    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsNumber({}, { message: 'Price must be a number' })
    @Type(() => Number)
    @Min(0)
    price: number;

    @IsNumber()
    @Type(() => Number)
    categoryId: number;

    @IsArray()
    @IsOptional()
    images?: string[];

    @IsEnum(ProductCondition)
    condition: ProductCondition;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(0)
    stock?: number;

    @IsString()
    location: string;
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
