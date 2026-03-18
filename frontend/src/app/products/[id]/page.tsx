'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ShoppingCart, User, MapPin, Package, MessageCircle, Eye, X, ShieldCheck, Truck, Clock } from 'lucide-react';
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
  views?: number;
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
    if (!product?.id) return;
    router.push(`/checkout?productId=${product.id}`);
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Đang tải sản phẩm...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error || 'Không tìm thấy sản phẩm'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-[#963CC3] text-white rounded-xl hover:opacity-90 shadow-lg shadow-[#963CC3]/25"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const conditionLabel = (v: string) => {
    const c = (v ?? '').toLowerCase();
    if (c === 'new') return 'Mới';
    if (c === 'like_new') return 'Như mới';
    if (c === 'used') return 'Đã qua sử dụng';
    if (c === 'old') return 'Cũ';
    if (c === 'damaged') return 'Nát';
    return v || 'N/A';
  };

  const createdLabel = product.createdAt ? new Date(product.createdAt).toLocaleString('vi-VN') : '';

  const isOwner = product.seller && user?.id === product.seller.id;

  return (
    <div className="min-h-screen py-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#5A2475]/10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8">
            {/* Image Gallery */}
            <div className="lg:col-span-7">
              <div className="aspect-square bg-[#5A2475]/8 rounded-xl overflow-hidden mb-4 flex items-center justify-center relative">
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
                          selectedImageIndex === index ? 'border-[#5A2475] ring-2 ring-[#5A2475]/20' : 'border-[#5A2475]/15'
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
                          <div className="w-full h-full bg-[#5A2475]/10 flex items-center justify-center">
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
            <div className="lg:col-span-5">
              <div className="sticky top-24">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{product.name}</h1>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#5A2475]/10 text-[#5A2475] text-sm font-semibold">
                    {conditionLabel(product.condition)}
                  </span>
                  {typeof product.views === 'number' && (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
                      {product.views} lượt xem
                    </span>
                  )}
                  {createdLabel && (
                    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold inline-flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {createdLabel}
                    </span>
                  )}
                </div>

                <div className="mt-5 rounded-2xl border border-[#5A2475]/10 bg-white shadow-sm p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Giá</p>
                      <p className="text-4xl font-extrabold text-[#5A2475]">{formatPrice(product.price)}₫</p>
                    </div>
                    {typeof product.stock === 'number' && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500 font-semibold">Tồn kho</p>
                        <p className="text-lg font-bold text-gray-900">{product.stock}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Thanh toán nhanh · hạn chế rủi ro
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <MessageCircle className="w-4 h-4 text-[#5A2475]" />
                      Chat để kiểm tra tình trạng/đầy đủ phụ kiện
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Truck className="w-4 h-4 text-sky-600" />
                      Hẹn giao dịch linh hoạt theo khu vực
                    </div>
                  </div>

              {/* Primary CTAs — buy & chat */}
              <div className="flex flex-col sm:flex-row gap-3">
                {product.seller && user?.id === product.seller.id ? (
                  <button
                    onClick={openStatsModal}
                    disabled={statsLoading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 border border-[#5A2475]/20 text-[#1a1625] rounded-xl hover:bg-[#5A2475]/10 transition-colors font-medium"
                    title="Số người đã xem và đã nhắn tin"
                  >
                    <Eye className="w-5 h-5" />
                    Số người đã xem
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleBuy}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#963CC3] text-white rounded-xl font-semibold text-lg shadow-lg shadow-[#963CC3]/25 hover:opacity-95 transition-all"
                    >
                      <ShoppingCart className="w-6 h-6" />
                      Mua ngay — Thanh toán an toàn
                    </button>
                    {product.seller && user && user.id !== product.seller.id && (
                      <button
                        onClick={handleChat}
                        disabled={chatOpening}
                        className="flex items-center justify-center gap-2 px-5 py-3 border-2 border-[#5A2475]/30 text-[#5A2475] rounded-xl hover:bg-[#5A2475]/10 transition-colors font-medium shrink-0"
                        title="Hỏi người bán trước khi mua"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Chat với người bán
                      </button>
                    )}
                  </>
                )}
              </div>
              {product.seller && user && user.id !== product.seller.id && (
                <p className="text-sm text-gray-500 mt-2">Chat để hỏi giá, tình trạng hoặc thương lượng.</p>
              )}

                  <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-700 space-y-2">
                    {product.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{product.location}</span>
                      </div>
                    )}
                    {product.seller && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>
                          Người bán: <span className="font-semibold">{product.seller.fullName}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Mô tả chi tiết</h2>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{product.description}</p>
                </div>
              {statsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#5A2475]/50 p-4" onClick={() => setStatsOpen(false)}>
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Thống kê sản phẩm</h3>
                      <button type="button" onClick={() => setStatsOpen(false)} className="p-2 rounded-lg hover:bg-[#5A2475]/10 text-[#5A2475]">
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
                                <li key={r.id} className="flex justify-between items-center py-2 border-b border-[#5A2475]/10 last:border-0">
                                  <span className="text-gray-900">{r.otherUser?.fullName ?? 'Người dùng'}</span>
                                  <button
                                    type="button"
                                    onClick={() => openChatFromStats(r.id, r.otherUser?.fullName ?? 'Người dùng')}
                                    className="text-sm text-[#5A2475] hover:text-[#963CC3] font-medium"
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

        {/* Sticky CTA bar on mobile — always visible to push buy/chat */}
        {!isOwner && product.seller && (
          <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3 safe-area-pb">
            <div className="max-w-7xl mx-auto flex items-center gap-3">
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">Giá</p>
                <p className="text-lg font-bold text-[#5A2475] truncate">{formatPrice(product.price)}₫</p>
              </div>
              <button
                onClick={handleBuy}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#963CC3] text-white rounded-xl font-semibold text-sm shadow-lg"
              >
                <ShoppingCart className="w-5 h-5" />
                Mua ngay
              </button>
              {user && user.id !== product.seller.id && (
                <button
                  onClick={handleChat}
                  disabled={chatOpening}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 border-2 border-[#5A2475]/30 text-[#5A2475] rounded-xl font-medium text-sm shrink-0"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
