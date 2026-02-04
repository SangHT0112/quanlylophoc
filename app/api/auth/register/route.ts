// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool  from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { 
      username, 
      password, 
      confirmPassword,
      full_name, 
      email
    } = await request.json()

    // Validation cơ bản
    if (!username || !password || !confirmPassword || !full_name) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng điền đầy đủ thông tin bắt buộc' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu xác nhận không khớp' },
        { status: 400 }
      )
    }

    if (password.length < 3) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu phải có ít nhất 3 ký tự' },
        { status: 400 }
      )
    }

    // Kiểm tra username đã tồn tại chưa
    const [existingUsername] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    )
    
    if ((existingUsername as any[]).length > 0) {
      return NextResponse.json(
        { success: false, message: 'Tên đăng nhập đã được sử dụng' },
        { status: 400 }
      )
    }

    // Lưu mật khẩu trực tiếp (không hash)
    const password_hash = password

    // Tạo user mới
    const [result] = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, email, role, is_active) 
       VALUES (?, ?, ?, ?, 'teacher', 1)`,
      [username, password_hash, full_name, email || null]
    )

    const insertResult = result as any

    return NextResponse.json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      userId: insertResult.insertId
    })

  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ khi đăng ký' },
      { status: 500 }
    )
  }
}