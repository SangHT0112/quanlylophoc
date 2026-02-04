'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, Filter, BookOpen, Users, Mic, FileText } from 'lucide-react'
import { Label } from '@/components/ui/label'

interface StudentStat {
  id: string
  name: string
  participationCount: number
  subjectScores: string | null
  absentDates: string | null
  totalAbsent: number
  deskNumber: number
}

interface ClassSummary {
  className: string
  totalStudents: number
  absentToday?: number
}

type TimeFilter = 'today' | 'week' | 'month' | 'all'

export default function StatisticsPage() {
  const [classId] = useState('1')
  const [selectedSubject, setSelectedSubject] = useState('0') // 0 = tất cả môn
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today')
  const [showAll, setShowAll] = useState(false)
  const [stats, setStats] = useState<StudentStat[]>([])
  const [summary, setSummary] = useState<ClassSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string; code: string }>>([])

  // Load danh sách môn
  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await fetch('/api/subjects')
        const data = await res.json()
        if (data.success) {
          const allSubjects = [{ id: 0, name: 'Tất cả môn', code: 'all' }, ...data.subjects]
          setSubjects(allSubjects)
        }
      } catch (err) {
        console.error('Lỗi load subjects:', err)
      }
    }
    loadSubjects()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const subjectMap: Record<string, number> = {
        toan: 1, van: 2, anh: 3, ly: 4, hoa: 5,
      }
      
      const subjectId = selectedSubject === '0' || showAll ? 0 : subjectMap[selectedSubject] || 1

      const res = await fetch(
        `/api/stats/class/${classId}?subjectId=${subjectId}&timeFilter=${timeFilter}&showAll=${showAll}`
      )
      const data = await res.json()

      if (data.success) {
        setStats(data.students.map((s: any) => ({
          id: s.id.toString(),
          name: s.name,
          participationCount: Number(s.participation_count || 0),
          subjectScores: s.subject_scores || null,
          absentDates: s.absent_dates || null,
          totalAbsent: Number(s.total_absent || 0),
          deskNumber: s.desk_number
        })))

        setSummary({
          className: data.class.className,
          totalStudents: data.class.totalStudents,
          absentToday: timeFilter === 'today' ? data.absentToday : undefined,
        })
      }
    } catch (err) {
      console.error('Lỗi load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [selectedSubject, timeFilter, showAll])

  const getFilterLabel = () => {
    switch (timeFilter) {
      case 'today': return 'Hôm nay'
      case 'week': return 'Tuần này'
      case 'month': return 'Tháng này'
      case 'all': return 'Toàn bộ'
      default: return 'Hôm nay'
    }
  }

  const getSubjectLabel = () => {
    if (showAll) return 'Tất cả môn'
    const subject = subjects.find(s => s.code === selectedSubject)
    return subject ? subject.name : 'Chọn môn'
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-slate-800">Sổ Đầu Bài Thống Kê</h1>
            </div>
            <p className="text-slate-600 mt-1 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {summary ? `${summary.className} • ${summary.totalStudents} học sinh` : 'Đang tải...'}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Bật/Tắt Toàn bộ */}
            <div className="flex items-center gap-3">
             <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-all" 
                checked={showAll}
                onCheckedChange={(checked: boolean) => setShowAll(checked)}
              />
              <Label htmlFor="show-all" className="font-medium cursor-pointer">
                Hiển thị toàn bộ môn học
              </Label>
            </div>
              
              <Button variant="secondary" size="sm" onClick={loadStats}>
                <Filter className="h-4 w-4 mr-2" />
                Áp dụng
              </Button>
            </div>

            {/* Bộ lọc */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Combobox môn học (chỉ hiện khi không bật toàn bộ) */}
              {!showAll && (
                <div className="w-full sm:w-auto">
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className=" bg-white text-gray-900 w-full sm:w-[200px] bg-white text-black border">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <SelectValue placeholder="Chọn môn" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(sub => (
                        <SelectItem key={sub.id} value={sub.code}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Nút thời gian */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={timeFilter === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeFilter('today')}
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Hôm nay
                </Button>
                <Button
                  variant={timeFilter === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeFilter('week')}
                >
                  Tuần này
                </Button>
                <Button
                  variant={timeFilter === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeFilter('month')}
                >
                  Tháng này
                </Button>
                <Button
                  variant={timeFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeFilter('all')}
                >
                  Toàn bộ
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Thông tin bộ lọc */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant="outline" className="text-sm">
                <Filter className="h-3 w-3 mr-1" />
                Bộ lọc: {getFilterLabel()}
              </Badge>
              <Badge variant="outline" className="text-sm">
                <BookOpen className="h-3 w-3 mr-1" />
                {getSubjectLabel()}
              </Badge>
              {showAll && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  Đang xem toàn bộ dữ liệu
                </Badge>
              )}
              {timeFilter === 'today' && summary?.absentToday !== undefined && (
                <Badge variant="destructive" className="ml-auto">
                  <Users className="h-3 w-3 mr-1" />
                  Vắng: {summary.absentToday} HS
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bảng thống kê */}
        <Card className="shadow-lg">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xl">Chi tiết học sinh</span>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mic className="h-4 w-4" />
                <span>Tổng lượt phát biểu: {stats.reduce((sum, s) => sum + s.participationCount, 0)}</span>
                <span className="mx-2">•</span>
                <span>Tổng lượt vắng: {stats.reduce((sum, s) => sum + s.totalAbsent, 0)}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-12 text-center">STT</TableHead>
                      <TableHead className="w-20">Số bàn</TableHead>
                      <TableHead>Học sinh</TableHead>
                      <TableHead className="text-center">Lượt phát biểu</TableHead>
                      <TableHead className="text-center min-w-[200px]">Điểm miệng</TableHead>
                      <TableHead className="text-center min-w-[150px]">Lượt vắng</TableHead>
                      <TableHead className="text-center">Ngày vắng</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.map((s, index) => (
                      <TableRow key={s.id} className="hover:bg-slate-50">
                        <TableCell className="text-center text-slate-500 font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          <Badge variant="outline" className="bg-slate-100">
                            {s.deskNumber}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{s.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex items-center justify-center gap-2">
                            <Badge 
                              variant={s.participationCount > 0 ? "default" : "outline"}
                              className={s.participationCount > 0 ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                            >
                              {s.participationCount}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {s.subjectScores ? (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {s.subjectScores.split(', ').map((score, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="secondary"
                                  className="bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  {score}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={s.totalAbsent > 0 ? "destructive" : "secondary"}
                            className={s.totalAbsent > 0 ? "" : "bg-slate-100 text-slate-600"}
                          >
                            {s.totalAbsent} lần
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {s.absentDates ? (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {s.absentDates.split(',').map((date, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="outline"
                                  className="bg-red-50 text-red-600 border-red-200"
                                >
                                  {new Date(date).toLocaleDateString('vi-VN')}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {stats.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                          <div className="flex flex-col items-center gap-2">
                            <Filter className="h-12 w-12 text-slate-300" />
                            <p>Chưa có dữ liệu cho bộ lọc này</p>
                            <p className="text-sm">Thử thay đổi bộ lọc hoặc thời gian</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ghi chú */}
        <div className="mt-4 text-sm text-slate-500">
          <p>
            <strong>Lưu ý:</strong> 
            {showAll 
              ? " Đang xem toàn bộ dữ liệu kết hợp với bộ lọc thời gian. Dữ liệu sẽ bao gồm tất cả các môn học."
              : " Đang xem dữ liệu theo môn học đã chọn kết hợp với bộ lọc thời gian."
            }
          </p>
        </div>
      </div>
    </main>
  )
}