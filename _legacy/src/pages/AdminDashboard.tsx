import React, { useState, useEffect } from 'react'
import { LogOut, ShoppingBag, CheckCircle, Truck, Package, XCircle, Eye, Trash2, FileCheck } from 'lucide-react'
import AdminProductApproval from './AdminProductApproval'
import type { Page } from '../types'

interface AdminDashboardProps {
  onLogout: () => void;
  setCurrentPage: (page: Page) => void;
}

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  total_price: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  item_count?: number;
}

function AdminDashboard({ onLogout, setCurrentPage }: AdminDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders')

  // Mock data for now - will connect to API later
  const mockOrders: Order[] = [
    {
      id: 1,
      customer_name: 'Nguyễn Văn A',
      customer_phone: '0901234567',
      customer_email: 'nguyenvana@gmail.com',
      customer_address: '123 Đường ABC, TP.HCM',
      total_price: 45990000,
      status: 'pending',
      created_at: new Date().toISOString(),
      item_count: 1
    },
    {
      id: 2,
      customer_name: 'Trần Thị B',
      customer_phone: '0907654321',
      customer_address: '456 Đường XYZ, Hà Nội',
      total_price: 18990000,
      status: 'processing',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      item_count: 2
    },
  ]

  useEffect(() => {
    setOrders(mockOrders)
  }, [])

  const updateOrderStatus = (orderId: number, newStatus: Order['status']) => {
    setOrders(orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ))
    setSelectedOrder(null)
    alert(`Đã cập nhật đơn hàng #${orderId} thành ${getStatusLabel(newStatus)}`)
  }

  const deleteOrder = (orderId: number) => {
    if (confirm('Bạn có chắc muốn xóa đơn hàng này?')) {
      setOrders(orders.filter(order => order.id !== orderId))
      setSelectedOrder(null)
      alert('Đã xóa đơn hàng!')
    }
  }

  const getStatusLabel = (status: Order['status']) => {
    const labels = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      shipped: 'Đã gửi hàng',
      delivered: 'Đã giao hàng',
      cancelled: 'Đã hủy'
    }
    return labels[status]
  }

  const getStatusIcon = (status: Order['status']) => {
    const icons = {
      pending: <Package className="h-5 w-5" />,
      processing: <CheckCircle className="h-5 w-5" />,
      shipped: <Truck className="h-5 w-5" />,
      delivered: <CheckCircle className="h-5 w-5" />,
      cancelled: <XCircle className="h-5 w-5" />
    }
    return icons[status]
  }

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      processing: 'bg-blue-100 text-blue-800 border-blue-300',
      shipped: 'bg-purple-100 text-purple-800 border-purple-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    }
    return colors[status]
  }

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(order => order.status === filterStatus)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl border-2 border-emerald-200 shadow-lg mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Quản lý toàn diện</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('user')
                localStorage.removeItem('token')
                onLogout()
                setCurrentPage('login')
              }}
              className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition flex items-center gap-2"
            >
              <LogOut className="h-5 w-5" />
              Đăng xuất
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'orders' 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <ShoppingBag className="h-5 w-5" />
              Đơn hàng
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'products' 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <FileCheck className="h-5 w-5" />
              Duyệt sản phẩm
            </button>
          </div>
        </div>

        {activeTab === 'products' ? (
          <AdminProductApproval onBack={() => setActiveTab('orders')} />
        ) : (
          <>
            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border-2 border-emerald-200 shadow-lg mb-6">
          <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filterStatus === 'all'
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tất cả ({orders.length})
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filterStatus === 'pending'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Chờ xử lý ({orders.filter(o => o.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilterStatus('processing')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filterStatus === 'processing'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Đang xử lý ({orders.filter(o => o.status === 'processing').length})
              </button>
              <button
                onClick={() => setFilterStatus('shipped')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filterStatus === 'shipped'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Đã gửi ({orders.filter(o => o.status === 'shipped').length})
              </button>
              <button
                onClick={() => setFilterStatus('delivered')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filterStatus === 'delivered'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Đã giao ({orders.filter(o => o.status === 'delivered').length})
              </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="grid grid-cols-1 gap-6">
          {filteredOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border-2 border-emerald-200 shadow-lg text-center">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 text-lg">Không có đơn hàng nào</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className="bg-white p-6 rounded-xl border-2 border-emerald-200 shadow-lg hover:shadow-xl transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-800">
                        Đơn hàng #{order.id}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 flex items-center gap-1 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                      <p><strong>Khách hàng:</strong> {order.customer_name}</p>
                      <p><strong>SĐT:</strong> {order.customer_phone}</p>
                      <p><strong>Email:</strong> {order.customer_email || 'N/A'}</p>
                      <p><strong>Số sản phẩm:</strong> {order.item_count} sản phẩm</p>
                      <p className="md:col-span-2"><strong>Địa chỉ:</strong> {order.customer_address}</p>
                      <p><strong>Tổng tiền:</strong> <span className="text-emerald-600 font-bold">{order.total_price.toLocaleString('vi-VN')}đ</span></p>
                      <p><strong>Ngày đặt:</strong> {new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-6">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Chi tiết
                    </button>
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </button>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'processing')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"
                    >
                      Xử lý
                    </button>
                  )}
                  {order.status === 'processing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'shipped')}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition"
                    >
                      Gửi hàng
                    </button>
                  )}
                  {order.status === 'shipped' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition"
                    >
                      Hoàn thành
                    </button>
                  )}
                  {order.status !== 'cancelled' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition"
                    >
                      Hủy đơn
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
