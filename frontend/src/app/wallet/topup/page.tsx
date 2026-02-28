'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Loader2, Wallet } from 'lucide-react';
import Link from 'next/link';

export default function WalletTopupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(50000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTopup = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!Number.isFinite(amount) || amount < 10000) {
      setError('Số tiền tối thiểu 10.000₫');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.post('/wallet/vnpay/create-payment', { amount });
      window.location.href = data.paymentUrl;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tạo thanh toán VNPay');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-neutral-900 flex items-center gap-2 mb-3">
            <Wallet className="w-5 h-5 text-[#5A2475]" /> Nạp tiền qua VNPay
          </h2>
          <label className="block text-sm text-neutral-700 mb-1">Số tiền (VND)</label>
          <input
            type="number"
            min={10000}
            step={1000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full border border-neutral-300 rounded px-3 py-2 text-neutral-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#5A2475]"
          />
          <p className="text-xs text-neutral-500 mt-2">
            Lưu ý: Đây là nạp ví, số dư sẽ được cộng sau khi VNPay xác nhận.
          </p>

          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

          <button
            type="button"
            onClick={handleTopup}
            disabled={loading}
            className="w-full mt-4 py-3 rounded-lg bg-[#963CC3] text-white font-semibold hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {loading ? 'Đang tạo thanh toán...' : 'Tiếp tục với VNPay'}
          </button>
        </div>
      </div>
    </div>
  );
}

