export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock?: number;
  seller_id?: number;
  status?: string;
  condition?: string;
  images?: string[];
  views?: number;
  sold_count?: number;
  rating?: number;
  review_count?: number;
  featured?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface CheckoutForm {
  name: string;
  phone: string;
  address: string;
  email: string;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  total_price: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

export type Page = 'home' | 'products' | 'cart' | 'login' | 'admin' | 'register' | 'seller-dashboard' | 'marketplace' | 'role-selection';

export interface User {
  id?: number;
  email: string;
  role: string;
  isAdmin?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  role: 'buyer' | 'seller' | 'both';
}