import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { fetchExamById, fetchQuestionsWithOptions, createAttempt, submitAttempt, fetchStudentAttempt, saveAnswer, subscribeToExamChanges } from '../services/examService';
import { useExamTimer } from '../hooks/useExamTimer';
import { useAutoSave } from '../hooks/useAutoSave';
import { Clock, AlertTriangle, Check, X, ChevronLeft, ChevronRight, Send, Save } from 'lucide-react';

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
      <div className="p-margin-mobile md:p-margin-desktop max-w-5xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-md">
            <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            <p className="text-body-md text-on-surface-variant">Memuat ujian...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop max-w-5xl mx-auto py-2xl">
        <div className="bg-surface rounded-xl p-xl text-center border border-outline-variant/30 shadow-sm">
          <AlertTriangle className="w-12 h-12 text-error mx-auto mb-md" />
          <h2 className="text-title-md font-semibold text-on-surface mb-sm">Gagal Memuat Ujian</h2>
          <p className="text-body-md text-on-surface-variant">{error}</p>
        </div>
      </div>
    );
  }

  if (examState === 'not_started') {
    return (
      <div className="p-margin-mobile md:p-margin-desktop max-w-lg mx-auto py-3xl">
        <div className="bg-surface rounded-xl p-xl text-center border border-outline-variant/30 shadow-sm">
          <Clock className="w-12 h-12 text-warning mx-auto mb-md" />
          <h2 className="text-title-md font-semibold text-on-surface mb-sm">Ujian Belum Dimulai</h2>
          <p className="text-body-md text-on-surface-variant">Ujian "{exam?.title}" belum dipublikasikan. Silakan tunggu pengumuman dari guru Anda.</p>
        </div>
      </div>
    );
  }

  if (examState === 'closed' && !attempt) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop max-w-lg mx-auto py-3xl">
        <div className="bg-surface rounded-xl p-xl text-center border border-outline-variant/30 shadow-sm">
          <X className="w-12 h-12 text-error mx-auto mb-md" />
          <h2 className="text-title-md font-semibold text-on-surface mb-sm">Ujian Telah Ditutup</h2>
          <p className="text-body-md text-on-surface-variant">Ujian "{exam?.title}" telah ditutup oleh guru.</p>
        </div>
      </div>
    );
  }

  if (examState === 'ready') {
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
    return (
      <div className="p-margin-mobile md:p-margin-desktop max-w-lg mx-auto py-3xl">
        <div className="bg-surface rounded-2xl p-xl shadow-sm border border-outline-variant/30 text-center">
          <h1 className="text-headline-sm font-bold text-on-surface m-0 mb-sm">{exam?.title}</h1>
          {exam?.description && <p className="text-body-md text-on-surface-variant mb-lg">{exam.description}</p>}
          <div className="flex items-center justify-center gap-xl mb-lg">
            <div>
              <div className="text-2xl font-bold text-primary">{questions.length}</div>
              <div className="text-label-xs text-on-surface-variant">Soal</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{exam.duration_minutes}</div>
              <div className="text-label-xs text-on-surface-variant">Menit</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{totalPoints}</div>
              <div className="text-label-xs text-on-surface-variant">Total Poin</div>
            </div>
          </div>
          <button onClick={handleStartExam}
            className="px-6 py-3 rounded-xl bg-primary text-on-primary text-label-sm font-medium hover:bg-primary/90 transition-colors shadow-lg">Mulai Ujian</button>
        </div>
      </div>
    );
  }

  if (examState === 'submitted' && attempt) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop max-w-lg mx-auto py-3xl">
        <div className="bg-surface rounded-2xl p-xl shadow-sm border border-outline-variant/30 text-center">
          <div className="w-16 h-16 rounded-full bg-success-container flex items-center justify-center mx-auto mb-md">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-title-md font-semibold text-on-surface mb-sm">Ujian Terkumpul!</h2>
          <p className="text-body-md text-on-surface-variant mb-md">Jawaban Anda telah berhasil dikumpulkan. Hasil akan diumumkan oleh guru.</p>
          {attempt.status === 'auto_submitted' && (
            <div className="flex items-center gap-2 px-md py-3 rounded-xl bg-warning-container/50 text-body-sm text-on-warning-container mb-md">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Ujian ditutup oleh guru. Jawaban otomatis terkumpul.
            </div>
          )}
          <button onClick={onFinish} className="px-5 py-2.5 rounded-xl text-label-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors">Kembali</button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop max-w-5xl mx-auto py-3xl">
        <div className="text-center text-on-surface-variant">
          <p className="text-body-md">Tidak ada soal...</p>
        </div>
      </div>
    );
  }

  const q = currentQuestion;
  const currentAnswer = answers[q.id] || { selected_option_ids: [], answer_text: '' };
  const isLastQuestion = currentIndex === questions.length - 1;
  const isFirstQuestion = currentIndex === 0;

  return (
    <div className="h-full flex flex-col bg-surface-container-high">
      {/* Header bar */}
      <div className="bg-surface border-b border-outline-variant/20 px-margin-mobile md:px-margin-desktop py-md shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-title-md font-semibold text-on-surface truncate">{exam?.title}</span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-label-sm font-mono font-semibold"
            style={{ color: getTimerColor(), background: getTimerColor() + '20' }}>
            <Clock className="w-4 h-4" />
            {formattedTime}
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-5xl mx-auto mt-md">
          <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Autosave indicator */}
      <div className="text-center py-1 text-label-xs text-outline">
        {isSaving ? 'Menyimpan...' : lastSaveRef.current ? 'Tersimpan' : ''}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-margin-mobile md:px-margin-desktop py-lg">
        <div className="max-w-3xl mx-auto space-y-lg">
          {/* Question Navigator */}
          <div className="bg-surface rounded-xl p-md shadow-sm border border-outline-variant/30">
            <div className="flex items-center justify-between gap-sm mb-md">
              <span className="text-label-sm text-on-surface-variant">Soal {currentIndex + 1} dari {questions.length}</span>
              <span className="text-label-xs text-on-surface-variant bg-surface-container-low px-2 py-1 rounded">Terjawab: {answeredCount}/{questions.length}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {questions.map((question, idx) => {
                const hasAnswer = answers[question.id] && (
                  (answers[question.id].selected_option_ids?.length > 0) ||
                  (answers[question.id].answer_text?.trim())
                );
                return (
                  <button key={question.id}
                    onClick={() => goToQuestion(idx)}
                    className={`w-9 h-9 rounded-lg text-label-sm font-medium transition-all ${
                      idx === currentIndex
                        ? 'bg-primary text-on-primary shadow-sm'
                        : hasAnswer
                          ? 'bg-success-container text-on-success-container'
                          : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-high/80'
                    }`}
                    aria-label={`Go to question ${idx + 1}`}
                    title={`Question ${idx + 1}${hasAnswer ? ' - Answered' : ' - Not answered'}`}>
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question card */}
          <div className="bg-surface rounded-2xl p-xl shadow-sm border border-outline-variant/30">
            {/* Question type badge */}
            <span className="inline-flex items-center px-2 py-0.5 rounded text-label-xs font-medium bg-surface-container-low text-on-surface-variant mb-md">
              {q.type === 'multiple_choice' ? 'Pilihan Ganda' : q.type === 'checkbox' ? 'Checkbox' : 'Essay'}
              {' • '}{q.points} poin
            </span>

            {/* Question text */}
            <div className="text-title-md font-semibold text-on-surface leading-relaxed mb-lg">{q.question}</div>

            {/* Question image */}
            {q.image_url && (
              <div className="mb-lg text-center border border-outline-variant/30 rounded-xl p-md bg-surface-container-low">
                <img src={q.image_url} alt="Gambar soal"
                  className="max-w-full max-h-[400px] w-auto h-auto rounded-lg shadow-sm object-contain"
                  onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'block'; }} />
                <div className="hidden text-center text-error text-body-sm py-xl">Gagal memuat gambar soal</div>
              </div>
            )}

            {/* Options */}
            {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
              <div className="space-y-md">
                {(q.options || []).map(opt => {
                  const isSelected = (currentAnswer.selected_option_ids || []).includes(opt.id);
                  return (
                    <div key={opt.id}
                      onClick={() => handleAnswerChange(q.id, opt.id)}
                      role="button" tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAnswerChange(q.id, opt.id); } }}
                      aria-pressed={isSelected}
                      className={`flex items-center gap-md p-md rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary-container/20'
                          : 'border-outline-variant/40 hover:border-primary/50 hover:bg-primary-container/10'
                      }`}>
                      <input type={q.type === 'multiple_choice' ? 'radio' : 'checkbox'}
                        checked={isSelected} onChange={() => {}}
                        className={`w-5 h-5 ${q.type === 'multiple_choice' ? 'rounded-full' : 'rounded'} accent-primary`} />
                      <span className="text-body-md text-on-surface">{opt.option_text}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Essay textarea */}
            {q.type === 'essay' && (
              <textarea value={currentAnswer.answer_text || ''}
                onChange={e => handleAnswerChange(q.id, e.target.value)}
                placeholder="Tulis jawaban Anda di sini..."
                className="w-full px-4 py-3 rounded-xl border border-outline bg-surface text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none min-h-[150px]" />
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between gap-md">
            <button onClick={handlePrev} disabled={isFirstQuestion}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-label-sm font-medium transition-colors ${
                isFirstQuestion ? 'text-outline cursor-not-allowed' : 'text-on-surface-variant hover:bg-surface-container-high'
              }`} aria-label="Previous question">
              <ChevronLeft className="w-4 h-4" /> Sebelumnya
            </button>
            {isLastQuestion ? (
              <button onClick={handleManualSubmit} disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-label-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50" aria-label="Submit exam">
                <Send className="w-4 h-4" />
                {submitting ? 'Mengumpulkan...' : 'Kumpulkan'}
              </button>
            ) : (
              <button onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-label-sm font-medium hover:bg-primary/90 transition-colors shadow-sm" aria-label="Next question">
                Selanjutnya <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPlayerPage;