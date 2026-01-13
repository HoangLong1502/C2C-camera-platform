import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum SubscriptionStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    EXPIRED = 'expired',
    CANCELLED = 'cancelled',
}

export enum PackageType {
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
}

@Entity('subscriptions')
export class Subscription {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id' })
    userId: number;

    @Column({ name: 'package_name', length: 100 })
    packageName: string;

    @Column({
        name: 'package_type',
        type: 'enum',
        enum: PackageType,
    })
    packageType: PackageType;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ type: 'jsonb', nullable: true })
    features: Record<string, any>;

    @Column({
        type: 'enum',
        enum: SubscriptionStatus,
        default: SubscriptionStatus.ACTIVE,
    })
    status: SubscriptionStatus;

    @Column({ name: 'started_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    startedAt: Date;

    @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
    expiresAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
