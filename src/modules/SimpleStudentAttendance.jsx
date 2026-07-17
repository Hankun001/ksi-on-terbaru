import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { UserCheck, Calendar, Users, Save, BookOpen, AlertCircle } from 'lucide-react';

const SimpleStudentAttendance = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [subject, setSubject] = useState('');

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [user]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'murid')
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);

      // Initialize attendance data
      const initialAttendance = {};
      data.forEach(student => {
        initialAttendance[student.id] = 'hadir';
      });
      setAttendanceData(initialAttendance);

    } catch (error) {
      console.error('Error fetching students:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, education_level, grade_level')
        .eq('teacher_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error.message);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const saveAttendance = async () => {
    if (!selectedClass) {
      alert('Silakan pilih kelas terlebih dahulu!');
      return;
    }

    if (!subject.trim()) {
      alert('Silakan isi mata pelajaran terlebih dahulu!');
      return;
    }

    try {
      // Create teaching journal with selected class_id
      const { data: journalData, error: journalError } = await supabase
        .from('teaching_journals')
        .insert([{
          teacher_id: user.id,
          class_id: selectedClass,
          date: selectedDate,
          subject: subject,
          duration_minutes: 45,
          teaching_method: 'Ceramah'
        }])
        .select()
        .single();

      if (journalError) throw journalError;

      // Save attendance records
      const attendanceRecords = Object.entries(attendanceData).map(([student_id, status]) => ({
        journal_id: journalData.id,
        student_id,
        status,
        note: ''
      }));

      const { error: attendanceError } = await supabase
        .from('student_attendance')
        .insert(attendanceRecords);

      if (attendanceError) throw attendanceError;

      alert('Absensi berhasil disimpan!');

    } catch (error) {
      console.error('Error saving attendance:', error.message);
      alert('Error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-sm">
          <div className="w-12 h-12 rounded-full bg-surface-dim"></div>
          <div className="h-4 w-48 bg-surface-dim rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-xl">
        <div>
          <h1 className="text-headline-sm md:text-headline-md font-bold text-on-surface flex items-center gap-sm">
            <UserCheck className="w-7 h-7 text-primary" />
            Absensi Siswa
          </h1>
          <p className="text-body-md text-on-surface-variant mt-xs">Catat kehadiran siswa langsung berdasarkan data murid</p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        {/* Form Section */}
        <div className="bg-primary-container/20 p-4 md:p-6 border-b border-outline-variant">
          <div className="flex items-center gap-sm mb-md">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-title-sm font-semibold text-on-surface m-0">Form Absensi</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-label-lg font-medium text-on-surface mb-1.5">Kelas <span className="text-error">*</span></label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md"
              >
                <option value="">
                  {classes.length === 0 ? 'Belum ada kelas' : 'Pilih Kelas'}
                </option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.education_level?.toUpperCase()} - Kelas {cls.grade_level})
                  </option>
                ))}
              </select>
              {classes.length === 0 && (
                <p className="mt-1 text-label-xs text-error flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Buat kelas terlebih dahulu di menu Data Kelas
                </p>
              )}
            </div>
            <div>
              <label className="block text-label-lg font-medium text-on-surface mb-1.5">Tanggal</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md"
              />
            </div>
            <div>
              <label className="block text-label-lg font-medium text-on-surface mb-1.5">Mata Pelajaran <span className="text-error">*</span></label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Contoh: Matematika"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md"
              />
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="p-4 md:p-6">
          <h2 className="text-title-md font-semibold text-on-surface flex items-center gap-sm mb-md">
            <Users className="w-5 h-5 text-primary" />
            Daftar Siswa
            <span className="bg-primary-container text-on-primary-container text-label-sm px-2 py-0.5 rounded-full ml-auto">
              {students.length}
            </span>
          </h2>

          {students.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-dim/50">
                      <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Siswa</th>
                      <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Email</th>
                      <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Status Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, idx) => (
                      <tr key={student.id} className={"border-t border-outline-variant/50 hover:bg-surface-dim/30 transition-colors " + (idx % 2 === 0 ? 'bg-surface' : 'bg-surface-dim/10')}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white font-bold text-label-sm shrink-0">
                              {(student.full_name || student.email || 'S').charAt(0).toUpperCase()}
                            </div>
                            <span className="text-body-sm font-medium text-on-surface">
                              {student.full_name || student.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-body-sm text-on-surface-variant">{student.email}</td>
                        <td className="px-4 py-3">
                          <select
                            value={attendanceData[student.id] || 'hadir'}
                            onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-body-sm min-w-[130px]"
                          >
                            <option value="hadir">Hadir</option>
                            <option value="absent">Alpha</option>
                            <option value="sick">Sakit</option>
                            <option value="permit">Izin</option>
                            <option value="late">Terlambat</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={saveAttendance}
                  disabled={!selectedClass || !subject.trim()}
                  className="inline-flex items-center gap-xs px-4 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all duration-200 shadow-sm text-label-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  Simpan Absensi
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-on-surface-variant/30 mb-4" />
              <p className="text-body-lg text-on-surface-variant mb-2">Belum ada data siswa.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleStudentAttendance;