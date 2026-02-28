'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import { Bell } from 'lucide-react';

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  const fetchNotifications = () => {
    if (!user) return;
    apiClient.get<NotificationItem[]>('/notifications').then((res) => {
      setNotifications(res.data ?? []);
    }).catch(() => {});
  };

  const fetchUnreadCount = () => {
    if (!user) return;
    apiClient.get<number>('/notifications/unread-count').then((res) => {
      setUnreadCount(typeof res.data === 'number' ? res.data : 0);
    }).catch(() => {});
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);
      fetchNotifications();
      fetchUnreadCount();
      setLoading(false);
    }
  }, [isOpen, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (n: NotificationItem) => {
    if (n.link) {
      if (!n.read) {
        try {
          await apiClient.patch(`/notifications/${n.id}/read`);
          setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
          setUnreadCount((c) => Math.max(0, c - 1));
        } catch (_) {}
      }
      setIsOpen(false);
      router.push(n.link);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return d.toLocaleDateString('vi-VN');
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-[#5A2475]/10 text-[#5A2475]"
        title="Thông báo"
        aria-label="Thông báo"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-hidden bg-white rounded-xl shadow-lg border border-[#5A2475]/15 z-50 flex flex-col">
          <div className="p-3 border-b border-neutral-100 font-semibold text-neutral-900">
            Thông báo
          </div>
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center text-neutral-500 text-sm">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-neutral-500 text-sm">Chưa có thông báo</div>
            ) : (
              <ul className="py-1">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left px-4 py-3 hover:bg-[#5A2475]/5 transition-colors border-b border-neutral-50 last:border-0 ${!n.read ? 'bg-[#5A2475]/5' : ''}`}
                    >
                      <p className={`text-sm font-medium ${!n.read ? 'text-neutral-900' : 'text-neutral-700'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-neutral-400 mt-1">{formatTime(n.createdAt)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
