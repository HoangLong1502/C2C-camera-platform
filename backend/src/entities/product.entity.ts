import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { Review } from './review.entity';
import { Promotion } from './promotion.entity';

export enum ProductStatus {
    DRAFT = 'draft',
    PENDING_APPROVAL = 'pending_approval',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    SUSPENDED = 'suspended',
    SOLD = 'sold',
}

export enum ProductCondition {
    USED = 'used',           // Đã qua sử dụng
    NEW = 'new',             // Mới
    LIKE_NEW = 'like_new',   // Như mới
    OLD = 'old',             // Cũ
    DAMAGED = 'damaged',     // Nát
}

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    price: number;

    @Column({ name: 'category_id', nullable: true })
    categoryId: number;

    @Column({ type: 'jsonb', nullable: true })
    images: string[];

    @Column({
        type: 'enum',
        enum: ProductCondition,
        default: ProductCondition.USED,
    })
    condition: ProductCondition;

    @Column({
        type: 'enum',
        enum: ProductStatus,
        default: ProductStatus.APPROVED, // Auto-approve by default, moderation will be added later
    })
    status: ProductStatus;

    @Column({ default: 0 })
    stock: number;

    @Column({ type: 'varchar', nullable: true })
    location: string;

    @Column({ default: 0 })
    views: number;

    @Column({ name: 'sold_count', default: 0 })
    soldCount: number;

    @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
    rating: number;

    @Column({ name: 'review_count', default: 0 })
    reviewCount: number;

    @Column({ default: false })
    featured: boolean;

    @Column({ name: 'premium_promotion', default: false })
    premiumPromotion: boolean;

    @Column({ name: 'seller_id' })
    sellerId: number;

    @ManyToOne(() => User, (user) => user.products)
    @JoinColumn({ name: 'seller_id' })
    seller: User;

    @ManyToOne(() => Category, (category) => category.products, { nullable: true })
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @OneToMany(() => Review, (review) => review.product)
    reviews: Review[];

    @OneToMany(() => Promotion, (promotion) => promotion.product)
    promotions: Promotion[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
