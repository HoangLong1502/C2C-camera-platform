'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import UserDropdown from '@/components/UserDropdown';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import { Camera, Plus, MessageCircle, Store, ShoppingBag, LayoutPanelTop, ClipboardList } from 'lucide-react';

type UserMode = 'buyer' | 'seller';

const SELLER_ROUTE_MATCHERS = ['/my-products', '/products/create'];

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [userMode, setUserMode] = useState<UserMode>('buyer');

  useEffect(() => {
    const isSellerRoute =
      SELLER_ROUTE_MATCHERS.some((p) => pathname.startsWith(p)) ||
      /^\/products\/\d+\/edit$/.test(pathname);

    if (isSellerRoute) {
      setUserMode('seller');
      localStorage.setItem('preferredUserMode', 'seller');
      return;
    }

    if (pathname === '/' || pathname.startsWith('/products/') || pathname.startsWith('/orders') || pathname.startsWith('/checkout')) {
      setUserMode('buyer');
      localStorage.setItem('preferredUserMode', 'buyer');
      return;
    }

    const preferred = localStorage.getItem('preferredUserMode');
    if (preferred === 'buyer' || preferred === 'seller') {
      setUserMode(preferred);
    }
  }, [pathname]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const fetchUnread = () => {
      apiClient.get<number>('/chat/unread-count').then((res) => setUnreadCount(res.data ?? 0)).catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 20000);
    return () => clearInterval(interval);
  }, [user]);

  const switchMode = (mode: UserMode) => {
    setUserMode(mode);
    localStorage.setItem('preferredUserMode', mode);
    if (mode === 'seller') {
      router.push(user ? '/my-products' : '/auth/register');
      return;
    }
    router.push('/');
  };

  return (
    <header className="shell-gradient backdrop-blur-xl border-b border-[#5A2475]/10 shadow-[0_10px_40px_rgba(26,21,34,0.10)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <Link href="/" className="flex items-center gap-2 text-gray-900 hover:opacity-90 shrink-0">
            <Camera className="w-8 h-8 text-[#5A2475]" />
            <h1 className="text-xl font-bold hidden sm:block">C2C Camera Platform</h1>
          </Link>

          {user && (
            <div className="hidden md:flex items-center p-1 rounded-xl bg-white border border-[#5A2475]/15">
              <button
                onClick={() => switchMode('buyer')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  userMode === 'buyer' ? 'bg-[#5A2475] text-white' : 'text-[#5A2475] hover:bg-[#5A2475]/10'
                }`}
              >
                Chế độ mua
              </button>
              <button
                onClick={() => switchMode('seller')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  userMode === 'seller' ? 'bg-[#963CC3] text-white' : 'text-[#5A2475] hover:bg-[#5A2475]/10'
                }`}
              >
                Chế độ bán
              </button>
            </div>
          )}

          <nav className="hidden lg:flex items-center gap-1">
            {userMode === 'buyer' ? (
              <>
                <Link
                  href="/"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-700 hover:bg-[#5A2475]/10 hover:text-[#5A2475] text-sm font-medium transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Khám phá sản phẩm
                </Link>
                <button
                  onClick={() => router.push('/orders')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-700 hover:bg-[#5A2475]/10 hover:text-[#5A2475] text-sm font-medium transition-colors"
                >
                  <ClipboardList className="w-4 h-4" />
                  Đơn mua
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/my-products')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-700 hover:bg-[#5A2475]/10 hover:text-[#5A2475] text-sm font-medium transition-colors"
                >
                  <LayoutPanelTop className="w-4 h-4" />
                  Quản lý sản phẩm
                </button>
                <button
                  onClick={() => router.push('/products/create')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#5A2475]/10 text-[#5A2475] hover:bg-[#5A2475]/20 text-sm font-medium transition-colors"
                >
                  <Store className="w-4 h-4" />
                  Đăng bán
                </button>
              </>
            )}
          </nav>

          <div className="flex gap-2 sm:gap-3 items-center shrink-0">
            {user ? (
              <>
                <button
                  onClick={() => router.push(userMode === 'seller' ? '/products/create' : '/')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#963CC3] text-white hover:opacity-95 rounded-xl font-medium text-sm shadow-lg shadow-[#963CC3]/25 transition-all"
                  title={userMode === 'seller' ? 'Đăng sản phẩm mới' : 'Khám phá sản phẩm'}
                >
                  {userMode === 'seller' ? <Plus className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                  <span className="hidden xs:inline">{userMode === 'seller' ? 'Đăng bán' : 'Mua ngay'}</span>
                </button>
                {user.role === 'admin' && (
                  <button
                    onClick={() => router.push('/admin')}
                    className="flex items-center gap-2 px-3 py-2 border border-[#5A2475]/30 text-[#5A2475] hover:bg-[#5A2475]/10 rounded-lg transition-colors text-sm"
                  >
                    <span className="hidden sm:inline">Admin</span>
                  </button>
                )}
                <NotificationsDropdown />
                <button
                  onClick={() => router.push('/messages')}
                  className="relative p-2.5 rounded-lg hover:bg-[#5A2475]/10 text-[#5A2475]"
                  title="Tin nhắn"
                  aria-label="Tin nhắn"
                >
                  <MessageCircle className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <UserDropdown />
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="px-4 py-2.5 text-[#5A2475] hover:bg-[#5A2475]/10 rounded-xl font-medium text-sm transition-colors"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => router.push('/auth/register')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#963CC3] text-white hover:opacity-95 rounded-xl font-medium text-sm shadow-lg shadow-[#963CC3]/25 transition-all"
                >
                  <Plus className="w-4 h-4 hidden sm:inline" />
                  Đăng ký & Bán ngay
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
