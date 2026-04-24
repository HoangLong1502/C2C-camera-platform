import { useState } from 'react'
import { ShoppingBag, Truck, CheckCircle, Package } from 'lucide-react'
import type { Order } from '../types'

interface OrderDetailProps {
  order: Order;
  onBack: () => void;
}

function OrderDetail({ order, onBack }: OrderDetailProps) {
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: <Package className="h-6 w-6" />,
      payment_received: <CheckCircle className="h-6 w-6" />,
      processing: <ShoppingBag className="h-6 w-6" />,
      shipped: <Truck className="h-6 w-6" />,
      delivered: <CheckCircle className="h-6 w-6" />,
      completed: <CheckCircle className="h-6 w-6" />
    }
    return icons[status as keyof typeof icons]
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Chờ thanh toán',
      payment_received: 'Đã thanh toán',
      processing: 'Đang xử lý',
      shipped: 'Đã gửi hàng',
      delivered: 'Đã nhận hàng',
      completed: 'Hoàn thành'
    }
    return labels[status as keyof typeof labels]
  }

  const handleSubmitReview = () => {
    alert('Đánh giá đã được gửi!')
    onBack()
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-2"
        >
          ← Quay lại
        </button>

        <div className="bg-white p-8 rounded-xl border-2 border-emerald-200 shadow-lg">
          {/* Order Header */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-gray-800">Đơn hàng #{order.id}</h2>
              <div className="flex items-center gap-2 bg-emerald-100 px-4 py-2 rounded-lg">
                {getStatusIcon(order.status)}
                <span className="font-semibold text-emerald-700">{getStatusLabel(order.status)}</span>
              </div>
            </div>
            <p className="text-gray-600">Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}</p>
          </div>

          {/* Items */}
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-4">Sản phẩm</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{order.items[0]?.image || '📷'}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">Canon EOS R5</h4>
                    <p className="text-sm text-gray-600">SL: 1 x 45.990.000đ</p>
                  </div>
                  <p className="text-lg font-bold text-emerald-600">45.990.000đ</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-xl font-bold mb-4">Thông tin đơn hàng</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng sản phẩm:</span>
                <span className="font-semibold">{order.total_price.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Hoa hồng platform (5%):</span>
                <span className="font-semibold">{(order.total_price * 0.05).toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-green-600 font-bold text-xl pt-3 border-t-2 border-emerald-300">
                <span>Tổng thanh toán:</span>
                <span>{(order.total_price * 1.05).toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-4">Thông tin giao hàng</h3>
            <div className="bg-white p-4 border-2 border-gray-200 rounded-lg">
              <p className="font-semibold">{order.customer_name}</p>
              <p className="text-gray-600">{order.customer_phone}</p>
              <p className="text-gray-600">{order.customer_address}</p>
            </div>
          </div>

          {/* Review Section (if delivered) */}
          {order.status === 'delivered' && (
            <div className="border-t pt-6">
              <h3 className="text-xl font-bold mb-4">Đánh giá sản phẩm</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Đánh giá (sao)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`w-12 h-12 rounded-lg ${star <= rating ? 'bg-yellow-400' : 'bg-gray-200'} transition`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Nhận xét</label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none"
                    rows={4}
                    placeholder="Chia sẻ trải nghiệm của bạn..."
                  />
                </div>
                <button
                  onClick={handleSubmitReview}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg font-bold text-white hover:scale-105 transition"
                >
                  Gửi đánh giá
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetail
