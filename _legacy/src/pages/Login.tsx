import { useState, type FormEvent } from 'react'
import { Camera, Eye, EyeOff, Shield } from 'lucide-react'
import type { User, Page } from '../types'

interface LoginProps {
  onLogin: (user: User) => void;
  setCurrentPage: (page: Page) => void;
  onShowRegister?: () => void;
}

function Login({ onLogin, setCurrentPage, onShowRegister }: LoginProps) {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const handleGoogleLogin = () => {
    try {
      // Mock Google OAuth flow
      alert('🔐 Đăng nhập bằng Google sẽ được tích hợp sau!\n\nHiện tại bạn có thể:\n- Đăng ký với email\n- Đăng nhập với tài khoản đã có\n\nVí dụ:\nEmail: admin@admin.com\nPassword: 123')
    } catch (error) {
      console.error('Google login error:', error)
      alert('Đăng nhập bằng Google tạm thời không khả dụng')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      // Call API to authenticate  
      const response = await fetch('http://localhost:3001/api/auth/login', {
        mode: 'cors',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.user) {
        // Store user info
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token)
        
        onLogin({ email: data.user.email, isAdmin: data.user.role === 'admin' })
        setCurrentPage('admin')
      } else {
        setError(data.error || 'Email hoặc mật khẩu không đúng!')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Không thể kết nối đến server!')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white p-8 rounded-xl border-2 border-emerald-200 shadow-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
              <Camera className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">CameraStore</h2>
            <p className="text-gray-600">Đăng nhập Admin</p>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 px-6 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-3 shadow-sm hover:shadow-md mb-4 hover:border-emerald-400"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Đăng nhập bằng Google
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-500">hoặc</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-800"
                placeholder="admin@admin.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-gray-800"
                  placeholder="Nhập mật khẩu"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg font-bold hover:scale-105 transition transform shadow-lg shadow-emerald-500/30 text-white flex items-center justify-center gap-2"
            >
              <Shield className="h-5 w-5" />
              Đăng nhập
            </button>
          </form>

          <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-sm text-emerald-700">
              <strong>Tài khoản mặc định:</strong><br />
              Email: admin@admin.com<br />
              Mật khẩu: 123
            </p>
          </div>

          <div className="mt-4 text-center">
            <button 
              onClick={onShowRegister}
              className="text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              Chưa có tài khoản? Đăng ký ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
