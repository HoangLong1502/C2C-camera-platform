'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ShoppingCart, User, MapPin, Package, MessageCircle, Eye, X } from 'lucide-react';
import { formatPrice } from '@/lib/formatPrice';
import { ChatBox } from '@/components/ChatBox';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number | string;
  images: string[] | null;
  condition: string;
  stock: number;
  location: string | null;
  seller: {
    id: number;
    fullName: string;
    email?: string;
  } | null;
  createdAt: string;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [chatRoomId, setChatRoomId] = useState<number | null>(null);
  const [chatOtherUserName, setChatOtherUserName] = useState<string | null>(null);
  const [chatProductName, setChatProductName] = useState<string | null>(null);
  const [chatOpening, setChatOpening] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [stats, setStats] = useState<{ viewCount: number; chattedUsers: { id: number; otherUser: { id: number; fullName: string } }[] } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  useEffect(() => {
    if (!product?.id || (user && product.seller && user.id === product.seller.id)) return;
    apiClient.post(`/products/${product.id}/view`).catch(() => {});
  }, [product?.id, user?.id, product?.seller?.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get(`/products/${params.id}`);
      setProduct(response.data);
    } catch (err: any) {
      console.error('Failed to fetch product', err);
      setError(err.response?.data?.message || 'Không thể tải sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    // TODO: Implement buy functionality
    alert('Chức năng mua hàng sẽ được thêm sau!');
  };

  const handleChat = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!product?.seller?.id || !product?.id) return;
    if (user.id === product.seller.id) return;
    setChatOpening(true);
    try {
      const { data } = await apiClient.post('/chat/room', {
        sellerId: product.seller.id,
        productId: product.id,
      });
      setChatRoomId(data.id);
      setChatOtherUserName(null);
      setChatProductName(product?.name ?? null);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không mở được chat';
      alert(msg);
    } finally {
      setChatOpening(false);
    }
  };

  const openStatsModal = async () => {
    if (!user || !product?.id) return;
    setStatsLoading(true);
    setStatsOpen(true);
    setStats(null);
    try {
      const { data } = await apiClient.get<{ viewCount: number; chattedUsers: { id: number; otherUser: { id: number; fullName: string } }[] }>(
        `/products/${product.id}/stats`,
      );
      setStats(data);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không tải được thống kê';
      alert(msg);
      setStatsOpen(false);
    } finally {
      setStatsLoading(false);
    }
  };

  const openChatFromStats = (roomId: number, otherUserName: string) => {
    setChatRoomId(roomId);
    setChatOtherUserName(otherUserName);
    setChatProductName(product?.name ?? null);
    setStatsOpen(false);
  };

  const closeChat = () => {
    setChatRoomId(null);
    setChatOtherUserName(null);
    setChatProductName(null);
  };

  // Process images
  const getImages = (): string[] => {
    if (!product?.images) {
      console.log('No images for product', product?.id);
      return [];
    }
    
    let imageArray: string[] = [];
    
    if (Array.isArray(product.images)) {
      imageArray = product.images.filter(img => {
        if (!img || typeof img !== 'string' || img.trim().length === 0) {
          return false;
        }
        // Validate base64 format and check if truncated
        const isValid = img.startsWith('data:image') && img.includes('base64,');
        if (!isValid) {
          console.warn('Invalid image format:', img.substring(0, 100));
          return false;
        }
        // Check if image seems truncated (base64 images should be much longer)
        if (img.length < 100) {
          console.warn('Image seems truncated (too short):', img);
          return false;
        }
        return true;
      });
    } else if (typeof product.images === 'string' && product.images.trim()) {
      // Try JSON parse first
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed)) {
          imageArray = parsed.filter((img: any) => {
            if (!img || typeof img !== 'string' || img.trim().length === 0) {
              return false;
            }
            const isValid = img.startsWith('data:image') && img.includes('base64,');
            if (!isValid || img.length < 100) {
              console.warn('Invalid or truncated image:', img.substring(0, 100));
              return false;
            }
            return true;
          });
        }
      } catch (e) {
        // Not JSON, treat as comma-separated (legacy format)
        imageArray = product.images.split(',').map(img => img.trim()).filter(img => {
          if (img.length === 0) return false;
          const isValid = img.startsWith('data:image') && img.includes('base64,');
          if (!isValid || img.length < 100) {
            console.warn('Invalid or truncated image:', img.substring(0, 100));
            return false;
          }
          return true;
        });
      }
    }
    
    console.log('Processed images for product', product.id, {
      original: product.images,
      processed: imageArray,
      count: imageArray.length,
      imageLengths: imageArray.map(img => img.length)
    });
    
    return imageArray;
  };

  const images = getImages();
  const mainImage = images[selectedImageIndex] || null;
  
  // Validate main image
  const isValidMainImage = mainImage && (
    mainImage.startsWith('data:image') || 
    mainImage.startsWith('http://') || 
    mainImage.startsWith('https://')
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Đang tải sản phẩm...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error || 'Không tìm thấy sản phẩm'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Image Gallery */}
            <div>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center relative">
                {isValidMainImage ? (
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image load error for product detail', product.id, mainImage?.substring(0, 50));
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent && !parent.querySelector('.placeholder')) {
                        const placeholder = document.createElement('span');
                        placeholder.className = 'placeholder text-gray-400 text-6xl';
                        placeholder.textContent = '📦';
                        parent.appendChild(placeholder);
                      }
                    }}
                    onLoad={() => {
                      console.log('Main image loaded successfully for product', product.id);
                    }}
                  />
                ) : (
                  <span className="text-gray-400 text-6xl">📦</span>
                )}
              </div>
              
              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, index) => {
                    const isValidImage = img && (
                      img.startsWith('data:image') || 
                      img.startsWith('http://') || 
                      img.startsWith('https://')
                    );
                    
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                          selectedImageIndex === index ? 'border-blue-600' : 'border-gray-200'
                        }`}
                      >
                        {isValidImage ? (
                          <img
                            src={img}
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Thumbnail load error', index, img?.substring(0, 50));
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-2xl">📦</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-blue-600">
                  {formatPrice(product.price)} đ
                </span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="w-5 h-5" />
                  <span>Độ mới: <span className="font-medium">{
                    product.condition === 'used' ? 'Đã qua sử dụng' :
                    product.condition === 'new' ? 'Mới' :
                    product.condition === 'like_new' ? 'Như mới' :
                    product.condition === 'old' ? 'Cũ' :
                    product.condition === 'damaged' ? 'Nát' :
                    product.condition || 'N/A'
                  }</span></span>
                </div>
                
                {product.stock !== undefined && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Package className="w-5 h-5" />
                    <span>Số lượng: <span className="font-medium">{product.stock}</span></span>
                  </div>
                )}
                
                {product.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-5 h-5" />
                    <span>{product.location}</span>
                  </div>
                )}
                
                {product.seller && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-5 h-5" />
                    <span>Người bán: <span className="font-medium">{product.seller.fullName}</span></span>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Mô tả</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
              </div>

              <div className="flex gap-3">
                {product.seller && user?.id === product.seller.id ? (
                  <button
                    onClick={openStatsModal}
                    disabled={statsLoading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    title="Số người đã xem và đã nhắn tin"
                  >
                    <Eye className="w-5 h-5" />
                    Số người đã xem
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleBuy}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
                    >
                      <ShoppingCart className="w-6 h-6" />
                      Mua ngay
                    </button>
                    {product.seller && user && user.id !== product.seller.id && (
                      <button
                        onClick={handleChat}
                        disabled={chatOpening}
                        className="flex items-center justify-center gap-1.5 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shrink-0"
                        title="Chat với người bán"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Chat
                      </button>
                    )}
                  </>
                )}
              </div>
              {statsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setStatsOpen(false)}>
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Thống kê sản phẩm</h3>
                      <button type="button" onClick={() => setStatsOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    {statsLoading ? (
                      <p className="text-gray-500">Đang tải...</p>
                    ) : stats ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Eye className="w-5 h-5" />
                          <span>Số user đã xem: <strong>{stats.viewCount}</strong></span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Đã nhắn tin với bạn:</p>
                          {stats.chattedUsers.length === 0 ? (
                            <p className="text-gray-500 text-sm">Chưa có ai nhắn tin.</p>
                          ) : (
                            <ul className="space-y-2">
                              {stats.chattedUsers.map((r) => (
                                <li key={r.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                  <span className="text-gray-900">{r.otherUser?.fullName ?? 'Người dùng'}</span>
                                  <button
                                    type="button"
                                    onClick={() => openChatFromStats(r.id, r.otherUser?.fullName ?? 'Người dùng')}
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    Nhắn tin
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
              {chatRoomId !== null && user && (
                <ChatBox
                  roomId={chatRoomId}
                  productName={chatProductName ?? product?.name ?? 'Tin nhắn'}
                  otherUserName={chatOtherUserName ?? product?.seller?.fullName ?? 'Người dùng'}
                  currentUserId={user.id}
                  onClose={closeChat}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
