import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_rooms')
export class ChatRoom {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user1_id' })
    user1Id: number;

    @Column({ name: 'user2_id' })
    user2Id: number;

    @Column({ name: 'product_id', nullable: true })
    productId: number;

    @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
    lastMessageAt: Date;

    @OneToMany(() => ChatMessage, (message) => message.room)
    messages: ChatMessage[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
