import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { User } from './user.entity';

export enum CommissionStatus {
    PENDING = 'pending',
    CALCULATED = 'calculated',
    PAID = 'paid',
}

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'order_id' })
    orderId!: number;

    @Column({ name: 'seller_id' })
    sellerId!: number;

    @Column({ name: 'buyer_id' })
    buyerId!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount!: number;

    @Column({ name: 'commission_rate', type: 'decimal', precision: 3, scale: 2, default: 0.05 })
    commissionRate!: number;

    @Column({ name: 'commission_amount', type: 'decimal', precision: 10, scale: 2 })
    commissionAmount!: number;

    @Column({ name: 'seller_payout', type: 'decimal', precision: 10, scale: 2 })
    sellerPayout!: number;

    @Column({ name: 'platform_revenue', type: 'decimal', precision: 10, scale: 2 })
    platformRevenue!: number;

    @Column({
        name: 'commission_status',
        type: 'enum',
        enum: CommissionStatus,
        default: CommissionStatus.PENDING,
    })
    commissionStatus!: CommissionStatus;

    @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
    paidAt: Date | null;

    @ManyToOne(() => Order, (order) => order.transactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'seller_id' })
    seller: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'buyer_id' })
    buyer: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
