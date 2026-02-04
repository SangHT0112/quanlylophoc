import { NextResponse } from 'next/server';
import pool from '@/lib/db';

interface MaxCodeRow {
  max_code: number;
}

interface Student {
  student_id: number;
  student_code: string;
  full_name: string;
  gender: 'Nam' | 'Nữ';
  date_of_birth: string | null;
  class_id: number;
  desk_number: number;
  seat_position: 'Trái' | 'Phải';
  is_active: number;
  created_at: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const class_id = searchParams.get('class_id');

    let query = `
      SELECT 
        student_id,
        student_code,
        full_name,
        gender,
        date_of_birth,
        class_id,
        desk_number,
        seat_position,
        is_active,
        created_at
      FROM students 
      WHERE is_active = 1
    `;
    const params: any[] = [];

    if (class_id) {
      query += ' AND class_id = ?';
      params.push(class_id);
    }

    query += ' ORDER BY desk_number, seat_position';

    const [students] = await pool.execute(query, params) as [Student[], any];

    return NextResponse.json({ success: true, data: students });
  } catch (error) {
    console.error('Lỗi lấy danh sách học sinh:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Lỗi server', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'add_student') {
      const { full_name, gender, date_of_birth, class_id } = body;

      // Tạo mã HS tự động
      const [rows] = await pool.execute(
        `SELECT MAX(CAST(SUBSTRING(student_code, 3) AS UNSIGNED)) as max_code FROM students`
      ) as [MaxCodeRow[], any];
      const maxCode = rows[0]?.max_code || 0;
      const nextNum = maxCode + 1;
      const student_code = `HS${nextNum.toString().padStart(3, '0')}`;

      // Tự động xác định số bàn và vị trí
      const [deskRows] = await pool.execute(
        `SELECT COALESCE(MAX(desk_number), 0) as max_desk FROM students WHERE class_id = ?`,
        [class_id]
      ) as [any[], any];

      const maxDesk = deskRows[0]?.max_desk || 0;

      // Đếm số học sinh ở bàn cuối cùng
      let countAtMax = 0;
      if (maxDesk > 0) {
        const [countRows] = await pool.execute(
          `SELECT COUNT(*) as count_at_max FROM students WHERE class_id = ? AND desk_number = ?`,
          [class_id, maxDesk]
        ) as [any[], any];
        countAtMax = countRows[0]?.count_at_max || 0;
      }

      let desk_number: number;
      let seat_position: 'Trái' | 'Phải';

      if (maxDesk === 0 || countAtMax === 2) {
        desk_number = maxDesk + 1;
        seat_position = 'Trái';
      } else if (countAtMax === 1) {
        desk_number = maxDesk;
        seat_position = 'Phải';
      } else {
        desk_number = maxDesk + 1;
        seat_position = 'Trái';
      }

      await pool.execute(
        `INSERT INTO students 
         (student_code, full_name, gender, date_of_birth, class_id, desk_number, seat_position, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
        [student_code, full_name, gender, date_of_birth || null, class_id, desk_number, seat_position]
      );

      await pool.execute(
        `UPDATE classes SET total_students = total_students + 1 WHERE class_id = ?`,
        [class_id]
      );

      return NextResponse.json({ 
        success: true, 
        data: { student_code, desk_number, seat_position } 
      });
    }

    if (action === 'update_student_position') {
      const { student_id, new_desk, new_position } = body;
      await pool.execute(
        `UPDATE students SET desk_number = ?, seat_position = ? WHERE student_id = ?`,
        [new_desk, new_position, student_id]
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_student') {
      const { student_id, class_id } = body;
      
      await pool.execute(
        `UPDATE students SET is_active = 0 WHERE student_id = ?`,
        [student_id]
      );

      await pool.execute(
        `UPDATE classes SET total_students = total_students - 1 WHERE class_id = ?`,
        [class_id]
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Action không hợp lệ' }, { status: 400 });
  } catch (error) {
    console.error('Lỗi xử lý student:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Lỗi server', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}