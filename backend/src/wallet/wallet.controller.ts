import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WalletService } from './wallet.service';
import { ConfigService } from '@nestjs/config';

@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService, private config: ConfigService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    return this.walletService.getBalance(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('vnpay/create-payment')
  createPayment(@Req() req: any, @Body() body: { amount: number }) {
    const userId = req.user.userId ?? req.user.sub;
    const ipAddr =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.socket?.remoteAddress as string) ||
      req.ip ||
      '127.0.0.1';
    return this.walletService.createVnpayPayment(userId, Number(body.amount), ipAddr);
  }

  // VNPay will redirect user here after payment
  @Get('vnpay/return')
  async vnpayReturn(@Query() query: Record<string, any>, @Res() res: Response) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') || '';
    const result = await this.walletService.handleVnpayResult(query, 'return');
    const txnRef = query.vnp_TxnRef ? String(query.vnp_TxnRef) : '';
    const status = result.ok ? 'success' : 'failed';
    const base = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;
    const target = `${base}/wallet/success?status=${encodeURIComponent(status)}&txnRef=${encodeURIComponent(txnRef)}`;
    return res.redirect(target);
  }

  // VNPay server-to-server notify (IPN). Usually GET.
  @Get('vnpay/ipn')
  async vnpayIpn(@Query() query: Record<string, any>) {
    const result = await this.walletService.handleVnpayResult(query, 'ipn');
    if (result.ok) {
      return { RspCode: '00', Message: 'Success' };
    }
    // VNPay expects '97' for invalid signature, '01' order not found, etc.
    const msg = (result as any).message || 'Failed';
    const rsp = msg === 'Sai chữ ký' ? '97' : msg === 'Giao dịch không tồn tại' ? '01' : '99';
    return { RspCode: rsp, Message: msg };
  }
}

