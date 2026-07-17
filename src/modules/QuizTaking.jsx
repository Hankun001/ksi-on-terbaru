import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { X, Clock, CheckCircle, XCircle, Trophy, Flame, Star, ArrowLeft, ArrowRight, Send, AlertCircle, Award, HelpCircle } from 'lucide-react';

const QuizTaking = ({ quiz, onClose }) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [previousAttempts, setPreviousAttempts] = useState([]);

  const [streakCount, setStreakCount] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState('');
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementMessage, setAchievementMessage] = useState('');

  const fetchQuestions = useCallback(async () => {
    if (!quiz || !quiz.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('order_index', { ascending: true });

      if (error) {
    
        // Check for 400 error specifically
        if (error.code === 'PGRST116' || error.message?.includes('Could not find')) {
          setQuestions([]);
        } else if (error.code === '42501') {
          setError('Tidak memiliki akses ke pertanyaan quiz');
        } else {
          setError('Gagal memuat pertanyaan: ' + error.message);
        }
        return;
      }
      console.log('Fetched questions:', data);
      setQuestions(data || []);
      setTimeLeft(quiz.time_limit * 60);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Gagal memuat pertanyaan: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [quiz]);

  const fetchPreviousAttempts = useCallback(async () => {
    try {
      // First get the attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quiz.id)
        .eq('student_id', user.id)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false });

      if (attemptsError) {
        console.warn('Error fetching attempts, setting empty:', attemptsError);
        setPreviousAttempts([]);
        return;
      }

      // Then get answers for each attempt if exists
      if (attemptsData && attemptsData.length > 0) {
        const attemptIds = attemptsData.map(a => a.id);
        
        let answersData = [];
        if (attemptIds.length > 0) {
          const { data: answers } = await supabase
            .from('quiz_answers')
            .select('*')
            .in('attempt_id', attemptIds);
          
          answersData = answers || [];
        }

        // Merge answers into attempts
        const attemptsWithAnswers = attemptsData.map(attempt => ({
          ...attempt,
          quiz_answers: answersData.filter(a => a.attempt_id === attempt.id)
        }));
        
        setPreviousAttempts(attemptsWithAnswers);
      } else {
        setPreviousAttempts([]);
      }
    } catch (err) {
      console.warn('Error fetching previous attempts:', err);
      setPreviousAttempts([]);
    }
  }, [quiz?.id, user?.id]);

  useEffect(() => {
    console.log('Running fetchEffects, quiz:', quiz);
    if (quiz && quiz.id) {
      fetchQuestions();
      fetchPreviousAttempts();
    }
  }, [quiz?.id]);

  useEffect(() => {
    let timer;
    if (quizStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizStarted, timeLeft]);

  // Gamification functions
  const showAnswerFeedback = (isCorrect, questionId) => {
    setFeedbackType(isCorrect ? 'correct' : 'incorrect');
    setShowFeedback(true);

    // Update streak
    if (isCorrect) {
      const newStreak = streakCount + 1;
      setStreakCount(newStreak);

      // Show streak achievement
      if (newStreak >= 3 && newStreak % 3 === 0) {
        setTimeout(() => {
          setFeedbackType('streak');
          setMotivationalMessage(`🔥 ${newStreak} jawaban benar berturut-turut!`);
          displayAchievement(`Streak Master! ${newStreak} jawaban benar berturut-turut!`);
        }, 500);
      }

      // Show perfect score achievement
      if (newStreak === questions.length) {
        displayAchievement('Perfect Score! Semua jawaban benar! 🏆');
      }
    } else {
      setStreakCount(0);
    }

    // Hide feedback after 2 seconds
    setTimeout(() => {
      setShowFeedback(false);
      setMotivationalMessage('');
    }, 2000);
  };

  const displayAchievement = (message) => {
    setAchievementMessage(message);
    setShowAchievement(true);
    setTimeout(() => setShowAchievement(false), 4000);
  };

  const motivationalMessages = [
    'Luar biasa! 🎉',
    'Kerja bagus! 👍',
    'Hebat sekali! 🌟',
    'Kamu pintar! 🧠',
    'Teruskan! 🚀',
    'Amazing! ✨',
    'Fantastic! 🎯',
    'Brilliant! 💫',
    'Excellent! ⭐',
    'Outstanding! 🌈',
    'Incredible! 🔥',
    'Super! ⚡',
    'Awesome! 🎊',
    'Magnificent! 👑'
  ];

  const getRandomMessage = () => {
    return motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setQuestionTransition(true);
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setQuestionTransition(false);
      }, 300);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setQuestionTransition(true);
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev - 1);
        setQuestionTransition(false);
      }, 300);
    }
  };

  const startQuiz = async () => {
    if (!user || !quiz || !quiz.id) {
      setError('Tidak dapat memulai quiz: data tidak lengkap');
      return;
    }

    try {
      console.log('Starting quiz with user:', user.id, 'quiz:', quiz.id);
      
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert([{
          quiz_id: quiz.id,
          student_id: user.id,
          started_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating attempt:', error);
        // Handle specific RLS or permission errors
        if (error.code === '42501') {
          setError('Tidak memiliki izin untuk membuat percobaan quiz');
        } else if (error.code === 'PGRST204') {
          setError('Quiz tidak ditemukan');
        } else {
          setError('Gagal memulai quiz: ' + error.message);
        }
        return;
      }
      
      if (!data) {
        setError('Gagal memulai quiz: Tidak ada respons dari server');
        return;
      }
      
      console.log('Attempt created:', data);
      setAttempt(data);
      setQuizStarted(true);
      
      // Track quiz attempt start
      trackQuizAttempt(quiz, data.id);
    } catch (err) {
      console.error('Error starting quiz:', err);
      setError('Gagal memulai quiz: ' + (err.message || 'Error tidak diketahui'));
    }
  };

  const handleAnswerChange = (questionId, selectedIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedIndex
    }));

    // Check if answer is correct and show feedback
    const currentQuestion = questions.find(q => q.id === questionId);
    if (currentQuestion) {
      const correctIndex = currentQuestion.options.findIndex(opt => opt.is_correct);
      const isCorrect = selectedIndex === correctIndex;

      // Show motivational message for correct answers
      if (isCorrect) {
        setMotivationalMessage(getRandomMessage());
      }

      showAnswerFeedback(isCorrect, questionId);
    }
  };

  // Track quiz attempt in detail tracking table
  const trackQuizAttempt = async (quizData, attemptId) => {
    try {
      // Get previous attempts count
      const { count } = await supabase
        .from('quiz_attempt_details')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id)
        .eq('quiz_id', quizData.id);
      
      await supabase
        .from('quiz_attempt_details')
        .insert([{
          student_id: user.id,
          quiz_id: quizData.id,
          course_id: quizData.course_id,
          attempt_number: (count || 0) + 1,
          started_at: new Date().toISOString()
        }]);
    } catch (err) {
      console.debug('Quiz attempt tracking (optional):', err.message);
    }
  };

  const updateQuizAttemptDetails = async (attemptId, score, passed, timeSpent, correct, wrong) => {
    try {
      // Find and update the most recent attempt for this quiz
      await supabase
        .from('quiz_attempt_details')
        .update({
          completed_at: new Date().toISOString(),
          score: score,
          passed: passed,
          time_spent_seconds: timeSpent,
          questions_answered: correct + wrong,
          correct_answers: correct,
          wrong_answers: wrong,
          is_best_attempt: passed // Simplified - could be more complex
        })
        .eq('id', attemptId);
    } catch (err) {
      console.debug('Update quiz attempt details (optional):', err.message);
    }
  };



  const handleSubmitQuiz = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);

      // Calculate score
      let totalPoints = 0;
      let earnedPoints = 0;
      const answerInserts = [];

      questions.forEach(question => {
        const selectedIndex = answers[question.id];
        const correctIndex = question.options.findIndex(opt => opt.is_correct);
        const isCorrect = selectedIndex === correctIndex;
        const points = isCorrect ? question.points : 0;

        totalPoints += question.points;
        earnedPoints += points;

        answerInserts.push({
          attempt_id: attempt.id,
          question_id: question.id,
          selected_answer: selectedIndex,
          is_correct: isCorrect,
          points_earned: points
        });
      });

      const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const passed = score >= quiz.passing_score;

      // Insert answers
      const { error: answersError } = await supabase
        .from('quiz_answers')
        .insert(answerInserts);

      if (answersError) throw answersError;

      // Update attempt
      const { error: updateError } = await supabase
        .from('quiz_attempts')
        .update({
          submitted_at: new Date().toISOString(),
          score: score,
          passed: passed
        })
        .eq('id', attempt.id);

      if (updateError) throw updateError;

      setResults({
        score,
        passed,
        totalPoints,
        earnedPoints,
        answers: answerInserts
      });

      // Update quiz attempt details for tracking
      const timeSpent = quiz.time_limit * 60 - timeLeft;
      const correctCount = answerInserts.filter(a => a.is_correct).length;
      const wrongCount = answerInserts.filter(a => !a.is_correct).length;
      updateQuizAttemptDetails(attempt.id, score, passed, timeSpent, correctCount, wrongCount);

      // Show achievement based on score
      if (score === 100) {
        displayAchievement('Perfect Score! Skor sempurna 100%! 🏆');
      } else if (passed) {
        displayAchievement('Quiz Lulus! Selamat! 🎉');
      }

      setQuizStarted(false);
      setShowResults(true);
      fetchPreviousAttempts(); // Refresh previous attempts

    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError('Gagal mengirim quiz: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <LoadingSpinner message="Memuat quiz..." />;
  }

  if (error) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop max-w-2xl mx-auto">
        <div className="bg-surface rounded-xl p-xl text-center border border-outline-variant/30 shadow-sm">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-md" />
          <h3 className="text-title-md font-semibold text-on-surface mb-sm">Terjadi Kesalahan</h3>
          <p className="text-body-md text-on-surface-variant mb-lg">{error}</p>
          <button className="px-5 py-2.5 rounded-xl text-label-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors" onClick={onClose}>Tutup</button>
        </div>
      </div>
    );
  }

  if (showResults && results) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-md">
        <div className="bg-surface rounded-2xl shadow-xl max-w-lg w-full">
          <div className="flex items-center justify-between px-xl pt-lg pb-md border-b border-outline-variant/30">
            <h2 className="text-title-lg font-semibold text-on-surface m-0">Hasil Quiz</h2>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant" onClick={onClose}><X className="w-5 h-5" /></button>
          </div>
          <div className="p-xl text-center space-y-lg">
            <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center mx-auto shadow-lg ${results.passed ? 'bg-success-container/60 text-success' : 'bg-error-container/60 text-error'}`}>
              <span className="text-3xl font-bold">{results.score}%</span>
              <span className="text-label-xs font-semibold">{results.passed ? 'LULUS' : 'TIDAK LULUS'}</span>
            </div>
            <div className="text-body-sm text-on-surface-variant space-y-1">
              <p>Skor: {results.earnedPoints}/{results.totalPoints} poin</p>
              <p>Kriteria Kelulusan: {quiz.passing_score}%</p>
            </div>
            {previousAttempts.length > 1 && (
              <div className="bg-surface-container-low rounded-xl p-md text-left">
                <h3 className="text-title-sm font-semibold text-on-surface mb-sm">Hasil Percobaan Sebelumnya</h3>
                <div className="space-y-1">
                  {previousAttempts.slice(1).map((a, i) => (
                    <div key={a.id} className="flex justify-between text-body-sm">
                      <span className="text-on-surface-variant">Percobaan {previousAttempts.length - i}</span>
                      <span className="font-semibold text-on-surface">{a.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-md justify-center pt-sm">
              <button className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-label-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
                onClick={() => { setShowResults(false); setResults(null); setAnswers({}); setCurrentQuestionIndex(0); startQuiz(); }}>Coba Lagi</button>
              <button className="px-5 py-2.5 rounded-xl text-label-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors" onClick={onClose}>Tutup</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    if (questions.length === 0) {
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-md">
          <div className="bg-surface rounded-2xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between px-xl pt-lg pb-md border-b border-outline-variant/30">
              <h2 className="text-title-lg font-semibold text-on-surface m-0">{quiz.title}</h2>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant" onClick={onClose}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-xl text-center space-y-lg">
              <p className="text-body-md text-on-surface-variant">{quiz.description || 'Quiz untuk menguji pemahaman Anda'}</p>
              <div className="flex flex-wrap justify-center gap-md text-label-sm">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-lg"><Clock className="w-4 h-4" /> {quiz.time_limit} menit</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-lg"><Award className="w-4 h-4" /> Lulus: {quiz.passing_score}%</span>
              </div>
              <div className="bg-warning-container/40 rounded-xl p-md text-body-sm text-on-warning-container">
                <p>Quiz ini belum memiliki pertanyaan.</p>
                <p>Silakan hubungi guru untuk menambahkan pertanyaan.</p>
              </div>
              <button className="px-5 py-2.5 rounded-xl text-label-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors" onClick={onClose}>Tutup</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-md">
        <div className="bg-surface rounded-2xl shadow-xl max-w-lg w-full">
          <div className="flex items-center justify-between px-xl pt-lg pb-md border-b border-outline-variant/30">
            <h2 className="text-title-lg font-semibold text-on-surface m-0">{quiz.title}</h2>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant" onClick={onClose}><X className="w-5 h-5" /></button>
          </div>
          <div className="p-xl text-center space-y-lg">
            <p className="text-body-md text-on-surface-variant">{quiz.description || 'Quiz untuk menguji pemahaman Anda'}</p>
            <div className="flex flex-wrap justify-center gap-md">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-lg text-label-sm"><Clock className="w-4 h-4" /> Waktu: {quiz.time_limit} menit</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-lg text-label-sm"><Award className="w-4 h-4" /> Lulus: {quiz.passing_score}%</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-lg text-label-sm"><HelpCircle className="w-4 h-4" /> Pertanyaan: {questions.length}</span>
            </div>
            {previousAttempts.length > 0 && (
              <div className="bg-surface-container-low rounded-xl p-md text-left">
                <h3 className="text-title-sm font-semibold text-on-surface mb-sm">Hasil Percobaan Terakhir</h3>
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">Skor: {previousAttempts[0].score}%</span>
                  <span className={`font-semibold ${previousAttempts[0].passed ? 'text-success' : 'text-error'}`}>{previousAttempts[0].passed ? 'Lulus' : 'Tidak Lulus'}</span>
                </div>
              </div>
            )}
            <button className="px-6 py-3 rounded-xl bg-primary text-on-primary text-label-sm font-medium hover:bg-primary/90 transition-colors shadow-lg" onClick={startQuiz}>Mulai Quiz</button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const timePercentage = quiz.time_limit > 0 ? (timeLeft / (quiz.time_limit * 60)) * 100 : 100;

  return (
    <div className="fixed inset-0 bg-surface-container-high z-[1000] flex flex-col">
      {/* Header */}
      <div className="bg-surface border-b border-outline-variant/20 px-margin-mobile md:px-margin-desktop py-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-md">
            <h2 className="text-title-lg font-semibold text-on-surface m-0">{quiz.title}</h2>
            <span className="text-label-sm text-on-surface-variant">{currentQuestionIndex + 1} dari {questions.length}</span>
          </div>
          <div className="flex items-center gap-md">
            <div className="flex items-center gap-sm">
              <Clock className={`w-4 h-4 ${timeLeft < 300 ? 'text-error animate-pulse' : 'text-on-surface-variant'}`} />
              <span className={`text-label-sm font-mono font-semibold ${timeLeft < 300 ? 'text-error' : 'text-on-surface'}`}>{formatTime(timeLeft)}</span>
            </div>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant"
              onClick={() => { if (window.confirm('Apakah Anda yakin ingin keluar? Progress akan hilang.')) onClose(); }}><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-md">
          <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          {timeLeft < 300 && (
            <div className="w-full h-1 bg-error/30 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-error rounded-full transition-all duration-1000" style={{ width: `${timePercentage}%` }} />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop">
        <div className="max-w-3xl mx-auto space-y-lg">
          {streakCount > 0 && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${streakCount >= 3 ? 'bg-warning-container text-on-warning-container animate-pulse' : 'bg-surface-container-low text-on-surface-variant'}`}>
              <Flame className="w-4 h-4" />
              <span className="text-label-sm font-semibold">{streakCount} streak</span>
            </div>
          )}
          {motivationalMessage && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success-container/50 text-on-success-container text-label-sm font-medium">
              <Star className="w-4 h-4" /> {motivationalMessage}
            </div>
          )}

          {currentQuestion && (
            <div className="bg-surface rounded-2xl p-xl shadow-sm border border-outline-variant/30">
              <div className="flex items-start justify-between mb-lg">
                <h3 className="text-title-md font-semibold text-on-surface leading-relaxed">{currentQuestion.question_text}</h3>
                <span className="text-label-sm text-on-surface-variant shrink-0 ml-md">{currentQuestion.points} poin</span>
              </div>
              <div className="space-y-md">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = answers[currentQuestion.id] === index;
                  return (
                    <label key={index} className={`flex items-center gap-md p-md rounded-xl border-2 cursor-pointer transition-all group ${
                      isSelected
                        ? option.is_correct
                          ? 'border-success bg-success-container/20'
                          : 'border-error bg-error-container/20'
                        : 'border-outline-variant/40 hover:border-primary/50 hover:bg-primary-container/10'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-label-sm font-bold shrink-0 transition-colors ${
                        isSelected
                          ? option.is_correct ? 'bg-success text-on-success' : 'bg-error text-on-error'
                          : 'bg-surface-container-high text-on-surface-variant group-hover:bg-primary/20 group-hover:text-primary'
                      }`}>
                        {isSelected && option.is_correct ? <CheckCircle className="w-5 h-5" /> :
                         isSelected && !option.is_correct ? <XCircle className="w-5 h-5" /> :
                         String.fromCharCode(65 + index)}
                      </div>
                      <div className="flex-1">
                        <input type="radio" name={`question-${currentQuestion.id}`} value={index}
                          checked={isSelected} onChange={() => handleAnswerChange(currentQuestion.id, index)} className="sr-only" />
                        <span className="text-body-md text-on-surface">{option.text}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-md">
            <button className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-label-sm font-medium transition-colors ${
                currentQuestionIndex === 0 ? 'text-outline cursor-not-allowed' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
              onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
              <ArrowLeft className="w-4 h-4" /> Sebelumnya
            </button>
            <div className="flex items-center gap-1.5">
              {questions.map((_, index) => (
                <button key={index} onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentQuestionIndex ? 'bg-primary w-6' : answers[questions[index]?.id] !== undefined ? 'bg-success' : 'bg-outline-variant'}`} />
              ))}
            </div>
            {currentQuestionIndex === questions.length - 1 ? (
              <button className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-label-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                onClick={handleSubmitQuiz} disabled={submitting}>
                <Send className="w-4 h-4" /> {submitting ? 'Mengirim...' : 'Kirim Quiz'}
              </button>
            ) : (
              <button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-label-sm font-medium hover:bg-primary/90 transition-colors shadow-sm" onClick={handleNext}>
                Berikutnya <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showFeedback && (
        <div className={`fixed inset-0 pointer-events-none flex items-center justify-center z-[1100] ${feedbackType === 'correct' || feedbackType === 'streak' ? 'bg-success/5' : 'bg-error/5'}`}>
          <div className={`text-center ${feedbackType === 'correct' ? 'text-success' : feedbackType === 'streak' ? 'text-warning' : 'text-error'}`}>
            <div className="text-5xl mb-sm">
              {feedbackType === 'correct' ? <CheckCircle className="w-16 h-16 mx-auto" /> :
               feedbackType === 'streak' ? <Flame className="w-16 h-16 mx-auto" /> : <XCircle className="w-16 h-16 mx-auto" />}
            </div>
            <div className="text-title-lg font-bold">
              {feedbackType === 'correct' ? 'Benar!' : feedbackType === 'streak' ? motivationalMessage : 'Belum tepat'}
            </div>
            <div className="text-body-sm mt-1">
              {feedbackType === 'correct' ? 'Kerja bagus!' : feedbackType === 'streak' ? 'Kamu sedang panas!' : 'Coba lagi ya!'}
            </div>
          </div>
        </div>
      )}

      {showAchievement && (
        <div className="fixed top-4 right-4 z-[1200]">
          <div className="bg-warning-container border border-warning/40 rounded-xl p-md shadow-xl flex items-center gap-md">
            <Trophy className="w-8 h-8 text-warning" />
            <div className="text-title-sm font-semibold text-on-warning-container">{achievementMessage}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizTaking;