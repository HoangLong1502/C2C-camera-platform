'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/formatPrice';
import { ArrowLeft, Package, Loader2, ShoppingBag, Store } from 'lucide-react';
import Link from 'next/link';

interface OrderItemType {
  id: number;
  productName: string;
  quantity: number;
  subtotal: number | string;
}

interface OrderRow {
  id: number;
  buyerId: number;
  sellerId: number;
  totalPrice: number | string;
  status: string;
  paymentMethod: string;
  trackingNumber?: string | null;
  createdAt: string;
  items: OrderItemType[];
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xử lý',
  payment_received: 'Đã thanh toán',
  processing: 'Đang xử lý',
  shipped: 'Đã giao vận',
  delivered: 'Đã giao hàng',
  cancelled: 'Đã huỷ',
  completed: 'Hoàn thành',
};

export default function MyOrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<'buyer' | 'seller'>('buyer');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await apiClient.get<OrderRow[]>(`/orders?role=${tab}`);
        setOrders(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải đơn hàng');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user, tab, router]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-[#5A2475] text-white py-3 px-4 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="p-1 rounded hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Đơn hàng của tôi</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 pb-8">
        <div className="flex rounded-xl bg-white shadow-sm border border-[#5A2475]/10 p-1 mb-4">
          <button
            type="button"
            onClick={() => setTab('buyer')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors ${
              tab === 'buyer' ? 'bg-[#5A2475] text-white' : 'text-neutral-600 hover:bg-[#5A2475]/10'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Đã mua
          </button>
          <button
            type="button"
            onClick={() => setTab('seller')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors ${
              tab === 'seller' ? 'bg-[#5A2475] text-white' : 'text-neutral-600 hover:bg-[#5A2475]/10'
            }`}
          >
            <Store className="w-4 h-4" /> Đã bán
          </button>
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#5A2475]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-neutral-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{tab === 'buyer' ? 'Bạn chưa có đơn mua nào.' : 'Bạn chưa có đơn bán nào.'}</p>
            <Link href={tab === 'buyer' ? '/' : '/my-products'} className="text-[#5A2475] font-medium hover:underline mt-2 inline-block">
              {tab === 'buyer' ? 'Xem sản phẩm' : 'Quản lý sản phẩm'}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="block bg-white rounded-xl shadow-sm border border-[#5A2475]/10 p-4 hover:border-[#5A2475]/30 transition-colors"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-900">Đơn #{order.id}</p>
                      <p className="text-sm text-neutral-500 truncate">
                        {order.items?.[0]?.productName}
                        {order.items?.length > 1 ? ` và ${order.items.length - 1} sp` : ''}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-[#5A2475]">{formatPrice(Number(order.totalPrice))}₫</p>
                      <p className="text-xs text-neutral-600">{STATUS_LABEL[order.status] || order.status}</p>
                      {order.trackingNumber && (
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">{order.trackingNumber}</p>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
