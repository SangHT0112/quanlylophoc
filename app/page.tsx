'use client'

import { useState, useEffect } from 'react'
import SeatingChart from '@/components/seating-chart'
import RankingBoard from '@/components/ranking-board'
import ScoreModal from '@/components/score-modal'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Student {
  id: string
  name: string
  deskNumber: number
  participationCount: number
  mouthScore?: string
  side: 'left' | 'right'
}

interface ClassData {
  className: string
  totalStudents: number
  teacher: string
  schoolYear: string
  students: Student[]
  topPerformers: Array<{ name: string; count: number }>
  rankings: Array<{ rank: number; name: string; count: number; deskNumber: number; lastDate: string }>
}

export default function Home() {
  const [classData, setClassData] = useState<ClassData | null>(null)
  const [selectedSubject, setSelectedSubject] = useState('toan')
  const [isRandoming, setIsRandoming] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string; code: string }>>([]);

  const [isMarkingAbsent, setIsMarkingAbsent] = useState(false)
  const [absentStudents, setAbsentStudents] = useState<string[]>([])

  const [isCheckingMouth, setIsCheckingMouth] = useState(false);
  // Thêm useEffect để load danh sách môn (chạy 1 lần)
  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await fetch('/api/subjects');
        const data = await res.json();
        if (data.success) {
          setSubjects(data.subjects);
        } else {
          console.error('Không tải được danh sách môn');
        }
      } catch (err) {
        console.error('Lỗi fetch subjects:', err);
      }
    }
    loadSubjects();
  }, []);
  // Mock data
