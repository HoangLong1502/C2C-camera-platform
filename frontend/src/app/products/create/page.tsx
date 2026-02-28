'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import { Upload, X, Plus, Save } from 'lucide-react';

interface ImagePreview {
  file: File;
  preview: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    condition: '' as 'used' | 'new' | 'like_new' | 'old' | 'damaged' | '',
    stock: '1',
    location: '',
    category: '' as 'camera' | 'lens' | 'other' | '',
  });
  const [images, setImages] = useState<ImagePreview[]>([]);

  // Redirect if not logged in (wait for auth to finish loading)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  // Don't render form if not logged in
  if (!user) {
    return null;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize if too large
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Could not compress image'));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            file.type,
            quality
          );
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const convertImagesToBase64 = async (): Promise<string[]> => {
    const base64Images: string[] = [];
    for (const img of images) {
      try {
        // Compress image first (max 1920px width, 80% quality)
        const compressedFile = await compressImage(img.file, 1920, 0.8);
        
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Validate base64 format
            if (!result || !result.startsWith('data:image') || !result.includes('base64,')) {
              reject(new Error('Invalid base64 image format'));
              return;
            }
            console.log('Converted image:', {
              length: result.length,
              preview: result.substring(0, 100),
              isValid: result.includes('base64,')
            });
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(compressedFile);
        });
        base64Images.push(base64);
      } catch (error) {
        console.error('Error compressing image:', error);
        // Fallback to original if compression fails
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Validate base64 format
            if (!result || !result.startsWith('data:image') || !result.includes('base64,')) {
              reject(new Error('Invalid base64 image format'));
              return;
            }
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(img.file);
        });
        base64Images.push(base64);
      }
    }
    return base64Images;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convert images to base64
      const imageUrls = await convertImagesToBase64();

      // Validate all images before sending
      const validImages = imageUrls.filter(img => {
        const isValid = img && img.startsWith('data:image') && img.includes('base64,');
        if (!isValid) {
          console.error('Invalid image format:', img?.substring(0, 100));
        }
        return isValid;
      });

      if (validImages.length === 0 && imageUrls.length > 0) {
        throw new Error('Tất cả hình ảnh không hợp lệ. Vui lòng thử tải lên lại.');
      }

      // Map category to categoryId - must match database category IDs
      // Database categories: 1=Máy ảnh(camera), 2=Ống kính(lens), 3=Phụ kiện(accessory)
      const categoryMap: Record<string, number> = {
        'camera': 1,    // Máy ảnh → categoryId 1
        'lens': 2,      // Ống kính → categoryId 2
        'other': 3,     // Khác (đèn, trigger, ...) → categoryId 3 (Phụ kiện)
      };

      // Validate required fields
      if (!formData.condition) {
        throw new Error('Vui lòng chọn độ mới');
      }
      if (!formData.category) {
        throw new Error('Vui lòng chọn loại sản phẩm');
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        condition: formData.condition,
        stock: parseInt(formData.stock) || 1,
        location: formData.location.trim(),
        categoryId: formData.category ? categoryMap[formData.category] : undefined,
        images: validImages.length > 0 ? validImages : undefined,
      };

      console.log('Sending payload:', {
        ...payload,
        images: payload.images ? payload.images.map(img => ({
          length: img.length,
          preview: img.substring(0, 50) + '...',
          isValid: img.includes('base64,')
        })) : undefined
      });
      const response = await apiClient.post('/products', payload);
      console.log('Product created successfully:', response.data);
      router.push('/');
    } catch (err: any) {
      console.error('Error creating product:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.error 
        || (Array.isArray(err.response?.data?.message) ? err.response.data.message.join(', ') : err.message)
        || 'Không thể tạo sản phẩm';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Đăng Camera</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection - Moved to top */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại sản phẩm *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A2475] focus:border-[#5A2475]/40 text-gray-900 font-medium"
              >
                <option value="">-- Chọn loại sản phẩm --</option>
                <option value="camera">Máy ảnh</option>
                <option value="lens">Ống kính</option>
                <option value="other">Khác (đèn, trigger, ...)</option>
              </select>
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên sản phẩm *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A2475] focus:border-[#5A2475]/40 text-gray-900 font-medium"
                placeholder="Nhập tên sản phẩm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A2475] focus:border-[#5A2475]/40 text-gray-900 font-medium"
                placeholder="Mô tả sản phẩm của bạn..."
              />
            </div>

            {/* Price and Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá (VNĐ) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A2475] focus:border-[#5A2475]/40 text-gray-900 font-medium"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A2475] focus:border-[#5A2475]/40 text-gray-900 font-medium"
                  placeholder="1"
                />
              </div>
            </div>

            {/* Condition and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Độ mới *
                </label>
                <select
                  required
                  value={formData.condition}
                  onChange={(e) =>
                    setFormData({ ...formData, condition: e.target.value as any })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A2475] focus:border-[#5A2475]/40 text-gray-900 font-medium"
                >
                  <option value="">-- Chọn độ mới --</option>
                  <option value="used">Đã qua sử dụng</option>
                  <option value="new">Mới</option>
                  <option value="like_new">Như mới</option>
                  <option value="old">Cũ</option>
                  <option value="damaged">Nát</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa điểm *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A2475] focus:border-[#5A2475]/40 text-gray-900 font-medium"
                  placeholder="Ví dụ: Hà Nội, Việt Nam"
                />
              </div>
            </div>


            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hình ảnh sản phẩm
              </label>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-[#963CC3] text-white rounded-xl hover:opacity-90 cursor-pointer transition-colors">
                    <Upload className="w-5 h-5" />
                    <span>Tải hình ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm text-gray-500">
                    Đã chọn {images.length} hình ảnh
                  </span>
                </div>

                {/* Image Previews */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-[#963CC3] text-white rounded-xl hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Đang đăng...' : 'Đăng'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-[#5A2475]/15 text-[#1a1625] rounded-xl hover:bg-[#5A2475]/25 transition-colors"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
