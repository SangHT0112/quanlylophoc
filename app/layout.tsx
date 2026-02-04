// app/layout.tsx
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './context/AuthContext'
import Header from '@/components/layout/Header'
const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Quản lý lớp học - Trường THCS',
  description: 'Hệ thống quản lý lớp học và sơ đồ chỗ ngồi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            
            {/* Footer đơn giản */}
            <footer className="border-t py-4">
              <div className="container mx-auto px-4 text-center text-sm text-gray-600">
                <p>© {new Date().getFullYear()} Trường THCS ............ - Hệ thống quản lý lớp học</p>
                <p className="mt-1">Phiên bản 1.0 • Dành cho giáo viên</p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}