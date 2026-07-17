import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Plus, Edit, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import './QuizManagement.css';

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
      <div className="quiz-error">
        <h3>Terjadi Kesalahan</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="quiz-management">
      <div className="quiz-header">
        <h2>Manajemen Quiz</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetQuizForm();
            setShowCreateForm(true);
          }}
        >
          <Plus size={16} />
          Buat Quiz Baru
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="no-courses">
          <p>Anda belum memiliki kursus. Buat kursus terlebih dahulu untuk membuat quiz.</p>
        </div>
      ) : (
        <div className="quizzes-grid">
          {quizzes.map(quiz => (
            <div key={quiz.id} className="quiz-card">
              <div className="quiz-card-header">
                <h3>{quiz.title}</h3>
                <div className="quiz-status">
                  {quiz.is_published ? (
                    <span className="status published">Dipublikasikan</span>
                  ) : (
                    <span className="status draft">Draft</span>
                  )}
                </div>
              </div>
              <div className="quiz-card-body">
                <p className="quiz-description">{quiz.description || 'Tidak ada deskripsi'}</p>
                <div className="quiz-meta">
                  <span>Kursus: {quiz.courses?.title}</span>
                  <span>Waktu: {quiz.time_limit} menit</span>
                  <span>Lulus: {quiz.passing_score}%</span>
                </div>
              </div>
              <div className="quiz-card-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => handleManageQuestions(quiz)}
                >
                  <Edit size={14} />
                  Kelola Pertanyaan
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => handleEditQuiz(quiz)}
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button
                  className={`btn ${quiz.is_published ? 'btn-warning' : 'btn-success'}`}
                  onClick={() => handleTogglePublish(quiz)}
                >
                  {quiz.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                  {quiz.is_published ? 'Sembunyikan' : 'Publikasikan'}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteQuiz(quiz.id)}
                >
                  <Trash2 size={14} />
                  Hapus
                </button>
              </div>
            </div>
          ))}
          {quizzes.length === 0 && (
            <div className="no-quizzes">
              <p>Belum ada quiz. Klik "Buat Quiz Baru" untuk memulai.</p>
            </div>
          )}
        </div>
      )}

      {/* Quiz Form Modal */}
      {(showCreateForm || editingQuiz) && (
        <div className="modal-overlay" onClick={(e) => {
          // Only close if clicking on overlay itself, not on modal content
          if (e.target === e.currentTarget) {
            setShowCreateForm(false);
            setEditingQuiz(null);
          }
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingQuiz ? 'Edit Quiz' : 'Buat Quiz Baru'}</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingQuiz(null);
                }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleQuizSubmit}>
              <div className="form-group">
                <label>Kursus</label>
                <select
                  value={quizForm.course_id}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, course_id: e.target.value }))}
                  required
                  disabled={!!editingQuiz}
                >
                  <option value="">Pilih Kursus</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Judul Quiz</label>
                <input
                  type="text"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Deskripsi</label>
                <textarea
                  value={quizForm.description}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Waktu (menit)</label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={quizForm.time_limit}
                    onChange={(e) => setQuizForm(prev => ({ ...prev, time_limit: parseInt(e.target.value) }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nilai Lulus (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={quizForm.passing_score}
                    onChange={(e) => setQuizForm(prev => ({ ...prev, passing_score: parseInt(e.target.value) }))}
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowCreateForm(false);
                  setEditingQuiz(null);
                }}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  {editingQuiz ? 'Simpan Perubahan' : 'Buat Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions Management Modal */}
      {editingQuiz && !showCreateForm && (
        <div className="modal-overlay" onClick={() => setEditingQuiz(null)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Kelola Pertanyaan - {editingQuiz.title}</h3>
              <button className="close-btn" onClick={() => setEditingQuiz(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="questions-list">
              {questions.map((question, index) => (
                <div key={question.id} className="question-item">
                  <div className="question-header">
                    <span className="question-number">{index + 1}.</span>
                    <span className="question-text">{question.question_text}</span>
                    <span className="question-points">{question.points} poin</span>
                  </div>
                  <div className="question-options">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className={`option ${option.is_correct ? 'correct' : ''}`}>
                        {option.is_correct && '✓'} {option.text}
                      </div>
                    ))}
                  </div>
                  <div className="question-actions">
                    <button
                      className="btn btn-outline"
                      onClick={() => handleEditQuestion(question)}
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Trash2 size={14} />
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
              {questions.length === 0 && (
                <div className="no-questions">
                  <p>Belum ada pertanyaan. Klik "Tambah Pertanyaan" untuk memulai.</p>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  resetQuestionForm();
                  setShowQuestionForm(true);
                }}
              >
                <Plus size={16} />
                Tambah Pertanyaan
              </button>
              <button className="btn btn-secondary" onClick={() => setEditingQuiz(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Form Modal */}
      {showQuestionForm && (
        <div className="modal-overlay" onClick={(e) => {
          // Only close if clicking on overlay itself, not on modal content
          if (e.target === e.currentTarget) {
            setShowQuestionForm(false);
            setEditingQuestion(null);
          }
        }}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingQuestion ? 'Edit Pertanyaan' : 'Tambah Pertanyaan'}</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowQuestionForm(false);
                  setEditingQuestion(null);
                }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleQuestionSubmit}>
              <div className="form-group">
                <label>Pertanyaan</label>
                <textarea
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, question_text: e.target.value }))}
                  required
                  rows={3}
                  placeholder="Ketik pertanyaan di sini..."
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Opsi Jawaban</label>
                <div className="options-container">
                  {questionForm.options.map((option, index) => (
                    <div 
                      key={index} 
                      className={`option-input-row ${option.is_correct ? 'correct-option' : ''}`}
                    >
                      <label className="option-radio-label">
                        <input
                          type="radio"
                          name="correct-option"
                          checked={option.is_correct}
                          onChange={() => {
                            const newOptions = questionForm.options.map((opt, i) => ({
                              ...opt,
                              is_correct: i === index
                            }));
                            setQuestionForm(prev => ({ ...prev, options: newOptions }));
                          }}
                        />
                        <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                      </label>
                      <div className="option-input-wrapper">
                        <input
                          type="text"
                          placeholder={`Ketik jawaban untuk opsi ${String.fromCharCode(65 + index)}...`}
                          value={option.text}
                          onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                          className="option-text-input"
                          required
                          style={{
                            color: '#111827',
                            WebkitTextFillColor: '#111827',
                            backgroundColor: '#ffffff',
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '15px',
                            fontFamily: 'inherit',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="form-help">Pilih tombol radio di samping jawaban yang benar</p>
              </div>
              <div className="form-group">
                <label>Poin</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={questionForm.points}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowQuestionForm(false);
                  setEditingQuestion(null);
                }}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
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