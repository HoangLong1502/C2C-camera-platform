import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { OrderItem } from './order-item.entity';
import { Transaction } from './transaction.entity';

export enum OrderStatus {
    PENDING = 'pending',
    PAYMENT_RECEIVED = 'payment_received',
    PROCESSING = 'processing',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
    COMPLETED = 'completed',
}

export enum PaymentStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REFUNDED = 'refunded',
}

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'buyer_id' })
    buyerId!: number;

    @Column({ name: 'seller_id' })
    sellerId!: number;

    @Column({ name: 'customer_name' })
    customerName!: string;

    @Column({ name: 'customer_phone' })
    customerPhone!: string;

    @Column({ name: 'customer_address', type: 'text' })
    customerAddress!: string;

    @Column({ name: 'total_price', type: 'decimal', precision: 12, scale: 2 })
    totalPrice!: number;

    @Column({ name: 'commission_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
    commissionAmount!: number;

    @Column({ name: 'shipping_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
    shippingFee!: number;

    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    status!: OrderStatus;

    @Column({
        name: 'payment_status',
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    paymentStatus!: PaymentStatus;

    @Column({ name: 'payment_method', nullable: true })
    paymentMethod!: string;

    @Column({ name: 'tracking_number', nullable: true })
    trackingNumber!: string;

    @Column({ name: 'estimated_delivery', type: 'date', nullable: true })
    estimatedDelivery!: Date;

    @Column({ type: 'text', nullable: true })
    notes!: string;

    @ManyToOne(() => User, (user) => user.purchasedOrders)
    @JoinColumn({ name: 'buyer_id' })
    buyer: User;

    @ManyToOne(() => User, (user) => user.soldOrders)
    @JoinColumn({ name: 'seller_id' })
    seller: User;

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    items: OrderItem[];

    @OneToMany(() => Transaction, (transaction) => transaction.order)
    transactions: Transaction[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
