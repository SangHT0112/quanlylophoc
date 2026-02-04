// app/api/score/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      action,
      student_id,
      subject_id,       // sẽ gửi từ frontend (hoặc mặc định)
      score_type,       // 'Miệng', '15 phút', ...
      score,            // số từ 0-10
      teacher_note,
    } = body;

    if (action === 'save_score') {
      if (!student_id || !score_type || score == null) {
        return NextResponse.json(
          { success: false, message: 'Thiếu thông tin bắt buộc' },
          { status: 400 }
        );
      }

      await pool.execute(
        `INSERT INTO scores 
         (student_id, subject_id, score_type, score, score_date, teacher_note, created_at)
         VALUES (?, ?, ?, ?, CURDATE(), ?, NOW())`,
        [
          student_id,
          subject_id || 1,           // mặc định Toán nếu frontend chưa gửi
          score_type,
          parseFloat(score),
          teacher_note || null,
        ]
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, message: 'Action không hợp lệ' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Lỗi khi lưu điểm:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server', detail: error.message },
      { status: 500 }
    );
  }
}