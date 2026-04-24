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
  LayoutDashboard,
  ShieldCheck,
  Zap,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

const MODERATION_STATUS = {
  pending_approval: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  ai_auto: 'AI tự đăng',
} as const;

type ModerationFilterKey = keyof typeof MODERATION_STATUS;

interface DashboardStats {
  totalProducts: number;
  totalUsers: number;
  productsOnSale: number;
  productsContacted: number;
  pendingApproval: number;
  totalChatRooms: number;
}

interface ModerationIssue {
  code: string;
  message: string;
}

interface ModerationProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  adminFee?: number | null;
  status: string;
  adminComment?: string | null;
  autoApproved?: boolean;
  moderationScore?: number;
  moderationIssues?: ModerationIssue[] | null;
  seller?: { id: number; fullName?: string; email?: string };
  createdAt: string;
}

function parseAiRow(issues: ModerationIssue[] | null | undefined) {
  const list = Array.isArray(issues) ? issues : [];
  const aiPricing = list.find((i) => i.code === 'ai_pricing');
  const priceRejected = list.some((i) => i.code === 'price_unreasonable');
  return { aiPricing: aiPricing?.message ?? null, priceRejected };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [moderationProducts, setModerationProducts] = useState<ModerationProduct[]>([]);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [moderationFilter, setModerationFilter] = useState<ModerationFilterKey>('pending_approval');
  const [rejectModal, setRejectModal] = useState<{
    productId: number;
    productName: string;
    isRevoke?: boolean;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feeInputs, setFeeInputs] = useState<Record<number, string>>({});

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

  const moderationListParams = () =>
    moderationFilter === 'ai_auto'
      ? { status: 'approved' as const, autoApprovedOnly: 'true' }
      : { status: moderationFilter };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    setModerationLoading(true);
    apiClient
      .get<ModerationProduct[]>('/admin/products/moderation', {
        params: moderationListParams(),
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
        params: moderationListParams(),
      })
      .then((res) => setModerationProducts(Array.isArray(res.data) ? res.data : []))
      .finally(() => setModerationLoading(false));
  };

  const handleApprove = async (id: number) => {
    const feeInput = feeInputs[id];
    const adminFee = feeInput != null && feeInput.trim() !== '' ? parseFloat(feeInput) : undefined;
    if (adminFee != null && (Number.isNaN(adminFee) || adminFee < 0)) {
      alert('Phí phải là số không âm.');
      return;
    }
    setActionLoading(true);
    try {
      await apiClient.patch(`/admin/products/${id}/approve`, {
        adminFee: adminFee,
      });
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
    const wasRevoke = rejectModal.isRevoke === true;
    setActionLoading(true);
    try {
      await apiClient.patch(`/admin/products/${rejectModal.productId}/reject`, {
        reason: rejectReason.trim(),
      });
      setRejectModal(null);
      setRejectReason('');
      refreshModeration();
      if (stats) {
        if (wasRevoke) {
          setStats({
            ...stats,
            productsOnSale: Math.max(0, stats.productsOnSale - 1),
            totalProducts: Math.max(0, stats.totalProducts),
          });
        } else {
          setStats({ ...stats, pendingApproval: Math.max(0, stats.pendingApproval - 1) });
        }
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Không thể từ chối bài');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          <p className="text-sm font-medium text-slate-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar — technical / business header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Về trang chủ</span>
              </button>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-slate-700" />
                <span className="text-sm font-semibold text-slate-900">Admin</span>
                <span className="text-xs text-slate-500 font-medium px-1.5 py-0.5 rounded bg-slate-100">Dashboard</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Quản trị viên</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Tổng quan hệ thống</h1>
          <p className="text-sm text-slate-500 mt-0.5">Thống kê và kiểm duyệt bài đăng</p>
        </div>

        {statsError && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {statsError}
          </div>
        )}

        {statsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-20 mb-3" />
                <div className="h-7 bg-slate-200 rounded w-14" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Stats grid — compact, data-first */}
            <section className="mb-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Tổng bài đăng', value: stats.totalProducts, icon: Package, sub: 'sản phẩm', iconClass: 'bg-slate-100 text-slate-600' },
                  { label: 'Người dùng', value: stats.totalUsers, icon: Users, sub: 'tài khoản', iconClass: 'bg-slate-100 text-slate-600' },
                  { label: 'Đang bán', value: stats.productsOnSale, icon: ShoppingBag, sub: 'đang hiển thị', iconClass: 'bg-emerald-100 text-emerald-600' },
                  { label: 'Đã liên hệ', value: stats.productsContacted, icon: MessageCircle, sub: 'có tin nhắn', iconClass: 'bg-amber-100 text-amber-600' },
                  { label: 'Chờ duyệt', value: stats.pendingApproval, icon: FileText, sub: 'cần xử lý', iconClass: 'bg-violet-100 text-violet-600' },
                  { label: 'Phòng chat', value: stats.totalChatRooms, icon: MessageCircle, sub: 'cuộc hội thoại', iconClass: 'bg-sky-100 text-sky-600' },
                ].map(({ label, value, icon: Icon, sub, iconClass }) => (
                  <div
                    key={label}
                    className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
                      <div className={`p-1.5 rounded-md ${iconClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-semibold tabular-nums text-slate-900">{value.toLocaleString('vi-VN')}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Moderation — table-first, technical */}
            <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-600" />
                  Kiểm duyệt bài đăng
                </h2>
                <div className="flex flex-wrap rounded-lg border border-slate-200 p-0.5 bg-slate-50 gap-0.5">
                  {(['pending_approval', 'ai_auto', 'approved', 'rejected'] as const).map((key) => (
                    <button
                      key={key}
                      onClick={() => setModerationFilter(key)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        moderationFilter === key
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {MODERATION_STATUS[key]}
                    </button>
                  ))}
                </div>
              </div>

              {moderationLoading ? (
                <div className="flex items-center justify-center py-16 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-sm">Đang tải...</span>
                </div>
              ) : moderationProducts.length === 0 ? (
                <div className="py-16 text-center text-sm text-slate-500">Không có bài nào trong mục này.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80">
                        <th className="px-4 py-2.5 font-semibold text-slate-700">Bài đăng</th>
                        <th className="px-4 py-2.5 font-semibold text-slate-700">Người đăng</th>
                        <th className="px-4 py-2.5 font-semibold text-slate-700">Giá / Phí</th>
                        <th className="px-4 py-2.5 font-semibold text-slate-700 min-w-[200px]">
                          <span className="inline-flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                            AI định giá
                          </span>
                        </th>
                        <th className="px-4 py-2.5 font-semibold text-slate-700">Trạng thái</th>
                        {moderationFilter === 'rejected' ? (
                          <th className="px-4 py-2.5 font-semibold text-slate-700 min-w-[180px]">Lý do</th>
                        ) : (
                          <th className="px-4 py-2.5 font-semibold text-slate-700 text-right min-w-[200px]">Thao tác</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {moderationProducts.map((p, idx) => {
                        const { aiPricing, priceRejected } = parseAiRow(p.moderationIssues);
                        const canRevokeAuto =
                          p.status === 'approved' && p.autoApproved === true;
                        return (
                        <tr
                          key={p.id}
                          className={`border-b border-slate-100 ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{p.name}</div>
                            <div className="text-slate-500 line-clamp-1 text-xs mt-0.5">{p.description}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {p.seller?.fullName || p.seller?.email || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="tabular-nums font-medium text-slate-900">
                              {Number(p.price).toLocaleString('vi-VN')}₫
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Phí: {p.adminFee != null ? `${Number(p.adminFee).toLocaleString('vi-VN')}₫` : '—'}
                            </div>
                            {moderationFilter === 'pending_approval' && (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <input
                                  type="number"
                                  min={0}
                                  step={1000}
                                  value={feeInputs[p.id] ?? (p.adminFee != null ? String(p.adminFee) : '')}
                                  onChange={(e) =>
                                    setFeeInputs((prev) => ({ ...prev, [p.id]: e.target.value }))
                                  }
                                  className="w-24 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                                  placeholder="Phí"
                                />
                                <span className="text-xs text-slate-500">
                                  Thu về: {(() => {
                                    const feeStr = feeInputs[p.id] ?? (p.adminFee != null ? String(p.adminFee) : '');
                                    const feeNum = feeStr && !Number.isNaN(Number(feeStr)) ? Number(feeStr) : 0;
                                    return `${Math.max(0, p.price - feeNum).toLocaleString('vi-VN')}₫`;
                                  })()}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top">
                            {moderationFilter === 'pending_approval' && (
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                    priceRejected
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {priceRejected ? 'AI: Giá chưa đạt' : 'AI: Giá OK'}
                                </span>
                                {typeof p.moderationScore === 'number' && (
                                  <span className="text-[10px] text-slate-500">Điểm nội dung: {p.moderationScore}</span>
                                )}
                              </div>
                            )}
                            {(moderationFilter === 'ai_auto' || moderationFilter === 'approved') && p.autoApproved && (
                              <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-xs font-semibold bg-violet-100 text-violet-800">
                                AI đã chấp nhận, tự đăng
                              </span>
                            )}
                            {moderationFilter === 'rejected' && aiPricing && (
                              <span className="text-[10px] text-slate-500">Có log AI lúc đăng</span>
                            )}
                            {aiPricing ? (
                              <p className="text-xs text-slate-600 mt-1.5 line-clamp-4 whitespace-pre-wrap break-words max-w-[280px]">
                                {aiPricing}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400 mt-1">—</p>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  p.status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : p.status === 'rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {MODERATION_STATUS[p.status as keyof typeof MODERATION_STATUS] ?? p.status}
                              </span>
                              {p.autoApproved && moderationFilter !== 'ai_auto' && (
                                <span className="text-[10px] text-violet-600 font-medium">Tự động (AI)</span>
                              )}
                            </div>
                          </td>
                          {moderationFilter === 'rejected' ? (
                            <td className="px-4 py-3 text-slate-600 text-xs max-w-xs">
                              <p className="line-clamp-4 break-words">{p.adminComment || '—'}</p>
                            </td>
                          ) : (
                            <td className="px-4 py-3 text-right align-top">
                              <div className="flex flex-col items-end gap-2">
                                {moderationFilter === 'pending_approval' && (
                                  <div className="flex gap-1.5 justify-end flex-wrap">
                                    <button
                                      onClick={() => handleApprove(p.id)}
                                      disabled={actionLoading}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-emerald-600 bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                      Duyệt
                                    </button>
                                    <button
                                      onClick={() =>
                                        setRejectModal({ productId: p.id, productName: p.name, isRevoke: false })
                                      }
                                      disabled={actionLoading}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-red-600 text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-50"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      Từ chối
                                    </button>
                                  </div>
                                )}
                                {moderationFilter === 'ai_auto' && (
                                  <div className="flex flex-col items-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setRejectModal({ productId: p.id, productName: p.name, isRevoke: true })
                                      }
                                      disabled={actionLoading}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-red-600 text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-50"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      Gỡ bài (reject)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => router.push(`/products/${p.id}`)}
                                      className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      Xem trang sản phẩm
                                    </button>
                                  </div>
                                )}
                                {moderationFilter === 'approved' && (
                                  <div className="flex flex-col items-end gap-2">
                                    {canRevokeAuto ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setRejectModal({ productId: p.id, productName: p.name, isRevoke: true })
                                          }
                                          disabled={actionLoading}
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-red-600 text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-50"
                                        >
                                          <XCircle className="w-3.5 h-3.5" />
                                          Gỡ bài AI
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => router.push(`/products/${p.id}`)}
                                          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                          Xem
                                        </button>
                                      </>
                                    ) : (
                                      <span className="text-xs text-slate-400">Duyệt tay — không gỡ tự động</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Quick actions — compact bar */}
            <section className="mt-6 flex flex-wrap gap-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider self-center mr-2">Quick actions</span>
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
              >
                <Zap className="w-4 h-4" />
                Danh sách sản phẩm
              </button>
              <button
                onClick={() => router.push('/products/create')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
              >
                <Package className="w-4 h-4" />
                Đăng sản phẩm
              </button>
              <button
                onClick={() => router.push('/my-products')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
              >
                <ShoppingBag className="w-4 h-4" />
                Sản phẩm của tôi
              </button>
            </section>
          </>
        ) : null}

        {rejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="rounded-lg border border-slate-200 bg-white shadow-xl max-w-md w-full p-5">
              <h3 className="text-base font-semibold text-slate-900">
                {rejectModal.isRevoke ? 'Gỡ bài sau AI tự duyệt' : 'Từ chối bài đăng'}
              </h3>
              <p className="text-sm text-slate-500 mt-1">Bài: {rejectModal.productName}</p>
              {rejectModal.isRevoke && (
                <p className="text-xs text-amber-700 mt-2 rounded-md bg-amber-50 border border-amber-200 px-2 py-1.5">
                  Bài đang hiển thị công khai. Sau khi gỡ, trạng thái chuyển sang từ chối và người bán nhận thông báo.
                </p>
              )}
              <label className="mt-4 block text-xs font-medium text-slate-700 uppercase tracking-wider">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                className="mt-1.5 w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-900 min-h-[100px] resize-y focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                autoFocus
              />
              <div className="flex gap-2 mt-4 justify-end">
                <button
                  onClick={() => { setRejectModal(null); setRejectReason(''); }}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={actionLoading || !rejectReason.trim()}
                  className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