// Trong component Home

  // Thay vì mock data, fetch từ API
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/classes/1'); // ví dụ classId = 1
        const data = await res.json();
        if (data.success) {
          setClassData({
            ...data.class,
            students: data.students.map((st: any) => ({
              id: st.id.toString(),
              name: st.name,
              deskNumber: st.desk_number,
              participationCount: 0, // sẽ fetch riêng hoặc tính sau
              side: st.side.toLowerCase() === 'trái' ? 'left' : 'right',
            })),
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        // Map subject string → subject_id
        const subjectMap: Record<string, number> = {
          toan: 1,
          van: 2,
          anh: 3,
          ly: 4,
          hoa: 5,
        };

        const subjectId = subjectMap[selectedSubject] || 1;

        const res = await fetch(`/api/classes/1?subjectId=${subjectId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        if (data.success) {
          setClassData({
            className: data.class.className,
            totalStudents: data.class.totalStudents,
            teacher: data.class.teacher,
            schoolYear: data.class.schoolYear,
            students: data.students.map((st: any) => ({
              id: String(st.id),
              name: st.name,
              deskNumber: st.desk_number,
              side: st.side.toLowerCase() === 'trái' ? 'left' : 'right',
              participationCount: Number(st.participation_count || 0),
              mouthScore: st.last_mouth_score != null ? st.last_mouth_score.toFixed(1) : undefined,
            })),
            // topPerformers & rankings: tạm để trống hoặc fetch riêng sau
            topPerformers: [],
            rankings: [],
          });
        } else {
          console.error('API error:', data.error);
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu lớp:', err);
      }
    }

    fetchData();
  }, [selectedSubject]);   // ← quan trọng: reload khi đổi môn

  const refetchClassData = async () => {
    try {
      const subjectMap: Record<string, number> = {
        toan: 1,
        van: 2,
        anh: 3,
        ly: 4,
        hoa: 5,
      };
      const subjectId = subjectMap[selectedSubject] || 1;

      const res = await fetch(`/api/classes/1?subjectId=${subjectId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (data.success) {
        setClassData({
          className: data.class.className,
          totalStudents: data.class.totalStudents,
          teacher: data.class.teacher,
          schoolYear: data.class.schoolYear,
          students: data.students.map((st: any) => ({
            id: String(st.id),
            name: st.name,
            deskNumber: st.desk_number,
            side: st.side.toLowerCase() === 'trái' ? 'left' : 'right',
            participationCount: Number(st.participation_count || 0),
            mouthScore: st.last_mouth_score != null ? Number(st.last_mouth_score).toFixed(1) : undefined,
          })),
          topPerformers: [],
          rankings: [],
        });
      } else {
        console.error('API error:', data.error);
      }
    } catch (err) {
      console.error('Lỗi refetch dữ liệu lớp:', err);
    }
  };

  // Khi random xong → mở modal → lưu điểm
  const handleSaveScore = async (score: number, noteType: string, note: string) => {
    if (!selectedStudent) return;

    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_score',
          student_id: selectedStudent.id,
          subject_id: selectedSubject === 'toan' ? 1 :
                      selectedSubject === 'van'  ? 2 :
                      selectedSubject === 'anh'  ? 3 :
                      selectedSubject === 'ly'   ? 4 : 5,
          score_type: noteType || 'Miệng',
          score,
          teacher_note: note,
        }),
      });

      const result = await res.json();
      if (result.success) {
        await refetchClassData();
      }
    } catch (err) {
      alert('Lỗi khi lưu điểm');
    }

    setShowScoreModal(false);
  };

  const handleStudentInteraction = async (student: Student) => {
    if (!classData) return;

    // Ưu tiên chế độ điểm danh (nếu đang bật)
    if (isMarkingAbsent) {
      await handleStudentClickForAttendance(student);
      return;
    }

    // Chế độ kiểm tra miệng → mở modal nhập điểm ngay
    if (isCheckingMouth) {
      setSelectedStudent(student);
      setShowScoreModal(true);
      return; // Không làm gì thêm
    }

    // Chế độ bình thường: ghi lượt phát biểu + có thể mở modal sau
    // (giữ logic cũ của bạn)
    // 1. Optimistic update participation
    setClassData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        students: prev.students.map(s =>
          s.id === student.id
            ? { ...s, participationCount: s.participationCount + 1 }
            : s
        )
      };
    });

    setSelectedStudent(student);

    // 2. Ghi participation vào DB (giữ nguyên code cũ của bạn)
    try {
      const subjectMap: Record<string, number> = {
        toan: 1, van: 2, anh: 3, ly: 4, hoa: 5,
      };
      const subjectId = subjectMap[selectedSubject] || 1;

      const res = await fetch('/api/participation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_participation',
          student_id: student.id,
          subject_id: subjectId,
          notes: null,
        }),
      });

      const result = await res.json();
      if (!result.success) {
        // rollback nếu cần
        setClassData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            students: prev.students.map(s =>
              s.id === student.id
                ? { ...s, participationCount: s.participationCount - 1 }
                : s
            )
          };
        });
        alert('Không thể ghi lượt phát biểu');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối');
    }

    // Nếu bạn muốn tự động mở modal điểm miệng sau khi phát biểu → thêm dòng này:
    // setShowScoreModal(true);
  };

  const handleRandomStudent = () => {
    if (!classData || classData.students.length === 0) return

    // 1. Lọc học sinh có mặt (KHÔNG vắng)
    const presentStudents = classData.students.filter(
      student => !absentStudents.includes(student.id)
    )

    if (presentStudents.length === 0) {
      alert('❌ Tất cả học sinh đều vắng hôm nay!')
      return
    }

    // 2. Lọc học sinh có mặt VÀ chưa có điểm miệng
    const presentStudentsWithoutScore = presentStudents.filter(
      student => !student.mouthScore || student.mouthScore.trim() === ''
    )

    if (presentStudentsWithoutScore.length === 0) {
      // Nếu tất cả học sinh có mặt đã có điểm, chọn ngẫu nhiên từ học sinh có mặt
      // alert('📝 Tất cả học sinh có mặt đã có điểm. Sẽ chọn ngẫu nhiên từ học sinh có mặt.')
      
      // Ưu tiên học sinh ít phát biểu nhất
      presentStudents.sort((a, b) => a.participationCount - b.participationCount)
      const candidates = presentStudents.slice(0, Math.ceil(presentStudents.length * 0.3))
      
      startRandomAnimation(candidates, 'present')
      return
    }

    // 3. Ưu tiên học sinh có mặt, chưa có điểm VÀ ít phát biểu
    presentStudentsWithoutScore.sort((a, b) => a.participationCount - b.participationCount)
    
    // Lấy top 50% ít phát biểu nhất để random
    const topCandidates = presentStudentsWithoutScore.slice(
      0, 
      Math.ceil(presentStudentsWithoutScore.length * 0.5)
    )

    startRandomAnimation(topCandidates, 'present')
  }

  // Hàm phụ để chạy animation
  // Hàm phụ để chạy animation - THÊM tham số thứ 2
  const startRandomAnimation = (candidateStudents: Student[], type: 'all' | 'present' = 'all') => {
    if (candidateStudents.length === 0) {
      alert('Không có học sinh phù hợp để chọn!')
      return
    }

    // Thông báo nếu có học sinh vắng
    if (type === 'present' && absentStudents.length > 0) {
      console.log(`⚠️ Bỏ qua ${absentStudents.length} học sinh vắng khi random`)
    }

    setIsRandoming(true)
    setSelectedStudent(null)

    // Tạo mảng đã xáo trộn
    const shuffled = [...candidateStudents]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    let count = 0
    const totalAnimations = Math.min(30, shuffled.length * 3)
    const animationInterval = 70 // ms

    const interval = setInterval(() => {
      const randomIndex = count % shuffled.length
      const randomStudent = shuffled[randomIndex]
      
      setSelectedStudent(randomStudent)
      count++

      if (count > totalAnimations) {
        clearInterval(interval)
        setIsRandoming(false)

        // Chọn ngẫu nhiên học sinh cuối cùng
        const finalIndex = Math.floor(Math.random() * shuffled.length)
        const finalStudent = shuffled[finalIndex]
        setSelectedStudent(finalStudent)

        // Kiểm tra xem học sinh có vắng không (phòng ngừa)
        if (absentStudents.includes(finalStudent.id)) {
          // Tìm học sinh có mặt
          const presentStudent = shuffled.find(s => !absentStudents.includes(s.id))
          if (presentStudent) {
            setSelectedStudent(presentStudent)
            console.log('⚠️ Đã chuyển sang học sinh có mặt:', presentStudent.name)
          } else {
            alert('❌ Không còn học sinh có mặt để chọn!')
            return
          }
        }

        // Hiển thị thông tin chi tiết
        console.log('Selected student:', {
          name: finalStudent.name,
          desk: finalStudent.deskNumber,
          participation: finalStudent.participationCount,
          hasScore: !!finalStudent.mouthScore,
          isAbsent: absentStudents.includes(finalStudent.id)
        })

        // Delay một chút rồi hiện modal
        setTimeout(() => {
          setShowScoreModal(true)
        }, 400)
      }
    }, animationInterval)
  }

  // Thêm hàm xử lý di chuyển học sinh
  // Thêm hàm xử lý trao đổi vị trí trong Home component
  const handleStudentsSwap = async (student1Id: string, student2Id: string) => {
    if (!classData) return
    
    try {
      // Tìm 2 học sinh cần đổi chỗ
      const student1 = classData.students.find(s => s.id === student1Id)
      const student2 = classData.students.find(s => s.id === student2Id)
      
      if (!student1 || !student2) {
        alert('Không tìm thấy học sinh')
        return
      }
      
      console.log('Swapping students:', {
        student1: { name: student1.name, desk: student1.deskNumber },
        student2: { name: student2.name, desk: student2.deskNumber }
      })
      
      // Lưu vị trí cũ để rollback
      const student1OldDesk = student1.deskNumber
      const student2OldDesk = student2.deskNumber
      
      // Optimistic update: cập nhật UI ngay
      setClassData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          students: prev.students.map(s => {
            if (s.id === student1Id) {
              return { ...s, deskNumber: student2OldDesk }
            }
            if (s.id === student2Id) {
              return { ...s, deskNumber: student1OldDesk }
            }
            return s
          })
        }
      })
      
      // Gọi API để cập nhật database
      const res = await fetch('/api/students/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student1Id: parseInt(student1Id),
          student2Id: parseInt(student2Id),
          student1NewDesk: student2OldDesk,
          student2NewDesk: student1OldDesk,
          classId: 1 // Hoặc lấy từ classData
        })
      })
      
      const data = await res.json()
      
      if (!data.success) {
        // Rollback nếu API fail
        setClassData(prev => {
          if (!prev) return prev
          return {
            ...prev,
            students: prev.students.map(s => {
              if (s.id === student1Id) {
                return { ...s, deskNumber: student1OldDesk }
              }
              if (s.id === student2Id) {
                return { ...s, deskNumber: student2OldDesk }
              }
              return s
            })
          }
        })
        alert(`❌ ${data.message || 'Không thể đổi chỗ'}`)
        return
      }
      
      // Thông báo thành công
      console.log('Swap successful:', data.message)
      
      // Refresh data để đồng bộ
      await refetchClassData()
      
      
    } catch (error) {
      console.error('Error swapping students:', error)
      alert('❌ Có lỗi xảy ra khi đổi chỗ học sinh')
    }
  }

  const handleStudentClickForAttendance = async (student: Student) => {
    if (!isMarkingAbsent || !classData) return
    
    const studentId = student.id
    
    try {
      // Toggle trạng thái vắng/có mặt
      const newStatus = absentStudents.includes(studentId) ? 'present' : 'absent'
      const today = new Date().toISOString().split('T')[0]
      
      // Map subject
      const subjectMap: Record<string, number> = {
        toan: 1, van: 2, anh: 3, ly: 4, hoa: 5,
      }
      const subjectId = subjectMap[selectedSubject] || 1
      
      // Gọi API lưu điểm danh
      const res = await fetch('/api/attendance/simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: parseInt(studentId),
          subject_id: subjectId,
          attendance_date: today,
          status: newStatus === 'absent' ? 'absent' : 'present'
        }),
      })
      
      const data = await res.json()
      
      if (data.success) {
        // Cập nhật state
        if (newStatus === 'absent') {
          // Thêm vào danh sách vắng
          setAbsentStudents(prev => [...prev, studentId])
        } else {
          // Xóa khỏi danh sách vắng
          setAbsentStudents(prev => prev.filter(id => id !== studentId))
        }
        
        // Cập nhật UI
        setClassData(prev => {
          if (!prev) return prev
          return {
            ...prev,
            students: prev.students.map(s => 
              s.id === studentId
                ? { ...s, isMarkedAbsent: newStatus === 'absent' }
                : s
            )
          }
        })
        
        console.log(`Đã ${newStatus === 'absent' ? 'đánh dấu vắng' : 'bỏ vắng'}: ${student.name}`)
      } else {
        alert('❌ Lỗi khi lưu điểm danh')
      }
      
    } catch (error) {
      console.error('Attendance error:', error)
      alert('❌ Lỗi kết nối khi lưu điểm danh')
    }
  }

  // Hàm lưu tất cả điểm danh vào database
  // Sửa hàm handleSaveAttendance
  const handleSaveAttendance = async () => {
    if (absentStudents.length === 0) {
      const confirm = window.confirm('📝 Không có học sinh vắng mặt. Kết thúc điểm danh?')
      if (confirm) {
        setIsMarkingAbsent(false)
      }
      return
    }
    
    const confirmSave = window.confirm(
      `Bạn đã đánh dấu ${absentStudents.length} học sinh vắng.\n\n` +
      '❌ Vắng: ' + absentStudents.length + '\n\n' +
      'Lưu điểm danh và kết thúc?'
    )
    
    if (confirmSave) {
      try {
        const today = new Date().toISOString().split('T')[0]
        const subjectMap: Record<string, number> = {
          toan: 1, van: 2, anh: 3, ly: 4, hoa: 5,
        }
        const subjectId = subjectMap[selectedSubject] || 1
        
        // Lấy danh sách tên học sinh vắng
        const absentNames = absentStudents.map(id => {
          const student = classData?.students.find(s => s.id === id)
          return student?.name || id
        }).join(', ')
        
        // Thông báo thành công (không cần gọi API vì đã lưu từng cái khi click)
        alert(`✅ Đã lưu điểm danh thành công!\n\n` +
              `📅 Ngày: ${today}\n` +
              `📚 Môn: ${subjects.find(s => s.code.toLowerCase() === selectedSubject)?.name || selectedSubject}\n` +
              `❌ Vắng (${absentStudents.length}): ${absentNames}`)
        
        // Reset
        setIsMarkingAbsent(false)
        // KHÔNG reset absentStudents để giữ hiển thị
        
      } catch (error) {
        console.error('Save attendance error:', error)
        alert('❌ Lỗi khi xử lý điểm danh')
      }
    }
  }  

  if (!classData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Đang tải...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="w-full">
       {/* TOP PANEL */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 f-flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          {/* Info + Controls */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            {/* Lớp */}
            <div>
              <p className="text-xs text-slate-500">Lớp</p>
              <p className="text-lg font-bold text-blue-600">
                {classData.className}
              </p>
            </div>

            {/* Sĩ số */}
            <div>
              <p className="text-xs text-slate-500">Sĩ số</p>
              <p className="text-lg font-bold text-blue-600">
                {classData.totalStudents}
              </p>
            </div>

            {/* Môn học */}
          <div>
            <p className="text-xs text-slate-500 mb-1">Môn học</p>
            <Select
              value={selectedSubject}
              onValueChange={setSelectedSubject}
              disabled={subjects.length === 0}
            >
              <SelectTrigger className="h-9 bg-white text-gray-900 border-gray-400 focus:ring-blue-500">
                <SelectValue 
                  placeholder="Chọn môn" 
                  className="text-gray-900 placeholder:text-gray-500"  // ← ép màu chữ & placeholder
                />
              </SelectTrigger>
              <SelectContent className="bg-white text-gray-900 border border-gray-300 max-h-60">
                {subjects.map((sub) => (
                  <SelectItem 
                    key={sub.id} 
                    value={sub.code.toLowerCase()}
                    className="text-gray-900 focus:bg-blue-50 focus:text-blue-900"
                  >
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => {
              setIsMarkingAbsent(!isMarkingAbsent)
              if (!isMarkingAbsent) {
                // alert('🎯 Chế độ điểm danh nhanh: Nhấn vào học sinh VẮNG. Học sinh có mặt KHÔNG cần click.')
              } else {
                // Khi tắt chế độ, hiển thị thống kê và lưu
                handleSaveAttendance()
              }
            }}
            variant={isMarkingAbsent ? "default" : "outline"}
            className={`h-9 font-semibold ${
              isMarkingAbsent 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'border-red-500 text-red-600 hover:bg-red-50'
            }`}
          >
            {isMarkingAbsent ? (
              <span className="flex items-center gap-2">
                <span className="animate-pulse">●</span> 
                Đang điểm danh ({absentStudents.length} vắng)
              </span>
            ) : (
              '📋 Điểm danh nhanh'
            )}
          </Button>

           <Button
              onClick={handleRandomStudent}
              disabled={isRandoming}
              className="h-9 bg-amber-400 hover:bg-amber-500 text-white font-semibold"
            >
              {isRandoming ? 'Đang quay...' : '🎲 Quay số may mắn'}
            </Button>

            <Button
              onClick={() => {
                setIsCheckingMouth(prev => !prev);
                // Tắt các chế độ khác nếu cần
                if (!isCheckingMouth) {
                  setIsMarkingAbsent(false);
                }
              }}
              variant={isCheckingMouth ? "default" : "outline"}
              className={`h-9 font-semibold ${
                isCheckingMouth 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'border-purple-500 text-purple-600 hover:bg-purple-50'
              }`}
            >
              {isCheckingMouth ? (
                <span className="flex items-center gap-2">
                  <span className="animate-pulse">●</span> 
                  Đang chọn HS chấm miệng ({selectedSubject.toUpperCase()})
                </span>
              ) : (
                '✍️ Kiểm tra miệng'
              )}
            </Button>
           
          </div>
        </div>


        {/* Seating Chart */}
        <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
         <SeatingChart 
            students={classData.students.map(s => ({
              ...s,
              isMarkedAbsent: absentStudents.includes(s.id)
            }))} 
            selectedStudent={selectedStudent} 
            onStudentClick={handleStudentInteraction}
            onStudentsSwap={handleStudentsSwap}
            isMarkingAbsent={isMarkingAbsent}
          />
        </div>

        {/* Ranking Board */}
        {/* <div className="bg-white rounded-lg p-6 shadow-lg">
          <RankingBoard topPerformers={classData.topPerformers} rankings={classData.rankings} />
        </div> */}

        {/* Score Modal */}
        <ScoreModal
          isOpen={showScoreModal}
          studentName={selectedStudent?.name || ''}
          onClose={() => setShowScoreModal(false)}
          onSave={handleSaveScore}
        />
      </div>
    </main>
  )
}
