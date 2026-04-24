import { useState } from 'react'
import { Search, ShoppingCart, Star, MapPin, Package, Heart } from 'lucide-react'
import type { Product } from '../types'

interface MarketplaceProps {
  products: Product[];
  addToCart: (product: Product) => void;
}

function Marketplace({ products, addToCart }: MarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [priceFilter, setPriceFilter] = useState('all')
  const [conditionFilter, setConditionFilter] = useState('all')

  const categories = [
    { id: 'all', name: 'Tất cả', icon: '🏠' },
    { id: 'camera', name: 'Máy ảnh', icon: '📷' },
    { id: 'lens', name: 'Ống kính', icon: '🔭' },
    { id: 'accessory', name: 'Phụ kiện', icon: '🎒' },
  ]

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent">
            Marketplace - Mua bán C2C
          </h1>
          <p className="text-gray-600">Khám phá sản phẩm từ nhiều người bán</p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-6 rounded-xl border-2 border-emerald-200 shadow-lg mb-8">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Danh mục</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Khoảng giá</label>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">Tất cả</option>
                <option value="0-5000000">Dưới 5 triệu</option>
                <option value="5000000-10000000">5-10 triệu</option>
                <option value="10000000-20000000">10-20 triệu</option>
                <option value="20000000+">Trên 20 triệu</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tình trạng</label>
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">Tất cả</option>
                <option value="new">Mới</option>
                <option value="used">Đã sử dụng</option>
                <option value="refurbished">Đã qua sửa</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Không tìm thấy sản phẩm</p>
            </div>
          ) : (
            filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-xl border-2 border-emerald-200 shadow-lg hover:shadow-xl transition hover:scale-105">
                {/* Product Image */}
                <div className="h-64 bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center text-8xl rounded-t-xl">
                  {product.image}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-800">{product.name}</h3>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition">
                      <Heart className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{product.description}</p>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center text-yellow-400">
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                    </div>
                    <span className="text-sm text-gray-600">({product.review_count || 0})</span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">TP.HCM</span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-600">{product.views || 0} lượt xem</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">
                        {product.price.toLocaleString('vi-VN')}đ
                      </p>
                      {product.condition && (
                        <span className="text-xs text-gray-500 capitalize">{product.condition}</span>
                      )}
                    </div>
                    {product.status === 'approved' && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        Đã duyệt
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg font-semibold hover:scale-105 transition transform shadow-lg text-white"
                  >
                    <ShoppingCart className="inline h-4 w-4 mr-2" />
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {filteredProducts.length > 0 && (
          <div className="mt-8 text-center text-gray-600">
            Hiển thị {filteredProducts.length} sản phẩm
          </div>
        )}
      </div>
    </div>
  )
}

export default Marketplace
