'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/formatPrice';
import { ArrowLeft, CheckCircle2, Package, XCircle, Loader2, FileText, Wallet } from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productPrice: number | string;
  quantity: number;
  subtotal: number | string;
}

interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  totalPrice: number | string;
  shippingFee: number | string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
}

const PAYMENT_LABEL: Record<string, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  bank_transfer: 'Chuyển khoản ngân hàng',
  wallet: 'Thanh toán bằng ví',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xử lý',
  payment_received: 'Đã thanh toán',
  processing: 'Đang xử lý',
  shipped: 'Đã giao vận',
  delivered: 'Đã giao hàng',
  cancelled: 'Đã huỷ',
  completed: 'Hoàn thành',
};

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [payingWallet, setPayingWallet] = useState(false);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!orderId) {
      setError('Thiếu mã đơn hàng');
      setLoading(false);
      return;
    }
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await apiClient.get(`/orders/${orderId}`);
        setOrder(data);
        refreshUser().catch(() => {});
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải đơn hàng');
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [user, orderId, router, refreshUser]);

  const handleCancel = async () => {
    if (!orderId || !order || (order.status !== 'pending' && order.status !== 'payment_received')) return;
    if (!confirm('Bạn có chắc muốn huỷ đơn hàng này?')) return;
    setCancelling(true);
    setError('');
    try {
      await apiClient.patch(`/orders/${orderId}/cancel`);
      setOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
      refreshUser().catch(() => {});
    } catch (err: any) {
      setError(err.response?.data?.message || 'Huỷ đơn thất bại');
    } finally {
      setCancelling(false);
    }
  };

  const handlePayWithWallet = async () => {
    if (!orderId || !order) return;
    setPayingWallet(true);
    setError('');
    try {
      const { data } = await apiClient.patch(`/orders/${orderId}/pay-with-wallet`);
      setOrder((prev) => (prev ? { ...prev, ...data } : prev));
      refreshUser().catch(() => {});
    } catch (err: any) {
      setError(err.response?.data?.message || 'Thanh toán bằng ví thất bại');
    } finally {
      setPayingWallet(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#5A2475]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-600 mb-4 text-center">{error || 'Đơn hàng không tồn tại'}</p>
        <Link href="/" className="text-[#5A2475] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Về trang chủ
        </Link>
      </div>
    );
  }

  const canCancel = order.status === 'pending' || order.status === 'payment_received';
  const canPayWithWallet =
    order.status === 'pending' &&
    order.paymentMethod === 'bank_transfer' &&
    order.paymentStatus === 'pending' &&
    Number(user?.walletBalance ?? 0) >= Number(order.totalPrice);
  const paymentLabel = PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod;
  const statusLabel = STATUS_LABEL[order.status] || order.status;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-[#5A2475] text-white py-3 px-4 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="p-1 rounded hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Đặt hàng thành công</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pb-8">
        {/* Success card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4 text-center">
          <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-1">Cảm ơn bạn đã đặt hàng</h2>
          <p className="text-neutral-600 text-sm">
            Mã đơn hàng: <span className="font-mono font-semibold text-[#5A2475]">#{order.id}</span>
          </p>
          <p className="text-neutral-500 text-sm mt-1">Trạng thái: {statusLabel}</p>
        </div>

        {/* Chi tiết đơn - toggle */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 transition-colors"
          >
            <span className="flex items-center gap-2 font-semibold text-neutral-900">
              <FileText className="w-5 h-5 text-[#5A2475]" />
              Chi tiết đơn hàng
            </span>
            <span className="text-neutral-500 text-sm">{showDetails ? 'Thu gọn' : 'Xem'}</span>
          </button>
          {showDetails && (
            <div className="px-4 pb-4 border-t border-neutral-100 space-y-3 pt-3">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Sản phẩm</p>
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-neutral-800 py-1">
                    <span>{item.productName} x{item.quantity}</span>
                    <span className="font-medium text-[#5A2475]">{formatPrice(Number(item.subtotal))}₫</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm text-neutral-600">
                <span>Phí vận chuyển</span>
                <span>{formatPrice(Number(order.shippingFee))}₫</span>
              </div>
              <div className="flex justify-between font-semibold text-neutral-900 pt-2 border-t border-neutral-100">
                <span>Tổng thanh toán</span>
                <span className="text-[#5A2475]">{formatPrice(Number(order.totalPrice))}₫</span>
              </div>
              <div className="text-sm text-neutral-600">
                <p className="font-medium text-neutral-700 mb-1">Giao đến</p>
                <p>{order.customerName} · {order.customerPhone}</p>
                <p className="text-neutral-600 mt-0.5">{order.customerAddress}</p>
              </div>
              <p className="text-sm text-neutral-500">
                Thanh toán: {paymentLabel}
                {order.notes ? ` · Ghi chú: ${order.notes}` : ''}
              </p>
            </div>
          )}
        </div>

        {/* Pháp lý cơ bản */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#5A2475]" />
            Điều khoản & Lưu ý
          </h3>
          <ul className="text-sm text-neutral-700 space-y-1.5 list-disc list-inside">
            <li>Đơn hàng được xác nhận khi người bán chấp nhận. Bạn sẽ nhận thông báo khi đơn được xử lý.</li>
            <li>Với thanh toán COD: thanh toán khi nhận hàng. Kiểm tra hàng trước khi thanh toán.</li>
            <li>Với chuyển khoản: thực hiện chuyển khoản theo hướng dẫn từ người bán sau khi đơn được xác nhận.</li>
            <li>Bạn có thể huỷ đơn khi đơn ở trạng thái &quot;Chờ xử lý&quot;. Sau khi người bán xác nhận, vui lòng liên hệ người bán để thoả thuận.</li>
            <li>Mọi tranh chấp phát sinh sẽ được xử lý theo chính sách của nền tảng và pháp luật hiện hành.</li>
          </ul>
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-3">{error}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          {canPayWithWallet && (
            <button
              type="button"
              onClick={handlePayWithWallet}
              disabled={payingWallet}
              className="flex-1 min-w-[200px] py-3 rounded-lg bg-[#963CC3] text-white font-semibold hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {payingWallet ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
              {payingWallet ? 'Đang xử lý...' : 'Thanh toán bằng ví'}
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 min-w-[200px] py-3 rounded-lg border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {cancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
              {cancelling ? 'Đang xử lý...' : 'Huỷ đơn hàng'}
            </button>
          )}
          <Link
            href="/orders"
            className="flex-1 min-w-[200px] py-3 rounded-lg border-2 border-[#5A2475]/30 text-[#5A2475] font-semibold hover:bg-[#5A2475]/10 text-center"
          >
            Đơn hàng của tôi
          </Link>
          <Link
            href="/"
            className="flex-1 min-w-[200px] py-3 rounded-lg bg-[#5A2475] text-white font-semibold hover:opacity-90 text-center"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#5A2475]" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
