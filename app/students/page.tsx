'use client';

import { useState, useEffect } from 'react';

interface Student {
  student_id: number;
  student_code: string;
  full_name: string;
  gender: 'Nam' | 'Nữ';
  date_of_birth: string | null;
  class_id: number;
  desk_number: number;
  seat_position: 'Trái' | 'Phải';
  is_active: number;
  created_at: string;
}

interface Class {
  class_id: number;
  class_name: string;
  school_year: string;
  homeroom_teacher: string | null;
  total_students: number;
  created_date: string;
  created_at: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    full_name: '',
    gender: 'Nam' as 'Nam' | 'Nữ',
    date_of_birth: '',
    class_id: 0
  });

  // Lấy danh sách lớp
  useEffect(() => {
    fetchClasses();
  }, []);

  // Lấy danh sách học sinh khi chọn lớp
  useEffect(() => {
    if (selectedClassId) {
      fetchStudents(selectedClassId);
      setFormData(prev => ({ ...prev, class_id: selectedClassId }));
    }
  }, [selectedClassId]);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      if (data.success && data.classes && Array.isArray(data.classes)) {
        setClasses(data.classes);
        if (data.classes.length > 0) {
          setSelectedClassId(data.classes[0].class_id);
        }
      } else {
        console.error('API trả về không đúng format:', data);
        setClasses([]);
      }
    } catch (error) {
      console.error('Lỗi lấy danh sách lớp:', error);
      setClasses([]);
    }
  };

  const fetchStudents = async (classId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students?class_id=${classId}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (error) {
      console.error('Lỗi lấy danh sách học sinh:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.class_id) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_student',
          ...formData
        })
      });

      const data = await res.json();
      
      if (data.success) {
        alert(`Thêm học sinh thành công!\nMã HS: ${data.data.student_code}\nBàn số: ${data.data.desk_number}\nVị trí: ${data.data.seat_position}`);
        setFormData({
          full_name: '',
          gender: 'Nam',
          date_of_birth: '',
          class_id: selectedClassId || 0
        });
        setShowAddForm(false);
        if (selectedClassId) {
          fetchStudents(selectedClassId);
          fetchClasses(); // Cập nhật số lượng học sinh
        }
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (error) {
      console.error('Lỗi thêm học sinh:', error);
      alert('Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (studentId: number, classId: number) => {
    if (!confirm('Bạn có chắc muốn xóa học sinh này?')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_student',
          student_id: studentId,
          class_id: classId
        })
      });

      const data = await res.json();
      
      if (data.success) {
        alert('Xóa học sinh thành công!');
        if (selectedClassId) {
          fetchStudents(selectedClassId);
          fetchClasses();
        }
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (error) {
      console.error('Lỗi xóa học sinh:', error);
      alert('Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Quản lý Học sinh</h1>
          
          {/* Chọn lớp */}
          <div className="mb-6 flex items-center gap-4">
            <label className="font-semibold text-gray-700">Chọn lớp:</label>
            <select
              value={selectedClassId || ''}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Chọn lớp --</option>
              {classes.map((cls) => (
                <option key={cls.class_id} value={cls.class_id}>
                  {cls.class_name} ({cls.school_year}) - {cls.total_students} HS
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={!selectedClassId}
            >
              {showAddForm ? '✕ Đóng' : '+ Thêm học sinh'}
            </button>
          </div>

          {/* Form thêm học sinh */}
          {showAddForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Thêm học sinh mới</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới tính
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Nam' | 'Nữ' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                  >
                    {loading ? 'Đang xử lý...' : '✓ Thêm học sinh'}
                  </button>
                </div>
              </form>
              <p className="text-sm text-gray-600 mt-4">
                ℹ️ Số bàn và vị trí ngồi sẽ được tự động phân bổ
              </p>
            </div>
          )}
        </div>

        {/* Danh sách học sinh */}
        {loading && <p className="text-center text-gray-600">Đang tải...</p>}
        
        {!loading && selectedClassId && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">STT</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Mã HS</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Họ và tên</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Giới tính</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ngày sinh</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Số bàn</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Vị trí</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        Chưa có học sinh nào trong lớp này
                      </td>
                    </tr>
                  ) : (
                    students.map((student, index) => (
                      <tr key={student.student_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">{student.student_code}</td>
                        <td className="px-4 py-3 text-sm font-medium">{student.full_name}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            student.gender === 'Nam' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                          }`}>
                            {student.gender}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('vi-VN') : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-center font-semibold">{student.desk_number}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            student.seat_position === 'Trái' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {student.seat_position}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <button
                            onClick={() => handleDelete(student.student_id, student.class_id)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!selectedClassId && !loading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">Vui lòng chọn lớp để xem danh sách học sinh</p>
          </div>
        )}
      </div>
    </div>
  );
}