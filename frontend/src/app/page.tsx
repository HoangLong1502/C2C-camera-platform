'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Search, ShoppingCart, Store, MessageCircle, ArrowRight, Sparkles, SlidersHorizontal, Clock, TrendingUp } from 'lucide-react';
import { formatPrice } from '@/lib/formatPrice';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number | string; // Can be string from database decimal
  images: string[] | string | null; // API may return array or legacy string
  location: string | null;
  condition?: string;
  stock?: number;
  views?: number;
  createdAt?: string;
  seller: {
    id: number;
    fullName: string;
    email?: string;
  } | null;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'popular'>('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts(search, selectedCategory, true); // Initial load with loading
  }, [selectedCategory]);

  // Auto refresh in background (silent, no loading state)
  useEffect(() => {
    // Only auto-refresh if user is not actively searching
    if (!search) {
      const interval = setInterval(() => {
        fetchProducts(search, selectedCategory, false); // Silent refresh
      }, 30000); // Refresh every 30 seconds instead of 5
      return () => clearInterval(interval);
    }
  }, [selectedCategory, search]);

  const fetchProducts = async (searchTerm?: string, categoryId?: string, showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      const params: any = {};
      if (searchTerm) {
        params.search = searchTerm;
      }
      if (categoryId) {
        params.category = categoryId;
      }
      
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Fetching products with params:', params);
      }
      
      const response = await apiClient.get<Product[]>('/products', { params });
      
      const productsData = Array.isArray(response.data) ? response.data : [];
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Products response:', response.data);
        console.log('Processed products data:', productsData.length, 'products');
      }
      
      // Always update products (removed comparison to fix display issue)
      setProducts(productsData);
    } catch (error: any) {
      // Only log detailed errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch products', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          url: error.config?.url,
        });
      }
      
      // Show error on user-initiated actions, not silent refreshes
      if (showLoading) {
        const errorMessage = error.response?.data?.message 
          || error.message 
          || 'Không thể tải sản phẩm. Vui lòng kiểm tra kết nối và thử lại.';
        setError(errorMessage);
        setProducts([]);
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleSearch = () => {
    fetchProducts(search, selectedCategory, true); // User action, show loading
  };

  const normalizePrice = (value: Product['price']) => {
    const n = typeof value === 'string' ? Number(value) : value;
    return Number.isFinite(n) ? n : 0;
  };

  const filteredAndSorted = (() => {
    const base = Array.isArray(products) ? products : [];
    const filtered =
      conditionFilter === 'all'
        ? base
        : base.filter((p) => (p.condition ?? '').toLowerCase() === conditionFilter);

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'price_asc') return normalizePrice(a.price) - normalizePrice(b.price);
      if (sortBy === 'price_desc') return normalizePrice(b.price) - normalizePrice(a.price);
      if (sortBy === 'popular') return Number(b.views ?? 0) - Number(a.views ?? 0);
      // newest
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });
    return sorted;
  })();

  const conditionLabel = (c?: string) => {
    const v = (c ?? '').toLowerCase();
    if (v === 'new') return 'Mới';
    if (v === 'like_new') return 'Như mới';
    if (v === 'used') return 'Đã qua sử dụng';
    if (v === 'old') return 'Cũ';
    if (v === 'damaged') return 'Nát';
    return '—';
  };

  const handleCategoryClick = async (categorySlug: string) => {
    if (categorySlug === 'all') {
      setSelectedCategory(undefined);
      fetchProducts(search, undefined);
    } else {
      // Map category slug to categoryId - must match database category IDs
      // Database categories: 1=Máy ảnh(camera), 2=Ống kính(lens), 3=Phụ kiện(accessory)
      const categoryMap: Record<string, string> = {
        'camera': '1',      // Máy ảnh → categoryId 1
        'lens': '2',        // Ống kính → categoryId 2
        'accessory': '3',   // Phụ kiện → categoryId 3 (includes "Khác" items from create form)
      };
      
      const categoryId = categoryMap[categorySlug];
      if (categoryId) {
        setSelectedCategory(categoryId);
        fetchProducts(search, categoryId);
      } else {
        // If category not found, just fetch all
        setSelectedCategory(undefined);
        fetchProducts(search, undefined);
      }
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-10 bg-[#f8f6fc]/95 backdrop-blur-sm border-b border-[#5A2475]/8">
        <div className="max-w-7xl mx-auto px-4 flex justify-center gap-2 py-3 text-[#1c1c1c]">
          {[
            { key: 'all', label: 'Tất cả', value: undefined },
            { key: 'camera', label: 'Máy ảnh', value: '1' },
            { key: 'lens', label: 'Ống kính', value: '2' },
            { key: 'accessory', label: 'Phụ kiện', value: '3' },
          ].map(({ key, label, value }) => (
            <button
              key={key}
              onClick={() => handleCategoryClick(key)}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                selectedCategory === value
                  ? 'text-white bg-[#5A2475] shadow-md shadow-[#5A2475]/20'
                  : 'text-[#5A2475]/90 hover:bg-[#5A2475]/10 hover:text-[#5A2475]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Hero: push to buy & sell */}
      <section className="bg-gradient-to-r from-[#5A2475] to-[#963CC3] text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-semibold mb-2">
                <Sparkles className="w-4 h-4" />
                Marketplace cho cộng đồng camera
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">Mua camera giá tốt · Bán nhanh, an toàn</h2>
              <p className="text-white/90 text-sm sm:text-base mt-1">
                Xem thông tin đầy đủ, chat trực tiếp người bán, thanh toán nhanh.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => document.getElementById('product-list')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#5A2475] rounded-xl font-semibold text-sm hover:bg-white/95 shadow-lg transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                Xem sản phẩm
              </button>
              <button
                onClick={() => user ? router.push('/products/create') : router.push('/auth/register')}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 border border-white/40 text-white rounded-xl font-semibold text-sm hover:bg-white/30 transition-all"
              >
                <Store className="w-4 h-4" />
                {user ? 'Đăng bán ngay' : 'Bán ngay'}
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-white/90">
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-2">
              <Clock className="w-4 h-4" />
              Bài đăng mới mỗi ngày
            </div>
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-2">
              <MessageCircle className="w-4 h-4" />
              Chat nhanh với người bán
            </div>
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-2">
              <TrendingUp className="w-4 h-4" />
              Dễ mua · Dễ bán · Dễ tìm
            </div>
          </div>
        </div>
      </section>

      <div id="product-list" className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="relative flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-3.5 pl-12 border border-[#5A2475]/20 rounded-xl focus:ring-2 focus:ring-[#5A2475] focus:border-[#5A2475]/40 text-gray-900 font-medium bg-white/90 shadow-sm transition-shadow"
              />
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-[#5A2475]/60" />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-3.5 bg-[#963CC3] text-white rounded-xl font-semibold shadow-lg shadow-[#963CC3]/25 hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tìm kiếm
              </button>
              <button
                onClick={() => (user ? router.push('/products/create') : router.push('/auth/register'))}
                className="px-6 py-3.5 border border-[#5A2475]/25 text-[#5A2475] bg-white/80 rounded-xl font-semibold hover:bg-[#5A2475]/10 transition-colors"
              >
                Đăng bán
              </button>
            </div>
          </div>

          {/* Filters row */}
          <div className="mt-4 bg-white/80 border border-[#5A2475]/10 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <SlidersHorizontal className="w-4 h-4 text-[#5A2475]" />
                Bộ lọc nhanh
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: 'all', label: 'Tất cả' },
                  { key: 'new', label: 'Mới' },
                  { key: 'like_new', label: 'Như mới' },
                  { key: 'used', label: 'Đã dùng' },
                  { key: 'old', label: 'Cũ' },
                  { key: 'damaged', label: 'Nát' },
                ].map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setConditionFilter(c.key)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                      conditionFilter === c.key
                        ? 'bg-[#5A2475] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 focus:ring-2 focus:ring-[#5A2475]/30 focus:border-[#5A2475]/30"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="popular">Phổ biến</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Đang tải sản phẩm...</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-[#5A2475]/10 shadow-sm">
            <p className="text-gray-600 text-lg font-medium">Chưa có sản phẩm nào trong mục này</p>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">Bạn có camera hoặc phụ kiện cũ? Đăng bán miễn phí, giao dịch nhanh với người mua.</p>
            <button
              onClick={() => user ? router.push('/products/create') : router.push('/auth/register')}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#963CC3] text-white rounded-xl font-semibold shadow-lg shadow-[#963CC3]/25 hover:opacity-95 transition-all"
            >
              <Store className="w-5 h-5" />
              {user ? 'Đăng sản phẩm ngay' : 'Đăng ký và bán ngay'}
            </button>
          </div>
        )}

        {!loading && !error && filteredAndSorted.length > 0 && (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Tìm thấy <span className="font-semibold">{filteredAndSorted.length}</span> sản phẩm
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredAndSorted.map((product) => {
                // Handle images - could be array or string (simple-array format)
                let imageUrl: string | null = null;
                
                // Process images array
                if (product.images) {
                  if (Array.isArray(product.images)) {
                    // Filter out empty/null values and validate base64 format
                    const validImages = product.images.filter(img => {
                      if (!img || typeof img !== 'string' || img.trim().length === 0) {
                        return false;
                      }
                      // Validate base64 format and check if truncated
                      const isValid = img.startsWith('data:image') && img.includes('base64,');
                      if (!isValid || img.length < 100) {
                        console.warn('Invalid or truncated image for product', product.id, img.substring(0, 50));
                        return false;
                      }
                      return true;
                    });
                    if (validImages.length > 0) {
                      imageUrl = validImages[0].trim();
                    }
                  } else if (typeof product.images === 'string' && product.images.trim()) {
                    // Try JSON parse first
                    try {
                      const parsed = JSON.parse(product.images);
                      if (Array.isArray(parsed)) {
                        const validImages = parsed.filter((img: any) => {
                          if (!img || typeof img !== 'string' || img.trim().length === 0) {
                            return false;
                          }
                          const isValid = img.startsWith('data:image') && img.includes('base64,');
                          if (!isValid || img.length < 100) {
                            return false;
                          }
                          return true;
                        });
                        if (validImages.length > 0) {
                          imageUrl = validImages[0];
                        }
                      }
                    } catch (e) {
                      // Not JSON, treat as comma-separated (legacy format)
                      const raw = typeof product.images === 'string' ? product.images : '';
                      const images = raw.split(',').map((img: string) => img.trim()).filter((img: string) => {
                        if (img.length === 0) return false;
                        const isValid = img.startsWith('data:image') && img.includes('base64,');
                        if (!isValid || img.length < 100) {
                          return false;
                        }
                        return true;
                      });
                      if (images.length > 0) {
                        imageUrl = images[0];
                      }
                    }
                  }
                }

                // Validate image URL format
                const isValidImage = imageUrl && (
                  (imageUrl.startsWith('data:image') && imageUrl.includes('base64,') && imageUrl.length > 100) ||
                  imageUrl.startsWith('http://') || 
                  imageUrl.startsWith('https://')
                );

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl shadow-md border border-[#5A2475]/5 overflow-hidden hover:shadow-lg hover:border-[#5A2475]/15 transition-all"
                  >
                    <div
                      className="h-48 bg-gradient-to-br from-[#5A2475] to-[#963CC3] flex items-center justify-center overflow-hidden cursor-pointer relative"
                      onClick={() => router.push(`/products/${product.id}`)}
                    >
                      {isValidImage ? (
                        <img
                          src={imageUrl!}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent && !parent.querySelector('.placeholder')) {
                              const placeholder = document.createElement('span');
                              placeholder.className = 'placeholder text-white text-6xl';
                              placeholder.textContent = '📦';
                              parent.appendChild(placeholder);
                            }
                          }}
                        />
                      ) : (
                        <span className="text-white text-6xl">📦</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3
                        className="font-semibold text-gray-900 line-clamp-2 mb-1 cursor-pointer hover:text-[#5A2475]"
                        onClick={() => router.push(`/products/${product.id}`)}
                      >
                        {product.name}
                      </h3>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-xl font-bold text-[#5A2475]">
                          {formatPrice(product.price)}₫
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="px-2 py-1 rounded-full bg-[#5A2475]/10 text-[#5A2475] text-xs font-semibold">
                          {conditionLabel(product.condition)}
                        </span>
                        {typeof product.stock === 'number' && (
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                            Còn {product.stock}
                          </span>
                        )}
                        {typeof product.views === 'number' && product.views > 0 && (
                          <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                            {product.views} lượt xem
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 text-sm text-gray-500 mb-3">
                        {product.location && (
                          <span className="truncate">📍 {product.location}</span>
                        )}
                        {product.seller && (
                          <span className="truncate">👤 {product.seller.fullName || 'Người bán'}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/products/${product.id}`);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#963CC3] text-white rounded-xl font-semibold text-sm shadow-md shadow-[#963CC3]/20 hover:opacity-95 transition-all"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Mua ngay
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/products/${product.id}#chat`);
                          }}
                          className="flex items-center justify-center gap-1 px-3 py-2.5 border border-[#5A2475]/25 text-[#5A2475] rounded-xl font-medium text-sm hover:bg-[#5A2475]/10 transition-colors"
                          title="Chat với người bán"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
