import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Award, Users, Calendar, Save, BarChart3 } from 'lucide-react';

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
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <div>Memuat data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>
            <Award size={28} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
            Penilaian Siswa Sederhana
          </h1>
          <p>Beri nilai kepada siswa berdasarkan performa mereka</p>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Evaluation Form */}
        <div style={{ 
          background: 'linear-gradient(135deg, #fef7ff 0%, #fae8ff 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#a855f7' }}>
            <Award size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Form Penilaian
          </h3>

          <form onSubmit={handleSubmitEvaluation}>
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
                <label htmlFor="student">Pilih Siswa *</label>
                <select
                  id="student"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.full_name || student.email}
                    </option>
                  ))}
                </select>
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

              <div className="form-group">
                <label htmlFor="score">Nilai (0-100) *</label>
                <input
                  type="number"
                  id="score"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  min="0"
                  max="100"
                  style={{ width: '100%' }}
                  required
                />
                {score > 0 && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    padding: '0.25rem', 
                    borderRadius: '4px', 
                    background: getGradeColor(score),
                    color: 'white',
                    fontSize: '0.8rem',
                    textAlign: 'center'
                  }}>
                    {getGradeLabel(score)}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="note">Komentar / Catatan</label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Berikan komentar tentang performa siswa..."
                rows="3"
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!selectedStudent || !subject.trim() || score === ''}
              style={{ marginTop: '1rem' }}
            >
              <Save size={18} style={{ marginRight: '8px' }} />
              Simpan Penilaian
            </button>
          </form>
        </div>

        {/* Evaluations List */}
        <section className="dashboard-section">
          <h2>
            <BarChart3 size={20} style={{ marginRight: '8px' }} />
            Riwayat Penilaian ({evaluations.length} data)
          </h2>

          {evaluations.length > 0 ? (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Siswa</th>
                    <th>Mata Pelajaran</th>
                    <th>Tanggal</th>
                    <th>Nilai</th>
                    <th>Komentar</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map(evaluation => (
                    <tr key={evaluation.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            background: 'linear-gradient(135deg, #a855f7, #7c3aed)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: 'white', 
                            fontWeight: 'bold', 
                            fontSize: '0.75rem' 
                          }}>
                            {(evaluation.student?.full_name || evaluation.student?.email || 'S').charAt(0).toUpperCase()}
                          </div>
                          <strong>{evaluation.student?.full_name || evaluation.student?.email || 'N/A'}</strong>
                        </div>
                      </td>
                      <td>{evaluation.subject}</td>
                      <td>{new Date(evaluation.date).toLocaleDateString('id-ID')}</td>
                      <td>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          background: getGradeColor(evaluation.score),
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.9rem'
                        }}>
                          {evaluation.score}
                        </span>
                      </td>
                      <td style={{ maxWidth: '200px', fontSize: '0.85rem', color: '#6b7280' }}>
                        {evaluation.note || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon"><Award size={48} /></span>
              <p>Belum ada data penilaian.</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Mulai dengan mengisi form penilaian di atas.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SimpleStudentEvaluation;