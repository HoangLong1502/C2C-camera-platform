import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { User } from './user.entity';

export enum DisputeStatus {
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    RESOLVED = 'resolved',
    CLOSED = 'closed',
}

@Entity('disputes')
export class Dispute {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'order_id' })
    orderId: number;

    @Column({ name: 'initiator_id' })
    initiatorId: number;

    @Column({ name: 'respondent_id' })
    respondentId: number;

    @Column({ type: 'text' })
    reason: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: DisputeStatus,
        default: DisputeStatus.OPEN,
    })
    status: DisputeStatus;

    @Column({ type: 'text', nullable: true })
    resolution: string;

    @Column({ name: 'admin_id', nullable: true })
    adminId: number;

    @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
    resolvedAt: Date;

    @ManyToOne(() => Order, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'initiator_id' })
    initiator: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'respondent_id' })
    respondent: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'admin_id' })
    admin: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
