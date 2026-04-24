import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, User, Mail } from 'lucide-react'
import type { Page, User } from '../types'

interface RegisterProps {
  onRegister: (user: User) => void;
  setCurrentPage: (page: Page) => void;
  onBack: () => void;
  onGoogleLogin?: () => void;
}

function Register({ onRegister: _onRegister, setCurrentPage: _setCurrentPage, onBack, onGoogleLogin: _onGoogleLogin }: RegisterProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    role: 'buyer' as 'buyer' | 'seller' | 'both'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string>('')

  const handleGoogleRegister = async () => {
    try {
      // Mock Google OAuth flow
      const mockGoogleUser = {
        email: 'user@gmail.com',
        fullName: 'Người dùng Google',
        phone: '0901234567',
        role: 'buyer',
        provider: 'google'
      }

      // Call backend to register with Google
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: mockGoogleUser.email,
          password: 'google-oauth-' + Date.now(),
          confirmPassword: 'google-oauth-' + Date.now(),
          fullName: mockGoogleUser.fullName,
          phone: mockGoogleUser.phone,
          role: mockGoogleUser.role
        })
      })

      if (response.ok) {
        alert('Đăng ký bằng Google thành công! Vui lòng đăng nhập.')
        onBack() // Go back to login
      } else {
        const data = await response.json()
        if (data.error?.includes('already exists')) {
          alert('Email này đã được đăng ký. Vui lòng đăng nhập.')
          onBack()
        } else {
          alert('Đăng ký thất bại: ' + (data.error || 'Unknown error'))
        }
      }
    } catch (error) {
      console.error('Google register error:', error)
      alert('Không thể kết nối đến server!')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không khớp!')
      return
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự!')
      return
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        alert('Đăng ký thành công! Vui lòng đăng nhập.')
        onBack()
      } else {
        setError(data.error || 'Đăng ký thất bại!')
      }
    } catch (error) {
      console.error('Register error:', error)
      setError('Không thể kết nối đến server!')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-white p-8 rounded-xl border-2 border-emerald-200 shadow-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
              <User className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Đăng ký</h2>
            <p className="text-gray-600">Tạo tài khoản mới</p>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleRegister}
            className="w-full py-3 px-6 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-3 shadow-sm hover:shadow-md mb-4 hover:border-emerald-400"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Đăng ký bằng Google
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-500">hoặc</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-800"
                placeholder="Nhập họ và tên"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email (Gmail) *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-800"
                placeholder="your@gmail.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Sử dụng email của bạn (Gmail hoặc email khác)</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-800"
                placeholder="0901234567"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Bạn là?</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'buyer' })}
                  className={`p-3 rounded-lg border-2 transition ${formData.role === 'buyer' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}
                >
                  Người mua
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'seller' })}
                  className={`p-3 rounded-lg border-2 transition ${formData.role === 'seller' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}
                >
                  Người bán
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'both' })}
                  className={`p-3 rounded-lg border-2 transition ${formData.role === 'both' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}
                >
                  Cả hai
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-800"
                  placeholder="Ít nhất 6 ký tự"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Xác nhận mật khẩu *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-800"
                placeholder="Nhập lại mật khẩu"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg font-bold hover:scale-105 transition transform shadow-lg shadow-emerald-500/30 text-white"
            >
              Đăng ký
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={onBack} className="text-emerald-600 hover:text-emerald-700 font-semibold">
              ← Quay lại đăng nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
