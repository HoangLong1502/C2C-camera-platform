'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User, ChevronDown, LogOut, Package, Plus, Settings } from 'lucide-react';

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const menuItems = [
    {
      label: 'My Products',
      icon: Package,
      onClick: () => {
        router.push('/my-products');
        setIsOpen(false);
      },
    },
    {
      label: 'Profile',
      icon: User,
      onClick: () => {
        router.push('/profile');
        setIsOpen(false);
      },
    },
    ...(user.role === 'admin'
      ? [
          {
            label: 'Admin Dashboard',
            icon: Settings,
            onClick: () => {
              router.push('/admin');
              setIsOpen(false);
            },
          },
        ]
      : []),
    {
      label: 'Logout',
      icon: LogOut,
      onClick: () => {
        logout();
        setIsOpen(false);
      },
      className: 'text-red-600 hover:bg-red-50',
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
            {user.fullName?.[0]?.toUpperCase() || user.email[0]?.toUpperCase() || 'U'}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-medium text-gray-900">
              {user.fullName || user.email}
            </div>
            {user.role === 'admin' && (
              <div className="text-xs text-purple-600">Admin</div>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors ${
                  item.className || ''
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
