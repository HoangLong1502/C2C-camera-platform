import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'order_id' })
    orderId!: number;

    @Column({ name: 'product_id' })
    productId!: number;

    @Column({ name: 'product_name' })
    productName!: string;

    @Column({ name: 'product_price', type: 'decimal', precision: 12, scale: 2 })
    productPrice!: number;

    @Column()
    quantity!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    subtotal!: number;

    @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
