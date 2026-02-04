// app/api/auth/check/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value
    
    if (!userId) {
      return NextResponse.json({ success: false, user: null })
    }

    const [rows] = await pool.query(
      `SELECT id, username, full_name, email, role 
       FROM users 
       WHERE id = ? AND is_active = TRUE`,
      [userId]
    )

    const users = rows as any[]
    if (users.length === 0) {
      // Clear invalid cookies
      const response = NextResponse.json({ success: false, user: null })
      response.cookies.delete('user_id')
      response.cookies.delete('user_role')
      return response
    }

    return NextResponse.json({
      success: true,
      user: users[0]
    })

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ success: false, user: null })
  }
}