'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import { User, Mail, Shield, Phone, Pencil, X, Check } from 'lucide-react';

/** Số điện thoại VN: 10 số, bắt đầu 0 hoặc +84, tiếp theo 3/5/7/8/9 */
const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

function validatePhone(phone: string): string | null {
  if (!phone || !phone.trim()) return null;
  const trimmed = phone.trim();
  if (!PHONE_REGEX.test(trimmed)) {
    return 'Số điện thoại không hợp lệ. VD: 0912345678 hoặc +84912345678';
  }
  return null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });
  const [fieldErrors, setFieldErrors] = useState<{ fullName?: string; email?: string; phone?: string }>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setError('');
    setFieldErrors({});

    const err: typeof fieldErrors = {};
    if (!form.fullName.trim()) {
      err.fullName = 'Vui lòng nhập họ tên';
    }
    if (!form.email.trim()) {
      err.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      err.email = 'Email không hợp lệ';
    }
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) err.phone = phoneErr;

    if (Object.keys(err).length > 0) {
      setFieldErrors(err);
      return;
    }

    setSaving(true);
    try {
      const payload: { fullName?: string; email?: string; phone?: string } = {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
      };
      if (form.phone.trim()) {
        payload.phone = form.phone.trim();
      } else {
        payload.phone = '';
      }
      await apiClient.patch('/auth/profile', payload);
      await refreshUser();
      setEditing(false);
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Không lưu được. Thử lại.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-[#5A2475] flex items-center justify-center text-white text-3xl font-bold">
                {user.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{user.fullName || 'User'}</h1>
                <p className="text-gray-500">{user.email}</p>
              </div>
            </div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 border border-[#5A2475]/20 text-[#1a1625] rounded-xl hover:bg-[#5A2475]/10"
              >
                <Pencil className="w-4 h-4" />
                Chỉnh sửa hồ sơ
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setForm({ fullName: user.fullName || '', email: user.email || '', phone: user.phone || '' });
                    setError('');
                    setFieldErrors({});
                  }}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 border border-[#5A2475]/20 text-[#1a1625] rounded-xl hover:bg-[#5A2475]/10"
                >
                  <X className="w-4 h-4" />
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-[#963CC3] text-white rounded-xl hover:opacity-90 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="w-full px-4 py-2 border border-[#5A2475]/20 rounded-xl focus:ring-2 focus:ring-[#5A2475] focus:border-[#5A2475]/40"
                  placeholder="Họ và tên"
                />
                {fieldErrors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.fullName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2 border border-[#5A2475]/20 rounded-xl focus:ring-2 focus:ring-[#5A2475] focus:border-[#5A2475]/40"
                  placeholder="email@example.com"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại (tùy chọn)</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-[#5A2475]/20 rounded-xl focus:ring-2 focus:ring-[#5A2475] focus:border-[#5A2475]/40"
                  placeholder="0912345678 hoặc +84912345678"
                />
                {fieldErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Định dạng: 10 số, bắt đầu 0 hoặc +84, ví dụ 0912345678
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-[#5A2475]/5 rounded-xl">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Họ tên</div>
                  <div className="font-medium text-gray-900">{user.fullName || 'Chưa cập nhật'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[#5A2475]/5 rounded-xl">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium text-gray-900">{user.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[#5A2475]/5 rounded-xl">
                <Phone className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Số điện thoại</div>
                  <div className="font-medium text-gray-900">{user.phone || 'Chưa thêm'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[#5A2475]/5 rounded-xl">
                <Shield className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Vai trò</div>
                  <div className="font-medium text-gray-900 capitalize">
                    {user.role || 'buyer'}
                    {user.role === 'admin' && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-[#5A2475]/10 text-[#5A2475] rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-[#5A2475]/15">
            <button
              onClick={() => router.push('/my-products')}
              className="px-6 py-3 bg-[#963CC3] text-white rounded-xl hover:opacity-90 transition-all"
            >
              Xem sản phẩm của tôi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
