import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';
import { User } from './user.entity';

export enum PromotionType {
    FEATURED = 'featured',
    BANNER = 'banner',
    BOOST = 'boost',
}

export enum PromotionStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    EXPIRED = 'expired',
}

@Entity('promotions')
export class Promotion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'product_id' })
    productId: number;

    @Column({ name: 'seller_id' })
    sellerId: number;

    @Column({
        name: 'promotion_type',
        type: 'enum',
        enum: PromotionType,
    })
    promotionType: PromotionType;

    @Column({ name: 'start_date', type: 'date' })
    startDate: Date;

    @Column({ name: 'end_date', type: 'date' })
    endDate: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    cost: number;

    @Column({
        type: 'enum',
        enum: PromotionStatus,
        default: PromotionStatus.ACTIVE,
    })
    status: PromotionStatus;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'seller_id' })
    seller: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
