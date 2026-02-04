// app/api/students/swap/route.ts - Phiên bản an toàn
import { NextRequest, NextResponse } from 'next/server'
import  pool  from '@/lib/db'

export async function POST(request: NextRequest) {
  const connection = await pool.getConnection()
  
  try {
    const { student1Id, student2Id, student1NewDesk, student2NewDesk } = await request.json()

    console.log('Safe swap starting...')
    
    // 1. Kiểm tra bảng tồn tại và lấy cấu trúc
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'students'
        AND COLUMN_NAME LIKE '%id%'
    `)
    
    console.log('ID-like columns:', columns)
    
    // 2. Tìm cột ID chính
    const idColumns = columns as Array<{COLUMN_NAME: string}>
    const primaryIdColumn = idColumns.find(col => 
      col.COLUMN_NAME.toLowerCase().includes('student') || 
      col.COLUMN_NAME.toLowerCase() === 'id'
    )
    
    if (!primaryIdColumn) {
      throw new Error('Không tìm thấy cột ID trong bảng students')
    }
    
    const idColumnName = primaryIdColumn.COLUMN_NAME
    console.log(`Using column: ${idColumnName}`)
    
    await connection.beginTransaction()
    
    // 3. Cập nhật học sinh 1
    const update1Query = `
      UPDATE students 
      SET desk_number = ? 
      WHERE ${idColumnName} = ?
    `
    console.log('Query 1:', update1Query)
    
    const [result1] = await connection.query(update1Query, [student1NewDesk, student1Id])
    console.log('Update 1 affected rows:', (result1 as any).affectedRows)
    
    // 4. Cập nhật học sinh 2
    const update2Query = `
      UPDATE students 
      SET desk_number = ? 
      WHERE ${idColumnName} = ?
    `
    console.log('Query 2:', update2Query)
    
    const [result2] = await connection.query(update2Query, [student2NewDesk, student2Id])
    console.log('Update 2 affected rows:', (result2 as any).affectedRows)
    
    await connection.commit()
    
    return NextResponse.json({
      success: true,
      message: 'Đã đổi chỗ 2 học sinh thành công'
    })
    
  } catch (error: any) {
    await connection.rollback()
    
    console.error('Safe swap failed:', {
      message: error.message,
      stack: error.stack
    })
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Lỗi khi đổi chỗ học sinh',
        error: error.message
      },
      { status: 500 }
    )
  } finally {
    connection.release()
  }
}