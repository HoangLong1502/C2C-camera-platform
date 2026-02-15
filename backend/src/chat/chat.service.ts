import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom } from '../entities/chat-room.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { User } from '../entities/user.entity';

export interface RoomWithOtherUser {
  id: number;
  productId: number;
  lastMessageAt: Date | null;
  otherUser: { id: number; fullName: string };
  unreadCount?: number;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomRepo: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private chatMessageRepo: Repository<ChatMessage>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getOrCreateRoom(buyerId: number, sellerId: number, productId: number): Promise<ChatRoom> {
    if (buyerId === sellerId) {
      throw new Error('Không thể chat với chính mình');
    }
    let room = await this.chatRoomRepo.findOne({
      where: [
        { user1Id: buyerId, user2Id: sellerId, productId },
        { user1Id: sellerId, user2Id: buyerId, productId },
      ],
    });
    if (!room) {
      room = this.chatRoomRepo.create({
        user1Id: buyerId,
        user2Id: sellerId,
        productId,
      });
      await this.chatRoomRepo.save(room);
    }
    return room;
  }

  async getRoom(roomId: number, userId: number): Promise<ChatRoom> {
    const room = await this.chatRoomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Phòng chat không tồn tại');
    if (room.user1Id !== userId && room.user2Id !== userId) {
      throw new NotFoundException('Bạn không có quyền xem phòng chat này');
    }
    return room;
  }

  async getMessages(roomId: number, userId: number): Promise<ChatMessage[]> {
    await this.getRoom(roomId, userId);
    const messages = await this.chatMessageRepo.find({
      where: { roomId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
    await this.markMessagesAsRead(roomId, userId);
    return messages;
  }

  async markMessagesAsRead(roomId: number, userId: number): Promise<void> {
    await this.chatMessageRepo
      .createQueryBuilder()
      .update()
      .set({ readAt: new Date() })
      .where('room_id = :roomId', { roomId })
      .andWhere('sender_id != :userId', { userId })
      .andWhere('read_at IS NULL')
      .execute();
  }

  async getUnreadCount(userId: number): Promise<number> {
    const rooms = await this.chatRoomRepo.find({
      where: [{ user1Id: userId }, { user2Id: userId }],
      select: ['id'],
    });
    const roomIds = rooms.map((r) => r.id);
    if (roomIds.length === 0) return 0;
    const result = await this.chatMessageRepo
      .createQueryBuilder('m')
      .where('m.room_id IN (:...roomIds)', { roomIds })
      .andWhere('m.sender_id != :userId', { userId })
      .andWhere('m.read_at IS NULL')
      .getCount();
    return result;
  }

  async getAllRoomsForUser(userId: number): Promise<RoomWithOtherUser[]> {
    const rooms = await this.chatRoomRepo.find({
      where: [
        { user1Id: userId },
        { user2Id: userId },
      ],
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
    });
    const result: RoomWithOtherUser[] = [];
    for (const room of rooms) {
      const otherUserId = room.user1Id === userId ? room.user2Id : room.user1Id;
      const other = await this.userRepo.findOne({
        where: { id: otherUserId },
        select: ['id', 'fullName'],
      });
      const unreadFromOther = await this.chatMessageRepo
        .createQueryBuilder('m')
        .where('m.room_id = :roomId', { roomId: room.id })
        .andWhere('m.sender_id = :otherId', { otherId: otherUserId })
        .andWhere('m.read_at IS NULL')
        .getCount();
      result.push({
        id: room.id,
        productId: room.productId,
        lastMessageAt: room.lastMessageAt,
        otherUser: other
          ? { id: other.id, fullName: other.fullName }
          : { id: otherUserId, fullName: 'Người dùng' },
        unreadCount: unreadFromOther,
      });
    }
    return result;
  }

  async createMessage(roomId: number, senderId: number, message: string): Promise<ChatMessage> {
    await this.getRoom(roomId, senderId);
    const msg = this.chatMessageRepo.create({ roomId, senderId, message });
    await this.chatMessageRepo.save(msg);
    await this.chatRoomRepo.update(roomId, { lastMessageAt: new Date() });
    const withSender = await this.chatMessageRepo.findOne({
      where: { id: msg.id },
      relations: ['sender'],
    });
    if (!withSender) throw new Error('Failed to load message');
    return withSender;
  }

  async getRoomsByProduct(productId: number, userId: number): Promise<RoomWithOtherUser[]> {
    const rooms = await this.chatRoomRepo.find({
      where: [
        { productId, user1Id: userId },
        { productId, user2Id: userId },
      ],
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
    });
    const result: RoomWithOtherUser[] = [];
    for (const room of rooms) {
      const otherUserId = room.user1Id === userId ? room.user2Id : room.user1Id;
      const other = await this.userRepo.findOne({
        where: { id: otherUserId },
        select: ['id', 'fullName'],
      });
      result.push({
        id: room.id,
        productId: room.productId,
        lastMessageAt: room.lastMessageAt,
        otherUser: other
          ? { id: other.id, fullName: other.fullName }
          : { id: otherUserId, fullName: 'Người dùng' },
      });
    }
    return result;
  }
}
