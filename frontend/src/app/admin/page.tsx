'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import {
  Package,
  Users,
  ShoppingBag,
  MessageCircle,
  FileText,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';

const MODERATION_STATUS = {
  pending_approval: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
} as const;

interface DashboardStats {
  totalProducts: number;
  totalUsers: number;
  productsOnSale: number;
  productsContacted: number;
  pendingApproval: number;
  totalChatRooms: number;
}

interface ModerationProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  status: string;
  adminComment?: string | null;
  seller?: { id: number; name?: string; email?: string };
  createdAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [moderationProducts, setModerationProducts] = useState<ModerationProduct[]>([]);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [moderationFilter, setModerationFilter] = useState<string>('pending_approval');
  const [rejectModal, setRejectModal] = useState<{ productId: number; productName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    setStatsLoading(true);
    setStatsError('');
    apiClient
      .get<DashboardStats>('/admin/stats')
      .then((res) => setStats(res.data))
      .catch(() => setStatsError('Không tải được thống kê'))
      .finally(() => setStatsLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    setModerationLoading(true);
    apiClient
      .get<ModerationProduct[]>('/admin/products/moderation', {
        params: moderationFilter ? { status: moderationFilter } : {},
      })
      .then((res) => setModerationProducts(Array.isArray(res.data) ? res.data : []))
      .catch(() => setModerationProducts([]))
      .finally(() => setModerationLoading(false));
  }, [user, moderationFilter]);

  const refreshModeration = () => {
    if (!user || user.role !== 'admin') return;
    setModerationLoading(true);
    apiClient
      .get<ModerationProduct[]>('/admin/products/moderation', {
        params: moderationFilter ? { status: moderationFilter } : {},
      })
      .then((res) => setModerationProducts(Array.isArray(res.data) ? res.data : []))
      .finally(() => setModerationLoading(false));
  };

  const handleApprove = async (id: number) => {
    setActionLoading(true);
    try {
      await apiClient.patch(`/admin/products/${id}/approve`);
      refreshModeration();
      if (stats) setStats({ ...stats, pendingApproval: Math.max(0, stats.pendingApproval - 1) });
    } catch (e: any) {
      alert(e.response?.data?.message || 'Không thể duyệt bài');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal || !rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối.');
      return;
    }
    setActionLoading(true);
    try {
      await apiClient.patch(`/admin/products/${rejectModal.productId}/reject`, {
        reason: rejectReason.trim(),
      });
      setRejectModal(null);
      setRejectReason('');
      refreshModeration();
      if (stats) setStats({ ...stats, pendingApproval: Math.max(0, stats.pendingApproval - 1) });
    } catch (e: any) {
      alert(e.response?.data?.message || 'Không thể từ chối bài');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Về trang chủ
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-2">Tổng quan và quản lý marketplace</p>
        </div>

        {statsError && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {statsError}
          </div>
        )}

        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-12 w-12 bg-[#5A2475]/15 rounded-lg mb-4" />
                <div className="h-6 bg-[#5A2475]/15 rounded w-24 mb-2" />
                <div className="h-8 bg-[#5A2475]/15 rounded w-16" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-[#5A2475]/10 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-[#5A2475]" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Tổng bài đăng</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                <p className="text-xs text-gray-400 mt-1">Tất cả sản phẩm đã đăng</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Số user</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-xs text-gray-400 mt-1">Tài khoản đã đăng ký</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Đang đăng bán</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.productsOnSale}</p>
                <p className="text-xs text-gray-400 mt-1">Sản phẩm đang bán</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Đã được liên hệ</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.productsContacted}</p>
                <p className="text-xs text-gray-400 mt-1">Bài có tin nhắn</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-violet-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Chờ duyệt</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingApproval}</p>
                <p className="text-xs text-gray-400 mt-1">Bài chờ phê duyệt</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-sky-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Cuộc hội thoại</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalChatRooms}</p>
                <p className="text-xs text-gray-400 mt-1">Tổng phòng chat</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Kiểm duyệt bài đăng</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {(['pending_approval', 'approved', 'rejected'] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => setModerationFilter(key)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      moderationFilter === key
                        ? 'bg-[#5A2475] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {MODERATION_STATUS[key]}
                  </button>
                ))}
              </div>
              {moderationLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin mr-2" />
                  Đang tải...
                </div>
              ) : moderationProducts.length === 0 ? (
                <p className="text-gray-500 py-8 text-center">Không có bài nào trong mục này.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="pb-3 font-semibold text-gray-700">Bài đăng</th>
                        <th className="pb-3 font-semibold text-gray-700">Người đăng</th>
                        <th className="pb-3 font-semibold text-gray-700">Trạng thái</th>
                        {moderationFilter === 'pending_approval' && (
                          <th className="pb-3 font-semibold text-gray-700">Thao tác</th>
                        )}
                        {moderationFilter === 'rejected' && (
                          <th className="pb-3 font-semibold text-gray-700">Lý do</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {moderationProducts.map((p) => (
                        <tr key={p.id} className="border-b border-gray-100">
                          <td className="py-3">
                            <div className="font-medium text-gray-900">{p.name}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{p.description}</div>
                          </td>
                          <td className="py-3 text-sm text-gray-600">
                            {p.seller?.name || p.seller?.email || '—'}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                p.status === 'approved'
                                  ? 'bg-green-100 text-green-700'
                                  : p.status === 'rejected'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {MODERATION_STATUS[p.status as keyof typeof MODERATION_STATUS] ?? p.status}
                            </span>
                          </td>
                          {moderationFilter === 'pending_approval' && (
                            <td className="py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApprove(p.id)}
                                  disabled={actionLoading}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                                >
                                  {actionLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4" />
                                  )}
                                  Duyệt
                                </button>
                                <button
                                  onClick={() => setRejectModal({ productId: p.id, productName: p.name })}
                                  disabled={actionLoading}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Từ chối
                                </button>
                              </div>
                            </td>
                          )}
                          {moderationFilter === 'rejected' && (
                            <td className="py-3 text-sm text-gray-600 max-w-xs truncate">
                              {p.adminComment || '—'}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => router.push('/')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#963CC3] text-white rounded-xl hover:opacity-90 transition-colors"
                >
                  <Package className="w-5 h-5" />
                  Xem danh sách sản phẩm
                </button>
                <button
                  onClick={() => router.push('/products/create')}
                  className="flex items-center gap-2 px-4 py-2 border border-[#5A2475]/20 text-[#1a1625] rounded-xl hover:bg-[#5A2475]/10 transition-colors"
                >
                  <Package className="w-5 h-5" />
                  Đăng sản phẩm
                </button>
                <button
                  onClick={() => router.push('/my-products')}
                  className="flex items-center gap-2 px-4 py-2 border border-[#5A2475]/20 text-[#1a1625] rounded-xl hover:bg-[#5A2475]/10 transition-colors"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Sản phẩm của tôi
                </button>
              </div>
            </div>
          </>
        ) : null}

        {rejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Từ chối bài đăng</h3>
              <p className="text-gray-600 text-sm mb-4">Bài: {rejectModal.productName}</p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 min-h-[100px] resize-y"
                autoFocus
              />
              <div className="flex gap-2 mt-4 justify-end">
                <button
                  onClick={() => {
                    setRejectModal(null);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={actionLoading || !rejectReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
