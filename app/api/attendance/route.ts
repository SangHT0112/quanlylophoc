// app/api/attendance/quick/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { 
      student_id, 
      class_id, 
      attendance_date, 
      status = 'absent',
      subject_id 
    } = await request.json()

    console.log('Quick attendance:', { student_id, attendance_date, status })

    // Kiểm tra xem đã điểm danh chưa
    const [existing] = await pool.query(
      `SELECT id FROM attendance 
       WHERE student_id = ? AND attendance_date = ? AND subject_id = ?`,
      [student_id, attendance_date, subject_id]
    )

    if ((existing as any[]).length > 0) {
      // Cập nhật nếu đã tồn tại
      await pool.query(
        `UPDATE attendance 
         SET status = ?, updated_at = NOW() 
         WHERE student_id = ? AND attendance_date = ? AND subject_id = ?`,
        [status, student_id, attendance_date, subject_id]
      )
    } else {
      // Thêm mới (chỉ lưu học sinh vắng)
      await pool.query(
        `INSERT INTO attendance 
         (student_id, subject_id, class_id, attendance_date, status, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [student_id, subject_id, class_id, attendance_date, status]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Đã lưu điểm danh'
    })

  } catch (error) {
    console.error('Quick attendance error:', error)
    return NextResponse.json(
      { success: false, message: 'Lỗi khi lưu điểm danh' },
      { status: 500 }
    )
  }
}

// API lấy danh sách vắng hôm nay
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('class_id')
    const subjectId = searchParams.get('subject_id')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const [rows] = await pool.query(
      `SELECT student_id FROM attendance 
       WHERE class_id = ? AND subject_id = ? AND attendance_date = ? AND status = 'absent'`,
      [classId, subjectId, date]
    )

    const absentIds = (rows as any[]).map(row => row.student_id.toString())

    return NextResponse.json({
      success: true,
      absentStudents: absentIds
    })

  } catch (error) {
    console.error('Get absent error:', error)
    return NextResponse.json(
      { success: false, message: 'Lỗi khi lấy dữ liệu vắng' },
      { status: 500 }
    )
  }
}