// app/api/classes/[classId]/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  context: { params: Promise<{ classId: string }> }
) {
  const params = await context.params;
  const classId = parseInt(params.classId, 10);

  if (isNaN(classId)) {
    return NextResponse.json({ success: false, error: 'classId không hợp lệ' }, { status: 400 });
  }

  // Lấy subjectId từ query string (mặc định là 1 - Toán)
  const { searchParams } = new URL(request.url);
  const subjectIdStr = searchParams.get('subjectId');
  const subjectId = subjectIdStr ? parseInt(subjectIdStr, 10) : 1;

  if (isNaN(subjectId)) {
    return NextResponse.json({ success: false, error: 'subjectId không hợp lệ' }, { status: 400 });
  }

  try {
    // 1. Lấy thông tin lớp
    const [classRows] = await pool.execute(
      `SELECT 
         class_id,
         class_name,
         school_year,
         homeroom_teacher,
         total_students
       FROM classes 
       WHERE class_id = ?`,
      [classId]
    );

    if (!Array.isArray(classRows) || classRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy lớp' }, { status: 404 });
    }

    const classInfo = classRows[0] as {
      class_id: number;
      class_name: string;
      school_year: string;
      homeroom_teacher: string | null;
      total_students: number;
    };

    // 2. Lấy danh sách học sinh + thống kê phát biểu + điểm miệng mới nhất
   // 2. Lấy danh sách học sinh + thống kê phát biểu + điểm miệng mới nhất
    const [students] = await pool.execute(
      `SELECT 
        s.student_id           AS id,
        s.student_code,
        s.full_name            AS name,
        s.gender,
        s.desk_number,
        s.seat_position        AS side,
        s.is_active,

        COALESCE(SUM(p.count), 0) AS participation_count,  -- Sửa ở đây: SUM thay vì COUNT

        -- Điểm miệng mới nhất của môn đang chọn
        (
          SELECT sc.score
          FROM scores sc
          WHERE sc.student_id = s.student_id
            AND sc.subject_id = ?
            AND sc.score_type = 'Miệng'
          ORDER BY sc.score_date DESC, sc.created_at DESC
          LIMIT 1
        ) AS last_mouth_score

      FROM students s
      LEFT JOIN participations p 
        ON p.student_id = s.student_id 
        AND p.subject_id = ?   -- chỉ đếm phát biểu của môn đang chọn

      WHERE s.class_id = ?
        AND s.is_active = 1

      GROUP BY 
        s.student_id, 
        s.student_code, 
        s.full_name, 
        s.gender, 
        s.desk_number, 
        s.seat_position, 
        s.is_active

      ORDER BY 
        s.desk_number,
        CASE s.seat_position 
          WHEN 'Trái' THEN 1 
          ELSE 2 
        END`,
      [subjectId, subjectId, classId]
    );

    // Map dữ liệu để đảm bảo kiểu đúng với frontend
    const formattedStudents = (students as any[]).map(student => ({
      id: String(student.id),
      student_code: student.student_code || '',
      name: student.name,
      gender: student.gender || null,
      desk_number: Number(student.desk_number),
      side: student.side?.toLowerCase() === 'trái' ? 'left' : 'right',
      is_active: !!student.is_active,
      participation_count: Number(student.participation_count || 0),
      last_mouth_score: student.last_mouth_score !== null 
        ? Number(student.last_mouth_score) 
        : null,
    }));

    return NextResponse.json({
      success: true,
      class: {
        className: classInfo.class_name,
        totalStudents: classInfo.total_students,
        teacher: classInfo.homeroom_teacher || 'Chưa có GV chủ nhiệm',
        schoolYear: classInfo.school_year || 'Chưa cập nhật',
      },
      students: formattedStudents,
    });
  } catch (err: any) {
    console.error('Lỗi API GET /classes/[classId]:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Lỗi server nội bộ',
        devMessage: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}