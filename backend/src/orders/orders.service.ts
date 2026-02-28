import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Product } from '../entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async create(buyerId: number, dto: CreateOrderDto) {
    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
      relations: ['seller'],
    });
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }
    if (product.sellerId === buyerId) {
      throw new BadRequestException('Không thể mua sản phẩm của chính mình');
    }
    const stock = Number(product.stock) ?? 0;
    if (stock < dto.quantity) {
      throw new BadRequestException(`Số lượng không đủ. Còn ${stock} sản phẩm`);
    }
    const price = Number(product.price);
    const subtotal = price * dto.quantity;
    const shippingFee = 0;
    const totalPrice = subtotal + shippingFee;

    const order = this.orderRepo.create({
      buyerId,
      sellerId: product.sellerId,
      customerName: dto.customerName.trim(),
      customerPhone: dto.customerPhone.trim(),
      customerAddress: dto.customerAddress.trim(),
      totalPrice,
      shippingFee,
      commissionAmount: 0,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: dto.paymentMethod === 'bank' ? 'bank_transfer' : 'cod',
      notes: dto.notes?.trim() || undefined,
    });
    await this.orderRepo.save(order);

    const item = this.orderItemRepo.create({
      orderId: order.id,
      productId: product.id,
      productName: product.name,
      productPrice: price,
      quantity: dto.quantity,
      subtotal,
    });
    await this.orderItemRepo.save(item);

    return this.orderRepo.findOne({
      where: { id: order.id },
      relations: ['items'],
    });
  }
}
