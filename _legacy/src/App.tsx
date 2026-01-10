import { useState } from 'react'
import { ShoppingCart, Search, Menu, X, Camera, ShoppingBag, Trash2, Plus, Minus, Home, Check, LogIn, User as UserIcon, ChevronDown } from 'lucide-react'
import type { Product, CartItem, Category, CheckoutForm, Page, User } from './types'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import SellerDashboard from './pages/SellerDashboard'
import Marketplace from './pages/Marketplace'
import RoleSelection from './pages/RoleSelection'
import UserDropdown from './components/UserDropdown'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [cart, setCart] = useState<CartItem[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({ name: '', phone: '', address: '', email: '' })
  const [user, setUser] = useState<User | null>(null)
  const [showRegister, setShowRegister] = useState<boolean>(false)
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false)
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller' | 'both' | null>(null)

  const products: Product[] = [
    { id: 1, name: 'Canon EOS R5', category: 'camera', price: 45990000, image: '📷', description: 'Full-frame mirrorless camera 45MP' },
    { id: 2, name: 'Sony A7 IV', category: 'camera', price: 38990000, image: '📷', description: 'Full-frame camera 33MP với 4K video' },
    { id: 3, name: 'Nikon Z6 II', category: 'camera', price: 32990000, image: '📷', description: 'Mirrorless camera 24.5MP' },
    { id: 4, name: 'Canon EF 24-70mm f/2.8', category: 'lens', price: 18990000, image: '🔭', description: 'Zoom lens chuyên nghiệp' },
    { id: 5, name: 'Sony FE 85mm f/1.4', category: 'lens', price: 22990000, image: '🔭', description: 'Portrait lens chất lượng cao' },
    { id: 6, name: 'Tripod Manfrotto', category: 'accessory', price: 2900000, image: '📦', description: 'Tripod chống rung chuyên nghiệp' },
    { id: 7, name: 'Thẻ nhớ SanDisk 128GB', category: 'accessory', price: 890000, image: '💾', description: 'Class 10, tốc độ cao' },
    { id: 8, name: 'Camera Bag Lowepro', category: 'accessory', price: 1950000, image: '🎒', description: 'Túi đựng camera chống nước' },
    { id: 9, name: 'Battery Sony NP-FZ100', category: 'accessory', price: 1500000, image: '🔋', description: 'Pin chính hãng Sony' },
    { id: 10, name: 'LED Video Light', category: 'accessory', price: 3500000, image: '💡', description: 'Đèn LED 3 màu RGB' },
    { id: 11, name: 'Gimbal DJI RS3', category: 'accessory', price: 8900000, image: '📹', description: 'Gimbal chống rung 3 trục' },
    { id: 12, name: 'Canon RF 50mm f/1.2', category: 'lens', price: 42990000, image: '🔭', description: 'Prime lens độ mở lớn' },
  ]

  const categories: Category[] = [
    { id: 'all', name: 'Tất cả', icon: '🏠' },
    { id: 'camera', name: 'Máy ảnh', icon: '📷' },
    { id: 'lens', name: 'Ống kính', icon: '🔭' },
    { id: 'accessory', name: 'Phụ kiện', icon: '🎒' },
  ]

  const addToCart = (product: Product): void => {
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
    alert('Đã thêm vào giỏ hàng!')
  }

  const removeFromCart = (productId: number): void => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId: number, change: number): void => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + change
        return { ...item, quantity: newQuantity }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const getTotalPrice = (): number => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleCheckout = (): void => {
    if (!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address) {
      alert('Vui lòng điền đầy đủ thông tin!')
      return
    }
    alert(`Đặt hàng thành công!\nTên: ${checkoutForm.name}\nSĐT: ${checkoutForm.phone}\nĐịa chỉ: ${checkoutForm.address}\nTổng tiền: ${getTotalPrice().toLocaleString('vi-VN')}đ`)
    setCart([])
    setCheckoutForm({ name: '', phone: '', address: '', email: '' })
    setCurrentPage('home')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 text-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-lg border-b border-emerald-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button onClick={() => setCurrentPage('home')} className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-emerald-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                CameraStore
              </span>
            </button>
            
            <div className="hidden md:flex items-center space-x-8">
              {!selectedRole && (
                <button onClick={() => setCurrentPage('role-selection')} className="hover:text-emerald-600 transition flex items-center gap-2 text-gray-700">
                  <Home className="h-4 w-4" />
                  Trang chủ
                </button>
              )}
              {selectedRole && (
                <>
                  <button onClick={() => setCurrentPage('home')} className="hover:text-emerald-600 transition flex items-center gap-2 text-gray-700">
                    <Home className="h-4 w-4" />
                    Trang chủ
                  </button>
                  <button onClick={() => setCurrentPage('marketplace')} className="hover:text-emerald-600 transition flex items-center gap-2 text-gray-700">
                    <ShoppingBag className="h-4 w-4" />
                    Marketplace
                  </button>
                </>
              )}
              <button 
                onClick={() => setCurrentPage('cart')} 
                className="hover:text-emerald-600 transition flex items-center gap-2 relative text-gray-700"
              >
                <ShoppingCart className="h-4 w-4" />
                Giỏ hàng
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    {cart.length}
                  </span>
                )}
              </button>
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold transition"
                  >
                    <UserIcon className="h-5 w-5" />
                    {user.email.split('@')[0]}
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 z-50">
                      <UserDropdown 
                        user={user} 
                        onLogout={() => {
                          setUser(null)
                          setUserMenuOpen(false)
                        }}
                        onNavigate={(page) => {
                          setCurrentPage(page as Page)
                          setUserMenuOpen(false)
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => setCurrentPage('login')} className="hover:text-emerald-600 transition flex items-center gap-2 text-gray-700">
                  <LogIn className="h-4 w-4" />
                  Đăng nhập
                </button>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-emerald-200">
            <div className="px-4 py-4 space-y-4">
              <button onClick={() => { setCurrentPage('home'); setMobileMenuOpen(false); }} className="block w-full text-left hover:text-emerald-600 transition text-gray-700">
                Trang chủ
              </button>
              <button onClick={() => { setCurrentPage('products'); setMobileMenuOpen(false); }} className="block w-full text-left hover:text-emerald-600 transition text-gray-700">
                Sản phẩm
              </button>
              <button onClick={() => { setCurrentPage('cart'); setMobileMenuOpen(false); }} className="block w-full text-left hover:text-emerald-600 transition text-gray-700">
                Giỏ hàng ({cart.length})
              </button>
              <button onClick={() => { setCurrentPage('login'); setMobileMenuOpen(false); }} className="block w-full text-left hover:text-emerald-600 transition text-gray-700">
                Admin Login
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className={!['login', 'register', 'admin', 'seller-dashboard'].includes(currentPage) ? 'pt-16' : ''}>
          {showRegister ? (
          <Register 
            onRegister={() => {
              alert('Đăng ký thành công! Vui lòng đăng nhập.')
              setShowRegister(false)
              setCurrentPage('login')
            }}
            setCurrentPage={setCurrentPage}
            onBack={() => setShowRegister(false)}
          />
        ) : currentPage === 'login' && (
          <Login 
            onLogin={(userData) => {
              setUser(userData)
              const savedUser = localStorage.getItem('user')
              if (savedUser) {
                const parsed = JSON.parse(savedUser)
                setUser({ email: parsed.email, role: parsed.role, isAdmin: parsed.role === 'admin' })
              }
            }} 
            setCurrentPage={setCurrentPage}
            onShowRegister={() => setShowRegister(true)}
          />
        )}
        {currentPage === 'admin' && (
          user?.isAdmin || localStorage.getItem('token') ? (
            <AdminDashboard 
              onLogout={() => {
                setUser(null)
                localStorage.removeItem('user')
                localStorage.removeItem('token')
              }} 
              setCurrentPage={setCurrentPage} 
            />
          ) : (
            <div className="text-center py-20">
              <p className="text-red-500">Bạn không có quyền truy cập!</p>
              <button onClick={() => setCurrentPage('login')} className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-lg">
                Đăng nhập
              </button>
            </div>
          )
        )}
        {currentPage === 'register' && (
          <Register 
            onRegister={() => {
              alert('Đăng ký thành công! Vui lòng đăng nhập.')
              setCurrentPage('login')
            }}
            setCurrentPage={setCurrentPage}
            onBack={() => setCurrentPage('login')}
          />
        )}
        {currentPage === 'role-selection' && !user && (
          <RoleSelection onSelectRole={(role) => {
            setSelectedRole(role)
            setCurrentPage('login')
          }} />
        )}
        {currentPage === 'seller-dashboard' && user && (
          <SellerDashboard user={user} onLogout={() => setUser(null)} />
        )}
        {currentPage === 'marketplace' && (
          <Marketplace products={filteredProducts} addToCart={addToCart} />
        )}
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'products' && (
          <ProductsPage 
            products={filteredProducts}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            addToCart={addToCart}
          />
        )}
        {currentPage === 'cart' && (
          <CartPage 
            cart={cart}
            removeFromCart={removeFromCart}
            updateQuantity={updateQuantity}
            getTotalPrice={getTotalPrice}
            checkoutForm={checkoutForm}
            setCheckoutForm={setCheckoutForm}
            handleCheckout={handleCheckout}
            onBackToProducts={() => setCurrentPage('products')}
          />
        )}
      </div>
    </div>
  )
}

