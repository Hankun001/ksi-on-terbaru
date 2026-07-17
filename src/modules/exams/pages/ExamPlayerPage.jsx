import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { fetchExamById, fetchQuestionsWithOptions, createAttempt, submitAttempt, fetchStudentAttempt, saveAnswer, subscribeToExamChanges } from '../services/examService';
import { useExamTimer } from '../hooks/useExamTimer';
import { useAutoSave } from '../hooks/useAutoSave';
import { Clock, AlertTriangle, Check, X, ChevronLeft, ChevronRight, Send, Save } from 'lucide-react';
import '../styles/examStyles.css';

const ExamPlayerPage = ({ examId, onFinish }) => {
  const { user } = useAuth();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [examState, setExamState] = useState('loading'); // loading, not_started, in_progress, submitted, closed
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const lastSaveRef = useRef(null);

  // Initialize
  useEffect(() => {
    if (!user || !examId) return;
    initExam();
    return () => { /* cleanup */ };
  }, [user, examId]);

  const initExam = async () => {
    try {
      setLoading(true);
      const examData = await fetchExamById(examId);
      setExam(examData);

      // Check exam status
      if (examData.status === 'draft' || examData.status === 'archived') {
        setExamState('not_started');
        setLoading(false);
        return;
      }

      if (examData.status === 'closed') {
        setExamState('closed');
        setLoading(false);
        return;
      }

      // Load questions
      const qs = await fetchQuestionsWithOptions(examId);
      setQuestions(qs);

      // Check existing attempt
      const existingAttempt = await fetchStudentAttempt(examId, user.id);
      
      if (existingAttempt) {
        if (existingAttempt.status === 'in_progress') {
          setAttempt(existingAttempt);
          setExamState('in_progress');
          // Load existing answers
          await loadExistingAnswers(existingAttempt.id);
        } else {
          setAttempt(existingAttempt);
          setExamState('submitted');
        }
      } else {
        setExamState('ready'); // Show start button
      }

    } catch (err) {
      console.error('Error loading exam:', err);
      setError('Gagal memuat ujian. Periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingAnswers = async (attemptId) => {
    try {
      const { data } = await supabase
        .from('attempt_answers')
        .select('*')
        .eq('attempt_id', attemptId);
      
      const answerMap = {};
      (data || []).forEach(a => {
        answerMap[a.question_id] = {
          selected_option_ids: a.selected_option_ids || [],
          answer_text: a.answer_text || ''
        };
      });
      setAnswers(answerMap);
    } catch (err) {
      console.warn('Error loading answers:', err);
    }
  };

  // Real-time subscription to exam changes
  useEffect(() => {
    if (!examId || examState !== 'in_progress') return;

    const channel = supabase
      .channel(`exam-${examId}-player`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'exams', filter: `id=eq.${examId}` },
        (payload) => {
          const newExam = payload.new;
          if (newExam.status === 'closed') {
            setExam(newExam);
            setExamState('closed');
            handleAutoSubmit();
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [examId, examState]);

  // Handle auto-submit when exam is closed by teacher
  const handleAutoSubmit = async () => {
    if (!attempt || attempt.status !== 'in_progress') return;
    try {
      await submitAttempt(attempt.id);
      setAttempt(prev => ({ ...prev, status: 'auto_submitted', submitted_at: new Date().toISOString() }));
    } catch (err) {
      console.error('Auto-submit failed:', err);
    }
  };

  // Auto-save hook for current question
  const currentQuestion = questions[currentIndex];
  const { triggerSave, saveImmediately, isSaving } = useAutoSave(
    attempt?.id,
    currentQuestion?.id,
    1500
  );

  // Timer
  const { formattedTime, getTimerColor, isExpired, progress } = useExamTimer(
    attempt?.started_at,
    exam?.duration_minutes,
    examState === 'in_progress'
  );

  // Auto-submit on timer expiry
  useEffect(() => {
    if (isExpired && examState === 'in_progress' && attempt) {
      handleManualSubmit();
    }
  }, [isExpired]);

  // Handle answer change for current question
  const handleAnswerChange = (questionId, value) => {
    let newAnswer;
    const q = questions.find(q => q.id === questionId);

    if (q.type === 'multiple_choice') {
      newAnswer = { selected_option_ids: [value], answer_text: '' };
    } else if (q.type === 'checkbox') {
      const current = answers[questionId]?.selected_option_ids || [];
      const updated = current.includes(value)
        ? current.filter(id => id !== value)
        : [...current, value];
      newAnswer = { selected_option_ids: updated, answer_text: '' };
    } else {
      newAnswer = { selected_option_ids: [], answer_text: value };
    }

    setAnswers(prev => ({ ...prev, [questionId]: newAnswer }));
    triggerSave(newAnswer);
    lastSaveRef.current = Date.now();
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleStartExam = async () => {
    try {
      const newAttempt = await createAttempt(examId, user.id);
      setAttempt(newAttempt);
      setExamState('in_progress');
      setCurrentIndex(0);
    } catch (err) {
      alert('Gagal memulai ujian: ' + err.message);
    }
  };

  const handleManualSubmit = async () => {
    if (!attempt) return;
    
    // Save current answer first
    if (currentQuestion && answers[currentQuestion.id]) {
      await saveImmediately(answers[currentQuestion.id]);
    }

    const confirmed = window.confirm(
      'Apakah Anda yakin ingin mengumpulkan ujian? Jawaban tidak dapat diubah setelah dikumpulkan.'
    );
    if (!confirmed) return;

    try {
      setSubmitting(true);
      await submitAttempt(attempt.id);
      setAttempt(prev => ({ ...prev, status: 'submitted', submitted_at: new Date().toISOString() }));
      setExamState('submitted');
    } catch (err) {
      alert('Gagal mengumpulkan: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const goToQuestion = (idx) => {
    setCurrentIndex(idx);
  };

  // Count answers
  const answeredCount = Object.keys(answers).filter(qId => {
    const a = answers[qId];
    if (!a) return false;
    if ((a.selected_option_ids && a.selected_option_ids.length > 0) || 
        (a.answer_text && a.answer_text.trim())) return true;
    return false;
  }).length;

  // --- RENDER STATES ---
  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#6b7280' }}>Memuat ujian...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <AlertTriangle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
        <h2 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Gagal Memuat Ujian</h2>
        <p style={{ color: '#6b7280' }}>{error}</p>
      </div>
    );
  }

  // Not published yet
  if (examState === 'not_started') {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', padding: '3rem 1rem', maxWidth: '500px', margin: '0 auto' }}>
        <Clock size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
        <h2 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Ujian Belum Dimulai</h2>
        <p style={{ color: '#6b7280' }}>
          Ujian "{exam?.title}" belum dipublikasikan. Silakan tunggu pengumuman dari guru Anda.
        </p>
      </div>
    );
  }

  // Closed by teacher
  if (examState === 'closed' && !attempt) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', padding: '3rem 1rem', maxWidth: '500px', margin: '0 auto' }}>
        <X size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
        <h2 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Ujian Telah Ditutup</h2>
        <p style={{ color: '#6b7280' }}>
          Ujian "{exam?.title}" telah ditutup oleh guru.
        </p>
      </div>
    );
  }

  // Ready to start
  if (examState === 'ready') {
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', padding: '2rem 1rem', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '2rem 1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', color: '#1f2937', margin: '0 0 0.5rem' }}>{exam?.title}</h1>
          {exam?.description && (
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{exam.description}</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6' }}>{questions.length}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Soal</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6' }}>{exam.duration_minutes}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Menit</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6' }}>{totalPoints}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Total Poin</div>
            </div>
          </div>
          <button onClick={handleStartExam} className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
            Mulai Ujian
          </button>
        </div>
      </div>
    );
  }

  // Already submitted
  if (examState === 'submitted' && attempt) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', padding: '2rem 1rem', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '2rem 1.5rem' }}>
          <div style={{ width: 64, height: 64, background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Check size={32} style={{ color: '#059669' }} />
          </div>
          <h2 style={{ color: '#1f2937', margin: '0 0 0.5rem' }}>Ujian Terkumpul!</h2>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            Jawaban Anda telah berhasil dikumpulkan. Hasil akan diumumkan oleh guru.
          </p>
          {attempt.status === 'auto_submitted' && (
            <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Ujian ditutup oleh guru. Jawaban otomatis terkumpul.
            </div>
          )}
          <button onClick={onFinish} className="btn btn-secondary">
            Kembali
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN EXAM PLAYER --- (in_progress)
  if (!currentQuestion) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Tidak ada soal...</div>;
  }

  const q = currentQuestion;
  const currentAnswer = answers[q.id] || { selected_option_ids: [], answer_text: '' };
  const isLastQuestion = currentIndex === questions.length - 1;
  const isFirstQuestion = currentIndex === 0;

  return (
    <div className="exam-player-container">
      {/* Sticky Top Bar */}
      <div className="exam-player-topbar no-print">
        <span className="exam-player-topbar-title">{exam?.title}</span>
        <div className="exam-timer" style={{ color: getTimerColor(), background: getTimerColor() + '15' }}>
          <Clock size={18} />
          {formattedTime}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="exam-progress-bar-container no-print">
        <div className="exam-progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Autosave indicator */}
      <div className="no-print" style={{ textAlign: 'center', padding: '0.25rem', fontSize: '0.75rem', color: '#9ca3af' }}>
        {isSaving ? 'Menyimpan...' : lastSaveRef.current ? 'Tersimpan' : ''}
      </div>

      <div className="question-display">
        {/* Question Navigator */}
        <div className="no-print" style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              Soal {currentIndex + 1} dari {questions.length}
            </span>
            <span style={{
              fontSize: '0.85rem',
              color: '#6b7280',
              background: '#f3f4f6',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px'
            }}>
              Terjawab: {answeredCount}/{questions.length}
            </span>
          </div>
          <div className="question-nav-grid">
            {questions.map((question, idx) => {
              const hasAnswer = answers[question.id] && (
                (answers[question.id].selected_option_ids?.length > 0) ||
                (answers[question.id].answer_text?.trim())
              );
              return (
                <button
                  key={question.id}
                  className={`question-dot ${idx === currentIndex ? 'active current' : ''} ${hasAnswer ? 'answered' : ''}`}
                  onClick={() => goToQuestion(idx)}
                  aria-label={`Go to question ${idx + 1}${hasAnswer ? ' (answered)' : ''}`}
                  title={`Question ${idx + 1}${hasAnswer ? ' - Answered' : ' - Not answered'}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Type Badge */}
        <div style={{ marginBottom: '0.75rem' }}>
          <span className="question-points">
            {q.type === 'multiple_choice' ? 'Pilihan Ganda' : q.type === 'checkbox' ? 'Checkbox' : 'Essay'}
            {' • '}{q.points} poin
          </span>
        </div>

        {/* Question Text */}
        <div className="question-text">{q.question}</div>

        {/* Question Image */}
        {q.image_url && (
          <div style={{
            marginBottom: '1.5rem',
            textAlign: 'center',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1rem',
            background: '#fafafa'
          }}>
            <img
              src={q.image_url}
              alt="Gambar soal"
              style={{
                maxWidth: '100%',
                maxHeight: '400px',
                width: 'auto',
                height: 'auto',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                objectFit: 'contain'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div style={{
              display: 'none',
              textAlign: 'center',
              color: '#ef4444',
              fontSize: '0.9rem',
              padding: '2rem'
            }}>
              Gagal memuat gambar soal
            </div>
          </div>
        )}

        {/* Options or Essay */}
        {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
          <div className="options-list">
            {(q.options || []).map(opt => {
              const isSelected = (currentAnswer.selected_option_ids || []).includes(opt.id);
              return (
                <div
                  key={opt.id}
                  className={`option-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleAnswerChange(q.id, opt.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAnswerChange(q.id, opt.id);
                    }
                  }}
                  aria-pressed={isSelected}
                  aria-label={`${q.type === 'multiple_choice' ? 'Select' : 'Toggle'} option: ${opt.option_text}`}
                >
                  <input
                    type={q.type === 'multiple_choice' ? 'radio' : 'checkbox'}
                    checked={isSelected}
                    onChange={() => {}}
                    name={`question-${q.id}`}
                    aria-hidden="true"
                  />
                  <span className="option-text">{opt.option_text}</span>
                </div>
              );
            })}
          </div>
        )}

        {q.type === 'essay' && (
          <textarea
            className="essay-textarea"
            value={currentAnswer.answer_text || ''}
            onChange={e => handleAnswerChange(q.id, e.target.value)}
            placeholder="Tulis jawaban Anda di sini..."
          />
        )}
      </div>

      {/* Bottom Navigation (fixed on mobile, static on desktop) */}
      <div className="exam-bottom-nav no-print">
        <div className="exam-bottom-nav-left">
          <button
            className="question-nav-btn"
            onClick={handlePrev}
            disabled={isFirstQuestion}
            aria-label="Previous question"
          >
            <ChevronLeft size={18} />
            <span className="nav-text-mobile">Sebelumnya</span>
          </button>
        </div>
        <div className="exam-bottom-nav-right">
          {isLastQuestion ? (
            <button
              className="submit-btn"
              onClick={handleManualSubmit}
              disabled={submitting}
              aria-label="Submit exam"
            >
              <Send size={18} style={{ marginRight: '8px' }} />
              {submitting ? 'Mengumpulkan...' : 'Kumpulkan'}
            </button>
          ) : (
            <button
              className="question-nav-btn"
              onClick={handleNext}
              aria-label="Next question"
            >
              <span className="nav-text-mobile">Selanjutnya</span>
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamPlayerPage;