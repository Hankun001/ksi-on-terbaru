import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Plus, Edit, Trash2, Eye, EyeOff, Save, X, HelpCircle, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';

const QuizManagement = ({ courses }) => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [quizForm, setQuizForm] = useState({
    course_id: '',
    title: '',
    description: '',
    time_limit: 30,
    passing_score: 60
  });
  const [questions, setQuestions] = useState([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    options: [
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false }
    ],
    points: 10
  });

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const courseIds = courses.map(c => c.id);
      if (courseIds.length === 0) {
        setQuizzes([]);
        return;
      }

      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          courses (
            title
          )
        `)
        .in('course_id', courseIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError('Gagal memuat quiz: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [courses]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingQuiz) {
        const { error } = await supabase
          .from('quizzes')
          .update({
            title: quizForm.title,
            description: quizForm.description,
            time_limit: quizForm.time_limit,
            passing_score: quizForm.passing_score
          })
          .eq('id', editingQuiz.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('quizzes')
          .insert([{
            course_id: quizForm.course_id,
            title: quizForm.title,
            description: quizForm.description,
            time_limit: quizForm.time_limit,
            passing_score: quizForm.passing_score
          }]);

        if (error) throw error;
      }

      setShowCreateForm(false);
      setEditingQuiz(null);
      resetQuizForm();
      fetchQuizzes();
    } catch (err) {
      console.error('Error saving quiz:', err);
      alert('Gagal menyimpan quiz: ' + err.message);
    }
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      course_id: quiz.course_id,
      title: quiz.title,
      description: quiz.description,
      time_limit: quiz.time_limit,
      passing_score: quiz.passing_score
    });
    setShowCreateForm(true);
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus quiz ini?')) return;

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;
      fetchQuizzes();
    } catch (err) {
      console.error('Error deleting quiz:', err);
      alert('Gagal menghapus quiz: ' + err.message);
    }
  };

  const handleTogglePublish = async (quiz) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_published: !quiz.is_published })
        .eq('id', quiz.id);

      if (error) throw error;
      fetchQuizzes();
    } catch (err) {
      console.error('Error toggling publish status:', err);
      alert('Gagal mengubah status publikasi: ' + err.message);
    }
  };

  const handleManageQuestions = async (quiz) => {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setQuestions(data || []);
      setEditingQuiz(quiz);
      setShowQuestionForm(false);
    } catch (err) {
      console.error('Error fetching questions:', err);
      alert('Gagal memuat pertanyaan: ' + err.message);
    }
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingQuestion) {
        const { error } = await supabase
          .from('quiz_questions')
          .update({
            question_text: questionForm.question_text,
            options: questionForm.options,
            points: questionForm.points
          })
          .eq('id', editingQuestion.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('quiz_questions')
          .insert([{
            quiz_id: editingQuiz.id,
            question_text: questionForm.question_text,
            options: questionForm.options,
            points: questionForm.points,
            order_index: questions.length
          }]);

        if (error) throw error;
      }

      setShowQuestionForm(false);
      setEditingQuestion(null);
      resetQuestionForm();
      handleManageQuestions(editingQuiz);
    } catch (err) {
      console.error('Error saving question:', err);
      alert('Gagal menyimpan pertanyaan: ' + err.message);
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text,
      options: question.options,
      points: question.points
    });
    setShowQuestionForm(true);
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pertanyaan ini?')) return;

    try {
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
      handleManageQuestions(editingQuiz);
    } catch (err) {
      console.error('Error deleting question:', err);
      alert('Gagal menghapus pertanyaan: ' + err.message);
    }
  };

  const resetQuizForm = () => {
    setQuizForm({
      course_id: '',
      title: '',
      description: '',
      time_limit: 30,
      passing_score: 60
    });
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      question_text: '',
      options: [
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ],
      points: 10
    });
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setQuestionForm(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  if (loading) {
    return <LoadingSpinner message="Memuat quiz..." />;
  }

  if (error) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-md">
          <AlertCircle className="w-10 h-10 text-error opacity-60" />
          <h3 className="text-title-md font-display text-on-surface">Terjadi Kesalahan</h3>
          <p className="text-body-sm text-on-surface-variant">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto space-y-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-headline-sm md:text-headline-md font-display text-on-surface flex items-center gap-sm">
          <HelpCircle className="w-6 h-6 text-primary" />
          Manajemen Quiz
        </h2>
        <button onClick={() => { resetQuizForm(); setShowCreateForm(true); }}
          className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-xl font-medium hover:bg-primary-container hover:text-on-primary-container transition-all">
          <Plus className="w-4 h-4" /> Buat Quiz Baru
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center py-xl text-on-surface-variant bg-surface rounded-xl">
          <BookOpen className="w-10 h-10 mb-sm opacity-40" />
          <p className="text-body-sm">Anda belum memiliki kursus. Buat kursus terlebih dahulu untuk membuat quiz.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-md">
          {quizzes.map(quiz => (
            <div key={quiz.id} className="bg-surface rounded-xl p-md border border-outline-variant/30 hover:border-primary/30 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-md mb-sm">
                <h3 className="text-title-sm font-display text-on-surface font-semibold">{quiz.title}</h3>
                <span className={`inline-flex items-center px-sm py-0.5 rounded-full text-label-xs font-medium ${
                  quiz.is_published ? 'bg-success-container text-on-success-container' : 'bg-surface-dim text-on-surface-variant'
                }`}>
                  {quiz.is_published ? 'Dipublikasikan' : 'Draft'}
                </span>
              </div>
              <p className="text-body-sm text-on-surface-variant mb-sm">{quiz.description || 'Tidak ada deskripsi'}</p>
              <div className="flex flex-wrap gap-sm text-label-sm text-on-surface-variant mb-md">
                <span className="inline-flex items-center gap-xs bg-surface-container-low px-sm py-0.5 rounded">📚 {quiz.courses?.title}</span>
                <span className="inline-flex items-center gap-xs bg-surface-container-low px-sm py-0.5 rounded">⏱️ {quiz.time_limit} menit</span>
                <span className="inline-flex items-center gap-xs bg-surface-container-low px-sm py-0.5 rounded">📊 Lulus: {quiz.passing_score}%</span>
              </div>
              <div className="flex flex-wrap gap-xs pt-sm border-t border-outline-variant/20">
                <button onClick={() => handleManageQuestions(quiz)} className="inline-flex items-center gap-xs px-sm py-xs rounded-lg bg-primary-container text-on-primary-container text-label-xs font-medium hover:bg-primary hover:text-on-primary transition-all">
                  <Edit className="w-3 h-3" /> Kelola Soal
                </button>
                <button onClick={() => handleEditQuiz(quiz)} className="inline-flex items-center gap-xs px-sm py-xs rounded-lg bg-surface-dim text-on-surface-variant text-label-xs font-medium hover:bg-outline-variant transition-all">
                  <Edit className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => handleTogglePublish(quiz)} className={`inline-flex items-center gap-xs px-sm py-xs rounded-lg text-label-xs font-medium transition-all ${
                  quiz.is_published ? 'bg-warning-container text-on-warning-container hover:bg-warning hover:text-on-warning' : 'bg-success-container text-on-success-container hover:bg-success hover:text-on-success'
                }`}>
                  {quiz.is_published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {quiz.is_published ? 'Sembunyikan' : 'Publikasikan'}
                </button>
                <button onClick={() => handleDeleteQuiz(quiz.id)} className="inline-flex items-center gap-xs px-sm py-xs rounded-lg bg-error-container text-on-error-container text-label-xs font-medium hover:bg-error hover:text-on-error transition-all">
                  <Trash2 className="w-3 h-3" /> Hapus
                </button>
              </div>
            </div>
          ))}
          {quizzes.length === 0 && (
            <div className="flex flex-col items-center py-xl text-on-surface-variant col-span-2">
              <HelpCircle className="w-10 h-10 mb-sm opacity-40" />
              <p className="text-body-sm">Belum ada quiz. Klik "Buat Quiz Baru" untuk memulai.</p>
            </div>
          )}
        </div>
      )}

      {/* Quiz Form Modal */}
      {(showCreateForm || editingQuiz) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-md" onClick={() => { setShowCreateForm(false); setEditingQuiz(null); }}>
          <div className="bg-surface rounded-2xl shadow-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-xl pt-lg pb-md border-b border-outline-variant/30">
              <h3 className="text-title-lg font-semibold text-on-surface m-0">{editingQuiz ? 'Edit Quiz' : 'Buat Quiz Baru'}</h3>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant" onClick={() => { setShowCreateForm(false); setEditingQuiz(null); }}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleQuizSubmit} className="p-xl space-y-md">
              <div className="space-y-1.5">
                <label className="block text-label-sm font-medium text-on-surface">Kursus</label>
                <select value={quizForm.course_id} onChange={(e) => setQuizForm(prev => ({ ...prev, course_id: e.target.value }))} required disabled={!!editingQuiz}
                  className="w-full px-3 py-2.5 rounded-xl border border-outline bg-surface text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-60">
                  <option value="">Pilih Kursus</option>
                  {courses.map(course => (<option key={course.id} value={course.id}>{course.title}</option>))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-medium text-on-surface">Judul Quiz</label>
                <input type="text" value={quizForm.title} onChange={(e) => setQuizForm(prev => ({ ...prev, title: e.target.value }))} required
                  className="w-full px-3 py-2.5 rounded-xl border border-outline bg-surface text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-medium text-on-surface">Deskripsi</label>
                <textarea value={quizForm.description} onChange={(e) => setQuizForm(prev => ({ ...prev, description: e.target.value }))} rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-outline bg-surface text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div className="space-y-1.5">
                  <label className="block text-label-sm font-medium text-on-surface">Waktu (menit)</label>
                  <input type="number" min="1" max="300" value={quizForm.time_limit} onChange={(e) => setQuizForm(prev => ({ ...prev, time_limit: parseInt(e.target.value) }))} required
                    className="w-full px-3 py-2.5 rounded-xl border border-outline bg-surface text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-label-sm font-medium text-on-surface">Nilai Lulus (%)</label>
                  <input type="number" min="0" max="100" value={quizForm.passing_score} onChange={(e) => setQuizForm(prev => ({ ...prev, passing_score: parseInt(e.target.value) }))} required
                    className="w-full px-3 py-2.5 rounded-xl border border-outline bg-surface text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                </div>
              </div>
              <div className="flex gap-md justify-end pt-sm border-t border-outline-variant/20">
                <button type="button" className="px-4 py-2 rounded-xl text-label-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors" onClick={() => { setShowCreateForm(false); setEditingQuiz(null); }}>Batal</button>
                <button type="submit" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-label-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
                  <Save className="w-4 h-4" />
                  {editingQuiz ? 'Simpan Perubahan' : 'Buat Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions Management Modal */}
      {editingQuiz && !showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-md" onClick={() => setEditingQuiz(null)}>
          <div className="bg-surface rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-xl pt-lg pb-md border-b border-outline-variant/30">
              <h3 className="text-title-lg font-semibold text-on-surface m-0">Kelola Pertanyaan - {editingQuiz.title}</h3>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant" onClick={() => setEditingQuiz(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-xl space-y-md">
              {questions.map((question, index) => (
                <div key={question.id} className="bg-surface-container-low/50 rounded-xl p-md border border-outline-variant/30">
                  <div className="flex items-start justify-between gap-sm mb-sm">
                    <div className="flex items-start gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-label-sm font-bold flex items-center justify-center shrink-0 mt-0.5">{index + 1}</span>
                      <span className="text-body-md font-medium text-on-surface">{question.question_text}</span>
                    </div>
                    <span className="text-label-sm text-on-surface-variant shrink-0 whitespace-nowrap">{question.points} poin</span>
                  </div>
                  <div className="ml-8 space-y-1 mb-sm">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className={`flex items-center gap-2 text-body-sm ${option.is_correct ? 'text-success font-medium' : 'text-on-surface-variant'}`}>
                        {option.is_correct && <CheckCircle className="w-3.5 h-3.5 text-success" />}
                        <span>{String.fromCharCode(65 + optIndex)}. {option.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-sm ml-8">
                    <button className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-label-xs font-medium text-primary hover:bg-primary-container/40 transition-colors" onClick={() => handleEditQuestion(question)}>
                      <Edit className="w-3 h-3" /> Edit
                    </button>
                    <button className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-label-xs font-medium text-error hover:bg-error-container/40 transition-colors" onClick={() => handleDeleteQuestion(question.id)}>
                      <Trash2 className="w-3 h-3" /> Hapus
                    </button>
                  </div>
                </div>
              ))}
              {questions.length === 0 && (
                <div className="text-center py-xl text-on-surface-variant">
                  <HelpCircle className="w-10 h-10 mx-auto mb-sm opacity-50" />
                  <p className="text-body-sm">Belum ada pertanyaan. Klik "Tambah Pertanyaan" untuk memulai.</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-xl py-md border-t border-outline-variant/20">
              <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-label-sm font-medium hover:bg-primary/90 transition-colors shadow-sm" onClick={() => { resetQuestionForm(); setShowQuestionForm(true); }}>
                <Plus className="w-4 h-4" /> Tambah Pertanyaan
              </button>
              <button className="px-4 py-2 rounded-xl text-label-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors" onClick={() => setEditingQuiz(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Question Form Modal */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-md" onClick={() => { setShowQuestionForm(false); setEditingQuestion(null); }}>
          <div className="bg-surface rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-xl pt-lg pb-md border-b border-outline-variant/30">
              <h3 className="text-title-lg font-semibold text-on-surface m-0">{editingQuestion ? 'Edit Pertanyaan' : 'Tambah Pertanyaan'}</h3>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant" onClick={() => { setShowQuestionForm(false); setEditingQuestion(null); }}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleQuestionSubmit} className="p-xl space-y-md">
              <div className="space-y-1.5">
                <label className="block text-label-sm font-medium text-on-surface">Pertanyaan</label>
                <textarea value={questionForm.question_text} onChange={(e) => setQuestionForm(prev => ({ ...prev, question_text: e.target.value }))} required rows={3} autoFocus
                  placeholder="Ketik pertanyaan di sini..."
                  className="w-full px-3 py-2.5 rounded-xl border border-outline bg-surface text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-medium text-on-surface">Opsi Jawaban</label>
                <div className="space-y-2">
                  {questionForm.options.map((option, index) => (
                    <div key={index} className={`flex items-center gap-md p-md rounded-xl border-2 transition-all ${option.is_correct ? 'border-success bg-success-container/20' : 'border-outline-variant/40'}`}>
                      <label className="flex items-center gap-2 cursor-pointer shrink-0">
                        <input type="radio" name="correct-option" checked={option.is_correct}
                          onChange={() => {
                            const newOptions = questionForm.options.map((opt, i) => ({ ...opt, is_correct: i === index }));
                            setQuestionForm(prev => ({ ...prev, options: newOptions }));
                          }}
                          className="w-4 h-4 accent-primary" />
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-label-xs font-bold ${option.is_correct ? 'bg-success text-on-success' : 'bg-surface-container-high text-on-surface-variant'}`}>
                          {String.fromCharCode(65 + index)}
                        </span>
                      </label>
                      <input type="text" placeholder={`Ketik jawaban untuk opsi ${String.fromCharCode(65 + index)}...`}
                        value={option.text} onChange={(e) => handleOptionChange(index, 'text', e.target.value)} required
                        className="flex-1 px-3 py-2 rounded-lg border border-outline bg-surface text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                    </div>
                  ))}
                </div>
                <p className="text-label-xs text-on-surface-variant mt-1">Pilih tombol radio di samping jawaban yang benar</p>
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-medium text-on-surface">Poin</label>
                <input type="number" min="1" max="100" value={questionForm.points} onChange={(e) => setQuestionForm(prev => ({ ...prev, points: parseInt(e.target.value) }))} required
                  className="w-full px-3 py-2.5 rounded-xl border border-outline bg-surface text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              </div>
              <div className="flex gap-md justify-end pt-sm border-t border-outline-variant/20">
                <button type="button" className="px-4 py-2 rounded-xl text-label-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors" onClick={() => { setShowQuestionForm(false); setEditingQuestion(null); }}>Batal</button>
                <button type="submit" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-label-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
                  <Save className="w-4 h-4" />
                  {editingQuestion ? 'Simpan Perubahan' : 'Tambah Pertanyaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizManagement;