import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { UserCheck, Calendar, Users, Clock, FileText, Printer } from 'lucide-react';

const StudentAttendance = () => {
  const { user } = useAuth();
  const [journals, setJournals] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [attendanceData, setAttendanceData] = useState({});
  const [classStudents, setClassStudents] = useState([]); // Store students for selected class
  const [loading, setLoading] = useState(true);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [journalForm, setJournalForm] = useState({
    class_id: '',
    date: new Date().toISOString().split('T')[0],
    subject: '',
    duration_minutes: 45
  });

  useEffect(() => {
    fetchJournals();
    fetchClasses();
  }, [user]);

  const fetchJournals = async () => {
    try {
      const { data, error } = await supabase
        .from('teaching_journals')
        .select(`
          *,
          classes (name, education_level, grade_level),
          student_attendance (
            student_id,
            status,
            note
          )
        `)
        .eq('teacher_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setJournals(data || []);
    } catch (error) {
      console.error('Error fetching journals:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error.message);
    }
  };

  const fetchClassStudents = async (classId) => {
    try {
      const { data, error } = await supabase
        .from('class_students')
        .select(`
          student_id,
          profiles (id, full_name, email)
        `)
        .eq('class_id', classId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching students:', error.message);
      return [];
    }
  };

  const handleCreateJournal = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('teaching_journals')
        .insert([{
          teacher_id: user.id,
          class_id: journalForm.class_id,
          date: journalForm.date,
          subject: journalForm.subject,
          duration_minutes: journalForm.duration_minutes
        }]);

      if (error) throw error;
      alert('Jurnal berhasil dibuat! Silakan isi absensi.');
      setShowJournalForm(false);
      setJournalForm({ class_id: '', date: new Date().toISOString().split('T')[0], subject: '', duration_minutes: 45 });
      fetchJournals();
    } catch (error) {
      console.error('Error creating journal:', error.message);
      alert('Error: ' + error.message);
    }
  };

  const handleJournalSelect = async (journal) => {
    setSelectedJournal(journal);
    
    // Fetch students for this class (store in state for display)
    const fetchedStudents = await fetchClassStudents(journal.class_id);
    setClassStudents(fetchedStudents);
    
    // Create a map of student_id -> student profile for quick lookup
    const studentMap = {};
    fetchedStudents.forEach(cs => {
      studentMap[cs.student_id] = cs.profiles;
    });
    
    // If attendance already recorded, load it
    if (journal.student_attendance && journal.student_attendance.length > 0) {
      const existingAttendance = {};
      journal.student_attendance.forEach(att => {
        existingAttendance[att.student_id] = att.status;
      });
      setAttendanceData(existingAttendance);
    } else {
      // Initialize empty attendance for all students
      const initialAttendance = {};
      fetchedStudents.forEach(cs => {
        initialAttendance[cs.student_id] = 'hadir';
      });
      setAttendanceData(initialAttendance);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const saveAttendance = async () => {
    if (!selectedJournal) return;

    try {
      // Delete existing attendance for this journal first
      await supabase
        .from('student_attendance')
        .delete()
        .eq('journal_id', selectedJournal.id);

      // Insert new attendance records
      const attendanceRecords = Object.entries(attendanceData).map(([student_id, status]) => ({
        journal_id: selectedJournal.id,
        student_id,
        status
      }));

      const { error } = await supabase
        .from('student_attendance')
        .insert(attendanceRecords);

      if (error) throw error;
      alert('Absensi berhasil disimpan!');
      fetchJournals();
    } catch (error) {
      console.error('Error saving attendance:', error.message);
      alert('Error: ' + error.message);
    }
  };

  const printAttendanceReport = (journal) => {
    const printWindow = window.open('', '_blank');
    const students = classStudents.length > 0 ? classStudents : [];
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Absensi - ${journal.date}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #8b5cf6; margin-bottom: 5px; }
            .info { margin-bottom: 20px; }
            .info p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f5f3ff; }
            .status-hadir { color: #10b981; font-weight: bold; }
            .status-absent { color: #ef4444; font-weight: bold; }
            .status-sick { color: #f59e0b; font-weight: bold; }
            .status-permit { color: #3b82f6; font-weight: bold; }
            .status-late { color: #8b5cf6; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN ABSENSI SISWA</h1>
            <p>PKBM - Sistem Administrasi Pendidikan</p>
          </div>
          <div class="info">
            <p><strong>Tanggal:</strong> ${new Date(journal.date).toLocaleDateString('id-ID')}</p>
            <p><strong>Kelas:</strong> ${journal.classes?.name || 'N/A'}</p>
            <p><strong>Mata Pelajaran:</strong> ${journal.subject}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Siswa</th>
                <th>Status</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${students.map((student, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${student.profiles?.full_name || student.profiles?.email || 'N/A'}</td>
                  <td class="status-${attendanceData[student.student_id] || 'hadir'}">
                    ${(attendanceData[student.student_id] || 'hadir').toUpperCase()}
                  </td>
                  <td>-</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            Dicetak pada: ${new Date().toLocaleString('id-ID')}
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return <div className="dashboard-container">Memuat absensi...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>
            <UserCheck size={28} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
            Absensi Siswa
          </h1>
          <p>Catat kehadiran siswa secara offline</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-primary"
            onClick={() => setShowJournalForm(true)}
          >
            <Calendar size={18} style={{ marginRight: '8px' }} />
            Buat Sesi Absensi
          </button>
        </div>
      </div>

      {/* Create Journal Modal */}
      {showJournalForm && (
        <div className="form-container">
          <h2>Buat Sesi Absensi Baru</h2>
          <form onSubmit={handleCreateJournal}>
            <div className="form-group">
              <label htmlFor="class_id">Pilih Kelas <span style={{ color: 'red' }}>*</span></label>
              <select
                id="class_id"
                name="class_id"
                value={journalForm.class_id}
                onChange={(e) => setJournalForm({ ...journalForm, class_id: e.target.value })}
                required
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.education_level?.toUpperCase()} - Kelas {cls.grade_level})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="date">Tanggal <span style={{ color: 'red' }}>*</span></label>
              <input
                type="date"
                id="date"
                name="date"
                value={journalForm.date}
                onChange={(e) => setJournalForm({ ...journalForm, date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Mata Pelajaran <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={journalForm.subject}
                onChange={(e) => setJournalForm({ ...journalForm, subject: e.target.value })}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                <Save size={18} style={{ marginRight: '8px' }} />
                Buat Sesi
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowJournalForm(false)}>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Attendance Recording */}
      {selectedJournal && (
        <div className="dashboard-content" style={{ marginTop: '2rem' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            borderRadius: '16px',
            padding: '1.5rem',
            color: 'white',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: '0 0 0.5rem 0' }}>
                  <Calendar size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Sesi Absensi: {journalForm.subject}
                </h2>
                <p style={{ margin: 0, opacity: 0.9 }}>
                  {selectedJournal.classes?.name} • {new Date(selectedJournal.date).toLocaleDateString('id-ID')}
                </p>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedJournal(null)} style={{ background: 'white', color: '#3b82f6' }}>
                Tutup
              </button>
            </div>
          </div>

          {/* Student List */}
          <div className="dashboard-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>
                <Users size={20} style={{ marginRight: '8px' }} />
                Daftar Siswa
              </h2>
              <button className="btn btn-primary" onClick={saveAttendance}>
                <Save size={16} style={{ marginRight: '8px' }} />
                Simpan Absensi
              </button>
            </div>

            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Siswa</th>
                    <th>Status</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(attendanceData).map(([studentId, status], index) => {
                    const student = classStudents.find(cs => cs.student_id === studentId)?.profiles;

                    return (
                      <tr key={studentId}>
                        <td>{index + 1}</td>
                        <td>{student?.full_name || student?.email || 'N/A'}</td>
                        <td>
                          <select
                            value={status}
                            onChange={(e) => handleAttendanceChange(studentId, e.target.value)}
                            style={{
                              padding: '0.5rem',
                              borderRadius: '6px',
                              border: '1px solid #ddd',
                              minWidth: '120px'
                            }}
                          >
                            <option value="hadir">Hadir</option>
                            <option value="absent">Alpha</option>
                            <option value="sick">Sakit</option>
                            <option value="permit">Izin</option>
                            <option value="late">Terlambat</option>
                          </select>
                        </td>
                        <td style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          - {/* Catatan bisa ditambahkan */}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => printAttendanceReport(selectedJournal)}>
              <Printer size={18} style={{ marginRight: '8px' }} />
              Cetak Absensi
            </button>
          </div>
        </div>
      )}

      {/* Journals List */}
      {!selectedJournal && (
        <div className="dashboard-content">
          <section className="dashboard-section">
            <h2>
              <Calendar size={20} style={{ marginRight: '8px' }} />
              Riwayat Jurnal Mengajar
            </h2>
            {journals.length > 0 ? (
              <div className="cards-grid">
                {journals.map(journal => (
                  <div key={journal.id} className="card">
                    <div className="card-header">
                      <span className="course-code">{journal.classes?.name || 'Kelas'}</span>
                      <span className="course-icon">
                        <Calendar size={16} />
                      </span>
                    </div>
                    <h3>{journal.subject}</h3>
                    <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                      {new Date(journal.date).toLocaleDateString('id-ID')} • {journal.duration_minutes} menit
                    </p>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      {journal.material?.substring(0, 60)}...
                    </p>
                    <div style={{ marginTop: '0.5rem' }}>
                      <span style={{ 
                        background: '#d1fae5', 
                        color: '#059669', 
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        {journal.student_attendance?.length || 0} siswa hadir
                      </span>
                    </div>
                    <div className="card-actions" style={{ marginTop: '1rem' }}>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleJournalSelect(journal)}
                      >
                        <UserCheck size={16} style={{ marginRight: '4px' }} />
                        Lihat Absensi
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => printAttendanceReport(journal)}
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon"><Calendar size={48} /></span>
                <p>Belum ada jurnal mengajar.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default StudentAttendance;