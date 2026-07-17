import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { fetchExamWithResults, closeExam, exportResultsToCSV, autoGradeEssay } from '../services/examService';
import { Eye, Download, Printer, X, Search, Clock, Users, CheckCircle, AlertTriangle, BarChart3, ChevronRight, Filter } from 'lucide-react';
import '../styles/examStyles.css';

const TeacherExamDashboardPage = ({ examId, onViewDetail, onViewStudentDetail, onBack }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [examId]);

  // Real-time updates
  useEffect(() => {
    if (!examId) return;
    const channel = supabase
      .channel(`teacher-exam-${examId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'exam_attempts', filter: `exam_id=eq.${examId}` },
        () => loadData()
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [examId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await fetchExamWithResults(examId);
      setData(result);
    } catch (err) {
      setError('Gagal memuat data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseExam = async () => {
    if (!window.confirm('Tutup ujian? Semua siswa yang sedang mengerjakan akan otomatis terkumpul.')) return;
    try {
      await closeExam(examId);
      loadData();
    } catch (err) {
      alert('Gagal menutup ujian: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#6b7280' }}>Memuat data ujian...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <AlertTriangle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
        <p style={{ color: '#6b7280' }}>{error || 'Data tidak ditemukan'}</p>
      </div>
    );
  }

  const { exam, questions, attempts } = data;
  const totalStudents = attempts.length;
  const submitted = attempts.filter(a => a.status === 'submitted' || a.status === 'auto_submitted' || a.status === 'graded').length;
  const inProgress = attempts.filter(a => a.status === 'in_progress').length;
  const scores = attempts.filter(a => a.score !== null).map(a => a.score);
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  const filteredAttempts = attempts.filter(a => {
    const name = (a.profiles?.display_name || a.profiles?.full_name || a.profiles?.email || '').toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status) => {
    switch (status) {
      case 'in_progress': return { label: 'Sedang Mengerjakan', color: '#f59e0b', bg: '#fef3c7' };
      case 'submitted': return { label: 'Sudah Submit', color: '#059669', bg: '#d1fae5' };
      case 'auto_submitted': return { label: 'Auto Submit', color: '#d97706', bg: '#fef3c7' };
      case 'graded': return { label: 'Sudah Dinilai', color: '#059669', bg: '#d1fae5' };
      default: return { label: status, color: '#6b7280', bg: '#f3f4f6' };
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem' }}>{exam.title}</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.85rem' }}>
            Durasi: {exam.duration_minutes} menit | Total Soal: {questions.length} | Total Poin: {totalPoints}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={handlePrint} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Printer size={18} />
            Cetak
          </button>
          <button onClick={() => exportResultsToCSV(examId)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={18} />
            CSV
          </button>
          {exam.status === 'published' && (
            <button onClick={handleCloseExam} className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <X size={18} />
              Tutup Ujian
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="exam-dashboard-stats slide-up">
        <div className="exam-stat-card">
          <div className="exam-stat-value" style={{ color: '#8b5cf6' }}>{totalStudents}</div>
          <div className="exam-stat-label">Total Peserta</div>
        </div>
        <div className="exam-stat-card">
          <div className="exam-stat-value" style={{ color: '#059669' }}>{submitted}</div>
          <div className="exam-stat-label">Sudah Submit</div>
        </div>
        <div className="exam-stat-card">
          <div className="exam-stat-value" style={{ color: '#f59e0b' }}>{inProgress}</div>
          <div className="exam-stat-label">Sedang Mengerjakan</div>
        </div>
        <div className="exam-stat-card">
          <div className="exam-stat-value" style={{ color: '#3b82f6' }}>{avgScore}</div>
          <div className="exam-stat-label">Rata-rata Nilai</div>
        </div>
        <div className="exam-stat-card">
          <div className="exam-stat-value" style={{ color: '#059669' }}>{highestScore}</div>
          <div className="exam-stat-label">Nilai Tertinggi</div>
        </div>
        <div className="exam-stat-card">
          <div className="exam-stat-value" style={{ color: '#ef4444' }}>{lowestScore}</div>
          <div className="exam-stat-label">Nilai Terendah</div>
        </div>
      </div>

      {/* Auto-Grading Section */}
      {questions.some(q => q.type === 'essay' && q.enable_auto_grading) && (
        <div className="no-print" style={{ marginBottom: '1.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
            border: '1px solid #d8b4fe',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🤖</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#7c3aed' }}>Penilaian Otomatis Essay</h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#6b21a8' }}>
                  Beberapa soal essay menggunakan penilaian otomatis berdasarkan kata kunci
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={async () => {
                  if (confirm('Jalankan penilaian otomatis untuk semua jawaban essay?')) {
                    try {
                      // Get all essay questions with auto-grading enabled
                      const autoGradeQuestions = questions.filter(q => q.type === 'essay' && q.enable_auto_grading);

                      for (const question of autoGradeQuestions) {
                        // Get all attempts for this question
                        const attemptsForQuestion = attempts.filter(a =>
                          a.answers?.some(ans => ans.question_id === question.id)
                        );

                        for (const attempt of attemptsForQuestion) {
                          const answer = attempt.answers?.find(ans => ans.question_id === question.id);
                          if (answer && !answer.points_earned) {
                            try {
                              await autoGradeEssay(attempt.id, question.id);
                            } catch (err) {
                              console.error(`Failed to auto-grade attempt ${attempt.id}:`, err);
                            }
                          }
                        }
                      }

                      alert('Penilaian otomatis selesai!');
                      loadData(); // Refresh data
                    } catch (err) {
                      alert('Gagal menjalankan penilaian otomatis: ' + err.message);
                    }
                  }
                }}
                style={{
                  background: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>⚡</span>
                Jalankan Auto-Grade
              </button>

              <div style={{
                background: 'white',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #d8b4fe',
                fontSize: '0.85rem',
                color: '#6b21a8'
              }}>
                <strong>{questions.filter(q => q.type === 'essay' && q.enable_auto_grading).length}</strong> soal essay dengan auto-grading
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="no-print" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Cari nama siswa..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.5rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.9rem' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '0.65rem 1rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.9rem', background: 'white' }}
        >
          <option value="all">Semua Status</option>
          <option value="in_progress">Sedang Mengerjakan</option>
          <option value="submitted">Sudah Submit</option>
          <option value="auto_submitted">Auto Submit</option>
          <option value="graded">Sudah Dinilai</option>
        </select>
      </div>

      {/* Status Badge */}
      <div style={{ marginBottom: '1rem' }}>
        <span className={`status-badge status-${exam.status}`}>
          {exam.status === 'draft' ? 'Draft' : exam.status === 'published' ? 'Dipublikasikan' : exam.status === 'closed' ? 'Ditutup' : 'Diarsipkan'}
        </span>
      </div>

      {/* Table */}
      <div className="attempt-table-wrapper">
        <table className="attempt-table">
          <thead>
            <tr>
              <th>Nama Siswa</th>
              <th>Status</th>
              <th>Nilai</th>
              <th>Waktu Mulai</th>
              <th>Waktu Submit</th>
              <th>Durasi</th>
              <th className="no-print">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttempts.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  {searchQuery || statusFilter !== 'all' ? 'Tidak ada hasil filter' : 'Belum ada peserta'}
                </td>
              </tr>
            ) : (
              filteredAttempts.map(attempt => {
                const status = getStatusLabel(attempt.status);
                const duration = attempt.submitted_at
                  ? Math.round((new Date(attempt.submitted_at) - new Date(attempt.started_at)) / 60000)
                  : '-';
                return (
                  <tr key={attempt.id}>
                    <td>
                      <strong>{attempt.profiles?.display_name || attempt.profiles?.full_name || attempt.profiles?.email || 'Unknown'}</strong>
                    </td>
                    <td>
                      <span style={{ background: status.bg, color: status.color, padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500 }}>
                        {status.label}
                      </span>
                    </td>
                    <td>
                      <strong>{attempt.score !== null ? attempt.score : '-'}</strong>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      {new Date(attempt.started_at).toLocaleString('id-ID')}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString('id-ID') : '-'}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      {duration !== '-' ? `${duration} mnt` : '-'}
                    </td>
                    <td className="no-print">
                      <button
                        onClick={() => onViewStudentDetail && onViewStudentDetail(examId, attempt.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Eye size={16} />
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Printable report hidden */}
      <div className="printable-report" style={{ display: 'none' }}>
        <div className="print-header">
          <h1>{exam.title}</h1>
          <p>Laporan Hasil Ujian</p>
          <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
        </div>
        <table className="print-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Siswa</th>
              <th>Status</th>
              <th>Nilai</th>
              <th>Durasi</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a, idx) => (
              <tr key={a.id}>
                <td>{idx + 1}</td>
                <td>{a.profiles?.display_name || a.profiles?.full_name || a.profiles?.email || 'Unknown'}</td>
                <td>{getStatusLabel(a.status).label}</td>
                <td>{a.score !== null ? a.score : '-'}</td>
                <td>{a.submitted_at ? Math.round((new Date(a.submitted_at) - new Date(a.started_at)) / 60000) + ' mnt' : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="print-footer">
          <p>Total Peserta: {totalStudents} | Rata-rata: {avgScore} | Tertinggi: {highestScore} | Terendah: {lowestScore}</p>
        </div>
      </div>
    </div>
  );
};

export default TeacherExamDashboardPage;