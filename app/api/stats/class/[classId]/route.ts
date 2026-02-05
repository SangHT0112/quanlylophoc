import { NextResponse } from 'next/server';
import pool from '@/lib/db';

interface ClassRow {
  class_name: string;
  total_students: number;
}

interface StudentRow {
  id: number;
  name: string;
  participation_count: number;
  subject_scores: string | null;
  absent_dates: string | null;
  total_absent: number;
  desk_number?: number; // thêm nếu bạn muốn trả về số bàn
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
  const subjectIdParam = searchParams.get('subjectId') || '1'; // fallback Toán
  const timeFilterRaw = searchParams.get('timeFilter') || 'today';
  const showAll = searchParams.get('showAll') === 'true';
  const customDateStr = searchParams.get('date');

  let subjectId = parseInt(subjectIdParam, 10);
  if (isNaN(subjectId)) subjectId = 1;

  const validFilters = ['today', 'week', 'month', 'all', 'custom'] as const;
  let timeFilter: typeof validFilters[number] = validFilters.includes(timeFilterRaw as any)
    ? timeFilterRaw as typeof validFilters[number]
    : 'today';

  let partDateCond = '';
  let scoreDateCond = '';
  let attendDateCond = '';
  let dateParam: string | null = null;

  if (timeFilter === 'custom' && customDateStr && /^\d{4}-\d{2}-\d{2}$/.test(customDateStr)) {
    partDateCond   = 'AND DATE(p.participation_date) = ?';
    scoreDateCond  = 'AND DATE(sc.score_date) = ?';
    attendDateCond = 'AND DATE(a.attendance_date) = ?';
    dateParam = customDateStr;
  } else if (timeFilter === 'custom') {
    timeFilter = 'today';
  }

  if (!dateParam) {
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

    // Query chính
    let query = `
      SELECT 
        s.student_id AS id,
        s.full_name AS name,
        s.desk_number,

        -- Participation: luôn lọc theo môn nếu !showAll
        (SELECT COALESCE(SUM(p.count), 0) 
         FROM participations p 
         WHERE p.student_id = s.student_id
           ${!showAll ? 'AND p.subject_id = ?' : ''}
           ${partDateCond}) AS participation_count,

        -- Scores: lọc môn nếu !showAll
        ${showAll 
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

        -- Absent: lọc môn nếu !showAll
        ${showAll 
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

    // Xây dựng params chính xác theo số placeholder
    let queryParams: any[] = [];

    if (showAll) {
      // participation: không có subjectId
      // scores: không có subjectId
      // absent: không có subjectId
      if (dateParam) {
        queryParams = [dateParam, dateParam, dateParam, classIdNum];
      } else {
        queryParams = [classIdNum];
      }
    } else {
      // participation: 1 subjectId
      // scores: 1 subjectId
      // absent_dates: 1 subjectId
      // total_absent: 1 subjectId
      if (dateParam) {
        queryParams = [
          subjectId, dateParam,     // participation
          subjectId, dateParam,     // scores
          subjectId, dateParam,     // absent_dates
          subjectId, dateParam,     // total_absent
          classIdNum
        ];
      } else {
        queryParams = [
          subjectId,                // participation
          subjectId,                // scores
          subjectId,                // absent_dates
          subjectId,                // total_absent
          classIdNum
        ];
      }
    }

    const [studentsRows] = await pool.execute(query, queryParams);

    // Tính vắng hôm nay (nếu cần)
    let absentToday = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    if (timeFilter === 'today' || (timeFilter === 'custom' && customDateStr === todayStr)) {
      const absentQuery = `
        SELECT COUNT(DISTINCT a.student_id) AS absent_count
        FROM attendance a
        JOIN students s ON a.student_id = s.student_id
        WHERE s.class_id = ?
          AND DATE(a.attendance_date) = ?
          AND a.status = 'absent'
          ${!showAll ? 'AND a.subject_id = ?' : ''}
      `;

      const absentParams = showAll
        ? [classIdNum, todayStr]
        : [classIdNum, todayStr, subjectId];

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