function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent">
            CameraStore - Máy ảnh & Phụ kiện
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Nơi mua sắm tin cậy cho các nhiếp ảnh gia chuyên nghiệp
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl border-2 border-emerald-200 hover:border-emerald-400 transition shadow-lg hover:shadow-xl">
            <div className="text-4xl mb-4">📷</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Máy ảnh chính hãng</h3>
            <p className="text-gray-600">Sản phẩm từ các thương hiệu hàng đầu</p>
          </div>
          <div className="bg-white p-6 rounded-xl border-2 border-emerald-200 hover:border-emerald-400 transition shadow-lg hover:shadow-xl">
            <div className="text-4xl mb-4">🔭</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Ống kính chất lượng</h3>
            <p className="text-gray-600">Nhiều loại ống kính phù hợp mọi nhu cầu</p>
          </div>
          <div className="bg-white p-6 rounded-xl border-2 border-emerald-200 hover:border-emerald-400 transition shadow-lg hover:shadow-xl">
            <div className="text-4xl mb-4">🎒</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Phụ kiện đa dạng</h3>
            <p className="text-gray-600">Tripod, túi, pin, thẻ nhớ và nhiều hơn nữa</p>
          </div>
        </div>
      </section>
    </div>
  )
}

interface ProductsPageProps {
  products: Product[];
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addToCart: (product: Product) => void;
}

