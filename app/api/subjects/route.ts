// app/api/subjects/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.execute(
      `SELECT 
         subject_id AS id,
         subject_name AS name,
         subject_code AS code
       FROM subjects
       ORDER BY subject_id`
    );

    return NextResponse.json({
      success: true,
      subjects: rows,
    });
  } catch (err: any) {
    console.error('Lỗi lấy danh sách môn:', err);
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    );
  }
}