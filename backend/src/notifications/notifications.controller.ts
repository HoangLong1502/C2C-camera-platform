import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get('unread-count')
  getUnreadCount(@Req() req: Request & { user: any }) {
    const userId = req.user.userId ?? req.user.sub;
    return this.notificationsService.getUnreadCount(userId);
  }

  @Get()
  findAll(@Req() req: Request & { user: any }) {
    const userId = req.user.userId ?? req.user.sub;
    return this.notificationsService.findAllByUser(userId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Req() req: Request & { user: any }) {
    const userId = req.user.userId ?? req.user.sub;
    return this.notificationsService.markRead(Number(id), userId);
  }
}
