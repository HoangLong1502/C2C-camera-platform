import { IsInt, IsString, IsIn, Min, MaxLength, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsInt()
  productId: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsIn(['bank', 'cod', 'wallet'], { message: 'Phương thức thanh toán phải là bank, cod hoặc wallet' })
  paymentMethod: 'bank' | 'cod' | 'wallet';

  @IsString()
  @MaxLength(100)
  customerName: string;

  @IsString()
  @MaxLength(20)
  customerPhone: string;

  @IsString()
  @MaxLength(500)
  customerAddress: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
