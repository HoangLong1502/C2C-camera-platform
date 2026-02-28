'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/formatPrice';
import { ArrowLeft, CreditCard, Banknote, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  price: number | string;
  images: string[] | null;
  stock: number;
  seller?: { id: number; fullName: string } | null;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const productId = searchParams.get('productId');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'cod'>('cod');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setCustomerName(user.fullName || '');
    setCustomerPhone(user.phone || '');
  }, [user, router]);

  useEffect(() => {
    if (!productId) {
      setError('Thiếu thông tin sản phẩm');
      setLoading(false);
      return;
    }
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await apiClient.get(`/products/${productId}`);
        setProduct(data);
        setQuantity((q) => Math.min(q, Math.max(1, data.stock ?? 1)));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải sản phẩm');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const price = product ? Number(product.price) : 0;
  const subtotal = price * quantity;
  const shippingFee = 0;
  const total = subtotal + shippingFee;
  const maxQty = Math.max(1, product?.stock ?? 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !product || !customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setError('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post('/orders', {
        productId: Number(productId),
        quantity,
        paymentMethod,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        notes: notes.trim() || undefined,
      });
      router.push('/?ordered=1');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Đặt hàng thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#5A2475]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-600 mb-4">{error || 'Sản phẩm không tồn tại'}</p>
        <Link href="/" className="text-[#5A2475] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Về trang chủ
        </Link>
      </div>
    );
  }

  const firstImage = product.images?.[0] || null;

  return (
    <div className="min-h-screen">
      <div className="bg-[#5A2475] text-white py-3 px-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href={`/products/${productId}`} className="p-1 rounded hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Thanh toán</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 pb-8">
        {/* Địa chỉ giao hàng */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-base font-semibold text-neutral-800 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#5A2475] rounded" /> Địa chỉ giao hàng
          </h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Họ và tên"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full border border-neutral-300 rounded px-3 py-2 text-neutral-900 font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5A2475] focus:border-transparent"
              required
            />
            <input
              type="tel"
              placeholder="Số điện thoại"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full border border-neutral-300 rounded px-3 py-2 text-neutral-900 font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5A2475] focus:border-transparent"
              required
            />
            <textarea
              placeholder="Địa chỉ nhận hàng (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành)"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              rows={2}
              className="w-full border border-neutral-300 rounded px-3 py-2 text-neutral-900 font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5A2475] focus:border-transparent resize-none"
              required
            />
            <input
              type="text"
              placeholder="Ghi chú (không bắt buộc)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-neutral-300 rounded px-3 py-2 text-neutral-900 font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5A2475] focus:border-transparent"
            />
          </div>
        </div>

        {/* Sản phẩm */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-base font-semibold text-neutral-800 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#5A2475] rounded" /> Sản phẩm
          </h2>
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#5A2475]/8 shrink-0">
              {firstImage ? (
                <img src={firstImage} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">Ảnh</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-neutral-800 truncate">{product.name}</p>
              <div className="flex items-center justify-between gap-2 mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#5A2475] font-semibold">{formatPrice(price)}₫</span>
                  <span className="text-neutral-400">x</span>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="border border-neutral-300 rounded px-2 py-1 text-sm text-neutral-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#5A2475]"
                  >
                    {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <span className="text-[#5A2475] font-semibold">{formatPrice(subtotal)}₫</span>
              </div>
            </div>
          </div>
        </div>

        {/* Phương thức thanh toán */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-base font-semibold text-neutral-800 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#5A2475] rounded" /> Phương thức thanh toán
          </h2>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-[#5A2475]/5 border-[#5A2475]/15 has-[:checked]:border-[#5A2475] has-[:checked]:bg-[#5A2475]/10">
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
                className="text-[#5A2475] focus:ring-[#5A2475]"
              />
              <Banknote className="w-5 h-5 text-neutral-600" />
              <span className="font-medium">Thanh toán khi nhận hàng (COD)</span>
            </label>
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-[#5A2475]/5 border-[#5A2475]/15 has-[:checked]:border-[#5A2475] has-[:checked]:bg-[#5A2475]/10">
              <input
                type="radio"
                name="payment"
                value="bank"
                checked={paymentMethod === 'bank'}
                onChange={() => setPaymentMethod('bank')}
                className="text-[#5A2475] focus:ring-[#5A2475]"
              />
              <CreditCard className="w-5 h-5 text-neutral-600" />
              <span className="font-medium">Chuyển khoản ngân hàng</span>
            </label>
          </div>
        </div>

        {/* Tổng & Đặt hàng */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between text-neutral-600 mb-1">
            <span>Tạm tính</span>
            <span>{formatPrice(subtotal)}₫</span>
          </div>
          {shippingFee > 0 && (
            <div className="flex justify-between text-neutral-600 mb-1">
              <span>Phí vận chuyển</span>
              <span>{formatPrice(shippingFee)}₫</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg mt-2 pt-2 border-t border-[#5A2475]/15">
            <span>Tổng thanh toán</span>
            <span className="text-[#5A2475]">{formatPrice(total)}₫</span>
          </div>
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-lg bg-[#963CC3] text-white font-semibold hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
        </button>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#5A2475]" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
