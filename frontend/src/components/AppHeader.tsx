'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import UserDropdown from '@/components/UserDropdown';
import { Camera, Plus, MessageCircle } from 'lucide-react';

export default function AppHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

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

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-[#5A2475]/10 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-gray-900 hover:opacity-90">
            <Camera className="w-8 h-8 text-[#5A2475]" />
            <h1 className="text-xl font-bold">C2C Camera Platform</h1>
          </Link>
          <div className="flex gap-3 items-center">
            {user ? (
              <>
                <button
                  onClick={() => router.push('/products/create')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#963CC3] text-white hover:opacity-90 rounded-lg transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Đăng</span>
                </button>
                <button
                  onClick={() => router.push('/messages')}
                  className="relative p-2 rounded-lg hover:bg-[#5A2475]/10 text-[#5A2475]"
                  title="Tin nhắn"
                  aria-label="Tin nhắn"
                >
                  <MessageCircle className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      !
                    </span>
                  )}
                </button>
                <UserDropdown />
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="px-4 py-2 text-[#5A2475] hover:bg-[#5A2475]/10 rounded-lg text-sm"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => router.push('/auth/register')}
                  className="px-4 py-2 bg-[#963CC3] text-white hover:opacity-90 rounded-lg text-sm"
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
