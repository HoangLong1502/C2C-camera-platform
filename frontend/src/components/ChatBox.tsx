'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import apiClient from '@/lib/api';
import { X, Send } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
const WS_BASE = API_URL.replace(/\/api\/?$/, '');

export interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  message: string;
  createdAt: string;
  sender?: { id: number; fullName: string } | null;
}

interface ChatBoxProps {
  roomId: number | null;
  productName: string;
  otherUserName: string;
  currentUserId: number;
  onClose: () => void;
}

export function ChatBox({
  roomId,
  productName,
  otherUserName,
  currentUserId,
  onClose,
}: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      setError('Vui lòng đăng nhập để chat');
      setLoading(false);
      return;
    }
    const s = io(`${WS_BASE}/chat`, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !connected) return;
    socket?.emit('join_room', { roomId });
  }, [roomId, connected, socket]);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    apiClient
      .get(`/chat/room/${roomId}/messages`)
      .then((res) => {
        if (!cancelled) setMessages(res.data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Không tải được tin nhắn');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  useEffect(() => {
    if (!socket) return;
    const onMsg = (msg: ChatMessage) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    };
    socket.on('new_message', onMsg);
    return () => {
      socket.off('new_message', onMsg);
    };
  }, [socket]);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text || !roomId || !socket || sending) return;
    setSending(true);
    socket.emit('send_message', { roomId, message: text }, (reply: any) => {
      setSending(false);
      if (reply?.error) {
        setError(reply.error);
      } else {
        setInput('');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#5A2475]/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-3 border-b">
          <div>
            <p className="font-medium text-gray-900">Chat: {productName}</p>
            <p className="text-sm text-gray-500">với {otherUserName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#5A2475]/10 text-[#5A2475]"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-3 mt-2 px-3 py-2 bg-red-50 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]"
        >
          {loading ? (
            <p className="text-gray-500 text-sm">Đang tải tin nhắn...</p>
          ) : messages.length === 0 ? (
            <p className="text-gray-500 text-sm">Chưa có tin nhắn. Hãy gửi lời chào!</p>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === currentUserId;
              return (
                <div
                  key={m.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      isMe
                        ? 'bg-[#963CC3] text-white'
                        : 'bg-[#5A2475]/10 text-[#1a1625]'
                    }`}
                  >
                    {!isMe && m.sender?.fullName && (
                      <p className="text-xs opacity-80 mb-0.5">{m.sender.fullName}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-white/90' : 'text-gray-500'}`}>
                      {new Date(m.createdAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-3 py-2 border border-[#5A2475]/20 rounded-lg focus:ring-2 focus:ring-[#5A2475] focus:border-[#5A2475]/40 outline-none"
            disabled={!connected || sending}
          />
          <button
            type="button"
            onClick={send}
            disabled={!input.trim() || !connected || sending}
            className="px-4 py-2 bg-[#963CC3] text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Send className="w-4 h-4" />
            Gửi
          </button>
        </div>
        {!connected && (
          <p className="text-xs text-amber-600 px-3 pb-2">Đang kết nối...</p>
        )}
      </div>
    </div>
  );
}
