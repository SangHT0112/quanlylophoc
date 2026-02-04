// app/api/ranking/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subjectId') || '1'; // mặc định Toán
  const classId   = searchParams.get('classId');
  const limit     = parseInt(searchParams.get('limit') || '10');

  if (!classId) {
    return NextResponse.json({ error: 'Thiếu classId' }, { status: 400 });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT 
         s.student_id,
         s.full_name AS name,
         s.desk_number,
         COUNT(p.participation_id) AS count,
         MAX(p.participation_date) AS last_date
       FROM students s
       LEFT JOIN participations p 
         ON p.student_id = s.student_id 
         AND p.subject_id = ?
       WHERE s.class_id = ? 
         AND s.is_active = 1
       GROUP BY s.student_id, s.full_name, s.desk_number
       ORDER BY count DESC, last_date DESC
       LIMIT ?`,
      [subjectId, classId, limit]
    );

    // Thêm rank
    const ranked = (rows as any[]).map((row, index) => ({
      rank: index + 1,
      name: row.name,
      count: row.count,
      deskNumber: row.desk_number,
      lastDate: row.last_date
        ? new Date(row.last_date).toLocaleDateString('vi-VN')
        : null,
    }));

    return NextResponse.json({ success: true, rankings: ranked });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Lỗi truy vấn xếp hạng' }, { status: 500 });
  }
}