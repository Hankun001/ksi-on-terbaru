import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { fetchTeacherExams, fetchAllExams, fetchPublishedExams, deleteExam, unpublishExam, reopenExam, closeExam } from '../services/examService';
import ExamBuilderPage from './ExamBuilderPage';
import ExamPlayerPage from './ExamPlayerPage';
import TeacherExamDashboardPage from './TeacherExamDashboardPage';
import StudentResultDetailPage from './StudentResultDetailPage';
import { Plus, Edit, Eye, Trash2, FileText, Clock, Users, BookOpen, Send, BarChart3, Search, Settings, X } from 'lucide-react';
import '../styles/examStyles.css';

const ExamModule = ({ role, onNavigate }) => {
  const { user } = useAuth();
  const [view, setView] = useState('list'); // list, create, edit, play, dashboard, result
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [managingExam, setManagingExam] = useState(null);
  const [showManageDialog, setShowManageDialog] = useState(false);

  useEffect(() => {
    loadExams();
  }, [role, user]);

  const loadExams = async () => {
    try {
      setLoading(true);
      let data;
      if (role === 'guru') {
        data = await fetchTeacherExams(user.id);
      } else if (role === 'admin') {
        data = await fetchAllExams();
      } else {
        data = await fetchPublishedExams();
      }
      setExams(data || []);
    } catch (err) {
      console.error('Error loading exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedExamId(null);
    setView('create');
  };

  const handleEdit = (examId) => {
    setSelectedExamId(examId);
    setView('edit');
  };

  const handleViewDashboard = (examId) => {
    setSelectedExamId(examId);
    setView('dashboard');
  };

  const handlePlay = (examId) => {
    setSelectedExamId(examId);
    setView('play');
  };

  const handleViewResult = (examId, attemptId) => {
    setSelectedExamId(examId);
    setSelectedAttemptId(attemptId);
    setView('result');
  };

  const handleDelete = async (examId) => {
    if (!window.confirm('Hapus ujian ini beserta semua data terkait?')) return;
    try {
      await deleteExam(examId);
      loadExams();
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const handleManageExam = (examId, status) => {
    const exam = exams.find(e => e.id === examId);
    if (exam) {
      setManagingExam({ ...exam, status });
      setShowManageDialog(true);
    } else {
      console.warn('Exam not found:', examId);
    }
  };

  const handleUnpublishExam = async (examId) => {
    if (!window.confirm('Unpublish ujian? Ujian akan kembali ke status draft dan siswa tidak dapat mengaksesnya.')) return;
    try {
      await unpublishExam(examId);
      setShowManageDialog(false);
      loadExams();
      alert('Ujian berhasil di-unpublish!');
    } catch (err) {
      alert('Gagal unpublish: ' + err.message);
    }
  };

  const handleReopenExam = async (examId) => {
    if (!window.confirm('Buka kembali ujian? Siswa dapat melanjutkan mengerjakan ujian.')) return;
    try {
      await reopenExam(examId);
      setShowManageDialog(false);
      loadExams();
      alert('Ujian berhasil dibuka kembali!');
    } catch (err) {
      alert('Gagal membuka ujian: ' + err.message);
    }
  };

  const handleCloseExamDialog = async (examId) => {
    if (!window.confirm('Tutup ujian? Semua siswa yang sedang mengerjakan akan otomatis submit.')) return;
    try {
      await closeExam(examId);
      setShowManageDialog(false);
      loadExams();
      alert('Ujian berhasil ditutup!');
    } catch (err) {
      alert('Gagal menutup ujian: ' + err.message);
    }
  };

  const handleBack = () => {
    setView('list');
    setSelectedExamId(null);
    setSelectedAttemptId(null);
    loadExams();
  };

  // Filter exams
  const filteredExams = exams.filter(e =>
    e.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft': return <span className="status-badge status-draft">Draft</span>;
      case 'published': return <span className="status-badge status-published">Dipublikasikan</span>;
      case 'closed': return <span className="status-badge status-closed">Ditutup</span>;
      case 'archived': return <span className="status-badge status-archived">Diarsipkan</span>;
      default: return null;
    }
  };

  // --- RENDER VIEWS ---

  return (
    <>
      {/* Exam List (default) */}
      {view === 'list' && (
        <div className="dashboard-container">
          <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText size={28} style={{ color: '#8b5cf6' }} />
                {role === 'guru' ? 'Ujian Saya' : role === 'admin' ? 'Semua Ujian' : 'Ujian Tersedia'}
              </h1>
              <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.85rem' }}>
                {role === 'guru' ? 'Buat dan kelola ujian untuk murid Anda' :
                 role === 'admin' ? 'Pantau seluruh ujian di sistem' :
                 'Kerjakan ujian yang tersedia'}
              </p>
            </div>
            {(role === 'guru' || role === 'admin') && (
              <button onClick={handleCreate} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={18} />
                Buat Ujian
              </button>
            )}
          </div>

          {/* Search */}
          {exams.length > 0 && (
            <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: '400px', width: '100%' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Cari ujian..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  minHeight: '44px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Memuat...</div>
          ) : filteredExams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <FileText size={48} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                {searchQuery ? 'Tidak ada ujian yang cocok' :
                 role === 'guru' ? 'Belum ada ujian. Buat ujian pertama Anda!' :
                 role === 'admin' ? 'Belum ada ujian di sistem.' :
                 'Belum ada ujian yang tersedia.'}
              </p>
            </div>
          ) : (
            <div className="exam-grid">
              {filteredExams.map(exam => (
                <div key={exam.id} className="exam-card slide-up">
                  <div className="exam-card-header">
                    <h3 className="exam-card-title">{exam.title}</h3>
                    {getStatusBadge(exam.status)}
                  </div>
                  {exam.description && (
                    <p className="exam-card-desc">{exam.description}</p>
                  )}
                  <div className="exam-card-meta">
                    <span className="exam-card-meta-item">
                      <Clock size={14} />
                      {exam.duration_minutes} menit
                    </span>
                    {exam.profiles && (
                      <span className="exam-card-meta-item">
                        <Users size={14} />
                        {exam.profiles.display_name || exam.profiles.email}
                      </span>
                    )}
                  </div>
                  <div className="exam-card-actions">
                    {role === 'murid' && exam.status === 'published' && (
                      <button onClick={() => handlePlay(exam.id)} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Send size={16} />
                        Kerjakan
                      </button>
                    )}
                    {(role === 'guru' || role === 'admin') && (
                      <>
                        {(exam.status === 'draft') && (
                          <button onClick={() => handleEdit(exam.id)} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Edit size={16} />
                            Edit
                          </button>
                        )}
                        {(exam.status === 'published' || exam.status === 'closed') && (
                          <>
                            <button onClick={() => handleViewDashboard(exam.id)} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <BarChart3 size={16} />
                              Hasil
                            </button>
                            <button onClick={() => handleManageExam(exam.id, exam.status)} className="btn btn-info btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Settings size={16} />
                              Kelola
                            </button>
                          </>
                        )}
                        {exam.status === 'draft' && (
                          <button onClick={() => handleDelete(exam.id)} className="btn btn-danger btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </>
                    )}
                    {role === 'murid' && exam.status === 'closed' && (
                      <button onClick={() => handleViewDashboard(exam.id)} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Eye size={16} />
                        Lihat Hasil
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Other Views */}
      {view === 'create' && (
        <ExamBuilderPage
          examId={null}
          onBack={handleBack}
        />
      )}

      {view === 'edit' && (
        <ExamBuilderPage
          examId={selectedExamId}
          onBack={handleBack}
        />
      )}

      {view === 'play' && (
        <ExamPlayerPage
          examId={selectedExamId}
          onFinish={handleBack}
        />
      )}

      {view === 'dashboard' && (role === 'guru' || role === 'admin') && (
        <TeacherExamDashboardPage
          examId={selectedExamId}
          onViewDetail={(examId, attemptId) => {
            setSelectedExamId(examId);
            setSelectedAttemptId(attemptId);
            setView('result');
          }}
          onViewStudentDetail={(examId, attemptId) => {
            setSelectedAttemptId(attemptId);
            setView('result');
          }}
          onBack={handleBack}
        />
      )}

      {view === 'result' && (
        <StudentResultDetailPage
          examId={selectedExamId}
          attemptId={selectedAttemptId}
          onBack={handleBack}
        />
      )}

      {/* Manage Exam Dialog */}
      {showManageDialog && managingExam && (
        <div className="modal-overlay" onClick={() => setShowManageDialog(false)} role="dialog" aria-modal="true">
          <div className="modal-content exam-manage-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header-mobile">
              <h3>Kelola Ujian</h3>
              <button
                onClick={() => setShowManageDialog(false)}
                className="modal-close-btn"
                aria-label="Tutup"
              >
                ×
              </button>
            </div>

            <div className="modal-body-mobile">
              <div className="exam-info-mobile">
                <h4>{managingExam?.title || 'Ujian'}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className={`status-badge-mobile ${managingExam?.status || ''}`}>
                    {managingExam?.status === 'published' ? 'Dipublikasikan' : 'Ditutup'}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: '0.5rem 0' }}>
                  {managingExam?.description || 'Tidak ada deskripsi'}
                </p>
              </div>

              <div className="exam-actions-mobile">
                {managingExam?.status === 'published' && (
                  <>
                    <button
                      onClick={() => managingExam?.id && handleCloseExamDialog(managingExam.id)}
                      className="btn-mobile btn-warning-mobile"
                    >
                      <X size={20} />
                      <span>Tutup Ujian</span>
                    </button>
                    <button
                      onClick={() => managingExam?.id && handleUnpublishExam(managingExam.id)}
                      className="btn-mobile btn-secondary-mobile"
                    >
                      <Eye size={20} />
                      <span>Unpublish</span>
                    </button>
                  </>
                )}

                {managingExam?.status === 'closed' && (
                  <button
                    onClick={() => managingExam?.id && handleReopenExam(managingExam.id)}
                    className="btn-mobile btn-success-mobile"
                  >
                    <Send size={20} />
                    <span>Buka Kembali</span>
                  </button>
                )}

                <button
                  onClick={() => managingExam?.id && handleEdit(managingExam.id)}
                  className="btn-mobile btn-primary-mobile"
                >
                  <Edit size={20} />
                  <span>Edit Detail</span>
                </button>
              </div>
            </div>

            <div className="modal-footer-mobile">
              <button
                onClick={() => setShowManageDialog(false)}
                className="btn-mobile btn-ghost-mobile"
              >
                <span>Batal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExamModule;