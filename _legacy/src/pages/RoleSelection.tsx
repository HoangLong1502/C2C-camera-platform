import { User, ShoppingBag, Store, CheckCircle } from 'lucide-react'

interface RoleSelectionProps {
  onSelectRole: (role: 'buyer' | 'seller' | 'both') => void;
}

function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent">
            Chào mừng đến với C2C Platform
          </h1>
          <p className="text-xl text-gray-600">
            Bạn muốn tham gia với vai trò gì?
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Buyer Role */}
          <button
            onClick={() => onSelectRole('buyer')}
            className="bg-white p-8 rounded-2xl border-4 border-emerald-200 hover:border-emerald-500 transition hover:scale-105 transform shadow-lg hover:shadow-2xl text-left"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
              <ShoppingBag className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Người Mua</h3>
            <p className="text-gray-600 mb-4">
              Khám phá và mua sản phẩm từ nhiều người bán trên nền tảng
            </p>
            <ul className="text-sm text-gray-500 space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                Duyệt sản phẩm không giới hạn
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                Mua sắm an toàn với Escrow
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                Đánh giá & nhận xét
              </li>
            </ul>
            <div className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold text-center">
              Chọn vai trò này
            </div>
          </button>

          {/* Seller Role */}
          <button
            onClick={() => onSelectRole('seller')}
            className="bg-white p-8 rounded-2xl border-4 border-amber-200 hover:border-amber-500 transition hover:scale-105 transform shadow-lg hover:shadow-2xl text-left"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
              <Store className="h-10 w-10 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Người Bán</h3>
            <p className="text-gray-600 mb-4">
              Đăng bán sản phẩm và quản lý doanh thu của bạn
            </p>
            <ul className="text-sm text-gray-500 space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-amber-600" />
                Đăng sản phẩm không giới hạn
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-amber-600" />
                Quản lý đơn hàng dễ dàng
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-amber-600" />
                Nhận thanh toán nhanh
              </li>
            </ul>
            <div className="px-4 py-2 bg-amber-500 text-white rounded-lg font-semibold text-center">
              Chọn vai trò này
            </div>
          </button>

          {/* Both Roles */}
          <button
            onClick={() => onSelectRole('both')}
            className="bg-white p-8 rounded-2xl border-4 border-purple-200 hover:border-purple-500 transition hover:scale-105 transform shadow-lg hover:shadow-2xl text-left relative"
          >
            <div className="absolute top-4 right-4 px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
              PHỔ BIẾN NHẤT
            </div>
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
              <User className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Cả Hai</h3>
            <p className="text-gray-600 mb-4">
              Vừa mua vừa bán - Tối đa hóa tiềm năng kinh doanh
            </p>
            <ul className="text-sm text-gray-500 space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                Tất cả tính năng của người mua
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                Tất cả tính năng của người bán
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                Linh hoạt chuyển đổi
              </li>
            </ul>
            <div className="px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold text-center">
              Chọn vai trò này
            </div>
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            💡 Bạn có thể thay đổi vai trò bất cứ lúc nào trong cài đặt tài khoản
          </p>
        </div>
      </div>
    </div>
  )
}

export default RoleSelection
