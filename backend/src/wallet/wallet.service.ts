import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { WalletTopup, WalletTopupStatus } from '../entities/wallet-topup.entity';

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatVnpDate(d: Date) {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}

function sortObject(obj: Record<string, any>) {
  const sorted: Record<string, any> = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = obj[key];
    });
  return sorted;
}

function buildQueryString(params: Record<string, any>) {
  return Object.keys(params)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key]))}`)
    .join('&');
}

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(WalletTopup) private topupRepo: Repository<WalletTopup>,
    private config: ConfigService,
  ) {}

  async getBalance(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User không tồn tại');
    return { walletBalance: Number(user.walletBalance ?? 0) };
  }

  async createVnpayPayment(userId: number, amount: number, ipAddr: string) {
    const vnpUrl = this.config.get<string>('VNP_URL');
    const vnpTmnCode = this.config.get<string>('VNP_TMN_CODE');
    const vnpHashSecret = this.config.get<string>('VNP_HASH_SECRET');
    const backendPublicUrl = this.config.get<string>('BACKEND_PUBLIC_URL');

    if (!vnpUrl || !vnpTmnCode || !vnpHashSecret || !backendPublicUrl) {
      throw new BadRequestException('VNPay chưa được cấu hình (VNP_URL, VNP_TMN_CODE, VNP_HASH_SECRET, BACKEND_PUBLIC_URL)');
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Số tiền không hợp lệ');
    }

    const rounded = Math.round(amount);
    const txnRef = `${Date.now()}${Math.floor(Math.random() * 100000)}`;

    await this.topupRepo.save(
      this.topupRepo.create({
        userId,
        amount: rounded,
        provider: 'vnpay',
        txnRef,
        status: WalletTopupStatus.PENDING,
        metadata: { ipAddr },
      }),
    );

    const now = new Date();
    const expire = new Date(now.getTime() + 15 * 60 * 1000);

    const vnpParams: Record<string, any> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnpTmnCode,
      vnp_Amount: rounded * 100, // VND * 100
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Nap vi user ${userId} (txn ${txnRef})`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: `${backendPublicUrl.endsWith('/') ? backendPublicUrl.slice(0, -1) : backendPublicUrl}/wallet/vnpay/return`,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: formatVnpDate(now),
      vnp_ExpireDate: formatVnpDate(expire),
    };

    const sorted = sortObject(vnpParams);
    const signData = buildQueryString(sorted);
    const secureHash = crypto.createHmac('sha512', vnpHashSecret).update(signData, 'utf-8').digest('hex');

    const paymentUrl = `${vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;
    return { paymentUrl, txnRef };
  }

  verifyVnpayReturn(query: Record<string, any>) {
    const vnpHashSecret = this.config.get<string>('VNP_HASH_SECRET');
    if (!vnpHashSecret) throw new BadRequestException('VNPay chưa được cấu hình (VNP_HASH_SECRET)');

    const input = { ...query };
    const secureHash = input.vnp_SecureHash;
    delete input.vnp_SecureHash;
    delete input.vnp_SecureHashType;

    const sorted = sortObject(input);
    const signData = buildQueryString(sorted);
    const checkHash = crypto.createHmac('sha512', vnpHashSecret).update(signData, 'utf-8').digest('hex');

    return { isValid: secureHash && checkHash === secureHash, computed: checkHash };
  }

  async handleVnpayResult(query: Record<string, any>, source: 'return' | 'ipn') {
    const { isValid } = this.verifyVnpayReturn(query);
    if (!isValid) {
      return { ok: false, message: 'Sai chữ ký' };
    }

    const txnRef = String(query.vnp_TxnRef || '');
    const responseCode = String(query.vnp_ResponseCode || '');
    const transactionStatus = String(query.vnp_TransactionStatus || '');
    const vnpTransactionNo = query.vnp_TransactionNo ? String(query.vnp_TransactionNo) : null;

    if (!txnRef) {
      return { ok: false, message: 'Thiếu mã giao dịch' };
    }

    const topup = await this.topupRepo.findOne({ where: { txnRef } });
    if (!topup) {
      return { ok: false, message: 'Giao dịch không tồn tại' };
    }

    // idempotent: if already success, just return
    if (topup.status === WalletTopupStatus.SUCCESS) {
      return { ok: true, topup, credited: false };
    }

    const isSuccess = responseCode === '00' && (transactionStatus === '' || transactionStatus === '00');

    topup.providerResponseCode = responseCode || null;
    topup.providerTransactionNo = vnpTransactionNo;
    topup.metadata = { ...(topup.metadata || {}), source, query };

    if (!isSuccess) {
      topup.status = WalletTopupStatus.FAILED;
      await this.topupRepo.save(topup);
      return { ok: false, topup, credited: false, message: 'Thanh toán thất bại' };
    }

    topup.status = WalletTopupStatus.SUCCESS;
    await this.topupRepo.save(topup);

    await this.userRepo.increment({ id: topup.userId }, 'walletBalance', topup.amount);
    return { ok: true, topup, credited: true };
  }
}

