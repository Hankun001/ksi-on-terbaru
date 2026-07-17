import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { UserCheck, Calendar, Users, Save, BookOpen } from 'lucide-react';

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
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <div>Memuat data siswa...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>
            <UserCheck size={28} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
            Absensi Siswa Sederhana
          </h1>
          <p>Catat kehadiran siswa langsung berdasarkan data murid</p>
        </div>
      </div>

      <div className="dashboard-content">
        <div style={{
          background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#7c3aed' }}>
            <Calendar size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Form Absensi
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="class">Kelas *</label>
              <select
                id="class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                style={{ width: '100%' }}
                required
              >
                <option value="">
                  {classes.length === 0 ? 'Belum ada kelas - buat kelas terlebih dahulu' : 'Pilih Kelas'}
                </option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.education_level?.toUpperCase()} - Kelas {cls.grade_level})
                  </option>
                ))}
              </select>
              {classes.length === 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#ef4444', background: '#fef2f2', padding: '0.5rem', borderRadius: '4px', border: '1px solid #fecaca' }}>
                  <strong>Info:</strong> Belum ada kelas. Login sebagai Admin dan buat kelas di menu "Data Kelas" terlebih dahulu.
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="date">Tanggal</label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Mata Pelajaran *</label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Contoh: Matematika, Bahasa Indonesia"
                style={{ width: '100%' }}
                required
              />
            </div>
          </div>
        </div>

        <section className="dashboard-section">
          <h2>
            <Users size={20} style={{ marginRight: '8px' }} />
            Daftar Siswa ({students.length} siswa)
          </h2>

          {students.length > 0 ? (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Siswa</th>
                    <th>Email</th>
                    <th>Status Kehadiran</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #8b5cf6, #c3aed)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.75rem'
                          }}>
                            {(student.full_name || student.email || 'S').charAt(0).toUpperCase()}
                          </div>
                          <strong>{student.full_name || student.email}</strong>
                        </div>
                      </td>
                      <td>{student.email}</td>
                      <td>
                        <select
                          value={attendanceData[student.id] || 'hadir'}
                          onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                          style={{
                            padding: '0.35rem 0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #ddd'
                          }}
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
          ) : (
            <div className="empty-state">
              <span className="empty-icon"><Users size={48} /></span>
              <p>Belum ada data siswa.</p>
            </div>
          )}

          {students.length > 0 && (
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-primary"
                onClick={saveAttendance}
                disabled={!selectedClass || !subject.trim()}
              >
                <Save size={18} style={{ marginRight: '8px' }} />
                Simpan Absensi
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SimpleStudentAttendance;