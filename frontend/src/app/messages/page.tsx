'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import { ChatBox } from '@/components/ChatBox';
import { MessageCircle, ArrowLeft } from 'lucide-react';

interface Room {
  id: number;
  productId: number;
  lastMessageAt: string | null;
  otherUser: { id: number; fullName: string };
  unreadCount?: number;
}

export default function MessagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRoomId, setOpenRoomId] = useState<number | null>(null);
  const [openRoomOtherName, setOpenRoomOtherName] = useState('');
  const [openRoomProductName, setOpenRoomProductName] = useState('Tin nhắn');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    const loadRooms = () => apiClient.get<Room[]>('/chat/rooms').then((res) => setRooms(res.data ?? [])).catch(() => setRooms([])).finally(() => setLoading(false));
    loadRooms();
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Về trang chủ
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MessageCircle className="w-7 h-7" />
          Tin nhắn
        </h1>
        {loading ? (
          <p className="text-gray-500">Đang tải...</p>
        ) : rooms.length === 0 ? (
          <p className="text-gray-500">Bạn chưa có cuộc hội thoại nào.</p>
        ) : (
          <ul className="bg-white rounded-lg shadow divide-y">
            {rooms.map((room) => (
              <li key={room.id}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenRoomId(room.id);
                    setOpenRoomOtherName(room.otherUser?.fullName ?? 'Người dùng');
                    setOpenRoomProductName(room.productId ? `Sản phẩm #${room.productId}` : 'Tin nhắn');
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#5A2475]/10"
                >
                  <span className="font-medium text-gray-900">{room.otherUser?.fullName ?? 'Người dùng'}</span>
                  {room.unreadCount && room.unreadCount > 0 ? (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                      {room.unreadCount}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {openRoomId !== null && (
        <ChatBox
          roomId={openRoomId}
          productName={openRoomProductName}
          otherUserName={openRoomOtherName}
          currentUserId={user.id}
          onClose={() => { setOpenRoomId(null); setOpenRoomOtherName(''); apiClient.get<Room[]>('/chat/rooms').then((res) => setRooms(res.data ?? [])); }}
        />
      )}
    </div>
  );
}
