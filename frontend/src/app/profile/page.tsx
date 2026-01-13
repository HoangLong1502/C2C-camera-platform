'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Shield } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
              {user.fullName?.[0]?.toUpperCase() || user.email[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user.fullName || 'User'}</h1>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium text-gray-900">{user.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Full Name</div>
                <div className="font-medium text-gray-900">{user.fullName || 'Not set'}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Role</div>
                <div className="font-medium text-gray-900 capitalize">
                  {user.role || 'buyer'}
                  {user.role === 'admin' && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push('/my-products')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View My Products
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
