'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/formatPrice';
import { ArrowLeft, Package, Loader2, FileText, Truck, CheckCircle2, Wallet } from 'lucide-react';
import Link from 'next/link';

interface OrderItemType {
  id: number;
  productId: number;
  productName: string;
  productPrice: number | string;
  quantity: number;
  subtotal: number | string;
}

interface OrderType {
  id: number;
  buyerId: number;
  sellerId: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  totalPrice: number | string;
  shippingFee: number | string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  trackingNumber?: string | null;
  notes: string | null;
  createdAt: string;
  items: OrderItemType[];
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

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, refreshUser } = useAuth();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!orderId) {
      setLoading(false);
      setError('Thiếu mã đơn hàng');
      return;
    }
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await apiClient.get<OrderType>(`/orders/${orderId}`);
        setOrder(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải đơn hàng');
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [user, orderId, router]);

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

  const isSeller = user && order.sellerId === user.id;
  const isBuyer = user && order.buyerId === user.id;
  const paymentLabel = PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod;
  const statusLabel = STATUS_LABEL[order.status] || order.status;

  const handleSellerUpdate = async (next: 'processing' | 'shipped') => {
    if (!orderId) return;
    setActing(true);
    setError('');
    try {
      const body = next === 'shipped' && trackingNumber.trim() ? { status: next, trackingNumber: trackingNumber.trim() } : { status: next };
      const { data } = await apiClient.patch(`/orders/${orderId}/seller/status`, body);
      setOrder((prev) => (prev ? { ...prev, status: data.status, trackingNumber: data.trackingNumber ?? prev.trackingNumber } : prev));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    } finally {
      setActing(false);
    }
  };

  const handlePayWithWallet = async () => {
    if (!orderId) return;
    setActing(true);
    setError('');
    try {
      const { data } = await apiClient.patch(`/orders/${orderId}/pay-with-wallet`);
      setOrder((prev) => (prev ? { ...prev, ...data } : prev));
      refreshUser().catch(() => {});
    } catch (err: any) {
      setError(err.response?.data?.message || 'Thanh toán bằng ví thất bại');
    } finally {
      setActing(false);
    }
  };

  const handleBuyerConfirm = async () => {
    if (!orderId) return;
    if (!confirm('Xác nhận bạn đã nhận hàng?')) return;
    setActing(true);
    setError('');
    try {
      const { data } = await apiClient.patch(`/orders/${orderId}/buyer/confirm-received`);
      setOrder((prev) => (prev ? { ...prev, status: data.status } : prev));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể xác nhận');
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-[#5A2475] text-white py-3 px-4 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href={isSeller ? '/my-products' : '/'} className="p-1 rounded hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">
            Chi tiết đơn hàng #{order.id}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-neutral-500">Trạng thái</span>
            <span className="font-semibold text-neutral-900">{statusLabel}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span>Thanh toán</span>
            <span>{paymentLabel}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-neutral-600 mt-1">
            <span>Trạng thái thanh toán</span>
            <span className="font-medium text-neutral-800">{order.paymentStatus}</span>
          </div>
          {order.trackingNumber && (
            <div className="flex items-center justify-between text-sm text-neutral-600 mt-1">
              <span>Mã vận đơn</span>
              <span className="font-mono font-medium">{order.trackingNumber}</span>
            </div>
          )}
          <p className="text-xs text-neutral-400 mt-1">
            Đặt lúc {new Date(order.createdAt).toLocaleString('vi-VN')}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h2 className="text-base font-semibold text-neutral-900 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#5A2475]" />
            Sản phẩm
          </h2>
          <ul className="space-y-3">
            {order.items?.map((item) => (
              <li key={item.id} className="flex justify-between items-start gap-2 border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <Link
                    href={`/products/${item.productId}`}
                    className="font-medium text-neutral-900 hover:text-[#5A2475] truncate block"
                  >
                    {item.productName}
                  </Link>
                  <p className="text-sm text-neutral-500">x{item.quantity} · {formatPrice(Number(item.productPrice))}₫/sp</p>
                </div>
                <span className="font-semibold text-[#5A2475] shrink-0">{formatPrice(Number(item.subtotal))}₫</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-sm text-neutral-600 mt-2 pt-2 border-t border-neutral-100">
            <span>Phí vận chuyển</span>
            <span>{formatPrice(Number(order.shippingFee))}₫</span>
          </div>
          <div className="flex justify-between font-semibold text-neutral-900 mt-2 pt-2 border-t border-[#5A2475]/15">
            <span>Tổng thanh toán</span>
            <span className="text-[#5A2475]">{formatPrice(Number(order.totalPrice))}₫</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h2 className="text-base font-semibold text-neutral-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#5A2475]" />
            {isSeller ? 'Thông tin người mua' : 'Giao đến'}
          </h2>
          <p className="font-medium text-neutral-900">{order.customerName}</p>
          <p className="text-sm text-neutral-600">{order.customerPhone}</p>
          <p className="text-sm text-neutral-600 mt-1">{order.customerAddress}</p>
          {order.notes && (
            <p className="text-sm text-neutral-500 mt-2 border-t border-neutral-100 pt-2">Ghi chú: {order.notes}</p>
          )}
        </div>

        {isSeller && order.status === 'processing' && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Mã vận đơn (tùy chọn)</label>
            <input
              type="text"
              placeholder="VD: VN123456789"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5A2475]"
            />
          </div>
        )}

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <div className="flex flex-wrap gap-3">
          {isBuyer && order.status === 'pending' && order.paymentMethod === 'bank_transfer' && order.paymentStatus === 'pending' && Number(user?.walletBalance ?? 0) >= Number(order.totalPrice) && (
            <button
              type="button"
              disabled={acting}
              onClick={handlePayWithWallet}
              className="py-3 px-4 rounded-lg bg-[#963CC3] text-white font-semibold hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4" /> Thanh toán bằng ví
            </button>
          )}
          {isSeller && (order.status === 'pending' || order.status === 'payment_received') && (
            <button
              type="button"
              disabled={acting}
              onClick={() => handleSellerUpdate('processing')}
              className="py-3 px-4 rounded-lg border-2 border-[#5A2475]/30 text-[#5A2475] font-semibold hover:bg-[#5A2475]/10 disabled:opacity-70"
            >
              Xác nhận xử lý
            </button>
          )}
          {isSeller && order.status === 'processing' && (
            <button
              type="button"
              disabled={acting}
              onClick={() => handleSellerUpdate('shipped')}
              className="py-3 px-4 rounded-lg border-2 border-[#5A2475]/30 text-[#5A2475] font-semibold hover:bg-[#5A2475]/10 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" /> Đã gửi hàng
            </button>
          )}
          {isBuyer && order.status === 'shipped' && (
            <button
              type="button"
              disabled={acting}
              onClick={handleBuyerConfirm}
              className="flex-1 py-3 rounded-lg bg-[#963CC3] text-white font-semibold hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Đã nhận hàng
            </button>
          )}
          {isBuyer && order.status === 'pending' && (
            <Link
              href={`/checkout/success?orderId=${order.id}`}
              className="py-3 px-4 rounded-lg border-2 border-[#5A2475]/30 text-[#5A2475] font-semibold hover:bg-[#5A2475]/10"
            >
              Trang đơn hàng
            </Link>
          )}
          <Link
            href={isSeller ? '/my-products' : '/orders'}
            className="py-3 px-4 rounded-lg bg-[#5A2475] text-white font-semibold hover:opacity-90"
          >
            {isSeller ? 'Về sản phẩm của tôi' : 'Đơn hàng của tôi'}
          </Link>
        </div>
      </div>
    </div>
  );
}
