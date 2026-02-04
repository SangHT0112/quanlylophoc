// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu' },
        { status: 400 }
      )
    }

    const [rows] = await pool.query(
      `SELECT id, username, password_hash, full_name, email, role 
       FROM users 
       WHERE username = ? AND is_active = TRUE`,
      [username]
    )

    const users = rows as any[]
    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng' },
        { status: 401 }
      )
    }

    const user = users[0]

    // So sánh mật khẩu trực tiếp
    if (password !== user.password_hash) {
      return NextResponse.json(
        { success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng' },
        { status: 401 }
      )
    }

    const { password_hash, ...userWithoutPassword } = user

    const response = NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: userWithoutPassword
    })

    // Set cookies đúng cách
    response.cookies.set({
      name: 'user_id',
      value: String(user.id),
      httpOnly: true,
      path: '/',
      maxAge: 8 * 60 * 60, // 8 hours
      sameSite: 'strict',
    })

    response.cookies.set({
      name: 'user_role',
      value: user.role,
      httpOnly: true,
      path: '/',
      maxAge: 8 * 60 * 60,
      sameSite: 'strict',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ' },
      { status: 500 }
    )
  }
}