import { useState, useEffect } from 'react'
import { Plus, Package, Edit2, Trash2, Eye, DollarSign, ShoppingBag } from 'lucide-react'
import type { User } from '../types'

interface SellerDashboardProps {
  user: User;
  onLogout: () => void;
}

interface SellerProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'suspended';
  images: string[];
  stock: number;
  views: number;
  sold_count: number;
  created_at: string;
  condition?: string;
}

function SellerDashboard({ user, onLogout: _onLogout }: SellerDashboardProps) {
  const [products, setProducts] = useState<SellerProduct[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: 1,
    stock: '',
    condition: 'new'
  })

  // Mock data
  useEffect(() => {
    const mockProducts: SellerProduct[] = [
      {
        id: 1,
        name: 'Canon 50mm f/1.8',
        description: 'Prime lens chất lượng tốt',
        price: 2000000,
        category_id: 3,
        status: 'approved',
        images: [],
        stock: 5,
        views: 120,
        sold_count: 3,
        created_at: new Date().toISOString()
      }
    ]
    setProducts(mockProducts)
  }, [])

  const getStatusLabel = (status: string) => {
    const labels = {
      draft: 'Bản nháp',
      pending_approval: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Đã từ chối',
      suspended: 'Đã khóa'
    }
    return labels[status as keyof typeof labels]
  }

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-red-200 text-red-900'
    }
    return colors[status as keyof typeof colors]
  }

  const handleAddProduct = () => {
    // TODO: Implement add product
    alert('Thêm sản phẩm thành công!')
    setShowAddForm(false)
    setFormData({ name: '', description: '', price: '', category_id: 1, stock: '', condition: 'new' })
  }

  const handleEditProduct = (id: number) => {
    alert(`Edit product ${id}`)
  }

  const handleDeleteProduct = (id: number) => {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      setProducts(products.filter(p => p.id !== id))
      alert('Đã xóa sản phẩm!')
    }
  }

  const totalRevenue = products.reduce((sum, p) => sum + (p.price * p.sold_count), 0)
  const totalViews = products.reduce((sum, p) => sum + p.views, 0)
  const totalSales = products.reduce((sum, p) => sum + p.sold_count, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl border-2 border-emerald-200 shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent">
                Trang người bán
              </h1>
              <p className="text-gray-600 mt-1">Xin chào, {user?.email}</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-semibold hover:scale-105 transition flex items-center gap-2 shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Đăng sản phẩm
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border-2 border-emerald-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Tổng doanh thu</p>
                <p className="text-3xl font-bold text-emerald-600">{totalRevenue.toLocaleString('vi-VN')}đ</p>
              </div>
              <DollarSign className="h-12 w-12 text-emerald-400" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border-2 border-emerald-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Tổng lượt xem</p>
                <p className="text-3xl font-bold text-blue-600">{totalViews}</p>
              </div>
              <Eye className="h-12 w-12 text-blue-400" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border-2 border-emerald-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Tổng sản phẩm đã bán</p>
                <p className="text-3xl font-bold text-purple-600">{totalSales}</p>
              </div>
              <ShoppingBag className="h-12 w-12 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Add Product Form */}
        {showAddForm && (
          <div className="bg-white p-8 rounded-xl border-2 border-emerald-200 shadow-xl mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Đăng sản phẩm mới</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tên sản phẩm *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none"
                  placeholder="Nhập tên sản phẩm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none"
                  rows={4}
                  placeholder="Mô tả sản phẩm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Giá *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none"
                    placeholder="1000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Số lượng *</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none"
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tình trạng</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="new">Mới</option>
                  <option value="used">Đã sử dụng</option>
                  <option value="refurbished">Đã qua sửa chữa</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleAddProduct}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg font-bold text-white hover:scale-105 transition"
                >
                  Đăng sản phẩm
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3 bg-gray-200 rounded-lg font-semibold text-gray-800 hover:bg-gray-300 transition"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products List */}
        <div className="space-y-4">
          {products.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border-2 border-emerald-200 shadow-lg text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 text-lg">Chưa có sản phẩm nào</p>
              <p className="text-gray-400 text-sm mt-2">Hãy bắt đầu đăng sản phẩm đầu tiên!</p>
            </div>
          ) : (
            products.map(product => (
              <div key={product.id} className="bg-white p-6 rounded-xl border-2 border-emerald-200 shadow-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-800">{product.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(product.status)}`}>
                        {getStatusLabel(product.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{product.description}</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <p><strong>Giá:</strong> <span className="text-emerald-600 font-bold">{product.price.toLocaleString('vi-VN')}đ</span></p>
                      <p><strong>Đã bán:</strong> {product.sold_count}</p>
                      <p><strong>Lượt xem:</strong> {product.views}</p>
                      <p><strong>Tồn kho:</strong> {product.stock}</p>
                      <p><strong>Tình trạng:</strong> {product.condition}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-6">
                    <button
                      onClick={() => handleEditProduct(product.id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default SellerDashboard
