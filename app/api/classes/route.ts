// app/api/classes/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    // Lấy tham số tìm kiếm từ query string
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const schoolYear = searchParams.get('schoolYear') || '';

    let query = `
      SELECT 
        class_id,
        class_name,
        school_year,
        homeroom_teacher,
        total_students,
        DATE_FORMAT(created_at, '%d/%m/%Y') as created_date,
        created_at
      FROM classes
      WHERE 1=1
    `;
    
    const params: any[] = [];

    // Thêm điều kiện tìm kiếm
    if (search) {
      query += ` AND (class_name LIKE ? OR homeroom_teacher LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (schoolYear) {
      query += ` AND school_year = ?`;
      params.push(schoolYear);
    }

    // Sắp xếp theo lớp mới nhất
    query += ` ORDER BY created_at DESC, class_name ASC`;

    const [classes] = await pool.execute(query, params);

    // Lấy danh sách các năm học có trong hệ thống
    const [years] = await pool.execute(
      `SELECT DISTINCT school_year FROM classes WHERE school_year IS NOT NULL AND school_year != '' ORDER BY school_year DESC`
    );

    return NextResponse.json({
      success: true,
      classes,
      schoolYears: years
    });
  } catch (err: any) {
    console.error('Lỗi API GET /classes:', err);
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