import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  async create(userId: number, type: string, title: string, message: string, link?: string) {
    const notification = this.notificationRepo.create({
      userId,
      type,
      title,
      message,
      link: link ?? null,
    });
    return this.notificationRepo.save(notification);
  }

  async findAllByUser(userId: number, limit = 50) {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getUnreadCount(userId: number) {
    return this.notificationRepo.count({
      where: { userId, read: false },
    });
  }

  async markRead(id: number, userId: number) {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Thông báo không tồn tại');
    }
    notification.read = true;
    await this.notificationRepo.save(notification);
    return notification;
  }
}
