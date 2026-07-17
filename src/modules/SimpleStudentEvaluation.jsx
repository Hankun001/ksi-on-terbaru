import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Award, Calendar, Save, BarChart3, AlertCircle } from 'lucide-react';

const SimpleStudentEvaluation = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [score, setScore] = useState(0);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchStudents();
    fetchClasses();
    fetchEvaluations();
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

    } catch (error) {
      console.error('Error fetching students:', error.message);
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
      if (data && data.length > 0 && !selectedClass) {
        setSelectedClass(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching classes:', error.message);
    }
  };

  const fetchEvaluations = async () => {
    try {
      const { data, error } = await supabase
        .from('student_evaluations')
        .select(`
          *,
          student:student_id (id, full_name, email)
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvaluations(data || []);
      
    } catch (error) {
      console.error('Error fetching evaluations:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();

    if (!selectedClass) {
      alert('Silakan pilih kelas terlebih dahulu!');
      return;
    }

    if (!selectedStudent || !subject.trim()) {
      alert('Silakan pilih siswa dan isi mata pelajaran terlebih dahulu!');
      return;
    }

    try {
      const { error } = await supabase
        .from('student_evaluations')
        .insert([{
          teacher_id: user.id,
          class_id: selectedClass,
          student_id: selectedStudent,
          date: selectedDate,
          subject: subject,
          score: parseInt(score),
          note: note,
          aspect: 'knowledge' // Default aspect
        }]);

      if (error) throw error;

      alert('Penilaian berhasil disimpan!');
      
      // Reset form
      setSelectedStudent('');
      setSubject('');
      setScore(0);
      setNote('');
      
      // Refresh evaluations list
      fetchEvaluations();
      
    } catch (error) {
      console.error('Error saving evaluation:', error.message);
      alert('Error: ' + error.message);
    }
  };

  const getGradeColor = (score) => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getGradeLabel = (score) => {
    if (score >= 85) return 'Sangat Baik';
    if (score >= 70) return 'Baik';
    if (score >= 60) return 'Cukup';
    return 'Perlu Perbaikan';
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
            <Award className="w-7 h-7 text-primary" />
            Penilaian Siswa
          </h1>
          <p className="text-body-md text-on-surface-variant mt-xs">Beri nilai kepada siswa berdasarkan performa mereka</p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        {/* Form Section */}
        <div className="bg-warning-container/20 p-4 md:p-6 border-b border-outline-variant">
          <div className="flex items-center gap-sm mb-md">
            <Award className="w-5 h-5 text-primary" />
            <h3 className="text-title-sm font-semibold text-on-surface m-0">Form Penilaian</h3>
          </div>

          <form onSubmit={handleSubmitEvaluation}>
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
                <label className="block text-label-lg font-medium text-on-surface mb-1.5">Pilih Siswa <span className="text-error">*</span></label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.full_name || student.email}
                    </option>
                  ))}
                </select>
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

              <div>
                <label className="block text-label-lg font-medium text-on-surface mb-1.5">Nilai (0-100) <span className="text-error">*</span></label>
                <input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  min="0" max="100"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md"
                />
                {score > 0 && (
                  <div className="mt-1 px-2 py-0.5 rounded text-label-xs text-center text-white font-medium"
                    style={{ background: getGradeColor(score) }}>
                    {getGradeLabel(score)}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-label-lg font-medium text-on-surface mb-1.5">Komentar / Catatan</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Berikan komentar tentang performa siswa..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md resize-none"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={!selectedStudent || !subject.trim() || score === ''}
                className="inline-flex items-center gap-xs px-4 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all duration-200 shadow-sm text-label-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Simpan Penilaian
              </button>
            </div>
          </form>
        </div>

        {/* History Table */}
        <div className="p-4 md:p-6">
          <h2 className="text-title-md font-semibold text-on-surface flex items-center gap-sm mb-md">
            <BarChart3 className="w-5 h-5 text-primary" />
            Riwayat Penilaian
            <span className="bg-primary-container text-on-primary-container text-label-sm px-2 py-0.5 rounded-full ml-auto">
              {evaluations.length}
            </span>
          </h2>

          {evaluations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-dim/50">
                    <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Siswa</th>
                    <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Mata Pelajaran</th>
                    <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Tanggal</th>
                    <th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Nilai</th>
                    <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Komentar</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((evaluation, idx) => (
                    <tr key={evaluation.id} className={"border-t border-outline-variant/50 hover:bg-surface-dim/30 transition-colors " + (idx % 2 === 0 ? 'bg-surface' : 'bg-surface-dim/10')}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white font-bold text-label-sm shrink-0">
                            {(evaluation.student?.full_name || evaluation.student?.email || 'S').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-body-sm font-medium text-on-surface">
                            {evaluation.student?.full_name || evaluation.student?.email || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-body-sm text-on-surface">{evaluation.subject}</td>
                      <td className="px-4 py-3 text-body-sm text-on-surface-variant">
                        {new Date(evaluation.date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-full text-label-sm font-bold text-white"
                          style={{ background: getGradeColor(evaluation.score) }}>
                          {evaluation.score}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-body-sm text-on-surface-variant max-w-[200px]">
                        {evaluation.note || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="w-16 h-16 mx-auto text-on-surface-variant/30 mb-4" />
              <p className="text-body-lg text-on-surface-variant mb-2">Belum ada data penilaian.</p>
              <p className="text-body-sm text-on-surface-variant/70">Mulai dengan mengisi form penilaian di atas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleStudentEvaluation;