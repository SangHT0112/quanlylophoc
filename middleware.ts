// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Các route cần bảo vệ
  const protectedRoutes = ['/']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname === route || 
    request.nextUrl.pathname.startsWith(`${route}/`)
  )

  // Route login và public
  const publicRoutes = ['/login', '/register', '/api/auth']
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || 
    request.nextUrl.pathname.startsWith(route)
  )

  // Kiểm tra cookie
  const userId = request.cookies.get('user_id')?.value

  // Nếu truy cập route protected mà chưa đăng nhập
  if (isProtectedRoute && !userId) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Nếu đã đăng nhập mà truy cập login/register
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register') && userId) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}