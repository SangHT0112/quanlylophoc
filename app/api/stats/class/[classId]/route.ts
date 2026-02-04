// app/api/stats/class/[classId]/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Interface cho dữ liệu lớp
interface ClassRow {
  class_name: string;
  total_students: number;
}

// Interface cho dữ liệu học sinh
interface StudentRow {
  id: number;
  name: string;
  participation_count: number;
  subject_scores: string | null;
  absent_dates: string | null;
  total_absent: number;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ classId: string }> }
) {
  const params = await context.params;
  const classIdNum = parseInt(params.classId, 10);

  if (isNaN(classIdNum)) {
    return NextResponse.json({ success: false, error: 'classId không hợp lệ' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  let subjectId = parseInt(searchParams.get('subjectId') || '0', 10);
  const timeFilterRaw = searchParams.get('timeFilter') || 'today';
  const showAll = searchParams.get('showAll') === 'true';

  if (subjectId === 0 && !showAll) subjectId = 1;

  const validFilters = ['today', 'week', 'month', 'all'] as const;
  const timeFilter = validFilters.includes(timeFilterRaw as any)
    ? timeFilterRaw as typeof validFilters[number]
    : 'today';

  // Điều kiện thời gian
  let partDateCond = '';
  let scoreDateCond = '';
  let attendDateCond = '';

  switch (timeFilter) {
    case 'today':
      partDateCond = 'AND DATE(p.participation_date) = CURDATE()';
      scoreDateCond = 'AND DATE(sc.score_date) = CURDATE()';
      attendDateCond = 'AND DATE(a.attendance_date) = CURDATE()';
      break;
    case 'week':
      partDateCond = 'AND p.participation_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
      scoreDateCond = 'AND sc.score_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
      attendDateCond = 'AND a.attendance_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
      break;
    case 'month':
      partDateCond = 'AND YEAR(p.participation_date) = YEAR(CURDATE()) AND MONTH(p.participation_date) = MONTH(CURDATE())';
      scoreDateCond = 'AND YEAR(sc.score_date) = YEAR(CURDATE()) AND MONTH(sc.score_date) = MONTH(CURDATE())';
      attendDateCond = 'AND YEAR(a.attendance_date) = YEAR(CURDATE()) AND MONTH(a.attendance_date) = MONTH(CURDATE())';
      break;
    case 'all':
      partDateCond = '';
      scoreDateCond = '';
      attendDateCond = '';
      break;
  }

  try {
    // Lấy thông tin lớp
    const [classRows] = await pool.execute(
      'SELECT class_name, total_students FROM classes WHERE class_id = ?',
      [classIdNum]
    );

    if (!Array.isArray(classRows) || classRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy lớp' }, { status: 404 });
    }

    const classInfo = classRows[0] as ClassRow;

    // Query chính - SỬA Ở ĐÂY: dùng SUM(p.count) thay vì COUNT(*)
    let query = `
      SELECT 
        s.student_id AS id,
        s.full_name AS name,
        ${
          showAll 
            ? `(SELECT COALESCE(SUM(p.count), 0) 
                FROM participations p 
                WHERE p.student_id = s.student_id 
                ${partDateCond}) AS participation_count`
            : `(SELECT COALESCE(SUM(p.count), 0) 
                FROM participations p 
                WHERE p.student_id = s.student_id 
                  AND p.subject_id = ? 
                ${partDateCond}) AS participation_count`
        },
        ${
          showAll 
            ? `(SELECT GROUP_CONCAT(CONCAT(ROUND(sc.score, 1), ' (', sub.subject_name, ')') 
                 ORDER BY sc.score_date DESC SEPARATOR ', ')
               FROM scores sc
               JOIN subjects sub ON sc.subject_id = sub.subject_id
               WHERE sc.student_id = s.student_id 
                 AND sc.score_type = 'Miệng'
                 ${scoreDateCond}) AS subject_scores`
            : `(SELECT GROUP_CONCAT(CONCAT(ROUND(sc.score, 1), ' (', sub.subject_name, ')') 
                 ORDER BY sc.score_date DESC SEPARATOR ', ')
               FROM scores sc
               JOIN subjects sub ON sc.subject_id = sub.subject_id
               WHERE sc.student_id = s.student_id 
                 AND sc.subject_id = ?
                 AND sc.score_type = 'Miệng'
                 ${scoreDateCond}) AS subject_scores`
        },
        ${
          showAll 
            ? `(SELECT GROUP_CONCAT(DISTINCT DATE(a.attendance_date) ORDER BY a.attendance_date DESC SEPARATOR ', ')
               FROM attendance a 
               WHERE a.student_id = s.student_id 
                 AND a.status = 'absent' 
                 ${attendDateCond}) AS absent_dates,
               (SELECT COUNT(DISTINCT a.attendance_date) 
                FROM attendance a 
                WHERE a.student_id = s.student_id 
                  AND a.status = 'absent' 
                  ${attendDateCond}) AS total_absent`
            : `(SELECT GROUP_CONCAT(DISTINCT DATE(a.attendance_date) ORDER BY a.attendance_date DESC SEPARATOR ', ')
               FROM attendance a 
               WHERE a.student_id = s.student_id 
                 AND a.subject_id = ? 
                 AND a.status = 'absent' 
                 ${attendDateCond}) AS absent_dates,
               (SELECT COUNT(DISTINCT a.attendance_date) 
                FROM attendance a 
                WHERE a.student_id = s.student_id 
                  AND a.subject_id = ? 
                  AND a.status = 'absent' 
                  ${attendDateCond}) AS total_absent`
        }
      FROM students s
      WHERE s.class_id = ?
        AND s.is_active = 1
      ORDER BY s.desk_number
    `;

    // Params - số lượng ? khớp với query
    let params: any[] = showAll 
      ? [classIdNum]                              // chỉ classId
      : [subjectId, subjectId, subjectId, subjectId, classIdNum]; // 4 subjectId + classId

    const [studentsRows] = await pool.execute(query, params);

    // Tổng vắng hôm nay (nếu filter today)
    let absentToday = 0;
    if (timeFilter === 'today') {
      const absentQuery = `
        SELECT COUNT(DISTINCT a.student_id) AS absent_count
        FROM attendance a
        JOIN students s ON a.student_id = s.student_id
        WHERE s.class_id = ?
          AND DATE(a.attendance_date) = CURDATE()
          AND a.status = 'absent'
          ${!showAll ? 'AND a.subject_id = ?' : ''}
      `;
      const absentParams = showAll ? [classIdNum] : [classIdNum, subjectId];
      const [absentRes] = await pool.execute(absentQuery, absentParams);
      absentToday = (absentRes as any[])[0]?.absent_count || 0;
    }

    return NextResponse.json({
      success: true,
      class: {
        className: classInfo.class_name,
        totalStudents: classInfo.total_students,
      },
      students: studentsRows as StudentRow[],
      absentToday,
      timeFilter,
      showAll,
      subjectId,
    });
  } catch (err: any) {
    console.error('Lỗi API stats/class:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Lỗi server',
        devMessage: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}