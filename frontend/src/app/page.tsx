'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Search, ShoppingCart } from 'lucide-react';
import { formatPrice } from '@/lib/formatPrice';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number | string; // Can be string from database decimal
  images: string[] | string | null; // API may return array or legacy string
  location: string | null;
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="relative flex gap-3">
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
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3.5 bg-[#963CC3] text-white rounded-xl font-medium shadow-lg shadow-[#963CC3]/25 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tìm kiếm
            </button>
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
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Không có sản phẩm nào</p>
            <p className="text-gray-400 text-sm mt-2">Hãy thử đăng sản phẩm đầu tiên!</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Tìm thấy {products.length} sản phẩm
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => {
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
                    className="bg-white rounded-2xl shadow-md border border-[#5A2475]/5 overflow-hidden card-hover"
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
                            console.error('Image load error for product', product.id, imageUrl?.substring(0, 50));
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent && !parent.querySelector('.placeholder')) {
                              const placeholder = document.createElement('span');
                              placeholder.className = 'placeholder text-white text-6xl';
                              placeholder.textContent = '📦';
                              parent.appendChild(placeholder);
                            }
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully for product', product.id);
                          }}
                        />
                      ) : (
                        <span className="text-white text-6xl">📦</span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-2xl font-bold text-[#5A2475]">
                            {formatPrice(product.price)} đ
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5 text-sm">
                          {product.location && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <span className="text-gray-400">📍</span>
                              <span className="truncate font-medium">{product.location}</span>
                            </div>
                          )}
                          {product.seller && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <span className="text-gray-400">👤</span>
                              <span className="truncate font-medium">{product.seller.fullName || 'Người bán'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/products/${product.id}`)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#963CC3] text-white rounded-xl font-medium shadow-md shadow-[#963CC3]/20 hover:opacity-90 transition-all"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        Mua ngay
                      </button>
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
