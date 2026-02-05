'use client';

import { useMemo, useState, useEffect } from 'react'

interface Student {
  id: string
  name: string
  deskNumber: number
  participationCount: number
  mouthScore?: string
  side: 'left' | 'right'
  isMarkedAbsent?: boolean
}

interface SeatingChartProps {
  students: Student[]
  selectedStudent: Student | null
  onStudentClick?: (student: Student) => void
  onStudentsSwap?: (student1Id: string, student2Id: string) => void
  isMarkingAbsent?: boolean
}

export default function SeatingChart({ 
  students, 
  selectedStudent, 
  onStudentClick,
  onStudentsSwap,
  isMarkingAbsent = false
}: SeatingChartProps) {
  const [draggingStudent, setDraggingStudent] = useState<Student | null>(null)
  const [dragOverStudent, setDragOverStudent] = useState<Student | null>(null)
  const [isLandscape, setIsLandscape] = useState(false)

  useEffect(() => {
    const checkOrientation = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      setIsLandscape(w > h && w < 1000)
    }

    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)
    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  const getScoreColor = (score: string) => {
    const numScore = parseFloat(score)
    if (isNaN(numScore)) return 'bg-gray-100 text-gray-600 border-gray-300'
    
    if (numScore >= 9.5) return 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-300'
    if (numScore >= 8.5) return 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-green-300'
    if (numScore >= 7.5) return 'bg-gradient-to-r from-lime-100 to-lime-50 text-lime-700 border-lime-300'
    if (numScore >= 6.5) return 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border-yellow-300'
    if (numScore >= 5.5) return 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border-amber-300'
    if (numScore >= 4.5) return 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border-orange-300'
    if (numScore >= 3.5) return 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border-red-300'
    return 'bg-gradient-to-r from-rose-100 to-rose-50 text-rose-700 border-rose-300'
  }

  const getScoreLabel = (score: string) => {
    const numScore = parseFloat(score)
    if (isNaN(numScore)) return 'Chưa điểm'
    if (numScore >= 9) return 'Xuất sắc'
    if (numScore >= 8) return 'Giỏi'
    if (numScore >= 7) return 'Khá'
    if (numScore >= 6) return 'Trung bình khá'
    if (numScore >= 5) return 'Trung bình'
    if (numScore >= 4) return 'Yếu'
    if (numScore >= 3.5) return 'Kém'
    return 'Học lại'
  }

  const columns = useMemo(() => {
    const cols = [[], [], [], []] as Student[][]
    students.forEach((student) => {
      const deskNumber = student.deskNumber
      if (deskNumber <= 5) cols[0].push(student)
      else if (deskNumber <= 10) cols[1].push(student)
      else if (deskNumber <= 15) cols[2].push(student)
      else cols[3].push(student)
    })
    return cols
  }, [students])

  const getShortName = (fullName: string) => {
    if (!fullName) return '';
    const words = fullName.trim().split(/\s+/);
    if (words.length <= 2) return fullName; // Nếu tên đã ngắn, giữ nguyên
    return words.slice(-2).join(' '); // Lấy 2 từ cuối
  };

  const getDesksInColumn = (columnStudents: Student[]) => {
    const desks = new Map<number, Student[]>()
    columnStudents.forEach((student) => {
      const existing = desks.get(student.deskNumber) || []
      desks.set(student.deskNumber, [...existing, student])
    })
    return Array.from(desks.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([_, students]) => students)
  }

  const handleDragStart = (e: React.DragEvent, student: Student) => {
    e.dataTransfer.setData('studentId', student.id)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingStudent(student)
    
    const dragImage = document.createElement('div')
    dragImage.innerHTML = `
      <div style="background: white; padding: 6px; border-radius: 4px; border: 2px solid #3b82f6; box-shadow: 0 2px 4px rgba(0,0,0,0.1); width: 120px; font-size: 12px;">
        <div style="font-weight: bold;">${student.name}</div>
        <div style="font-size: 10px; color: #6b7280;">Kéo để đổi chỗ</div>
      </div>
    `
    dragImage.style.position = 'absolute'
    dragImage.style.top = '-1000px'
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 60, 20)
    setTimeout(() => document.body.removeChild(dragImage), 0)
  }

  const handleDragOver = (e: React.DragEvent, student: Student) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggingStudent && draggingStudent.id !== student.id) {
      setDragOverStudent(student)
    }
  }

  const handleDragLeave = () => setDragOverStudent(null)

  const handleDrop = (e: React.DragEvent, targetStudent: Student) => {
    e.preventDefault()
    const draggedStudentId = e.dataTransfer.getData('studentId')
    if (draggedStudentId && draggedStudentId !== targetStudent.id && onStudentsSwap) {
      onStudentsSwap(draggedStudentId, targetStudent.id)
    }
    setDraggingStudent(null)
    setDragOverStudent(null)
  }

  const handleDragEnd = () => {
    setDraggingStudent(null)
    setDragOverStudent(null)
  }

  return (
    <div className="space-y-3 md:space-y-6 px-1 sm:px-0">
      {/* Thông báo drag */}
      {draggingStudent && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 text-sm md:text-base">
          <div className="animate-pulse">🔄</div>
          <div>{draggingStudent.name} – Kéo đổi chỗ</div>
        </div>
      )}

      {/* Chế độ điểm danh */}
      {isMarkingAbsent && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-2 md:p-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-pulse text-red-600">●</div>
            <div className="text-sm md:text-base font-semibold text-red-700">
              CHẾ ĐỘ ĐIỂM DANH: Nhấn HS VẮNG ({students.filter(s => s.isMarkedAbsent).length})
            </div>
          </div>
        </div>
      )}

      {/* Container chính - scroll ngang nếu cần, nhưng landscape sẽ scale nhỏ */}
      <div className={`overflow-x-auto pb-4 ${isLandscape ? 'landscape-container' : ''}`}>
        {/* Thêm wrapper với min-width để đảm bảo grid đủ rộng */}
        <div className="min-w-[850px] sm:min-w-full">
          {/* TĂNG KHOẢNG CÁCH GIỮA CÁC DÃY BÀN Ở ĐÂY */}
          <div className={`grid grid-cols-4 
            gap-4           /* Mobile: 16px (tăng từ 3) */
            sm:gap-5        /* Small: 20px (tăng từ 4) */
            md:gap-8        /* Medium: 32px (tăng từ 6) */
            lg:gap-10       /* Large: 40px */
            ${isLandscape ? 'compact-mode' : ''}`}>
            
            {columns.map((columnStudents, colIndex) => (
              <div 
                key={colIndex} 
                className="space-y-2 md:space-y-4 relative"
              >
                {/* Thêm padding ngang cho từng cột */}
                <div className="px-1.5 sm:px-0">
                  {getDesksInColumn(columnStudents).map((deskStudents) => {
                    const deskNumber = deskStudents[0]?.deskNumber
                    
                    return (
                      <div
                        key={deskNumber}
                        className={`border-2 border-blue-400 rounded-lg p-3 sm:p-4 
                          ${colIndex % 2 === 0 ? 'bg-blue-50' : 'bg-indigo-50'} 
                          hover:shadow-md transition-shadow 
                          ${isLandscape ? 'landscape-desk' : ''}
                          mb-3 sm:mb-4`}
                      >
                        {/* {!isLandscape && (
                          <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <div className="text-xs sm:text-sm font-semibold text-blue-600">
                              Bàn {deskNumber}
                            </div>
                            <div className="text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              Dãy {colIndex + 1}
                            </div>
                          </div>
                        )} */}
                        
                        <div className="flex gap-2 sm:gap-3">
                          {deskStudents.map((student) => {
                            const isBeingDragged = draggingStudent?.id === student.id
                            const isDragOverTarget = dragOverStudent?.id === student.id
                            
                            return (
                              <div
                                key={student.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, student)}
                                onDragOver={(e) => handleDragOver(e, student)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, student)}
                                onDragEnd={handleDragEnd}
                                onClick={() => onStudentClick?.(student)}
                                className={`
                                  relative flex-1 p-2 sm:p-3 rounded-lg border-2 
                                  text-xs sm:text-sm transition-all duration-300 
                                  cursor-pointer group 
                                  min-w-[75px] sm:min-w-[85px] md:min-w-[95px]  /* Tăng min-width */
                                  ${isBeingDragged 
                                    ? 'bg-gradient-to-r from-blue-100 to-blue-50 border-blue-400 opacity-60 scale-95' 
                                    : isDragOverTarget
                                    ? 'bg-gradient-to-r from-green-100 to-emerald-50 border-green-500 scale-105 ring-2 ring-green-300 shadow-lg'
                                    : selectedStudent?.id === student.id
                                    ? 'bg-gradient-to-r from-yellow-200 to-yellow-100 border-yellow-400 scale-105 shadow-md'
                                    : student.isMarkedAbsent
                                    ? 'bg-gradient-to-r from-red-100 to-red-50 border-red-400'
                                    : 'bg-white border-blue-300 hover:bg-blue-50 hover:border-blue-400'
                                  }
                                  ${isLandscape ? 'landscape-cell' : ''}
                                `}
                              >
                                {student.isMarkedAbsent && (
                                  <>
                                    <div className="absolute inset-0 bg-red-100/50 rounded-lg z-0"></div>
                                    <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                                  </>
                                )}

                                {isDragOverTarget && (
                                  <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs animate-pulse z-10">
                                    ↔️
                                  </div>
                                )}
                                
                                {/* Tooltip chỉ hiện khi không landscape hoặc màn lớn */}
                                {isMarkingAbsent && !isLandscape && (
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                    {student.isMarkedAbsent ? 'Click để bỏ vắng' : 'Click để đánh dấu vắng'}
                                  </div>
                                )}

                             <div 
                                className="font-semibold text-gray-800 line-clamp-1 relative z-10 group-hover:underline cursor-help"
                                title={student.name}  // Hover sẽ hiện tên đầy đủ
                              >
                                {getShortName(student.name)}
                                {student.isMarkedAbsent && <span className="text-xs text-red-600 ml-1">(Vắng)</span>}
                              </div>

                                <div className="flex items-center justify-between gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 relative z-10">
                                  <span
                                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                                      student.participationCount > 0
                                        ? 'bg-gradient-to-r from-red-100 to-red-50 text-red-600 border border-red-200'
                                        : 'bg-gray-100 text-gray-500 border border-gray-300'
                                    }`}
                                    title="Số lần phát biểu"
                                  >
                                    {student.participationCount}
                                  </span>

                                  {student.mouthScore && (
                                    <div className={`flex-1 text-xs px-1.5 sm:px-2 py-1 rounded font-medium border ${getScoreColor(student.mouthScore)} ${isLandscape ? 'landscape-score' : ''}`}>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-[10px]">{student.mouthScore}</span>
                                        </div>
                                        {!isLandscape && (
                                          <div className="text-[10px] opacity-80 truncate ml-1 max-w-[60px] sm:max-w-[70px]">
                                            {getScoreLabel(student.mouthScore)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                 {!student.mouthScore && (
                                    <div 
                                      className={`
                                        flex-1 text-[10px] sm:text-xs 
                                        px-1 sm:px-1.5 py-0.5 sm:px-1.5 
                                        rounded font-medium border 
                                        bg-gray-100 text-gray-600 border-gray-300 
                                        text-center
                                        whitespace-nowrap
                                        min-w-0  
                                      `}
                                    >
                                      Chưa điểm
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Legend - SỬA LẠI ĐỂ SÁT GẦN HƠN */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 sm:p-4"> {/* GIẢM padding và margin-top */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-6"> {/* GIẢM gap */}
          <div className="flex items-center gap-2 sm:gap-3"> {/* GIẢM gap */}
            <div className="text-xl sm:text-2xl text-red-500 font-bold">→</div> {/* GIẢM text size */}
            <span className="text-xs sm:text-sm font-medium text-gray-700">LỐI RA VÀO LỚP</span>
          </div>
          <div className="flex items-center">
            <span className="text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-slate-700 to-slate-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded font-semibold">
              BÀN GIÁO VIÊN
            </span>
          </div>
        </div>
      </div>

      {/* CSS landscape và custom spacing */}
      <style jsx>{`
        /* Trên mobile - TĂNG MẠNH khoảng cách giữa các dãy bàn */
        @media (max-width: 640px) {
          .grid.grid-cols-4 {
            gap: 16px !important;  /* Tăng lên 20px thay vì 16px */
          }
          
          /* Thêm đường phân cách rõ ràng giữa các cột */
          .grid.grid-cols-4 > div:not(:last-child)::after {
            content: '';
            position: absolute;
            top: 5%;
            right: -10px;
            width: 1px;
            height: 90%;
            background: linear-gradient(to bottom, 
              transparent 0%, 
              #cbd5e1 15%, 
              #cbd5e1 85%, 
              transparent 100%);
            z-index: 1;
          }
        }
          
        
        /* Trên tablet nhỏ */
        @media (min-width: 641px) and (max-width: 768px) {
          .grid.grid-cols-4 {
            gap: 24px !important;
          }
        }
        
        /* Trên tablet lớn */
        @media (min-width: 769px) and (max-width: 1024px) {
          .grid.grid-cols-4 {
            gap: 28px !important;
          }
        }
        
        /* Landscape mode */
        .landscape-container {
          transform: scale(0.78);
          transform-origin: top left;
          width: 128%;
          margin-bottom: 20px;
        }
        
        .compact-mode {
          gap: 4px !important;
        }
        
        .landscape-desk {
          padding: 6px !important;
          border-width: 1px !important;
        }
        
        .landscape-cell {
          font-size: 14px !important;  /* hoặc 12px nếu muốn to hơn */
          padding: 3px !important;
          min-width: 70px !important;
        }
        
        .landscape-score {
          font-size: 9px !important;
          padding: 3px 5px !important;
        }
        
        /* Khi landscape trên mobile */
        @media (orientation: landscape) and (max-width: 896px) {
          .landscape-container {
            transform: scale(0.72);
            width: 139%;
          }
          
          .grid.grid-cols-4 {
            gap: 12px !important;
          }
          
          .compact-mode .grid.grid-cols-4 {
            gap: 6px !important;
          }
        }
        
        @media (orientation: landscape) and (max-width: 812px) {
          .landscape-container {
            transform: scale(0.68);
            width: 147%;
          }
          
          .grid.grid-cols-4 {
            gap: 10px !important;
          }
        }
        
        /* Thêm hiệu ứng khi hover vào cả cột */
        .grid.grid-cols-4 > div:hover {
          transform: translateY(-2px);
          transition: transform 0.2s ease;
        }
      `}</style>
    </div>
  )
}