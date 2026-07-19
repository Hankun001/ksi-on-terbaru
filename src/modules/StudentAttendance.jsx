import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { UserCheck, Calendar, Users, Printer, Save, X, CheckCircle } from 'lucide-react';

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
            .header h1 { color: #3b82f6; margin-bottom: 5px; }
            .info { margin-bottom: 20px; }
            .info p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f5f3ff; }
            .status-hadir { color: #2563eb; font-weight: bold; }
            .status-absent { color: #60a5fa; font-weight: bold; }
            .status-sick { color: #93c5fd; font-weight: bold; }
            .status-permit { color: #3b82f6; font-weight: bold; }
            .status-late { color: #bfdbfe; font-weight: bold; }
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
          <p className="text-body-md text-on-surface-variant mt-xs">Catat kehadiran siswa secara offline</p>
        </div>
        <button
          onClick={() => setShowJournalForm(true)}
          className="inline-flex items-center gap-xs px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all duration-200 shadow-sm text-label-lg font-medium"
        >
          <Calendar className="w-4 h-4" />
          Buat Sesi Absensi
        </button>
      </div>

      {/* Create Journal Modal */}
      {showJournalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowJournalForm(false)}>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-title-md font-semibold text-white flex items-center gap-sm">
                <Calendar className="w-5 h-5" />
                Buat Sesi Absensi Baru
              </h2>
              <button onClick={() => setShowJournalForm(false)} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <form onSubmit={handleCreateJournal} className="p-6 space-y-5">
              <div>
                <label className="block text-label-lg font-medium text-on-surface mb-1.5">Pilih Kelas <span className="text-error">*</span></label>
                <select
                  name="class_id"
                  value={journalForm.class_id}
                  onChange={(e) => setJournalForm({ ...journalForm, class_id: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.education_level?.toUpperCase()} - Kelas {cls.grade_level})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-lg font-medium text-on-surface mb-1.5">Tanggal <span className="text-error">*</span></label>
                  <input
                    type="date"
                    name="date"
                    value={journalForm.date}
                    onChange={(e) => setJournalForm({ ...journalForm, date: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
                  />
                </div>
                <div>
                  <label className="block text-label-lg font-medium text-on-surface mb-1.5">Mata Pelajaran <span className="text-error">*</span></label>
                  <input
                    type="text"
                    name="subject"
                    value={journalForm.subject}
                    onChange={(e) => setJournalForm({ ...journalForm, subject: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
                  />
                </div>
              </div>
              <div className="flex gap-sm pt-2 border-t border-outline-variant">
                <button type="submit" className="flex-1 inline-flex items-center justify-center gap-xs px-4 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all duration-200 shadow-sm text-label-lg font-medium">
                  <Save className="w-4 h-4" />
                  Buat Sesi
                </button>
                <button type="button" onClick={() => setShowJournalForm(false)} className="px-4 py-2.5 rounded-full border border-outline text-on-surface-variant hover:bg-surface-dim transition-colors text-label-lg">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Recording Panel */}
      {selectedJournal && (
        <div className="mb-xl">
          {/* Session Banner */}
          <div className="bg-gradient-to-r from-primary to-primary-container rounded-2xl p-4 md:p-6 text-white shadow-md mb-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-title-md font-semibold flex items-center gap-sm">
                  <Calendar className="w-5 h-5" />
                  Sesi Absensi: {selectedJournal.subject}
                </h2>
                <p className="text-body-sm opacity-90 mt-1">
                  {selectedJournal.classes?.name} • {new Date(selectedJournal.date).toLocaleDateString('id-ID')}
                </p>
              </div>
              <button
                onClick={() => setSelectedJournal(null)}
                className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-label-sm font-medium"
              >
                Tutup
              </button>
            </div>
          </div>

          {/* Student List */}
          <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <h2 className="text-title-md font-semibold text-on-surface flex items-center gap-sm">
                <Users className="w-5 h-5 text-primary" />
                Daftar Siswa
              </h2>
              <button
                onClick={saveAttendance}
                className="inline-flex items-center gap-xs px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all duration-200 shadow-sm text-label-lg font-medium"
              >
                <Save className="w-4 h-4" />
                Simpan Absensi
              </button>
            </div>

            <div className="overflow-x-auto p-4 md:p-6">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-dim/50">
                    <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">No</th>
                    <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Nama Siswa</th>
                    <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Status</th>
                    <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(attendanceData).map(([studentId, status], index) => {
                    const student = classStudents.find(cs => cs.student_id === studentId)?.profiles;
                    return (
                      <tr key={studentId} className={"border-t border-outline-variant/50 hover:bg-surface-dim/30 transition-colors " + (index % 2 === 0 ? 'bg-surface' : 'bg-surface-dim/10')}>
                        <td className="px-4 py-3 text-body-sm text-on-surface-variant">{index + 1}</td>
                        <td className="px-4 py-3 text-body-sm font-medium text-on-surface">
                          {student?.full_name || student?.email || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={status}
                            onChange={(e) => handleAttendanceChange(studentId, e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-body-sm min-w-[130px]"
                          >
                            <option value="hadir">Hadir</option>
                            <option value="absent">Alpha</option>
                            <option value="sick">Sakit</option>
                            <option value="permit">Izin</option>
                            <option value="late">Terlambat</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-body-sm text-on-surface-variant">-</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-4 md:px-6 py-4 border-t border-outline-variant flex gap-sm">
              <button
                onClick={() => printAttendanceReport(selectedJournal)}
                className="inline-flex items-center gap-xs px-3 py-1.5 rounded-full border border-outline text-on-surface-variant hover:bg-surface-dim transition-colors text-label-sm"
              >
                <Printer className="w-4 h-4" />
                Cetak Absensi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Journals List */}
      {!selectedJournal && (
        <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant p-4 md:p-6">
          <h2 className="text-title-md font-semibold text-on-surface flex items-center gap-sm mb-md">
            <Calendar className="w-5 h-5 text-primary" />
            Riwayat Jurnal Mengajar
            <span className="bg-primary-container text-on-primary-container text-label-sm px-2 py-0.5 rounded-full ml-auto">
              {journals.length}
            </span>
          </h2>

          {journals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {journals.map(journal => (
                <div key={journal.id} className="bg-surface-dim/30 rounded-xl border border-outline-variant hover:border-primary/30 hover:shadow-md transition-all duration-300 p-4 group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1 text-label-sm text-primary bg-primary-container/50 px-2.5 py-1 rounded-full">
                      {journal.classes?.name || 'Kelas'}
                    </span>
                    <span className="text-label-xs text-on-surface-variant">
                      {new Date(journal.date).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <h3 className="text-title-sm font-semibold text-on-surface mb-2">{journal.subject}</h3>
                  <p className="text-body-sm text-on-surface-variant">{journal.duration_minutes} menit</p>
                  {journal.material && (
                    <p className="text-body-sm text-on-surface-variant/70 mt-1 line-clamp-2">{journal.material}</p>
                  )}
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 text-label-xs text-primary bg-primary-container/50 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      {journal.student_attendance?.length || 0} siswa
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-outline-variant opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleJournalSelect(journal)}
                      className="px-3 py-1.5 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all text-label-sm font-medium"
                    >
                      <UserCheck className="w-3.5 h-3.5 inline mr-1" />
                      Lihat Absensi
                    </button>
                    <button
                      onClick={() => printAttendanceReport(journal)}
                      className="p-1.5 rounded-full bg-surface-dim hover:bg-surface-dim/80 transition-colors text-on-surface-variant"
                      title="Cetak"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-on-surface-variant/30 mb-4" />
              <p className="text-body-lg text-on-surface-variant mb-2">Belum ada jurnal mengajar.</p>
              <p className="text-body-sm text-on-surface-variant/70">Klik tombol "Buat Sesi Absensi" untuk memulai.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentAttendance;