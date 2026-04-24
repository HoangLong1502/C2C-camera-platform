import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { User } from './user.entity';

export enum PaymentStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REFUNDED = 'refunded',
}

@Entity('payments')
export class Payment {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'order_id' })
    orderId!: number;

    @Column({ name: 'user_id' })
    userId!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount!: number;

    @Column({ default: 'VND', length: 3 })
    currency!: string;

    @Column({ name: 'payment_method', type: 'varchar', length: 50, nullable: true })
    paymentMethod!: string | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    provider!: string | null; // vnpay, momo, stripe

    @Column({ name: 'transaction_id', type: 'varchar', nullable: true })
    transactionId!: string | null;

    @Column({
        name: 'payment_status',
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    paymentStatus!: PaymentStatus;

    @Column({ type: 'jsonb', nullable: true })
    metadata!: Record<string, unknown> | null;

    @ManyToOne(() => Order, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
