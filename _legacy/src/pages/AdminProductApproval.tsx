import { useState } from 'react'
import { CheckCircle, XCircle, Eye, AlertCircle } from 'lucide-react'

interface AdminProductApprovalProps {
  onBack: () => void;
}

function AdminProductApproval({ onBack }: AdminProductApprovalProps) {
  const [pendingProducts] = useState([
    {
      id: 1,
      name: 'Canon 24-70mm f/2.8L',
      description: 'Professional zoom lens, như mới',
      price: 22000000,
      seller: 'Nguyễn Văn A',
      seller_email: 'nguyenvana@gmail.com',
      category: 'Ống kính',
      condition: 'used',
      images: ['image1.jpg', 'image2.jpg'],
      stock: 2,
      submitted_at: new Date(Date.now() - 3600000).toISOString(),
      status: 'pending_approval'
    }
  ])

  const handleApprove = (productId: number) => {
    alert(`Đã duyệt sản phẩm #${productId}`)
  }

  const handleReject = (productId: number, reason: string) => {
    alert(`Đã từ chối sản phẩm #${productId}: ${reason}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl border-2 border-emerald-200 shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent">
                Duyệt sản phẩm
              </h1>
              <p className="text-gray-600 mt-1">Các sản phẩm đang chờ duyệt: {pendingProducts.length}</p>
            </div>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              ← Quay lại
            </button>
          </div>
        </div>

        {/* Pending Products */}
        {pendingProducts.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border-2 border-emerald-200 shadow-lg text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-400" />
            <p className="text-gray-500 text-lg">Không có sản phẩm chờ duyệt</p>
          </div>
        ) : (
          pendingProducts.map(product => (
            <div key={product.id} className="bg-white p-8 rounded-xl border-2 border-yellow-200 shadow-lg mb-6">
              {/* Product Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-bold text-gray-800">{product.name}</h3>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold border-2 border-yellow-300">
                      Chờ duyệt
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{product.description}</p>
                  <p className="text-sm text-gray-500">Ngày gửi: {new Date(product.submitted_at).toLocaleString('vi-VN')}</p>
                </div>
              </div>

              {/* Product Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Giá bán</label>
                  <p className="text-2xl font-bold text-emerald-600">{product.price.toLocaleString('vi-VN')}đ</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tình trạng</label>
                  <p className="text-gray-800 capitalize">{product.condition} - {product.stock} sản phẩm</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Danh mục</label>
                  <p className="text-gray-800">{product.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Người bán</label>
                  <p className="text-gray-800">{product.seller}</p>
                  <p className="text-sm text-gray-600">{product.seller_email}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 border-t pt-6">
                <button
                  onClick={() => {
                    if (confirm(`Duyệt sản phẩm "${product.name}"?`)) {
                      handleApprove(product.id)
                    }
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-bold hover:scale-105 transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <CheckCircle className="h-5 w-5" />
                  Duyệt sản phẩm
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Lý do từ chối:')
                    if (reason) {
                      handleReject(product.id, reason)
                    }
                  }}
                  className="flex-1 py-3 bg-red-500 text-white rounded-lg font-bold hover:scale-105 transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <XCircle className="h-5 w-5" />
                  Từ chối
                </button>
                <button
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition flex items-center gap-2"
                >
                  <Eye className="h-5 w-5" />
                  Xem chi tiết
                </button>
              </div>

              {/* Warning */}
              <div className="mt-6 bg-red-50 border-2 border-red-200 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <p className="text-sm text-red-800">
                  <strong>Lưu ý:</strong> Vui lòng kiểm tra kỹ thông tin sản phẩm, hình ảnh, giá cả trước khi duyệt. 
                  Sản phẩm đã duyệt sẽ hiển thị công khai trên marketplace.
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AdminProductApproval
