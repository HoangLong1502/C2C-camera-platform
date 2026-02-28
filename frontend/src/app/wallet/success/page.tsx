'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';

function WalletSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();
  const status = searchParams.get('status') || 'failed';
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    // refresh user + fetch latest balance
    refreshUser().catch(() => {});
    apiClient.get('/wallet/me').then((res) => {
      setBalance(Number(res.data?.walletBalance ?? 0));
    }).catch(() => {});
  }, [user, router, refreshUser]);

  const ok = status === 'success';

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-[#5A2475] text-white py-3 px-4 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <Link href="/" className="p-1 rounded hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Nạp ví</h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 pb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          {ok ? (
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-3" />
          ) : (
            <XCircle className="w-14 h-14 text-red-500 mx-auto mb-3" />
          )}
          <h2 className="text-xl font-semibold text-neutral-900">
            {ok ? 'Nạp ví thành công' : 'Nạp ví thất bại'}
          </h2>
          <p className="text-neutral-600 text-sm mt-1">
            {ok ? 'Số dư sẽ được cập nhật ngay.' : 'Vui lòng thử lại hoặc kiểm tra giao dịch VNPay.'}
          </p>

          {balance != null && (
            <p className="text-sm text-neutral-700 mt-3">
              Số dư hiện tại: <span className="font-semibold text-neutral-900">{balance.toLocaleString('vi-VN')}₫</span>
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <Link
              href="/wallet/topup"
              className="flex-1 py-3 rounded-lg border-2 border-[#5A2475]/30 text-[#5A2475] font-semibold text-center hover:bg-[#5A2475]/10"
            >
              Nạp thêm
            </Link>
            <Link
              href="/"
              className="flex-1 py-3 rounded-lg bg-[#5A2475] text-white font-semibold hover:opacity-90 text-center"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WalletSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#5A2475]" />
      </div>
    }>
      <WalletSuccessContent />
    </Suspense>
  );
}

