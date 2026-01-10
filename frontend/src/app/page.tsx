'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { ShoppingBag, Search } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  images: string[];
  seller: {
    fullName: string;
  };
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await apiClient.get('/products', {
        params: { search },
      });
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">C2C Marketplace</h1>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/auth/login')}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/auth/register')}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
            >
              Register
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/products/${product.id}`)}
            >
              <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-t-lg flex items-center justify-center text-white text-6xl">
                📦
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">
                  {product.name}
                </h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-blue-600">
                    ${product.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">
                    {product.seller?.fullName || 'Seller'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
          </div>
        )}
      </main>
    </div>
  );
}
