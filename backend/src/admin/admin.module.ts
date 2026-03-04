import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Product } from '../entities/product.entity';
import { ChatRoom } from '../entities/chat-room.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Product, ChatRoom]),
    NotificationsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
