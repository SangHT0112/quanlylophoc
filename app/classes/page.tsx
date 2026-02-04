'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, Users, Calendar, User, Plus, ChevronRight, School } from 'lucide-react';

interface ClassItem {
  class_id: number;
  class_name: string;
  school_year: string;
  homeroom_teacher: string | null;
  total_students: number;
  created_date: string;
}

interface SchoolYear {
  school_year: string;
}

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State cho bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch danh sách lớp
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedYear) params.append('schoolYear', selectedYear);

      const response = await fetch(`/api/classes?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setClasses(data.classes);
        setSchoolYears(data.schoolYears || []);
      } else {
        setError(data.error || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      console.error('Lỗi khi lấy danh sách lớp:', err);
      setError('Không thể tải danh sách lớp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Xử lý tìm kiếm với debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClasses();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedYear]);

  const handleClassClick = (classId: number) => {
    router.push(`/classes/${classId}`);
  };

  const handleCreateClass = () => {
    router.push('/classes/create');
  };

  // Tính toán thống kê
  const totalStudents = classes.reduce((sum, cls) => sum + cls.total_students, 0);
  const totalClasses = classes.length;
  const averageStudents = totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0;

  // Nhóm lớp theo năm học
  const groupedByYear: Record<string, ClassItem[]> = {};
  classes.forEach(cls => {
    const year = cls.school_year || 'Không xác định';
    if (!groupedByYear[year]) {
      groupedByYear[year] = [];
    }
    groupedByYear[year].push(cls);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
                <School className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
                Danh Sách Lớp Học
              </h1>
              <p className="text-gray-600 mt-2">
                Quản lý và theo dõi các lớp học trong hệ thống
              </p>
            </div>
            
            <button
              onClick={handleCreateClass}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Thêm Lớp Mới
            </button>
          </div>

          {/* Thống kê nhanh */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Tổng số lớp</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{totalClasses}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Tổng học sinh</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{totalStudents}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <User className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">HS trung bình/lớp</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{averageStudents}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thanh tìm kiếm và bộ lọc */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Tìm kiếm */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm lớp hoặc giáo viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* Bộ lọc năm học */}
            <div className="w-full md:w-64">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
              >
                <option value="">Tất cả năm học</option>
                {schoolYears.map((year) => (
                  <option key={year.school_year} value={year.school_year}>
                    {year.school_year}
                  </option>
                ))}
              </select>
            </div>

            {/* Nút hiển thị bộ lọc nâng cao */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Bộ lọc</span>
            </button>
          </div>

          {/* Bộ lọc nâng cao (ẩn/hiện) */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Bộ lọc nâng cao</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Thêm các bộ lọc khác nếu cần */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số học sinh từ
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số học sinh đến
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày tạo
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-red-800">Lỗi tải dữ liệu</h3>
                <p className="text-red-600 mt-1">{error}</p>
                <button
                  onClick={fetchClasses}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Danh sách lớp */}
        {!loading && !error && (
          <div className="space-y-8">
            {Object.entries(groupedByYear).map(([year, yearClasses]) => (
              <div key={year} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Header nhóm năm học */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-800">Năm học: {year}</h2>
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                      {yearClasses.length} lớp
                    </span>
                  </div>
                </div>

                {/* Grid danh sách lớp */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                  {yearClasses.map((cls) => (
                    <div
                      key={cls.class_id}
                      onClick={() => handleClassClick(cls.class_id)}
                      className="group bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition">
                            {cls.class_name}
                          </h3>
                          <p className="text-gray-500 text-sm mt-1">
                            Ngày tạo: {cls.created_date}
                          </p>
                        </div>
                        <div className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                          {cls.total_students} HS
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4" />
                          <span className="font-medium">GVCN:</span>
                          <span className={cls.homeroom_teacher ? "text-gray-800" : "text-gray-400 italic"}>
                            {cls.homeroom_teacher || 'Chưa có giáo viên'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">Năm học:</span>
                          <span>{cls.school_year}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                        <div className="text-sm text-gray-500">
                          ID: {cls.class_id}
                        </div>
                        <div className="flex items-center gap-2 text-blue-600 font-medium group-hover:text-blue-700">
                          <span>Xem chi tiết</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Trạng thái không có lớp */}
            {classes.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
                  <Users className="w-full h-full" />
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">Chưa có lớp học nào</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  Bắt đầu bằng cách tạo lớp học đầu tiên để quản lý học sinh và điểm số
                </p>
                <button
                  onClick={handleCreateClass}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Tạo lớp đầu tiên
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer thông tin */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-600">
            <div>
              <p className="font-medium">Hệ thống Quản lý Lớp học</p>
              <p className="text-sm">Phiên bản 1.0.0</p>
            </div>
            <div className="text-sm">
              <p>Tổng cộng: <span className="font-semibold">{totalClasses}</span> lớp • 
                <span className="font-semibold"> {totalStudents}</span> học sinh
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS tùy chỉnh */}
      <style jsx>{`
        @media (max-width: 768px) {
          .grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 {
            grid-template-columns: 1fr;
          }
        }
        
        .group:hover {
          background: linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%);
        }
        
        .transition-all {
          transition-property: all;
        }
        
        .duration-300 {
          transition-duration: 300ms;
        }
      `}</style>
    </div>
  );
}