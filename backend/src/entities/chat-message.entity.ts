import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ChatRoom } from './chat-room.entity';
import { User } from './user.entity';

@Entity('chat_messages')
export class ChatMessage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'room_id' })
    roomId: number;

    @Column({ name: 'sender_id' })
    senderId: number;

    @Column({ type: 'text' })
    message: string;

    @Column({ name: 'read_at', type: 'timestamp', nullable: true })
    readAt: Date;

    @ManyToOne(() => ChatRoom, (room) => room.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'room_id' })
    room: ChatRoom;

    @ManyToOne(() => User, (user) => user.messages)
    @JoinColumn({ name: 'sender_id' })
    sender: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
