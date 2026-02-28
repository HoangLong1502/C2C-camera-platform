import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Product } from './product.entity';
import { Order } from './order.entity';
import { ChatMessage } from './chat-message.entity';
import { Review } from './review.entity';
import { Notification } from './notification.entity';
import { Subscription } from './subscription.entity';
import { Promotion } from './promotion.entity';

export enum UserRole {
    BUYER = 'buyer',
    SELLER = 'seller',
    BOTH = 'both',
    ADMIN = 'admin',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    email!: string;

    @Column({ name: 'password_hash', type: 'varchar', nullable: true })
    password!: string | null;

    @Column({ name: 'full_name', type: 'varchar', nullable: true })
    fullName!: string;

    @Column({ type: 'varchar', nullable: true })
    phone!: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.BUYER,
    })
    role!: UserRole;

    @Column({ name: 'avatar_url', type: 'text', nullable: true })
    avatarUrl!: string | null;

    @Column({ type: 'text', nullable: true })
    address!: string;

    @Column({ name: 'bank_account', type: 'varchar', nullable: true })
    bankAccount!: string;

    @Column({ name: 'bank_name', type: 'varchar', nullable: true })
    bankName!: string;

    @Column({ name: 'wallet_balance', type: 'decimal', precision: 12, scale: 2, default: 0 })
    walletBalance!: number;

    @Column({ default: false })
    verified!: boolean;

    @Column({ name: 'verification_code', type: 'varchar', length: 10, nullable: true })
    verificationCode!: string | null;

    @Column({ name: 'reputation_score', type: 'decimal', precision: 3, scale: 2, default: 5.0 })
    reputationScore!: number;

    @Column({ name: 'total_sales', default: 0 })
    totalSales!: number;

    @Column({ name: 'total_transactions', default: 0 })
    totalTransactions!: number;

    @Column({ name: 'is_active', default: true })
    isActive!: boolean;

    @Column({ name: 'refresh_token', type: 'text', nullable: true })
    refreshToken!: string | null;

    @Column({ name: 'google_id', type: 'varchar', nullable: true, unique: true })
    googleId!: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Product, (product) => product.seller)
    products!: Product[];

    @OneToMany(() => Order, (order) => order.buyer)
    purchasedOrders!: Order[];

    @OneToMany(() => Order, (order) => order.seller)
    soldOrders!: Order[];

    @OneToMany(() => ChatMessage, (message) => message.sender)
    messages!: ChatMessage[];

    @OneToMany(() => Review, (review) => review.reviewer)
    reviewsGiven!: Review[];

    @OneToMany(() => Review, (review) => review.reviewedUser)
    reviewsReceived!: Review[];

    @OneToMany(() => Notification, (notification) => notification.user)
    notifications!: Notification[];

    @OneToMany(() => Subscription, (subscription) => subscription.user)
    subscriptions!: Subscription[];

    @OneToMany(() => Promotion, (promotion) => promotion.seller)
    promotions!: Promotion[];
}