function ProductsPage({ products, categories, selectedCategory, setSelectedCategory, searchQuery, setSearchQuery, addToCart }: ProductsPageProps) {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent">
          Sản phẩm
        </h2>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8 flex flex-wrap gap-4 justify-center">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition shadow-sm ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-16">
              Không tìm thấy sản phẩm
            </div>
          ) : (
            products.map(product => (
              <ProductCard key={product.id} product={product} addToCart={addToCart} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

interface ProductCardProps {
  product: Product;
  addToCart: (product: Product) => void;
}

function ProductCard({ product, addToCart }: ProductCardProps) {

  return (
    <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-emerald-400 transition hover:scale-105 transform shadow-lg hover:shadow-xl">
      <div className="text-6xl mb-4 text-center">{product.image}</div>
      <h3 className="text-xl font-bold mb-2 text-gray-800">{product.name}</h3>
      <p className="text-gray-600 mb-4 text-sm">{product.description}</p>
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl font-bold text-emerald-600">
          {product.price.toLocaleString('vi-VN')}đ
        </span>
      </div>
      <button
        onClick={() => addToCart(product)}
        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg font-semibold hover:scale-105 transition transform shadow-lg shadow-emerald-500/30 text-white hover:shadow-xl"
      >
        Thêm vào giỏ
      </button>
    </div>
  )
}

interface CartPageProps {
  cart: CartItem[];
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, change: number) => void;
  getTotalPrice: () => number;
  checkoutForm: CheckoutForm;
  setCheckoutForm: (form: CheckoutForm) => void;
  handleCheckout: () => void;
  onBackToProducts: () => void;
}

function CartPage({ cart, removeFromCart, updateQuantity, getTotalPrice, checkoutForm, setCheckoutForm, handleCheckout, onBackToProducts }: CartPageProps) {
  const [showCheckout, setShowCheckout] = useState<boolean>(false)

  if (cart.length === 0 && !showCheckout) {
    return (
      <div className="py-16 px-4 text-center">
        <ShoppingCart className="h-24 w-24 mx-auto mb-6 text-gray-400" />
        <h2 className="text-3xl font-bold mb-4 text-gray-800">Giỏ hàng trống</h2>
        <p className="text-gray-600 mb-8">Hãy thêm sản phẩm vào giỏ hàng của bạn</p>
        <button
          onClick={onBackToProducts}
          className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg font-semibold hover:scale-105 transition shadow-lg shadow-emerald-500/30 text-white"
        >
          Tiếp tục mua sắm
        </button>
      </div>
    )
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {!showCheckout ? (
          <>
            <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent">
              Giỏ hàng ({cart.length})
            </h2>
            
              <div className="space-y-4 mb-8">
              {cart.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{item.image}</div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                        <p className="text-gray-600 text-sm">{item.description}</p>
                        <p className="text-emerald-600 font-bold mt-1">
                          {item.price.toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 bg-gray-100 rounded-lg border border-gray-200">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-2 hover:bg-gray-200 transition text-gray-700"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-4 font-bold text-gray-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-2 hover:bg-gray-200 transition text-gray-700"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded transition"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-emerald-50 p-6 rounded-xl border-2 border-emerald-200 mb-8 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-800">Tổng sản phẩm:</span>
                <span className="text-gray-700 font-bold">{getTotalPrice().toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Hoa hồng platform (5%):</span>
                <span className="text-red-600 font-semibold">{(getTotalPrice() * 0.05).toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="border-t border-emerald-300 pt-3 mt-3">
                <div className="flex justify-between items-center text-2xl font-bold">
                  <span className="text-gray-800">Tổng thanh toán:</span>
                  <span className="text-emerald-600">{(getTotalPrice() * 1.05).toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Lưu ý:</strong> Số tiền sẽ được giữ tại ví trung gian (Escrow) cho đến khi bạn xác nhận nhận hàng.
                </p>
              </div>
              <button
                onClick={() => setShowCheckout(true)}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg font-bold text-lg hover:scale-105 transition transform shadow-lg shadow-emerald-500/30 text-white"
              >
                💳 Thanh toán & Đặt hàng
              </button>
            </div>
          </>
        ) : (
          <CheckoutFormComponent
            checkoutForm={checkoutForm}
            setCheckoutForm={setCheckoutForm}
            handleCheckout={handleCheckout}
            getTotalPrice={getTotalPrice}
            onBack={() => setShowCheckout(false)}
          />
        )}
      </div>
    </div>
  )
}

interface CheckoutFormProps {
  checkoutForm: CheckoutForm;
  setCheckoutForm: (form: CheckoutForm) => void;
  handleCheckout: () => void;
  getTotalPrice: () => number;
  onBack: () => void;
}

function CheckoutFormComponent({ checkoutForm, setCheckoutForm, handleCheckout, getTotalPrice, onBack }: CheckoutFormProps) {
  return (
    <div>
      <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent">
        Thông tin đặt hàng
      </h2>

      <div className="bg-white p-8 rounded-xl border-2 border-gray-200 space-y-4 mb-8 shadow-lg">
        <div>
          <label className="block mb-2 font-semibold text-gray-800">Họ và tên *</label>
          <input
            type="text"
            value={checkoutForm.name}
            onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-800"
            placeholder="Nhập họ và tên"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-gray-800">Số điện thoại *</label>
          <input
            type="tel"
            value={checkoutForm.phone}
            onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-800"
            placeholder="Nhập số điện thoại"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-gray-800">Email</label>
          <input
            type="email"
            value={checkoutForm.email}
            onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-800"
            placeholder="Nhập email (tùy chọn)"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-gray-800">Địa chỉ giao hàng *</label>
          <textarea
            value={checkoutForm.address}
            onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-800"
            rows={3}
            placeholder="Nhập địa chỉ giao hàng"
          />
        </div>

        <div className="bg-emerald-50 p-4 rounded-lg mt-6 border-2 border-emerald-200 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-700">Tổng sản phẩm:</span>
            <span className="text-gray-800">{getTotalPrice().toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-700">Hoa hồng (5%):</span>
            <span className="text-red-600">{(getTotalPrice() * 0.05).toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="border-t border-emerald-300 pt-2 mt-2">
            <div className="flex justify-between items-center text-xl font-bold">
              <span className="text-gray-800">Tổng thanh toán:</span>
              <span className="text-emerald-600">{(getTotalPrice() * 1.05).toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300 transition text-gray-800"
        >
          Quay lại
        </button>
        <button
          onClick={handleCheckout}
          className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg font-bold hover:scale-105 transition transform shadow-lg shadow-emerald-500/30 text-white"
        >
          <Check className="inline h-5 w-5 mr-2" />
          Xác nhận đặt hàng
        </button>
      </div>
    </div>
  )
}

export default App