// app/login/page.tsx - Thêm debug
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    console.log('Login attempt:', { username, password })

    try {
      // Test API trực tiếp
      const testRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const testData = await testRes.json()
      console.log('API Response:', testData)

      if (testData.success) {
        // Gọi login từ context
        const result = await login(username, password)
        console.log('Context login result:', result)
        
        if (result.success) {
          console.log('Redirecting to /')
          router.push('/')
          router.refresh() // Force refresh
        } else {
          setError(result.message)
        }
      } else {
        setError(testData.message)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Lỗi kết nối máy chủ')
    } finally {
      setIsLoading(false)
    }
  }

  // Thêm test buttons
  const fillCredentials = (type: 'admin' | 'teacher') => {
    if (type === 'admin') {
      setUsername('admin')
      setPassword('admin123')
    } else {
      setUsername('teacher1')
      setPassword('teacher123')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Đăng nhập hệ thống</h1>
            <p className="text-gray-600 mt-2">Dành cho Giáo viên & Quản trị viên</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-medium block">
                Tên đăng nhập
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium block">
                Mật khẩu
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang xử lý...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm">
              Chưa có tài khoản?{' '}
              <Link 
                href="/register" 
                className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
              >
                Đăng ký tại đây
              </Link>
            </p>
          </div>

          {/* Debug info */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer">Debug Info</summary>
              <div className="mt-2 space-y-1">
                <div>Username: {username}</div>
                <div>Password length: {password.length}</div>
                <button
                  onClick={() => console.log('Cookies:', document.cookie)}
                  className="text-blue-500 hover:underline"
                >
                  Show Cookies
                </button>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}