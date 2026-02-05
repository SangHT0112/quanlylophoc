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
import { format } from 'date-fns'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { vi } from 'date-fns/locale'
import { ArrowDownUp, ArrowUpDown } from 'lucide-react'

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

interface StudentApiResponse {
  id: number
  name: string
  participation_count: number | string
  subject_scores: string | null
  absent_dates: string | null
  total_absent: number | string
  desk_number: number
}

interface StatsApiResponse {
  success: boolean
  students: StudentApiResponse[]
  class: {
    className: string
    totalStudents: number
  }
  absentToday?: number
  timeFilter: string
  showAll: boolean
  subjectId: number
}

interface Subject {
  id: number
  name: string
  code: string
}

type SortMode = 'default' | 'participation-desc' | 'scores-desc'
type TimeFilter = 'today' | 'week' | 'month' | 'all' | 'custom'

export default function StatisticsPage() {
  const [classId] = useState('1')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today')
  const [customDate, setCustomDate] = useState<Date | undefined>(new Date())
  const [showAll, setShowAll] = useState(false)
  const [stats, setStats] = useState<StudentStat[]>([])
  const [summary, setSummary] = useState<ClassSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [sortMode, setSortMode] = useState<SortMode>('default')
  const [subjectsLoading, setSubjectsLoading] = useState(true)

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);


  // Hàm sắp xếp
  const sortedStats = [...stats].sort((a, b) => {
    if (sortMode === 'participation-desc') {
      return b.participationCount - a.participationCount
    }

    if (sortMode === 'scores-desc') {
      const getScoreCount = (scores: string | null) => 
        scores ? scores.split(', ').filter(s => s.trim()).length : 0
      
      const getScoreSum = (scores: string | null) => {
        if (!scores) return 0
        return scores.split(', ').reduce((sum, item) => {
          const match = item.match(/(\d+\.?\d*)/)
          return sum + (match ? parseFloat(match[1]) : 0)
        }, 0)
      }

      const countA = getScoreCount(a.subjectScores)
      const countB = getScoreCount(b.subjectScores)

      if (countA !== countB) {
        return countB - countA
      }

      const sumA = getScoreSum(a.subjectScores)
      const sumB = getScoreSum(b.subjectScores)
      return sumB - sumA
    }

    return 0
  })

  // Load danh sách môn
  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await fetch('/api/subjects')
        const data = await res.json()
        if (data.success) {
          const allSubjects = data.subjects
          setSubjects(allSubjects)
          
          // Đặt môn đầu tiên làm mặc định
          if (allSubjects.length > 0) {
            setSelectedSubject(allSubjects[0].code)
          }
        }
      } catch (err) {
        console.error('Lỗi load subjects:', err)
      } finally {
        setSubjectsLoading(false)
      }
    }
    loadSubjects()
  }, [])

  const loadStats = async () => {
    // Chỉ load stats nếu đã có subjects hoặc đang showAll
    if (!showAll && subjects.length === 0) {
      return
    }
    
    setLoading(true)
    try {
      // Tìm subject id dựa trên selectedSubject (là code)
      const selectedSubjectObj = subjects.find(s => s.code === selectedSubject)
      // Nếu không tìm thấy hoặc showAll = true thì dùng 0
      const effectiveSubjectId = showAll ? 0 : (selectedSubjectObj?.id || 1)

      let queryParams = `subjectId=${effectiveSubjectId}&timeFilter=${timeFilter}&showAll=${showAll}`
      if (timeFilter === 'custom' && customDate) {
        queryParams += `&date=${format(customDate, 'yyyy-MM-dd')}`
      }

      const res = await fetch(`/api/stats/class/${classId}?${queryParams}`)
      const data: StatsApiResponse = await res.json()

      if (data.success) {
        setStats(
          data.students.map((s: StudentApiResponse) => ({
            id: s.id.toString(),
            name: s.name,
            participationCount: Number(s.participation_count || 0),
            subjectScores: s.subject_scores || null,
            absentDates: s.absent_dates || null,
            totalAbsent: Number(s.total_absent || 0),
            deskNumber: s.desk_number || 0,
          }))
        )

        const isToday =
          timeFilter === 'today' ||
          (timeFilter === 'custom' &&
            customDate &&
            format(customDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))

        setSummary({
          className: data.class.className,
          totalStudents: data.class.totalStudents,
          absentToday: isToday ? data.absentToday : undefined,
        })
      }
    } catch (err) {
      console.error('Lỗi load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAIAnalysis = async () => {
    if (!summary) return;

    setAiLoading(true);
    setAiAnalysis(null);
    setAiError(null);

    try {
      const params = new URLSearchParams({
        classId: classId,
        timeFilter,
        showAll: showAll.toString(),
        subjectCode: showAll ? '' : selectedSubject,
        ...(timeFilter === 'custom' && customDate
          ? { date: format(customDate, 'yyyy-MM-dd') }
          : {}),
      });

      const res = await fetch(`/api/ai/class-analysis?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.success && data.analysis) {
        setAiAnalysis(data.analysis);
      } else {
        setAiError(data.error || 'Không nhận được phân tích');
      }
    } catch (err: any) {
      console.error('AI analysis error:', err);
      setAiError('Lỗi kết nối hoặc server AI');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    // Chỉ load stats nếu subjects đã sẵn sàng hoặc đang showAll
    if (showAll || (!subjectsLoading && subjects.length > 0)) {
      loadStats()
    }
  }, [selectedSubject, timeFilter, showAll, customDate, subjectsLoading, subjects.length])

  const getFilterLabel = () => {
    if (timeFilter === 'custom' && customDate) {
      return `Ngày ${format(customDate, 'dd/MM/yyyy', { locale: vi })}`
    }
    switch (timeFilter) {
      case 'today':
        return 'Hôm nay'
      case 'week':
        return 'Tuần này'
      case 'month':
        return 'Tháng này'
      case 'all':
        return 'Toàn bộ'
      default:
        return 'Hôm nay'
    }
  }

  const getSubjectLabel = () => {
    if (showAll) return 'Tất cả môn'
    const subject = subjects.find((s) => s.code === selectedSubject)
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
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-all"
                  checked={showAll}
                  onCheckedChange={(checked: boolean) => setShowAll(!!checked)}
                />
                <Label htmlFor="show-all" className="font-medium cursor-pointer">
                  Hiển thị toàn bộ môn học
                </Label>
              </div>

              {/* Có thể bỏ nút Áp dụng nếu dùng auto-load */}
              {/* <Button variant="secondary" size="sm" onClick={loadStats}>
                <Filter className="h-4 w-4 mr-2" />
                Áp dụng
              </Button> */}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!showAll && (
                <div className="w-full sm:w-auto min-w-[180px]">
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="bg-white">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <SelectValue placeholder="Chọn môn" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((sub) => (
                        <SelectItem key={sub.id} value={sub.code}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={timeFilter === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeFilter('today')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
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

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={timeFilter === 'custom' ? 'default' : 'outline'}
                      size="sm"
                      className="min-w-[150px] justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {timeFilter === 'custom' && customDate
                        ? format(customDate, 'dd/MM/yyyy', { locale: vi })
                        : 'Chọn ngày'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={customDate}
                      onSelect={(date) => {
                        if (date) {
                          setCustomDate(date)
                          setTimeFilter('custom')
                        }
                      }}
                      initialFocus
                      locale={vi}
                      // Optional: disabled={(date) => date > new Date()} // không cho chọn tương lai
                    />
                  </PopoverContent>
                </Popover>

                  <Button
                    onClick={handleAIAnalysis}
                    disabled={loading || stats.length === 0}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2"
                  >
                    <span className="text-lg">✨</span>
                    Phân tích AI
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
                  Toàn bộ môn học
                </Badge>
              )}
              {summary?.absentToday !== undefined && (
                <Badge variant="destructive" className="ml-auto">
                  <Users className="h-3 w-3 mr-1" />
                  Vắng hôm nay: {summary.absentToday} HS
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bảng thống kê - giữ nguyên phần còn lại */}
        <Card className="shadow-lg">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xl">Chi tiết học sinh</span>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mic className="h-4 w-4" />
                <span>
                  Tổng lượt phát biểu: {stats.reduce((sum, s) => sum + s.participationCount, 0)}
                </span>
                <span className="mx-2">•</span>
                <span>
                  Tổng lượt vắng: {stats.reduce((sum, s) => sum + s.totalAbsent, 0)}
                </span>
              </div>

              <div className="flex gap-2 ml-4 border-l pl-4">
                <Button
                  variant={sortMode === 'participation-desc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortMode(
                    sortMode === 'participation-desc' ? 'default' : 'participation-desc'
                  )}
                  className="flex items-center gap-1"
                >
                  {sortMode === 'participation-desc' ? (
                    <ArrowDownUp className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  )}
                  Phát biểu cao nhất
                </Button>

                <Button
                  variant={sortMode === 'scores-desc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortMode(
                    sortMode === 'scores-desc' ? 'default' : 'scores-desc'
                  )}
                  className="flex items-center gap-1"
                >
                  {sortMode === 'scores-desc' ? (
                    <ArrowDownUp className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  )}
                  Nhiều điểm nhất
                </Button>
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
                    {sortedStats.map((s, index) => (
                      <TableRow key={s.id} className="hover:bg-slate-50">
                        <TableCell className="text-center text-slate-500 font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          <Badge variant="outline" className="bg-slate-100">
                            {s.deskNumber}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={s.participationCount > 0 ? 'default' : 'outline'}
                            className={
                              s.participationCount > 0 ? 'bg-green-100 text-green-800' : ''
                            }
                          >
                            {s.participationCount}
                          </Badge>
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
                                  {score.trim()}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={s.totalAbsent > 0 ? 'destructive' : 'secondary'}
                            className={s.totalAbsent === 0 ? 'bg-slate-100 text-slate-600' : ''}
                          >
                            {s.totalAbsent} lần
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {s.absentDates ? (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {s.absentDates
                                .split(',')
                                .map((date) => date.trim())
                                .filter(Boolean)
                                .map((date, idx) => (
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

                    {stats.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                          <div className="flex flex-col items-center gap-2">
                            <Filter className="h-12 w-12 text-slate-300" />
                            <p>Chưa có dữ liệu cho bộ lọc này</p>
                            <p className="text-sm">Thử thay đổi môn học, thời gian hoặc tắt "Toàn bộ môn"</p>
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

        {aiAnalysis && (
          <Card className="mt-8 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-purple-800">
                <span className="text-2xl">🤖</span>
                Phân tích từ AI - Giáo viên chủ nhiệm
              </CardTitle>
              <p className="text-sm text-purple-700">
                {getFilterLabel()} • {getSubjectLabel()}
              </p>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none text-gray-800 leading-relaxed whitespace-pre-line">
                {aiAnalysis}
              </div>
            </CardContent>
          </Card>
        )}

        {aiLoading && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p>Đang phân tích dữ liệu lớp...</p>
          </div>
        )}

        {aiError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {aiError}
          </div>
        )}

        <div className="mt-4 text-sm text-slate-500">
          <p>
            <strong>Lưu ý:</strong>{' '}
            {showAll
              ? 'Đang xem toàn bộ dữ liệu kết hợp với bộ lọc thời gian (tất cả môn học).'
              : 'Đang xem dữ liệu theo môn học đã chọn kết hợp với bộ lọc thời gian.'}
          </p>
        </div>
      </div>
    </main>
  )
}