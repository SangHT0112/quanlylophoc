// app/api/attendance/simple/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { 
      student_id, 
      subject_id, 
      attendance_date, 
      status = 'absent'
    } = await request.json()

    console.log('Attendance:', { student_id, subject_id, attendance_date, status })

    // Kiểm tra xem đã điểm danh chưa
    const [existing] = await pool.query(
      `SELECT id FROM attendance 
       WHERE student_id = ? AND subject_id = ? AND attendance_date = ?`,
      [student_id, subject_id, attendance_date]
    )

    let result
    if ((existing as any[]).length > 0) {
      // Cập nhật nếu đã tồn tại
      [result] = await pool.query(
        `UPDATE attendance 
         SET status = ?, updated_at = NOW() 
         WHERE student_id = ? AND subject_id = ? AND attendance_date = ?`,
        [status, student_id, subject_id, attendance_date]
      )
    } else {
      // Thêm mới
      [result] = await pool.query(
        `INSERT INTO attendance 
         (student_id, subject_id, attendance_date, status, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [student_id, subject_id, attendance_date, status]
      )
    }

    return NextResponse.json({
      success: true,
      message: `Đã ${status === 'absent' ? 'đánh dấu vắng' : 'đánh dấu có mặt'}`
    })

  } catch (error) {
    console.error('Attendance error:', error)
    return NextResponse.json(
      { success: false, message: 'Lỗi khi lưu điểm danh' },
      { status: 500 }
    )
  }
}

// Lấy danh sách vắng hôm nay
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subject_id')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const [rows] = await pool.query(
      `SELECT student_id FROM attendance 
       WHERE subject_id = ? AND attendance_date = ? AND status = 'absent'`,
      [subjectId, date]
    )

    const absentIds = (rows as any[]).map(row => row.student_id.toString())

    return NextResponse.json({
      success: true,
      absentStudents: absentIds,
      date: date,
      totalAbsent: absentIds.length
    })

  } catch (error) {
    console.error('Get attendance error:', error)
    return NextResponse.json(
      { success: false, message: 'Lỗi khi lấy điểm danh' },
      { status: 500 }
    )
  }
}