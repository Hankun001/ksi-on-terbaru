import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { fetchExamById, fetchQuestionsWithOptions, fetchAttemptById, fetchAttemptAnswers } from '../services/examService';
import { Check, X, Clock, AlertTriangle, Printer, ArrowLeft } from 'lucide-react';
import '../styles/examStyles.css';

const StudentResultDetailPage = ({ examId, attemptId, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [examId, attemptId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [exam, questions, attempt] = await Promise.all([
        fetchExamById(examId),
        fetchQuestionsWithOptions(examId),
        fetchAttemptById(attemptId)
      ]);

      const answers = await fetchAttemptAnswers(attemptId);

      // Build answer map
      const answerMap = {};
      answers.forEach(a => {
        answerMap[a.question_id] = a;
      });

      // Build result per question
      const results = questions.map(q => {
        const ans = answerMap[q.id];
        let status = 'unanswered';
        let correctOption = null;
        let userAnswer = null;

        if (ans) {
          userAnswer = ans;
          if (q.type === 'multiple_choice') {
            const selectedOpt = q.options.find(o => o.id === ans.selected_option_ids?.[0]);
            const correctOpt = q.options.find(o => o.is_correct);
            correctOption = correctOpt;
            status = selectedOpt?.is_correct ? 'correct' : 'wrong';
          } else if (q.type === 'checkbox') {
            const correctIds = q.options.filter(o => o.is_correct).map(o => o.id).sort();
            const userIds = (ans.selected_option_ids || []).sort();
            const isCorrect = JSON.stringify(correctIds) === JSON.stringify(userIds);
            status = isCorrect ? 'correct' : 'wrong';
            correctOption = q.options.filter(o => o.is_correct);
          } else {
            // Essay
            status = ans.is_correct === true ? 'correct' : ans.is_correct === false ? 'wrong' : 'pending';
          }
        }

        return {
          question: q,
          answer: ans,
          status,
          correctOption,
          earnedPoints: ans?.points_earned || 0
        };
      });

      const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
      const earnedPoints = results.reduce((sum, r) => sum + r.earnedPoints, 0);
      const correctCount = results.filter(r => r.status === 'correct').length;
      const wrongCount = results.filter(r => r.status === 'wrong').length;
      const pendingCount = results.filter(r => r.status === 'pending').length;

      const duration = attempt.submitted_at
        ? Math.round((new Date(attempt.submitted_at) - new Date(attempt.started_at)) / 60000)
        : null;

      setData({
        exam,
        attempt,
        results,
        stats: { totalPoints, earnedPoints, correctCount, wrongCount, pendingCount, duration }
      });
    } catch (err) {
      setError('Gagal memuat hasil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="dashboard-container" style={{ textAlign: 'center', padding: '3rem' }}><p>Memuat hasil...</p></div>;
  }

  if (error || !data) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <AlertTriangle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
        <p>{error || 'Data tidak ditemukan'}</p>
      </div>
    );
  }

  const { exam, attempt, results, stats } = data;
  const isTeacherView = !!onBack; // If onBack exists, it's teacher viewing

  return (
    <div className="student-result-container">
      {/* Back button */}
      <div className="no-print" style={{ marginBottom: '1rem' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={18} />
          Kembali
        </button>
      </div>

      {/* Header */}
      <div className="results-header">
        <h1>{exam.title}</h1>
        <p>Hasil Ujian</p>
      </div>

      {/* Score */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div className="student-score">
          {attempt.score !== null ? attempt.score : stats.earnedPoints}
        </div>
        <div className="student-score-label">
          dari {stats.totalPoints} poin
        </div>
        {stats.duration && (
          <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            <Clock size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Durasi: {stats.duration} menit
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="results-summary">
        <div className="result-summary-card" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
          <div className="result-summary-value">{stats.correctCount}</div>
          <div className="result-summary-label">Benar</div>
        </div>
        <div className="result-summary-card" style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
          <div className="result-summary-value">{stats.wrongCount}</div>
          <div className="result-summary-label">Salah</div>
        </div>
        {stats.pendingCount > 0 && (
          <div className="result-summary-card" style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
            <div className="result-summary-value">{stats.pendingCount}</div>
            <div className="result-summary-label">Menunggu Nilai</div>
          </div>
        )}
      </div>

      {/* Print button */}
      <div className="no-print" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <button onClick={handlePrint} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <Printer size={18} />
          Cetak Hasil
        </button>
      </div>

      {/* Question Reviews */}
      <h3 style={{ color: '#1f2937', marginBottom: '1rem' }}>Review Jawaban</h3>

      {results.map((r, idx) => (
        <div key={r.question.id} className="result-question-review slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.9rem' }}>
              Soal {idx + 1}
            </span>
            <span className={`result-question-status ${r.status === 'correct' ? 'result-correct' : r.status === 'wrong' ? 'result-wrong' : 'result-essay-pending'}`}>
              {r.status === 'correct' ? <Check size={14} /> : r.status === 'wrong' ? <X size={14} /> : <Clock size={14} />}
              {r.status === 'correct' ? ' Benar' : r.status === 'wrong' ? ' Salah' : ' Menunggu'}
            </span>
          </div>

          <div style={{ fontSize: '0.95rem', color: '#374151', marginBottom: '1rem', lineHeight: 1.6 }}>
            {r.question.question}
          </div>

          {/* Question Image */}
          {r.question.image_url && (
            <div style={{
              marginBottom: '1rem',
              textAlign: 'center',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '0.75rem',
              background: '#fafafa'
            }}>
              <img
                src={r.question.image_url}
                alt="Gambar soal"
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
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
                fontSize: '0.85rem',
                padding: '1rem'
              }}>
                Gagal memuat gambar soal
              </div>
            </div>
          )}

          {/* User's answer */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.35rem' }}>Jawaban Anda:</div>
            {r.question.type === 'essay' ? (
              <div style={{ background: '#f9fafb', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', color: '#374151' }}>
                {r.answer?.answer_text || '<Tidak dijawab>'}
              </div>
            ) : (
              <div>
                {(r.question.options || []).filter(o => r.answer?.selected_option_ids?.includes(o.id)).map(o => (
                  <div key={o.id} style={{
                    padding: '0.5rem 0.75rem', borderRadius: '8px', marginBottom: '0.25rem',
                    background: o.is_correct ? '#d1fae5' : '#fee2e2',
                    color: o.is_correct ? '#059669' : '#dc2626',
                    fontSize: '0.9rem'
                  }}>
                    {o.option_text}
                    {o.is_correct ? ' ✓' : ' ✗'}
                  </div>
                ))}
                {(!r.answer?.selected_option_ids || r.answer.selected_option_ids.length === 0) && (
                  <div style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9rem' }}>Tidak dijawab</div>
                )}
              </div>
            )}

            {/* Sample answer for essay questions */}
            {r.question.type === 'essay' && r.question.sample_answer && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#059669', marginBottom: '0.35rem' }}>
                  💡 Jawaban Contoh:
                </div>
                <div style={{
                  background: '#f0fdf4',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  color: '#166534',
                  border: '1px solid #bbf7d0'
                }}>
                  {r.question.sample_answer}
                </div>
              </div>
            )}

            {/* Auto-grading info for essay questions */}
            {r.question.type === 'essay' && r.question.enable_auto_grading && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#7c3aed',
                  marginBottom: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  🤖 <strong>Penilaian Otomatis</strong>
                </div>
                <div style={{
                  background: '#faf5ff',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  color: '#6b21a8',
                  border: '1px solid #d8b4fe'
                }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Kata Kunci:</strong> {(r.question.grading_keywords || []).join(', ') || 'Tidak ada'}
                  </div>
                  <div>
                    <strong>Status:</strong> {r.earnedPoints > 0 ? 'Dinilai otomatis' : 'Menunggu penilaian manual'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Correct answer */}
          {(r.status === 'wrong' || r.status === 'unanswered') && r.question.type !== 'essay' && (
            <div>
              <div style={{ fontSize: '0.8rem', color: '#059669', marginBottom: '0.35rem' }}>Jawaban Benar:</div>
              {r.question.options.filter(o => o.is_correct).map(o => (
                <div key={o.id} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', background: '#d1fae5', color: '#059669', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  {o.option_text}
                </div>
              ))}
            </div>
          )}

          {/* Points earned */}
          <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#6b7280', textAlign: 'right' }}>
            Poin: {r.earnedPoints}/{r.question.points}
          </div>
        </div>
      ))}

      {/* Printable Report */}
      <div className="printable-report" style={{ display: 'none' }}>
        <div className="print-header">
          <h1>{exam.title}</h1>
          <p>Hasil Ujian Siswa</p>
          <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <p>Nilai: {attempt.score !== null ? attempt.score : stats.earnedPoints} / {stats.totalPoints}</p>
          <p>Benar: {stats.correctCount} | Salah: {stats.wrongCount} | Tidak Dinilai: {stats.pendingCount}</p>
          {stats.duration && <p>Durasi: {stats.duration} menit</p>}
        </div>
        {results.map((r, idx) => (
          <div key={idx} style={{ marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
            <p><strong>Soal {idx + 1}:</strong> {r.question.question}</p>
            <p><strong>Jawaban:</strong> {r.question.type === 'essay' ? (r.answer?.answer_text || '-') : r.question.options.filter(o => r.answer?.selected_option_ids?.includes(o.id)).map(o => o.option_text).join(', ') || '-'}</p>
            {r.correctOption && <p><strong>Jawaban Benar:</strong> {Array.isArray(r.correctOption) ? r.correctOption.map(o => o.option_text).join(', ') : r.correctOption.option_text}</p>}
            <p><strong>Status:</strong> {r.status === 'correct' ? 'Benar' : r.status === 'wrong' ? 'Salah' : 'Menunggu Penilaian'} | Poin: {r.earnedPoints}/{r.question.points}</p>
          </div>
        ))}
        <div className="print-footer">
          <p>Dicetak dari KSI-ON LMS</p>
        </div>
      </div>
    </div>
  );
};

export default StudentResultDetailPage;