import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { fetchTeacherExams, fetchAllExams, fetchPublishedExams, deleteExam, unpublishExam, reopenExam, closeExam } from '../services/examService';
import ExamBuilderPage from './ExamBuilderPage';
import ExamPlayerPage from './ExamPlayerPage';
import TeacherExamDashboardPage from './TeacherExamDashboardPage';
import StudentResultDetailPage from './StudentResultDetailPage';
import { Plus, Edit, Eye, Trash2, FileText, Clock, Users, Send, BarChart3, Search, Settings, X } from 'lucide-react';

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
    const styles = {
      draft: 'bg-surface-dim text-on-surface-variant',
      published: 'bg-success-container text-on-success-container',
      closed: 'bg-error-container text-on-error-container',
      archived: 'bg-surface-dim text-on-surface-variant'
    };
    const labels = {
      draft: 'Draft',
      published: 'Dipublikasikan',
      closed: 'Ditutup',
      archived: 'Diarsipkan'
    };
    return <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-label-xs font-medium " + (styles[status] || 'bg-surface-dim text-on-surface-variant')}>{labels[status] || status}</span>;
  };

  // --- RENDER VIEWS ---

  return (
    <>
      {/* Exam List (default) */}
      {view === 'list' && (
        <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-xl">
            <div>
              <h1 className="text-headline-sm md:text-headline-md font-bold text-on-surface flex items-center gap-sm">
                <FileText className="w-7 h-7 text-primary" />
                {role === 'guru' ? 'Ujian Saya' : role === 'admin' ? 'Semua Ujian' : 'Ujian Tersedia'}
              </h1>
              <p className="text-body-md text-on-surface-variant mt-xs">
                {role === 'guru' ? 'Buat dan kelola ujian untuk murid Anda' :
                 role === 'admin' ? 'Pantau seluruh ujian di sistem' :
                 'Kerjakan ujian yang tersedia'}
              </p>
            </div>
            {(role === 'guru' || role === 'admin') && (
              <button onClick={handleCreate} className="inline-flex items-center gap-xs px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all duration-200 shadow-sm text-label-lg font-medium">
                <Plus className="w-4 h-4" />
                Buat Ujian
              </button>
            )}
          </div>

          {/* Search */}
          {exams.length > 0 && (
            <div className="relative mb-xl max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Cari ujian..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
              />
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="animate-pulse flex items-center gap-sm">
                <div className="w-8 h-8 rounded-full bg-surface-dim"></div>
                <div className="h-4 w-32 bg-surface-dim rounded"></div>
              </div>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 mx-auto text-on-surface-variant/30 mb-4" />
              <p className="text-body-lg text-on-surface-variant mb-2">
                {searchQuery ? 'Tidak ada ujian yang cocok' :
                 role === 'guru' ? 'Belum ada ujian. Buat ujian pertama Anda!' :
                 role === 'admin' ? 'Belum ada ujian di sistem.' :
                 'Belum ada ujian yang tersedia.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExams.map(exam => (
                <div key={exam.id} className="bg-surface rounded-xl border border-outline-variant hover:border-primary/30 hover:shadow-md transition-all duration-300 p-4 group">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-title-sm font-semibold text-on-surface flex-1 min-w-0 truncate m-0">{exam.title}</h3>
                    {getStatusBadge(exam.status)}
                  </div>
                  {exam.description && (
                    <p className="text-body-sm text-on-surface-variant line-clamp-2 mb-3">{exam.description}</p>
                  )}
                  {/* Meta */}
                  <div className="flex flex-wrap gap-3 mb-4 text-body-sm text-on-surface-variant">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {exam.duration_minutes} menit
                    </span>
                    {exam.profiles && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {exam.profiles.display_name || exam.profiles.email}
                      </span>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-outline-variant">
                    {role === 'murid' && exam.status === 'published' && (
                      <button onClick={() => handlePlay(exam.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all text-label-sm font-medium">
                        <Send className="w-3.5 h-3.5" />
                        Kerjakan
                      </button>
                    )}
                    {(role === 'guru' || role === 'admin') && (
                      <>
                        {exam.status === 'draft' && (
                          <button onClick={() => handleEdit(exam.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-outline text-on-surface-variant hover:bg-surface-dim transition-colors text-label-sm">
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        )}
                        {(exam.status === 'published' || exam.status === 'closed') && (
                          <>
                            <button onClick={() => handleViewDashboard(exam.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-container text-on-primary-container hover:bg-primary-container/80 transition-colors text-label-sm">
                              <BarChart3 className="w-3.5 h-3.5" />
                              Hasil
                            </button>
                            <button onClick={() => handleManageExam(exam.id, exam.status)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-outline text-on-surface-variant hover:bg-surface-dim transition-colors text-label-sm">
                              <Settings className="w-3.5 h-3.5" />
                              Kelola
                            </button>
                          </>
                        )}
                        {exam.status === 'draft' && (
                          <button onClick={() => handleDelete(exam.id)} className="p-1.5 rounded-full bg-error-container text-on-error-container hover:bg-error-container/80 transition-colors ml-auto">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                    {role === 'murid' && exam.status === 'closed' && (
                      <button onClick={() => handleViewDashboard(exam.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-container text-on-primary-container hover:bg-primary-container/80 transition-colors text-label-sm">
                        <Eye className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowManageDialog(false)}>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-title-md font-semibold text-white flex items-center gap-sm m-0">
                <Settings className="w-5 h-5" />
                Kelola Ujian
              </h3>
              <button onClick={() => setShowManageDialog(false)} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-title-sm font-semibold text-on-surface mb-1">{managingExam?.title || 'Ujian'}</h4>
                {getStatusBadge(managingExam?.status || 'draft')}
                {managingExam?.description && (
                  <p className="mt-2 text-body-sm text-on-surface-variant">{managingExam.description}</p>
                )}
              </div>
              <div className="space-y-2 pt-3 border-t border-outline-variant">
                {managingExam?.status === 'published' && (
                  <>
                    <button onClick={() => managingExam?.id && handleCloseExamDialog(managingExam.id)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-warning-container text-on-warning-container hover:bg-warning-container/80 transition-colors text-label-lg font-medium">
                      <X className="w-4 h-4" />
                      Tutup Ujian
                    </button>
                    <button onClick={() => managingExam?.id && handleUnpublishExam(managingExam.id)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-outline text-on-surface-variant hover:bg-surface-dim transition-colors text-label-lg">
                      <Eye className="w-4 h-4" />
                      Unpublish
                    </button>
                  </>
                )}
                {managingExam?.status === 'closed' && (
                  <button onClick={() => managingExam?.id && handleReopenExam(managingExam.id)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-success-container text-on-success-container hover:bg-success-container/80 transition-colors text-label-lg font-medium">
                    <Send className="w-4 h-4" />
                    Buka Kembali
                  </button>
                )}
                <button onClick={() => managingExam?.id && handleEdit(managingExam.id)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all text-label-lg font-medium">
                  <Edit className="w-4 h-4" />
                  Edit Detail
                </button>
              </div>
              <div className="pt-2 border-t border-outline-variant">
                <button onClick={() => setShowManageDialog(false)} className="w-full py-2.5 rounded-full border border-outline text-on-surface-variant hover:bg-surface-dim transition-colors text-label-lg">
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExamModule;