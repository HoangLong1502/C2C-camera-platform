import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Product } from './product.entity';
import { Order } from './order.entity';
import { ChatMessage } from './chat-message.entity';

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

    @Column()
    password!: string;

    @Column({ name: 'full_name', nullable: true })
    fullName!: string;

    @Column({ nullable: true })
    phone!: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.BUYER,
    })
    role!: UserRole;

    @Column({ name: 'avatar_url', nullable: true })
    avatarUrl!: string;

    @Column({ type: 'text', nullable: true })
    address!: string;

    @Column({ name: 'bank_account', nullable: true })
    bankAccount!: string;

    @Column({ name: 'bank_name', nullable: true })
    bankName!: string;

    @Column({ default: false })
    verified!: boolean;

    @Column({ name: 'reputation_score', type: 'decimal', precision: 3, scale: 2, default: 5.0 })
    reputationScore!: number;

    @Column({ name: 'total_sales', default: 0 })
    totalSales!: number;

    @Column({ name: 'total_transactions', default: 0 })
    totalTransactions!: number;

    @Column({ name: 'is_active', default: true })
    isActive!: boolean;

    @Column({ name: 'refresh_token', nullable: true })
    refreshToken!: string | null;

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
}
