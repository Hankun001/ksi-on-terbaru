import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { fetchExamWithResults, closeExam, exportResultsToCSV, autoGradeEssay } from '../services/examService';
import { Eye, Download, Printer, X, Search, Clock, Users, AlertTriangle, BarChart3, Filter, Zap } from 'lucide-react';

const TeacherExamDashboardPage = ({ examId, onViewDetail, onViewStudentDetail }) => {
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
      <div className="p-margin-mobile md:p-margin-desktop flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-md text-on-surface-variant">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-body-md">Memuat data ujian...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop flex flex-col items-center justify-center min-h-[60vh] py-3xl">
        <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center mb-lg">
          <AlertTriangle size={40} className="text-error" />
        </div>
        <p className="text-body-lg text-on-surface">{error || 'Data tidak ditemukan'}</p>
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
    <div className="p-margin-mobile md:p-margin-desktop max-w-6xl mx-auto space-y-xl">
      {/* Header */}
      <div className="print:hidden flex items-start justify-between gap-md flex-wrap">
        <div>
          <h1 className="text-title-md font-semibold text-on-surface m-0">{exam.title}</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Durasi: {exam.duration_minutes} menit | Total Soal: {questions.length} | Total Poin: {totalPoints}
          </p>
        </div>
        <div className="flex items-center gap-sm flex-wrap">
          <button onClick={handlePrint} className="inline-flex items-center gap-xs px-md py-2 rounded-xl bg-surface border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-higher transition-all duration-200 text-label-sm font-medium">
            <Printer size={18} />
            Cetak
          </button>
          <button onClick={() => exportResultsToCSV(examId)} className="inline-flex items-center gap-xs px-md py-2 rounded-xl bg-surface border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-higher transition-all duration-200 text-label-sm font-medium">
            <Download size={18} />
            CSV
          </button>
          {exam.status === 'published' && (
            <button onClick={handleCloseExam} className="inline-flex items-center gap-xs px-md py-2 rounded-xl bg-error text-on-error text-label-sm font-medium hover:bg-error-hover transition-all duration-200">
              <X size={18} />
              Tutup Ujian
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-md">
        <div className="bg-surface rounded-2xl p-lg shadow-sm border border-outline-variant/30 text-center">
          <div className="text-title-lg font-bold text-secondary">{totalStudents}</div>
          <div className="text-label-xs text-on-surface-variant mt-1">Total Peserta</div>
        </div>
        <div className="bg-surface rounded-2xl p-lg shadow-sm border border-outline-variant/30 text-center">
          <div className="text-title-lg font-bold text-success">{submitted}</div>
          <div className="text-label-xs text-on-surface-variant mt-1">Sudah Submit</div>
        </div>
        <div className="bg-surface rounded-2xl p-lg shadow-sm border border-outline-variant/30 text-center">
          <div className="text-title-lg font-bold text-warning">{inProgress}</div>
          <div className="text-label-xs text-on-surface-variant mt-1">Sedang Mengerjakan</div>
        </div>
        <div className="bg-surface rounded-2xl p-lg shadow-sm border border-outline-variant/30 text-center">
          <div className="text-title-lg font-bold text-primary">{avgScore}</div>
          <div className="text-label-xs text-on-surface-variant mt-1">Rata-rata Nilai</div>
        </div>
        <div className="bg-surface rounded-2xl p-lg shadow-sm border border-outline-variant/30 text-center">
          <div className="text-title-lg font-bold text-success">{highestScore}</div>
          <div className="text-label-xs text-on-surface-variant mt-1">Nilai Tertinggi</div>
        </div>
        <div className="bg-surface rounded-2xl p-lg shadow-sm border border-outline-variant/30 text-center">
          <div className="text-title-lg font-bold text-error">{lowestScore}</div>
          <div className="text-label-xs text-on-surface-variant mt-1">Nilai Terendah</div>
        </div>
      </div>

      {/* Auto-Grading Section */}
      {questions.some(q => q.type === 'essay' && q.enable_auto_grading) && (
        <div className="print:hidden bg-gradient-to-br from-secondary-container/30 to-tertiary-container/20 rounded-2xl p-lg border border-secondary/20 space-y-md">
          <div className="flex items-center gap-md">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center text-xl">
              🤖
            </div>
            <div>
              <h3 className="text-title-sm font-semibold text-on-surface m-0">Penilaian Otomatis Essay</h3>
              <p className="text-label-sm text-on-surface-variant mt-1 m-0">
                Beberapa soal essay menggunakan penilaian otomatis berdasarkan kata kunci
              </p>
            </div>
          </div>

          <div className="flex items-center gap-md flex-wrap">
            <button
              onClick={async () => {
                if (confirm('Jalankan penilaian otomatis untuk semua jawaban essay?')) {
                  try {
                    const autoGradeQuestions = questions.filter(q => q.type === 'essay' && q.enable_auto_grading);
                    for (const question of autoGradeQuestions) {
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
                    loadData();
                  } catch (err) {
                    alert('Gagal menjalankan penilaian otomatis: ' + err.message);
                  }
                }
              }}
              className="inline-flex items-center gap-xs px-lg py-2.5 rounded-xl bg-secondary text-on-secondary text-label-sm font-medium hover:bg-secondary-hover transition-all duration-200"
            >
              <Zap size={18} />
              Jalankan Auto-Grade
            </button>

            <div className="bg-surface rounded-lg px-md py-2 border border-secondary/20 text-label-sm text-on-secondary-container">
              <strong>{questions.filter(q => q.type === 'essay' && q.enable_auto_grading).length}</strong> soal essay dengan auto-grading
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="print:hidden flex items-center gap-md flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Cari nama siswa..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline bg-surface text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-md py-2.5 rounded-xl border border-outline bg-surface text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
        >
          <option value="all">Semua Status</option>
          <option value="in_progress">Sedang Mengerjakan</option>
          <option value="submitted">Sudah Submit</option>
          <option value="auto_submitted">Auto Submit</option>
          <option value="graded">Sudah Dinilai</option>
        </select>
      </div>

      {/* Status Badge */}
      <div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-label-xs font-medium ${
          exam.status === 'draft' ? 'bg-surface-container-high text-on-surface-variant' :
          exam.status === 'published' ? 'bg-tertiary-container text-on-tertiary-container' :
          exam.status === 'closed' ? 'bg-error-container text-on-error-container' :
          'bg-surface-container-high text-on-surface-variant'
        }`}>
          {exam.status === 'draft' ? 'Draft' : exam.status === 'published' ? 'Dipublikasikan' : exam.status === 'closed' ? 'Ditutup' : 'Diarsipkan'}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-outline-variant/20 bg-surface shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant/20">
              <th className="px-lg py-md text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider">Nama Siswa</th>
              <th className="px-lg py-md text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
              <th className="px-lg py-md text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider">Nilai</th>
              <th className="px-lg py-md text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider">Waktu Mulai</th>
              <th className="px-lg py-md text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider">Waktu Submit</th>
              <th className="px-lg py-md text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider">Durasi</th>
              <th className="print:hidden px-lg py-md text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {filteredAttempts.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center px-lg py-2xl text-body-sm text-on-surface-variant">
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
                  <tr key={attempt.id} className="hover:bg-surface-container-low/50 transition-colors duration-150">
                    <td className="px-lg py-md text-body-sm font-semibold text-on-surface">
                      {attempt.profiles?.display_name || attempt.profiles?.full_name || attempt.profiles?.email || 'Unknown'}
                    </td>
                    <td className="px-lg py-md">
                      <span className="inline-flex items-center px-md py-0.5 rounded-full text-label-xs font-medium"
                        style={{ background: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-lg py-md text-body-sm font-semibold text-on-surface">
                      {attempt.score !== null ? attempt.score : '-'}
                    </td>
                    <td className="px-lg py-md text-label-sm text-on-surface-variant">
                      {new Date(attempt.started_at).toLocaleString('id-ID')}
                    </td>
                    <td className="px-lg py-md text-label-sm text-on-surface-variant">
                      {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="px-lg py-md text-label-sm text-on-surface-variant">
                      {duration !== '-' ? `${duration} mnt` : '-'}
                    </td>
                    <td className="print:hidden px-lg py-md">
                      <button
                        onClick={() => onViewStudentDetail && onViewStudentDetail(examId, attempt.id)}
                        className="inline-flex items-center gap-xs px-md py-1.5 rounded-lg bg-surface border border-outline-variant/30 text-label-sm text-on-surface-variant hover:bg-surface-container-higher transition-all duration-200"
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
      <div className="hidden print:block">
        <div className="text-center mb-lg pb-lg border-b border-outline-variant/20">
          <h1 className="text-title-lg font-bold text-on-surface">{exam.title}</h1>
          <p className="text-body-sm text-on-surface-variant">Laporan Hasil Ujian</p>
          <p className="text-label-sm text-on-surface-variant">Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant/20">
              <th className="px-md py-sm text-label-xs font-semibold text-on-surface-variant">No</th>
              <th className="px-md py-sm text-label-xs font-semibold text-on-surface-variant">Nama Siswa</th>
              <th className="px-md py-sm text-label-xs font-semibold text-on-surface-variant">Status</th>
              <th className="px-md py-sm text-label-xs font-semibold text-on-surface-variant">Nilai</th>
              <th className="px-md py-sm text-label-xs font-semibold text-on-surface-variant">Durasi</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a, idx) => (
              <tr key={a.id} className="border-b border-outline-variant/10">
                <td className="px-md py-sm text-body-sm text-on-surface">{idx + 1}</td>
                <td className="px-md py-sm text-body-sm text-on-surface">{a.profiles?.display_name || a.profiles?.full_name || a.profiles?.email || 'Unknown'}</td>
                <td className="px-md py-sm text-body-sm text-on-surface">{getStatusLabel(a.status).label}</td>
                <td className="px-md py-sm text-body-sm text-on-surface">{a.score !== null ? a.score : '-'}</td>
                <td className="px-md py-sm text-body-sm text-on-surface">{a.submitted_at ? Math.round((new Date(a.submitted_at) - new Date(a.started_at)) / 60000) + ' mnt' : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-center pt-md text-label-sm text-on-surface-variant border-t border-outline-variant/20">
          Total Peserta: {totalStudents} | Rata-rata: {avgScore} | Tertinggi: {highestScore} | Terendah: {lowestScore}
        </div>
      </div>
    </div>
  );
};

export default TeacherExamDashboardPage;