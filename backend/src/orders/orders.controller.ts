import { Controller, Post, Body, Get, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto, @Req() req: Request & { user: any }) {
    const userId = req.user.userId ?? req.user.sub;
    return this.ordersService.create(userId, dto);
  }

  @Get()
  list(@Query('role') role: 'buyer' | 'seller', @Req() req: Request & { user: any }) {
    const userId = req.user.userId ?? req.user.sub;
    return this.ordersService.listForUser(userId, role || 'buyer');
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request & { user: any }) {
    const userId = req.user.userId ?? req.user.sub;
    return this.ordersService.findOneForUser(Number(id), userId);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: Request & { user: any }) {
    const userId = req.user.userId ?? req.user.sub;
    return this.ordersService.cancel(Number(id), userId);
  }

  @Patch(':id/pay-with-wallet')
  payWithWallet(@Param('id') id: string, @Req() req: Request & { user: any }) {
    const userId = req.user.userId ?? req.user.sub;
    return this.ordersService.payWithWallet(Number(id), userId);
  }

  @Patch(':id/seller/status')
  updateStatusAsSeller(
    @Param('id') id: string,
    @Body() body: { status: 'processing' | 'shipped'; trackingNumber?: string },
    @Req() req: Request & { user: any },
  ) {
    const userId = req.user.userId ?? req.user.sub;
    return this.ordersService.updateStatusAsSeller(Number(id), userId, body.status, body.trackingNumber);
  }

  @Patch(':id/buyer/confirm-received')
  confirmReceived(@Param('id') id: string, @Req() req: Request & { user: any }) {
    const userId = req.user.userId ?? req.user.sub;
    return this.ordersService.confirmReceived(Number(id), userId);
  }
}
