import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Payment, PaymentStatus as PaymentEntityStatus } from '../entities/payment.entity';
import { Product } from '../entities/product.entity';
import { CommissionStatus, Transaction } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    private notificationsService: NotificationsService,
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

    const savedOrder = await this.orderRepo.manager.transaction(async (manager) => {
      let orderStatus = OrderStatus.PENDING;
      let payStatus = PaymentStatus.PENDING;
      let paymentMethod: string = dto.paymentMethod === 'bank' ? 'bank_transfer' : dto.paymentMethod === 'wallet' ? 'wallet' : 'cod';

      if (dto.paymentMethod === 'wallet') {
        const userRepo = manager.getRepository(User);
        const user = await userRepo
          .createQueryBuilder('u')
          .setLock('pessimistic_write')
          .where('u.id = :id', { id: buyerId })
          .getOne();
        if (!user) {
          throw new BadRequestException('User không tồn tại');
        }

        const balance = Number(user.walletBalance ?? 0);
        const need = Number(totalPrice);
        if (!Number.isFinite(balance) || balance < need) {
          throw new BadRequestException('Số dư ví không đủ để thanh toán');
        }

        user.walletBalance = balance - need;
        await userRepo.save(user);

        orderStatus = OrderStatus.PAYMENT_RECEIVED;
        payStatus = PaymentStatus.COMPLETED;
      }

      const orderRepo = manager.getRepository(Order);
      const orderItemRepo = manager.getRepository(OrderItem);
      const paymentRepo = manager.getRepository(Payment);
      const transactionRepo = manager.getRepository(Transaction);

      const order = orderRepo.create({
        buyerId,
        sellerId: product.sellerId,
        customerName: dto.customerName.trim(),
        customerPhone: dto.customerPhone.trim(),
        customerAddress: dto.customerAddress.trim(),
        totalPrice,
        shippingFee,
        commissionAmount: 0,
        status: orderStatus,
        paymentStatus: payStatus,
        paymentMethod,
        notes: dto.notes?.trim() || undefined,
      });
      await orderRepo.save(order);

      const item = orderItemRepo.create({
        orderId: order.id,
        productId: product.id,
        productName: product.name,
        productPrice: price,
        quantity: dto.quantity,
        subtotal,
      });
      await orderItemRepo.save(item);

      if (dto.paymentMethod === 'wallet') {
        // record payment
        await paymentRepo.save(
          paymentRepo.create({
            orderId: order.id,
            userId: buyerId,
            amount: Number(totalPrice),
            currency: 'VND',
            paymentMethod: 'wallet',
            provider: 'wallet',
            paymentStatus: PaymentEntityStatus.COMPLETED,
            metadata: { kind: 'wallet_purchase' },
          }),
        );

        // pre-calculate transaction/commission (payout later on completion)
        const amount = Number(totalPrice);
        const commissionRate = 0.05;
        const commissionAmount = Math.round(amount * commissionRate);
        const sellerPayout = amount - commissionAmount;
        order.commissionAmount = commissionAmount;
        await orderRepo.save(order);

        const existingTx = await transactionRepo.findOne({ where: { orderId: order.id } });
        if (!existingTx) {
          await transactionRepo.save(
            transactionRepo.create({
              orderId: order.id,
              buyerId,
              sellerId: product.sellerId,
              amount,
              commissionRate,
              commissionAmount,
              sellerPayout,
              platformRevenue: commissionAmount,
              commissionStatus: CommissionStatus.CALCULATED,
            }),
          );
        }
      }

      return orderRepo.findOne({
        where: { id: order.id },
        relations: ['items'],
      });
    });

    if (savedOrder?.id) {
      await this.notificationsService.create(
        product.sellerId,
        'order_created',
        'Có đơn hàng mới',
        `Sản phẩm "${product.name}" đã được đặt. Mã đơn #${savedOrder.id}.`,
        `/orders/${savedOrder.id}`,
      );
    }

    return savedOrder;
  }

  async listForUser(userId: number, role: 'buyer' | 'seller') {
    const where = role === 'buyer' ? { buyerId: userId } : { sellerId: userId };
    return this.orderRepo.find({
      where,
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForUser(orderId: number, userId: number) {
    const order = await this.orderRepo.findOne({
      where: [{ id: orderId, buyerId: userId }, { id: orderId, sellerId: userId }],
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }
    return order;
  }

  async payWithWallet(orderId: number, buyerId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, buyerId },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    if (order.paymentMethod !== 'bank_transfer' || order.paymentStatus !== PaymentStatus.PENDING || order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể thanh toán bằng ví cho đơn chuyển khoản đang chờ thanh toán');
    }

    const totalPrice = Number(order.totalPrice);

    return this.orderRepo.manager.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const userRepo = manager.getRepository(User);
      const paymentRepo = manager.getRepository(Payment);
      const transactionRepo = manager.getRepository(Transaction);

      const locked = await orderRepo
        .createQueryBuilder('o')
        .setLock('pessimistic_write')
        .where('o.id = :id AND o.buyerId = :buyerId', { id: orderId, buyerId })
        .getOne();
      if (!locked) throw new NotFoundException('Đơn hàng không tồn tại');
      if (locked.paymentMethod !== 'bank_transfer' || locked.paymentStatus !== PaymentStatus.PENDING) {
        throw new BadRequestException('Đơn không thể thanh toán bằng ví');
      }

      const user = await userRepo
        .createQueryBuilder('u')
        .setLock('pessimistic_write')
        .where('u.id = :id', { id: buyerId })
        .getOne();
      if (!user) throw new BadRequestException('User không tồn tại');
      const balance = Number(user.walletBalance ?? 0);
      if (balance < totalPrice) throw new BadRequestException('Số dư ví không đủ');

      user.walletBalance = balance - totalPrice;
      await userRepo.save(user);

      locked.paymentMethod = 'wallet';
      locked.paymentStatus = PaymentStatus.COMPLETED;
      locked.status = OrderStatus.PAYMENT_RECEIVED;
      await orderRepo.save(locked);

      await paymentRepo.save(
        paymentRepo.create({
          orderId: locked.id,
          userId: buyerId,
          amount: totalPrice,
          currency: 'VND',
          paymentMethod: 'wallet',
          provider: 'wallet',
          paymentStatus: PaymentEntityStatus.COMPLETED,
          metadata: { kind: 'wallet_purchase_after_bank' },
        }),
      );

      const commissionRate = 0.05;
      const commissionAmount = Math.round(totalPrice * commissionRate);
      const sellerPayout = totalPrice - commissionAmount;
      locked.commissionAmount = commissionAmount;
      await orderRepo.save(locked);

      const existingTx = await transactionRepo.findOne({ where: { orderId: locked.id } });
      if (!existingTx) {
        await transactionRepo.save(
          transactionRepo.create({
            orderId: locked.id,
            buyerId,
            sellerId: locked.sellerId,
            amount: totalPrice,
            commissionRate,
            commissionAmount,
            sellerPayout,
            platformRevenue: commissionAmount,
            commissionStatus: CommissionStatus.CALCULATED,
          }),
        );
      }

      return orderRepo.findOne({ where: { id: locked.id }, relations: ['items'] });
    });
  }

  async findOneForBuyer(orderId: number, buyerId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, buyerId },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }
    return order;
  }

  async cancel(orderId: number, userId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, buyerId: userId },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    // Allow cancel before seller processing
    if (![OrderStatus.PENDING, OrderStatus.PAYMENT_RECEIVED].includes(order.status)) {
      throw new BadRequestException('Không thể huỷ đơn ở trạng thái hiện tại');
    }

    return this.orderRepo.manager.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const userRepo = manager.getRepository(User);
      const paymentRepo = manager.getRepository(Payment);

      const locked = await orderRepo
        .createQueryBuilder('o')
        .setLock('pessimistic_write')
        .where('o.id = :id AND o.buyerId = :buyerId', { id: orderId, buyerId: userId })
        .getOne();
      if (!locked) throw new NotFoundException('Đơn hàng không tồn tại');

      if (![OrderStatus.PENDING, OrderStatus.PAYMENT_RECEIVED].includes(locked.status)) {
        throw new BadRequestException('Không thể huỷ đơn ở trạng thái hiện tại');
      }

      // refund wallet if already paid via wallet
      if (locked.paymentMethod === 'wallet' && locked.paymentStatus === PaymentStatus.COMPLETED) {
        const u = await userRepo
          .createQueryBuilder('u')
          .setLock('pessimistic_write')
          .where('u.id = :id', { id: userId })
          .getOne();
        if (!u) throw new BadRequestException('User không tồn tại');
        u.walletBalance = Number(u.walletBalance ?? 0) + Number(locked.totalPrice);
        await userRepo.save(u);

        locked.paymentStatus = PaymentStatus.REFUNDED;
        await paymentRepo.save(
          paymentRepo.create({
            orderId: locked.id,
            userId,
            amount: Number(locked.totalPrice),
            currency: 'VND',
            paymentMethod: 'wallet_refund',
            provider: 'wallet',
            paymentStatus: PaymentEntityStatus.REFUNDED,
            metadata: { kind: 'wallet_refund' },
          }),
        );
      }

      locked.status = OrderStatus.CANCELLED;
      return orderRepo.save(locked);
    });
  }

  async updateStatusAsSeller(orderId: number, sellerId: number, status: 'processing' | 'shipped', trackingNumber?: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId, sellerId } });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');

    const next = status === 'processing' ? OrderStatus.PROCESSING : OrderStatus.SHIPPED;
    const allowed =
      (next === OrderStatus.PROCESSING && [OrderStatus.PENDING, OrderStatus.PAYMENT_RECEIVED].includes(order.status)) ||
      (next === OrderStatus.SHIPPED && order.status === OrderStatus.PROCESSING);

    if (!allowed) throw new BadRequestException('Không thể cập nhật trạng thái đơn hàng');

    order.status = next;
    if (status === 'shipped' && trackingNumber != null && String(trackingNumber).trim()) {
      order.trackingNumber = String(trackingNumber).trim();
    }
    await this.orderRepo.save(order);

    const msg = order.trackingNumber
      ? `Đơn hàng #${order.id} đã được gửi. Mã vận đơn: ${order.trackingNumber}.`
      : `Đơn hàng #${order.id} đã được cập nhật trạng thái: ${order.status}.`;
    await this.notificationsService.create(order.buyerId, 'order_status', 'Cập nhật đơn hàng', msg, `/orders/${order.id}`);

    return order;
  }

  async confirmReceived(orderId: number, buyerId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId, buyerId } });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    if (order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException('Chỉ có thể xác nhận khi đơn đã được gửi');
    }

    return this.orderRepo.manager.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const txRepo = manager.getRepository(Transaction);
      const userRepo = manager.getRepository(User);

      const locked = await orderRepo
        .createQueryBuilder('o')
        .setLock('pessimistic_write')
        .where('o.id = :id AND o.buyerId = :buyerId', { id: orderId, buyerId })
        .getOne();
      if (!locked) throw new NotFoundException('Đơn hàng không tồn tại');
      if (locked.status !== OrderStatus.SHIPPED) throw new BadRequestException('Không thể xác nhận');

      locked.status = OrderStatus.COMPLETED;
      await orderRepo.save(locked);

      // payout only for wallet-paid orders (for now)
      if (locked.paymentMethod === 'wallet' && locked.paymentStatus === PaymentStatus.COMPLETED) {
        const tx = await txRepo.findOne({ where: { orderId: locked.id } });
        if (tx && tx.commissionStatus !== CommissionStatus.PAID) {
          const seller = await userRepo
            .createQueryBuilder('u')
            .setLock('pessimistic_write')
            .where('u.id = :id', { id: locked.sellerId })
            .getOne();
          if (!seller) throw new BadRequestException('Seller không tồn tại');

          seller.walletBalance = Number(seller.walletBalance ?? 0) + Number(tx.sellerPayout);
          await userRepo.save(seller);

          tx.commissionStatus = CommissionStatus.PAID;
          tx.paidAt = new Date();
          await txRepo.save(tx);

          await this.notificationsService.create(
            locked.sellerId,
            'wallet_payout',
            'Đã giải ngân vào ví',
            `Đơn hàng #${locked.id} đã hoàn thành. Bạn đã nhận ${Math.round(Number(tx.sellerPayout)).toLocaleString('vi-VN')}₫ vào ví.`,
            `/orders/${locked.id}`,
          );
        }
      }

      return locked;
    });
  }
}
