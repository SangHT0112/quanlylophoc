// app/api/participation/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action !== 'add_participation') {
      return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }

    const { student_id, subject_id } = body;

    // Kiểm tra dữ liệu đầu vào
    if (!student_id || !subject_id) {
      return NextResponse.json(
        { success: false, message: 'Thiếu student_id hoặc subject_id' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Bước 1: Kiểm tra xem đã có row cho ngày + môn + hs chưa
    const [existingRows] = await pool.execute(
      `SELECT participation_id, count 
       FROM participations 
       WHERE student_id = ? 
         AND subject_id = ? 
         AND participation_date = ?`,
      [student_id, subject_id, today]
    );

    const existing = existingRows as Array<{ participation_id: number; count: number }>;

    if (existing.length > 0) {
      // Đã có → UPDATE tăng count
      const row = existing[0];
      const newCount = row.count + 1;

      await pool.execute(
        `UPDATE participations 
         SET count = ?,
             last_updated_at = NOW()
         WHERE participation_id = ?`,
        [newCount, row.participation_id]   // ← sửa ở đây: dùng .participation_id
      );

      return NextResponse.json({ 
        success: true, 
        message: 'Updated count', 
        newCount 
      });
    } else {
      // Chưa có → INSERT mới với count = 1
      await pool.execute(
        `INSERT INTO participations 
         (student_id, subject_id, participation_date, count, last_updated_at) 
         VALUES (?, ?, ?, 1, NOW())`,
        [student_id, subject_id, today]
      );

      return NextResponse.json({ 
        success: true, 
        message: 'Inserted new participation' 
      });
    }
  } catch (err: any) {
    console.error('Lỗi add participation:', err);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Lỗi server', 
        devMessage: err.message 
      },
      { status: 500 }
    );
  }
}