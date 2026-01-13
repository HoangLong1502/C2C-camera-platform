import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id' })
    userId: number;

    @Column({ length: 100 })
    type: string;

    @Column({ length: 255 })
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    link: string;

    @Column({ default: false })
    read: boolean;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
