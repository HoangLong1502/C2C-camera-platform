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
} from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  totalUsers: number;
  productsOnSale: number;
  productsContacted: number;
  pendingApproval: number;
  totalChatRooms: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
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
                <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4" />
                <div className="h-6 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-8 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
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

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => router.push('/')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Package className="w-5 h-5" />
                  Xem danh sách sản phẩm
                </button>
                <button
                  onClick={() => router.push('/products/create')}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Package className="w-5 h-5" />
                  Đăng sản phẩm
                </button>
                <button
                  onClick={() => router.push('/my-products')}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Sản phẩm của tôi
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Các chức năng quản lý user, duyệt bài chi tiết sẽ được bổ sung sau.
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
