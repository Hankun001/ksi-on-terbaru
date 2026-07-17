import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { fetchTeacherExams } from '../services/examService';
import { BarChart3, Eye, Search, ChevronRight, FileSignature, Clock, Users } from 'lucide-react';

const ExamResultsOverviewPage = ({ onViewExamResults }) => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [examStats, setExamStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadExams();
  }, [user]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const teacherExams = await fetchTeacherExams(user.id);
      // Only show published/closed exams that have attempts
      const activeExams = teacherExams.filter(e => e.status === 'published' || e.status === 'closed');
      
      // Load stats for each exam
      const statsMap = {};
      for (const exam of activeExams) {
        const { data: attempts } = await supabase
          .from('exam_attempts')
          .select('status, score')
          .eq('exam_id', exam.id);
        
        const total = attempts?.length || 0;
        const submitted = attempts?.filter(a => a.status !== 'in_progress').length || 0;
        const inProgress = attempts?.filter(a => a.status === 'in_progress').length || 0;
        const scores = attempts?.filter(a => a.score !== null).map(a => a.score) || [];
        const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
        const highestScore = scores.length > 0 ? Math.max(...scores) : '-';
        const lowestScore = scores.length > 0 ? Math.min(...scores) : '-';

        statsMap[exam.id] = { total, submitted, inProgress, avgScore, highestScore, lowestScore };
      }
      
      setExamStats(statsMap);
      setExams(activeExams);
    } catch (err) {
      console.error('Error loading exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = exams.filter(e =>
    e.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-md text-on-surface-variant">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-body-md">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-5xl mx-auto space-y-xl">
      {/* Header */}
      <div className="flex items-center gap-lg">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary/20 to-tertiary/20 flex items-center justify-center">
          <BarChart3 size={28} className="text-secondary" />
        </div>
        <div>
          <h1 className="text-title-md font-semibold text-on-surface m-0">Rekap Hasil Ujian</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Pantau, kelola, dan cetak seluruh hasil ujian siswa</p>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-3xl text-on-surface-variant">
          <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-lg">
            <FileSignature size={40} className="text-outline" />
          </div>
          <p className="text-body-lg font-medium text-on-surface">Belum Ada Ujian</p>
          <p className="text-body-sm text-on-surface-variant mt-1">Belum ada ujian yang sudah dipublikasikan.</p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="relative max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Cari ujian..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline bg-surface text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
            {filteredExams.map((exam, idx) => {
              const stats = examStats[exam.id] || {};
              return (
                <div
                  key={exam.id}
                  className="bg-surface rounded-2xl p-lg shadow-sm border border-outline-variant/30 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                  onClick={() => onViewExamResults && onViewExamResults(exam.id)}
                >
                  <div className="flex items-start justify-between gap-md mb-md">
                    <h3 className="text-body-lg font-semibold text-on-surface flex-1 line-clamp-2 m-0">{exam.title}</h3>
                    <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-label-xs font-medium ${
                      exam.status === 'published' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-error-container text-on-error-container'
                    }`}>
                      {exam.status === 'published' ? 'Dipublikasikan' : 'Ditutup'}
                    </span>
                  </div>
                  {exam.description && (
                    <p className="text-label-sm text-on-surface-variant line-clamp-2 mb-md">{exam.description}</p>
                  )}
                  <div className="grid grid-cols-3 gap-sm p-md bg-surface-container-low rounded-xl mb-md">
                    <div className="text-center">
                      <div className="text-title-sm font-bold text-secondary">{stats.total || 0}</div>
                      <div className="text-label-xs text-on-surface-variant">Peserta</div>
                    </div>
                    <div className="text-center">
                      <div className="text-title-sm font-bold text-success">{stats.submitted || 0}</div>
                      <div className="text-label-xs text-on-surface-variant">Selesai</div>
                    </div>
                    <div className="text-center">
                      <div className="text-title-sm font-bold text-primary">{stats.avgScore}</div>
                      <div className="text-label-xs text-on-surface-variant">Rata-rata</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-md text-label-sm text-on-surface-variant mb-md flex-wrap">
                    <span className="inline-flex items-center gap-xs">
                      <Clock size={14} />
                      {exam.duration_minutes} menit
                    </span>
                    {stats.inProgress > 0 && (
                      <span className="inline-flex items-center gap-xs text-warning">
                        <Users size={14} />
                        {stats.inProgress} sedang mengerjakan
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onViewExamResults && onViewExamResults(exam.id); }}
                    className="w-full inline-flex items-center justify-center gap-xs px-md py-2.5 rounded-xl bg-primary text-on-primary text-label-sm font-medium hover:bg-primary-hover transition-all duration-200"
                  >
                    <Eye size={16} />
                    Lihat Hasil Lengkap
                    <ChevronRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ExamResultsOverviewPage;