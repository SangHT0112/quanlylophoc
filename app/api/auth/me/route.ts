// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, user: null })
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Get user from database
    const [rows] = await pool.query(
      'SELECT id, username, full_name, email, role FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    )

    const users = rows as any[]
    if (users.length === 0) {
      const response = NextResponse.json({ success: false, user: null })
      response.cookies.delete('auth_token')
      return response
    }

    return NextResponse.json({
      success: true,
      user: users[0]
    })

  } catch (error) {
    console.error('Auth check error:', error)
    const response = NextResponse.json({ success: false, user: null })
    response.cookies.delete('auth_token')
    return response
  }
}