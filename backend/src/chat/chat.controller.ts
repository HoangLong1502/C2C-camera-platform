import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('room')
  async getOrCreateRoom(
    @Req() req: Request & { user: any },
    @Body() body: { sellerId: number; productId: number },
  ) {
    const userId = req.user.userId ?? req.user.sub;
    return this.chatService.getOrCreateRoom(userId, body.sellerId, body.productId);
  }

  @Get('room/:roomId/messages')
  async getMessages(@Param('roomId') roomId: string, @Req() req: Request & { user: any }) {
    const userId = req.user.userId ?? req.user.sub;
    return this.chatService.getMessages(parseInt(roomId, 10), userId);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: Request & { user: any }) {
    const userId = req.user.userId ?? req.user.sub;
    return this.chatService.getUnreadCount(userId);
  }

  @Get('rooms')
  async getAllRooms(@Req() req: Request & { user: any }) {
    const userId = req.user.userId ?? req.user.sub;
    return this.chatService.getAllRoomsForUser(userId);
  }

  @Get('rooms/by-product/:productId')
  async getRoomsByProduct(
    @Param('productId') productId: string,
    @Req() req: Request & { user: any },
  ) {
    const userId = req.user.userId ?? req.user.sub;
    return this.chatService.getRoomsByProduct(parseInt(productId, 10), userId);
  }
}
