import { User, ShoppingCart, Store, Settings, LogOut as LogoutIcon, Shield } from 'lucide-react'
import type { User as UserType } from '../types'

interface UserDropdownProps {
  user: UserType;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

function UserDropdown({ user, onLogout, onNavigate }: UserDropdownProps) {
  const menuItems = [
    { 
      icon: <User className="h-5 w-5" />, 
      label: 'Hồ sơ', 
      onClick: () => alert('Tính năng sắp có'),
      divider: false 
    },
    { 
      icon: <ShoppingCart className="h-5 w-5" />, 
      label: 'Đơn hàng của tôi', 
      onClick: () => alert('Tính năng sắp có'),
      divider: false 
    },
    { 
      icon: <Settings className="h-5 w-5" />, 
      label: 'Cài đặt', 
      onClick: () => alert('Tính năng sắp có'),
      divider: false 
    },
    ...(user.role === 'seller' || user.role === 'both' ? [{
      icon: <Store className="h-5 w-5" />, 
      label: 'Bán hàng', 
      onClick: () => onNavigate('seller-dashboard'),
      divider: false 
    }] : []),
    ...(user.role === 'admin' ? [{
      icon: <Shield className="h-5 w-5" />, 
      label: 'Admin Dashboard', 
      onClick: () => onNavigate('admin'),
      divider: true 
    }] : []),
    { 
      icon: <LogoutIcon className="h-5 w-5" />, 
      label: 'Đăng xuất', 
      onClick: () => {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        onLogout()
      },
      divider: false 
    },
  ]

  return (
    <div className="relative">
      <div className="bg-white rounded-lg shadow-xl border-2 border-emerald-200 min-w-[200px] py-2">
        {/* User Info */}
        <div className="px-4 py-3 border-b border-gray-200">
          <p className="font-semibold text-gray-800">{user.email}</p>
          <p className="text-xs text-gray-500 capitalize">{user.role}</p>
        </div>

        {/* Menu Items */}
        <div className="py-2">
          {menuItems.map((item, index) => (
            <React.Fragment key={index}>
              {item.divider && <hr className="my-2" />}
              <button
                onClick={item.onClick}
                className="w-full px-4 py-2 flex items-center gap-3 hover:bg-emerald-50 transition text-gray-700 hover:text-emerald-600"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

export default UserDropdown
