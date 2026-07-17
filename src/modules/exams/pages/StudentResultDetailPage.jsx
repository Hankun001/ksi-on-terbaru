import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { fetchExamById, fetchQuestionsWithOptions, fetchAttemptById, fetchAttemptAnswers } from '../services/examService';
import { Check, X, Clock, AlertTriangle, Printer, ArrowLeft, BookOpen, CheckSquare } from 'lucide-react';


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
    return (
      <div className="p-margin-mobile md:p-margin-desktop flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-md text-on-surface-variant">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-body-md">Memuat hasil...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop flex flex-col items-center justify-center min-h-[60vh] py-3xl">
        <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center mb-lg">
          <AlertTriangle size={40} className="text-error" />
        </div>
        <p className="text-body-lg text-on-surface">{error || 'Data tidak ditemukan'}</p>
      </div>
    );
  }

  const { exam, attempt, results, stats } = data;


  return (
    <div className="max-w-4xl mx-auto p-margin-mobile md:p-margin-desktop space-y-xl">
      {/* Back button */}
      <div className="print:hidden">
        <button onClick={onBack} className="inline-flex items-center gap-sm px-md py-2 rounded-xl bg-surface border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-higher transition-all duration-200 text-label-sm font-medium">
          <ArrowLeft size={18} />
          Kembali
        </button>
      </div>

      {/* Header */}
      <div className="text-center space-y-sm py-lg">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary/20 to-tertiary/20 flex items-center justify-center mx-auto">
          <BookOpen size={32} className="text-secondary" />
        </div>
        <h1 className="text-title-md font-bold text-on-surface m-0">{exam.title}</h1>
        <p className="text-body-sm text-on-surface-variant m-0">Hasil Ujian</p>
      </div>

      {/* Score */}
      <div className="text-center space-y-sm">
        <div className="text-5xl font-bold text-primary">
          {attempt.score !== null ? attempt.score : stats.earnedPoints}
        </div>
        <div className="text-body-sm text-on-surface-variant">
          dari {stats.totalPoints} poin
        </div>
        {stats.duration && (
          <div className="inline-flex items-center gap-xs text-label-sm text-on-surface-variant">
            <Clock size={14} />
            Durasi: {stats.duration} menit
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-md">
        <div className="bg-success rounded-2xl p-lg text-on-success text-center shadow-sm">
          <div className="text-title-lg font-bold">{stats.correctCount}</div>
          <div className="text-label-sm opacity-80">Benar</div>
        </div>
        <div className="bg-error rounded-2xl p-lg text-on-error text-center shadow-sm">
          <div className="text-title-lg font-bold">{stats.wrongCount}</div>
          <div className="text-label-sm opacity-80">Salah</div>
        </div>
        {stats.pendingCount > 0 ? (
          <div className="bg-warning rounded-2xl p-lg text-on-warning text-center shadow-sm">
            <div className="text-title-lg font-bold">{stats.pendingCount}</div>
            <div className="text-label-sm opacity-80">Menunggu Nilai</div>
          </div>
        ) : (
          <div className="bg-surface-container-high rounded-2xl p-lg text-on-surface-variant text-center shadow-sm">
            <div className="text-title-lg font-bold">0</div>
            <div className="text-label-sm">Menunggu Nilai</div>
          </div>
        )}
      </div>

      {/* Print button */}
      <div className="print:hidden text-center">
        <button onClick={handlePrint} className="inline-flex items-center gap-sm px-lg py-2.5 rounded-xl bg-surface border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-higher transition-all duration-200 text-label-sm font-medium">
          <Printer size={18} />
          Cetak Hasil
        </button>
      </div>

      {/* Question Reviews */}
      <h3 className="text-title-sm font-semibold text-on-surface">Review Jawaban</h3>

      {results.map((r, idx) => (
        <div key={r.question.id} className="bg-surface rounded-2xl p-lg shadow-sm border border-outline-variant/30 space-y-md" style={{ animationDelay: `${idx * 0.05}s` }}>
          <div className="flex items-center justify-between gap-md">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-secondary-container text-on-secondary-container text-label-xs font-semibold">
              Soal {idx + 1}
            </span>
            <span className={`inline-flex items-center gap-xs px-md py-1 rounded-full text-label-xs font-medium ${
              r.status === 'correct'
                ? 'bg-success-container text-on-success-container'
                : r.status === 'wrong'
                ? 'bg-error-container text-on-error-container'
                : 'bg-warning-container text-on-warning-container'
            }`}>
              {r.status === 'correct' ? <Check size={14} /> : r.status === 'wrong' ? <X size={14} /> : <Clock size={14} />}
              {r.status === 'correct' ? ' Benar' : r.status === 'wrong' ? ' Salah' : ' Menunggu'}
            </span>
          </div>

          <p className="text-body-md text-on-surface leading-relaxed m-0">
            {r.question.question}
          </p>

          {/* Question Image */}
          {r.question.image_url && (
            <div className="text-center border border-outline-variant/20 rounded-xl p-md bg-surface-container-low">
              <img
                src={r.question.image_url}
                alt="Gambar soal"
                className="max-w-full max-h-[300px] w-auto h-auto rounded-lg shadow-sm object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.classList.remove('hidden');
                }}
              />
              <div className="hidden text-center text-error text-label-sm p-md">
                Gagal memuat gambar soal
              </div>
            </div>
          )}

          {/* User's answer */}
          <div className="space-y-sm">
            <div className="text-label-xs text-on-surface-variant">Jawaban Anda:</div>
            {r.question.type === 'essay' ? (
              <div className="bg-surface-container-low rounded-xl p-md text-body-sm text-on-surface">
                {r.answer?.answer_text || '<Tidak dijawab>'}
              </div>
            ) : (
              <div className="space-y-xs">
                {(r.question.options || []).filter(o => r.answer?.selected_option_ids?.includes(o.id)).map(o => (
                  <div key={o.id} className={`px-md py-2 rounded-lg text-body-sm ${
                    o.is_correct
                      ? 'bg-success-container text-on-success-container'
                      : 'bg-error-container text-on-error-container'
                  }`}>
                    {o.option_text}
                    {o.is_correct ? ' ✓' : ' ✗'}
                  </div>
                ))}
                {(!r.answer?.selected_option_ids || r.answer.selected_option_ids.length === 0) && (
                  <div className="text-label-sm text-on-surface-variant italic">Tidak dijawab</div>
                )}
              </div>
            )}

            {/* Sample answer for essay questions */}
            {r.question.type === 'essay' && r.question.sample_answer && (
              <div className="space-y-xs pt-sm">
                <div className="inline-flex items-center gap-xs text-label-xs text-success">
                  <BookOpen size={14} />
                  <span className="font-medium">Jawaban Contoh:</span>
                </div>
                <div className="bg-success-container/30 rounded-xl p-md text-body-sm text-on-success-container border border-success/20">
                  {r.question.sample_answer}
                </div>
              </div>
            )}

            {/* Auto-grading info for essay questions */}
            {r.question.type === 'essay' && r.question.enable_auto_grading && (
              <div className="space-y-xs pt-sm">
                <div className="inline-flex items-center gap-xs text-label-xs text-secondary font-medium">
                  <CheckSquare size={14} />
                  Penilaian Otomatis
                </div>
                <div className="bg-secondary-container/20 rounded-xl p-md text-label-sm text-on-secondary-container border border-secondary/20">
                  <p className="m-0 mb-sm">
                    <span className="font-medium">Kata Kunci:</span> {(r.question.grading_keywords || []).join(', ') || 'Tidak ada'}
                  </p>
                  <p className="m-0">
                    <span className="font-medium">Status:</span> {r.earnedPoints > 0 ? 'Dinilai otomatis' : 'Menunggu penilaian manual'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Correct answer */}
          {(r.status === 'wrong' || r.status === 'unanswered') && r.question.type !== 'essay' && (
            <div className="space-y-xs">
              <div className="text-label-xs text-success font-medium">Jawaban Benar:</div>
              {r.question.options.filter(o => o.is_correct).map(o => (
                <div key={o.id} className="px-md py-2 rounded-lg bg-success-container text-on-success-container text-body-sm">
                  {o.option_text}
                </div>
              ))}
            </div>
          )}

          {/* Points earned */}
          <div className="text-label-sm text-on-surface-variant text-right">
            Poin: {r.earnedPoints}/{r.question.points}
          </div>
        </div>
      ))}

      {/* Printable Report */}
      <div className="hidden print:block">
        <div className="text-center mb-lg pb-lg border-b border-outline-variant/20">
          <h1 className="text-title-lg font-bold text-on-surface">{exam.title}</h1>
          <p className="text-body-sm text-on-surface-variant">Hasil Ujian Siswa</p>
          <p className="text-label-sm text-on-surface-variant">Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
        </div>
        <div className="mb-md text-body-sm text-on-surface">
          <p className="m-0">Nilai: {attempt.score !== null ? attempt.score : stats.earnedPoints} / {stats.totalPoints}</p>
          <p className="m-0">Benar: {stats.correctCount} | Salah: {stats.wrongCount} | Tidak Dinilai: {stats.pendingCount}</p>
          {stats.duration && <p className="m-0">Durasi: {stats.duration} menit</p>}
        </div>
        {results.map((r, idx) => (
          <div key={idx} className="mb-md pb-md border-b border-outline-variant/20 text-body-sm text-on-surface">
            <p className="m-0"><strong>Soal {idx + 1}:</strong> {r.question.question}</p>
            <p className="m-0"><strong>Jawaban:</strong> {r.question.type === 'essay' ? (r.answer?.answer_text || '-') : r.question.options.filter(o => r.answer?.selected_option_ids?.includes(o.id)).map(o => o.option_text).join(', ') || '-'}</p>
            {r.correctOption && <p className="m-0"><strong>Jawaban Benar:</strong> {Array.isArray(r.correctOption) ? r.correctOption.map(o => o.option_text).join(', ') : r.correctOption.option_text}</p>}
            <p className="m-0"><strong>Status:</strong> {r.status === 'correct' ? 'Benar' : r.status === 'wrong' ? 'Salah' : 'Menunggu Penilaian'} | Poin: {r.earnedPoints}/{r.question.points}</p>
          </div>
        ))}
        <div className="text-center pt-md text-label-sm text-on-surface-variant border-t border-outline-variant/20">
          Dicetak dari KSI-ON LMS
        </div>
      </div>
    </div>
  );
};

export default StudentResultDetailPage;