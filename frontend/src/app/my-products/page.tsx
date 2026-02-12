'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { formatPrice } from '@/lib/formatPrice';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number | string;
  images: string[] | null;
  status: string;
  condition: string;
  stock: number;
  createdAt: string;
}

export default function MyProductsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      fetchProducts();
    }
  }, [user, authLoading, router]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/products/seller/my-products');
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

    try {
      await apiClient.delete(`/products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa sản phẩm');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Sản phẩm của tôi</h1>
          <button
            onClick={() => router.push('/products/create')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Đăng
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Đang tải sản phẩm...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">Chưa có sản phẩm nào</p>
            <button
              onClick={() => router.push('/products/create')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tạo sản phẩm đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-t-lg flex items-center justify-center overflow-hidden relative">
                  {(() => {
                    // Handle images - could be array or string (legacy format)
                    let imageUrl: string | null = null;
                    
                    if (product.images) {
                      if (Array.isArray(product.images)) {
                        const validImages = product.images.filter(img => 
                          img && typeof img === 'string' && img.trim().length > 0
                        );
                        if (validImages.length > 0) {
                          imageUrl = validImages[0].trim();
                        }
                      } else if (typeof product.images === 'string' && product.images.trim()) {
                        // Legacy format: try JSON parse first, then comma-separated
                        try {
                          const parsed = JSON.parse(product.images);
                          if (Array.isArray(parsed) && parsed.length > 0) {
                            imageUrl = parsed[0].trim();
                          }
                        } catch (e) {
                          // Not JSON, treat as comma-separated
                          const images = product.images.split(',').map(img => img.trim()).filter(img => img.length > 0);
                          if (images.length > 0) {
                            imageUrl = images[0];
                          }
                        }
                      }
                    }
                    
                    // Validate image URL format
                    const isValidImage = imageUrl && (
                      imageUrl.startsWith('data:image') || 
                      imageUrl.startsWith('http://') || 
                      imageUrl.startsWith('https://')
                    );
                    
                    return isValidImage ? (
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
                    );
                  })()}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 truncate flex-1">
                      {product.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                        product.status
                      )}`}
                    >
                      {product.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xl font-bold text-blue-600">
                      {formatPrice(product.price)} đ
                    </span>
                    <span className="text-sm text-gray-500">
                      Số lượng: {product.stock}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/products/${product.id}/edit`)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
