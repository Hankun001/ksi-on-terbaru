import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { fetchTeacherExams, fetchExamWithResults } from '../services/examService';
import { BarChart3, Eye, Printer, Download, Search, ChevronRight, FileSignature, Clock, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import '../styles/examStyles.css';

const ExamResultsOverviewPage = ({ onViewExamResults, onBack }) => {
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
      <div className="dashboard-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#6b7280' }}>Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BarChart3 size={28} style={{ color: '#8b5cf6' }} />
            Rekap Hasil Ujian
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.85rem' }}>
            Pantau, kelola, dan cetak seluruh hasil ujian siswa
          </p>
        </div>
      </div>

      {exams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <FileSignature size={48} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
          <p style={{ color: '#6b7280' }}>Belum ada ujian yang sudah dipublikasikan.</p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Cari ujian..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.5rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.9rem' }}
            />
          </div>

          <div className="exam-grid">
            {filteredExams.map((exam, idx) => {
              const stats = examStats[exam.id] || {};
              return (
                <div 
                  key={exam.id} 
                  className="exam-card slide-up" 
                  style={{ animationDelay: `${idx * 0.05}s`, cursor: 'pointer' }}
                  onClick={() => onViewExamResults && onViewExamResults(exam.id)}
                >
                  <div className="exam-card-header">
                    <h3 className="exam-card-title">{exam.title}</h3>
                    <span className={`status-badge status-${exam.status}`}>
                      {exam.status === 'published' ? 'Dipublikasikan' : 'Ditutup'}
                    </span>
                  </div>
                  {exam.description && (
                    <p className="exam-card-desc">{exam.description}</p>
                  )}
                  
                  {/* Ringkasan Statistik */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#8b5cf6' }}>{stats.total || 0}</div>
                      <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Peserta</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>{stats.submitted || 0}</div>
                      <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Selesai</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>{stats.avgScore}</div>
                      <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Rata-rata</div>
                    </div>
                  </div>

                  <div className="exam-card-meta">
                    <span className="exam-card-meta-item">
                      <Clock size={14} />
                      {exam.duration_minutes} menit
                    </span>
                    {stats.inProgress > 0 && (
                      <span className="exam-card-meta-item" style={{ color: '#f59e0b' }}>
                        <Users size={14} />
                        {stats.inProgress} sedang mengerjakan
                      </span>
                    )}
                  </div>

                  <div className="exam-card-actions">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onViewExamResults && onViewExamResults(exam.id); }} 
                      className="btn btn-primary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', width: '100%', justifyContent: 'center' }}
                    >
                      <Eye size={16} />
                      Lihat Hasil Lengkap
                      <ChevronRight size={16} />
                    </button>
                  </div>
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