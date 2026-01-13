import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from './product.entity';
import { User } from './user.entity';

@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'order_id' })
    orderId: number;

    @Column({ name: 'product_id', nullable: true })
    productId: number;

    @Column({ name: 'reviewer_id' })
    reviewerId: number;

    @Column({ name: 'reviewed_user_id' })
    reviewedUserId: number;

    @Column({ type: 'integer' })
    rating: number;

    @Column({ type: 'text', nullable: true })
    comment: string;

    @Column('simple-array', { nullable: true })
    images: string[];

    @Column({ name: 'helpful_count', default: 0 })
    helpfulCount: number;

    @ManyToOne(() => Order, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @ManyToOne(() => Product, { nullable: true })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'reviewer_id' })
    reviewer: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'reviewed_user_id' })
    reviewedUser: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
