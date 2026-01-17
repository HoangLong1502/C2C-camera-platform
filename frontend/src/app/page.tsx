'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import UserDropdown from '@/components/UserDropdown';
import { Camera, Search, Plus, ShoppingCart } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number | string; // Can be string from database decimal
  images: string[] | null;
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
      const response = await apiClient.get<Product[]>('/products', { params });
      const productsData = Array.isArray(response.data) ? response.data : [];
      
      // Only update if data actually changed to prevent unnecessary re-renders and flickering
      setProducts(prevProducts => {
        // If no previous data, always update
        if (prevProducts.length === 0) {
          return productsData;
        }
        
        // Simple comparison: check if IDs changed
        const prevIds = new Set(prevProducts.map(p => p.id));
        const newIds = new Set(productsData.map(p => p.id));
        
        // If different number of products, update
        if (prevIds.size !== newIds.size) {
          return productsData;
        }
        
        // Check if any IDs are different
        for (const id of newIds) {
          if (!prevIds.has(id)) {
            return productsData; // New product found
          }
        }
        
        // Products are the same, keep previous to avoid re-render
        return prevProducts;
      });
    } catch (error: any) {
      console.error('Failed to fetch products', error);
      // Only show error on user-initiated actions, not silent refreshes
      if (showLoading) {
        setError(error.response?.data?.message || 'Không thể tải sản phẩm. Vui lòng thử lại.');
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Camera className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">C2C Camera Platform</h1>
            </div>
            <div className="flex gap-4 items-center">
            {user ? (
              <>
                <button
                  onClick={() => router.push('/products/create')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Đăng</span>
                </button>
                <UserDropdown />
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => router.push('/auth/register')}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
                >
                  Đăng ký
                </button>
              </>
            )}
            </div>
          </div>
          {/* Navigation Menu */}
          <nav className="flex justify-center gap-6 mt-4 border-t pt-4">
            <button
              onClick={() => handleCategoryClick('all')}
              className={`font-medium transition-colors ${
                !selectedCategory 
                  ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => handleCategoryClick('camera')}
              className={`font-medium transition-colors ${
                selectedCategory === '1' 
                  ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Máy ảnh
            </button>
            <button
              onClick={() => handleCategoryClick('lens')}
              className={`font-medium transition-colors ${
                selectedCategory === '2' 
                  ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Ống kính
            </button>
            <button
              onClick={() => handleCategoryClick('accessory')}
              className={`font-medium transition-colors ${
                selectedCategory === '3' 
                  ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Phụ kiện
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
              />
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

        {!loading && !error && (
          <>
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
                      const images = product.images.split(',').map(img => img.trim()).filter(img => {
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
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                  >
                    <div 
                      className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-t-lg flex items-center justify-center overflow-hidden cursor-pointer relative"
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
                          <span className="text-2xl font-bold text-blue-600">
                            ${typeof product.price === 'string' 
                              ? parseFloat(product.price).toLocaleString() 
                              : product.price.toLocaleString()}
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
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
      </main>
    </div>
  );
}
