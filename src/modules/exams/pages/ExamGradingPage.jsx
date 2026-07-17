import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { fetchTeacherExams, fetchQuestionsWithOptions, fetchExamById, fetchAttemptAnswers, updateAttemptStatusIfFullyGraded } from '../services/examService';
import { Check, X, Clock, Save, ArrowLeft, Search, BookOpen, FileSignature, AlertTriangle } from 'lucide-react';
import '../styles/examStyles.css';

const ExamGradingPage = ({ onBack }) => {
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
      <div className="dashboard-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#6b7280' }}>Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        {selectedExamId && (
          <button onClick={() => { setSelectedExamId(null); setData(null); }} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </button>
        )}
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileSignature size={28} style={{ color: '#8b5cf6' }} />
            Penilaian Ujian
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.85rem' }}>
            {selectedExamId ? 'Nilai jawaban essay siswa' : 'Pilih ujian untuk mulai menilai'}
          </p>
        </div>
      </div>

      {message && (
        <div style={{ background: '#d1fae5', color: '#065f46', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {message}
        </div>
      )}

      {!selectedExamId ? (
        // Exam selection list
        <div className="exam-grid">
          {exams.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <BookOpen size={48} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
              <p>Belum ada ujian yang perlu dinilai.</p>
            </div>
          ) : (
            exams.map(exam => (
              <div key={exam.id} className="exam-card" onClick={() => loadExamDetails(exam.id)}>
                <div className="exam-card-header">
                  <h3 className="exam-card-title">{exam.title}</h3>
                  <span className={`status-badge status-${exam.status}`}>
                    {exam.status === 'closed' ? 'Ditutup' : 'Dipublikasikan'}
                  </span>
                </div>
                <div className="exam-card-meta" style={{ marginTop: '0.5rem' }}>
                  <span className="exam-card-meta-item">
                    <Clock size={14} />
                    {exam.duration_minutes} menit
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  Klik untuk menilai jawaban essay
                </p>
              </div>
            ))
          )}
        </div>
      ) : (
        // Grading interface
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Memuat data ujian...</div>
          ) : !data || data.attempts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Check size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
              <h3 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Semua Sudah Dinilai</h3>
              <p style={{ color: '#6b7280' }}>Tidak ada jawaban essay yang perlu dinilai.</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', color: '#1f2937', margin: 0 }}>{data.exam.title}</h2>
                <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                  {data.attempts.length} siswa perlu dinilai • {data.questions.length} soal essay
                </p>
              </div>

              {data.attempts.map(attempt => (
                <div key={attempt.id} style={{ 
                  background: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '12px', 
                  padding: '1.25rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '1rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 'bold', fontSize: '1rem'
                      }}>
                        {getStudentName(attempt).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1f2937' }}>{getStudentName(attempt)}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                          {attempt.score !== null ? `Nilai saat ini: ${attempt.score}` : 'Belum dinilai'}
                        </div>
                      </div>
                    </div>
                    <span className={`status-badge ${attempt.status === 'submitted' ? 'status-published' : 'status-closed'}`}>
                      {attempt.status === 'submitted' ? 'Submit Manual' : 'Auto Submit'}
                    </span>
                  </div>

                  {/* Essay answers */}
                  {attempt.answers
                    .filter(a => data.questions.some(q => q.id === a.question_id))
                    .map(answer => {
                      const question = data.questions.find(q => q.id === answer.question_id);
                      const gradeKey = `${attempt.id}-${answer.question_id}`;
                      const grade = gradingState[gradeKey] || { points: 0, maxPoints: question?.points || 1 };
                      const isSaved = answer.points_earned !== null && answer.points_earned !== undefined;
                      
                      return (
                        <div key={answer.id} style={{
                          background: '#f9fafb',
                          borderRadius: '8px',
                          padding: '1rem',
                          marginTop: '0.75rem'
                        }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1f2937', marginBottom: '0.5rem' }}>
                            {question?.question || 'Soal essay'}
                          </div>

                          {/* Student's answer */}
                          <div style={{
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            marginBottom: '0.75rem',
                            fontSize: '0.9rem',
                            color: '#374151',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap'
                          }}>
                            {answer.answer_text || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Tidak dijawab</span>}
                          </div>

                          {/* Grading input */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Nilai:</span>
                              <input
                                type="number"
                                value={grade.points}
                                onChange={e => handleGradeChange(attempt.id, answer.question_id, e.target.value)}
                                min="0"
                                max={grade.maxPoints}
                                style={{
                                  width: '80px',
                                  padding: '0.5rem',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '8px',
                                  fontSize: '0.9rem',
                                  textAlign: 'center'
                                }}
                              />
                              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>/ {grade.maxPoints}</span>
                            </div>

                            <button
                              onClick={() => handleSaveGrade(attempt.id, answer.question_id)}
                              disabled={saving === gradeKey}
                              className="btn btn-primary btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              {saving === gradeKey ? (
                                'Menyimpan...'
                              ) : isSaved ? (
                                <> <Save size={16} /> Simpan Ulang</>
                              ) : (
                                <> <Save size={16} /> Simpan Nilai</>
                              )}
                            </button>

                            {isSaved && (
                              <span style={{ color: '#059669', fontSize: '0.8rem' }}>✓ Tersimpan</span>
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