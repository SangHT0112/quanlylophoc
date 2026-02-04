// app/api/students/move-desk/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2/promise'

export async function POST(request: NextRequest) {
  try {
    const { studentId, newDeskNumber, classId } = await request.json()

    // Kiểm tra bàn mới có trống không
    const checkQuery = `
      SELECT COUNT(*) as count 
      FROM students 
      WHERE desk_number = $1 AND class_id = $2 AND id != $3
    `
   const [rows] = await pool.query<RowDataPacket[]>(
    checkQuery,
    [newDeskNumber, classId, studentId]
    )

    if ((rows[0] as any).count >= 2) {
    return NextResponse.json({
        success: false,
        message: 'Bàn này đã đầy (tối đa 2 học sinh/bàn)'
    })
    }

    // Lấy vị trí cũ để rollback nếu cần
    const oldDeskQuery = `
      SELECT desk_number FROM students WHERE id = $1
    `
    const [oldRows] = await pool.query<RowDataPacket[]>(
    oldDeskQuery,
    [studentId]
    )

    const originalDesk = oldRows[0]?.desk_number


    // Cập nhật vị trí mới
    const updateQuery = `
      UPDATE students 
      SET desk_number = $1, updated_at = NOW() 
      WHERE id = $2
    `
    await pool.query(updateQuery, [newDeskNumber, studentId])

    return NextResponse.json({
      success: true,
      message: 'Đã đổi chỗ học sinh thành công',
      originalDesk
    })
  } catch (error) {
    console.error('Error moving student desk:', error)
    return NextResponse.json(
      { success: false, message: 'Lỗi server' },
      { status: 500 }
    )
  }
}