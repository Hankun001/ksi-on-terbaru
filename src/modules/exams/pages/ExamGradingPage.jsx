import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { fetchTeacherExams, fetchQuestionsWithOptions, fetchExamById, fetchAttemptAnswers, updateAttemptStatusIfFullyGraded } from '../services/examService';
import { Check, Clock, Save, ArrowLeft, BookOpen, FileSignature } from 'lucide-react';

const ExamGradingPage = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gradingState, setGradingState] = useState({});
  const [saving, setSaving] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadExams();
  }, [user]);

  const loadExams = async () => {
    try {
      const data = await fetchTeacherExams(user.id);
      setExams(data.filter(e => e.status === 'closed' || e.status === 'published'));
    } catch (err) {
      console.error('Error loading exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadExamDetails = async (examId) => {
    try {
      setLoading(true);
      setSelectedExamId(examId);
      setMessage('');

      const exam = await fetchExamById(examId);
      const questions = await fetchQuestionsWithOptions(examId);

      // Get all attempts with student info
      const { data: attempts, error: aError } = await supabase
        .from('exam_attempts')
        .select('*, profiles!exam_attempts_student_id_fkey(id, email, display_name, full_name)')
        .eq('exam_id', examId)
        .order('started_at', { ascending: true });

      if (aError) throw aError;

      // Get essay questions
      const essayQuestions = questions.filter(q => q.type === 'essay');

      // Get answers for each attempt
      const attemptsWithAnswers = await Promise.all(
        (attempts || []).map(async (attempt) => {
          const answers = await fetchAttemptAnswers(attempt.id);
          return { ...attempt, answers };
        })
      );

      // Filter only attempts that have essay answers needing grading
      const attemptsNeedingGrading = attemptsWithAnswers.filter(attempt => {
        return attempt.answers.some(a => {
          const q = questions.find(qq => qq.id === a.question_id);
          return q?.type === 'essay' && a.is_correct === null && a.answer_text?.trim();
        });
      });

      setData({
        exam,
        questions: essayQuestions,
        attempts: attemptsNeedingGrading
      });

      // Initialize grading state
      const initialGrading = {};
      attemptsNeedingGrading.forEach(attempt => {
        attempt.answers.forEach(a => {
          const q = questions.find(qq => qq.id === a.question_id);
          if (q?.type === 'essay') {
            initialGrading[`${attempt.id}-${a.question_id}`] = {
              points: a.points_earned || 0,
              maxPoints: q.points || 1
            };
          }
        });
      });
      setGradingState(initialGrading);

    } catch (err) {
      console.error('Error loading exam details:', err);
      setMessage('Gagal memuat data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (attemptId, questionId, value) => {
    const key = `${attemptId}-${questionId}`;
    setGradingState(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        points: Math.max(0, Math.min(prev[key]?.maxPoints || 1, parseInt(value) || 0))
      }
    }));
  };

  const handleSaveGrade = async (attemptId, questionId) => {
    const key = `${attemptId}-${questionId}`;
    const grade = gradingState[key];
    if (!grade) return;

    try {
      setSaving(key);
      
      // Update the answer points
      const { error: ansError } = await supabase
        .from('attempt_answers')
        .update({
          points_earned: grade.points,
          is_correct: grade.points > 0
        })
        .eq('attempt_id', attemptId)
        .eq('question_id', questionId);

      if (ansError) throw ansError;

      // Recalculate total score
      const { data: allAnswers } = await supabase
        .from('attempt_answers')
        .select('points_earned')
        .eq('attempt_id', attemptId);

      const totalScore = (allAnswers || []).reduce((sum, a) => sum + (a.points_earned || 0), 0);

      // Update attempt with new score
      const { error: updateError } = await supabase
        .from('exam_attempts')
        .update({
          score: totalScore,
          graded_by: user.id,
          graded_at: new Date().toISOString()
        })
        .eq('id', attemptId);

      if (updateError) throw updateError;

      // Check and update status if all questions are now graded
      await updateAttemptStatusIfFullyGraded(attemptId);

      if (updateError) throw updateError;

      setMessage('Nilai berhasil disimpan!');
      setTimeout(() => setMessage(''), 2000);

      // Refresh to update UI
      loadExamDetails(selectedExamId);
    } catch (err) {
      alert('Gagal menyimpan nilai: ' + err.message);
    } finally {
      setSaving(null);
    }
  };

  const getStudentName = (attempt) => {
    return attempt.profiles?.display_name || attempt.profiles?.full_name || attempt.profiles?.email || 'Unknown';
  };

  if (loading && !selectedExamId) {
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
      <div className="flex items-center gap-md">
        {selectedExamId && (
          <button onClick={() => { setSelectedExamId(null); setData(null); }} className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-higher transition-all duration-200 shrink-0">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-lg">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary/20 to-tertiary/20 flex items-center justify-center">
              <FileSignature size={28} className="text-secondary" />
            </div>
            <div>
              <h1 className="text-title-md font-semibold text-on-surface m-0">Penilaian Ujian</h1>
              <p className="text-body-sm text-on-surface-variant mt-1">{selectedExamId ? 'Nilai jawaban essay siswa' : 'Pilih ujian untuk mulai menilai'}</p>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-sm px-lg py-md rounded-xl bg-success-container text-on-success-container text-body-sm">
          <Check size={18} className="shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {!selectedExamId ? (
        /* Exam selection list */
        <>
          {exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-3xl text-on-surface-variant">
              <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-lg">
                <BookOpen size={40} className="text-outline" />
              </div>
              <p className="text-body-lg font-medium text-on-surface">Belum Ada Ujian</p>
              <p className="text-body-sm text-on-surface-variant mt-1">Belum ada ujian yang perlu dinilai.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
              {exams.map(exam => (
                <button key={exam.id} onClick={() => loadExamDetails(exam.id)} className="text-left bg-surface rounded-2xl p-lg shadow-sm border border-outline-variant/30 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                  <div className="flex items-start justify-between gap-md mb-md">
                    <h3 className="text-body-lg font-semibold text-on-surface flex-1 line-clamp-2 m-0">{exam.title}</h3>
                    <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-label-xs font-medium ${exam.status === 'closed' ? 'bg-error-container text-on-error-container' : 'bg-tertiary-container text-on-tertiary-container'}`}>
                      {exam.status === 'closed' ? 'Ditutup' : 'Dipublikasikan'}
                    </span>
                  </div>
                  <div className="flex items-center gap-xs text-label-sm text-on-surface-variant mb-sm">
                    <Clock size={14} />
                    <span>{exam.duration_minutes} menit</span>
                  </div>
                  <p className="text-label-sm text-on-surface-variant m-0">Klik untuk menilai jawaban essay</p>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Grading interface */
        <>
          {loading ? (
            <div className="flex items-center justify-center py-3xl">
              <div className="flex flex-col items-center gap-md text-on-surface-variant">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-body-md">Memuat data ujian...</p>
              </div>
            </div>
          ) : !data || data.attempts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-3xl">
              <div className="w-20 h-20 rounded-full bg-success-container flex items-center justify-center mb-lg">
                <Check size={40} className="text-success" />
              </div>
              <h3 className="text-body-lg font-semibold text-on-surface mb-sm">Semua Sudah Dinilai</h3>
              <p className="text-body-sm text-on-surface-variant">Tidak ada jawaban essay yang perlu dinilai.</p>
            </div>
          ) : (
            <>
              <div className="bg-surface rounded-2xl p-lg shadow-sm border border-outline-variant/30">
                <h2 className="text-title-sm font-semibold text-on-surface m-0">{data.exam.title}</h2>
                <p className="text-label-sm text-on-surface-variant mt-1 m-0">{data.attempts.length} siswa perlu dinilai · {data.questions.length} soal essay</p>
              </div>

              {data.attempts.map(attempt => (
                <div key={attempt.id} className="bg-surface rounded-2xl p-lg shadow-sm border border-outline-variant/30 space-y-md">
                  <div className="flex items-center justify-between pb-md border-b border-outline-variant/20">
                    <div className="flex items-center gap-md">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-tertiary flex items-center justify-center text-on-primary text-label-md font-bold shrink-0">
                        {getStudentName(attempt).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-body-md font-semibold text-on-surface">{getStudentName(attempt)}</div>
                        <div className="text-label-sm text-on-surface-variant">{attempt.score !== null ? `Nilai saat ini: ${attempt.score}` : 'Belum dinilai'}</div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-label-xs font-medium ${attempt.status === 'submitted' ? 'bg-primary-container text-on-primary-container' : 'bg-tertiary-container text-on-tertiary-container'}`}>
                      {attempt.status === 'submitted' ? 'Submit Manual' : 'Auto Submit'}
                    </span>
                  </div>

                  {attempt.answers.filter(a => data.questions.some(q => q.id === a.question_id)).map(answer => {
                    const question = data.questions.find(q => q.id === answer.question_id);
                    const gradeKey = `${attempt.id}-${answer.question_id}`;
                    const grade = gradingState[gradeKey] || { points: 0, maxPoints: question?.points || 1 };
                    const isSaved = answer.points_earned !== null && answer.points_earned !== undefined;
                    return (
                      <div key={answer.id} className="bg-surface-container-low rounded-xl p-md space-y-md">
                        <p className="text-body-md font-medium text-on-surface m-0">{question?.question || 'Soal essay'}</p>
                        <div className="bg-surface rounded-lg p-md border border-outline-variant/20 text-body-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                          {answer.answer_text || <span className="text-on-surface-variant italic">Tidak dijawab</span>}
                        </div>
                        <div className="flex items-center gap-md flex-wrap">
                          <div className="flex items-center gap-sm">
                            <span className="text-label-sm text-on-surface-variant">Nilai:</span>
                            <input type="number" value={grade.points} onChange={e => handleGradeChange(attempt.id, answer.question_id, e.target.value)} min="0" max={grade.maxPoints} className="w-20 px-3 py-2 rounded-xl border border-outline bg-surface text-body-sm text-center text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                            <span className="text-label-sm text-on-surface-variant">/ {grade.maxPoints}</span>
                          </div>
                          <button onClick={() => handleSaveGrade(attempt.id, answer.question_id)} disabled={saving === gradeKey} className="inline-flex items-center gap-xs px-md py-2 rounded-xl bg-primary text-on-primary text-label-sm font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                            {saving === gradeKey ? (
                              <><div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" /> Menyimpan...</>
                            ) : (
                              <><Save size={16} /> {isSaved ? 'Simpan Ulang' : 'Simpan Nilai'}</>
                            )}
                          </button>
                          {isSaved && (
                            <span className="inline-flex items-center gap-xs text-label-sm text-success"><Check size={14} /> Tersimpan</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ExamGradingPage;