import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './QuizTaking.css';

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

  // Gamification states
  const [streakCount, setStreakCount] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState(''); // 'correct', 'incorrect', 'streak'
  const [particles, setParticles] = useState([]);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [questionTransition, setQuestionTransition] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementMessage, setAchievementMessage] = useState('');
  const [showCompletion, setShowCompletion] = useState(false);
  const [confetti, setConfetti] = useState([]);

  const fetchQuestions = useCallback(async () => {
    if (!quiz || !quiz.id) return;
    
    try {
      console.log('Fetching questions for quiz:', quiz.id);
      setLoading(true);
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Supabase error fetching questions:', error);
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

    // Trigger haptic feedback
    triggerHapticFeedback(isCorrect ? 'success' : 'error');

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

    // Create particles for correct answers
    if (isCorrect) {
      createParticles();
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

  const createConfetti = () => {
    const newConfetti = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10,
      size: Math.random() * 8 + 4,
      color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe'][Math.floor(Math.random() * 8)],
      velocity: {
        x: (Math.random() - 0.5) * 6,
        y: Math.random() * 3 + 2
      },
      rotation: Math.random() * 360
    }));
    setConfetti(newConfetti);

    // Remove confetti after animation
    setTimeout(() => setConfetti([]), 4000);
  };

  // Haptic feedback simulation
  const triggerHapticFeedback = (type = 'light') => {
    // Simulate haptic feedback with visual feedback
    const body = document.body;
    if (type === 'success') {
      body.style.animation = 'hapticSuccess 0.3s ease-out';
    } else if (type === 'error') {
      body.style.animation = 'hapticError 0.3s ease-out';
    } else {
      body.style.animation = 'hapticLight 0.1s ease-out';
    }

    setTimeout(() => {
      body.style.animation = '';
    }, 300);
  };

  const createParticles = () => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 10 + 5,
      color: ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 4)],
      velocity: {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4
      }
    }));
    setParticles(newParticles);

    // Remove particles after animation
    setTimeout(() => setParticles([]), 2000);
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

      // Show completion celebration with confetti
      setShowCompletion(true);
      createConfetti();
      setTimeout(() => setShowCompletion(false), 3000);

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
      <div className="quiz-error">
        <h3>Terjadi Kesalahan</h3>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={onClose}>
          Tutup
        </button>
      </div>
    );
  }

  // Show results screen after submission
  if (showResults && results) {
    return (
      <div className="quiz-results">
        <div className="quiz-results-header">
          <h2>Hasil Quiz</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="quiz-results-body">
          <div className={`score-display ${results.passed ? 'passed' : 'failed'}`}>
            <div className="score-circle">
              <span className="score-number">{results.score}%</span>
              <span className="score-label">{results.passed ? 'LULUS' : 'TIDAK LULUS'}</span>
            </div>
          </div>
          <div className="score-details">
            <p>Skor: {results.earnedPoints}/{results.totalPoints} poin</p>
            <p>Kriteria Kelulusan: {quiz.passing_score}%</p>
          </div>
          {previousAttempts.length > 1 && (
            <div className="previous-attempts">
              <h3>Hasil Percobaan Sebelumnya</h3>
              {previousAttempts.slice(1).map((attempt, index) => (
                <div key={attempt.id} className="previous-attempt">
                  <span>Percobaan {previousAttempts.length - index}: {attempt.score}%</span>
                </div>
              ))}
            </div>
          )}
          <div className="results-actions">
            <button className="btn btn-primary" onClick={() => {
              setShowResults(false);
              setResults(null);
              setAnswers({});
              setCurrentQuestionIndex(0);
              startQuiz();
            }}>
              Coba Lagi
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    // Check if quiz has questions - if not, show warning
    if (questions.length === 0) {
      return (
        <div className="quiz-start">
          <div className="quiz-start-header">
            <h2>{quiz.title}</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="quiz-start-body">
            <p>{quiz.description || 'Quiz untuk menguji pemahaman Anda'}</p>
            <div className="quiz-info">
              <div className="info-item">
                <span className="info-icon">⏱️</span>
                <span>Waktu: {quiz.time_limit} menit</span>
              </div>
              <div className="info-item">
                <span className="info-icon">📊</span>
                <span>Lulus: {quiz.passing_score}%</span>
              </div>
            </div>
            <div className="quiz-warning">
              <p>⚠️ Quiz ini belum memiliki pertanyaan.</p>
              <p>Silakan hubungi guru untuk menambahkan pertanyaan.</p>
            </div>
            <button className="btn btn-secondary" onClick={onClose}>
              Tutup
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="quiz-start">
        <div className="quiz-start-header">
          <h2>{quiz.title}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="quiz-start-body">
          <p>{quiz.description || 'Quiz untuk menguji pemahaman Anda'}</p>
          <div className="quiz-info">
            <div className="info-item">
              <span className="info-icon">⏱️</span>
              <span>Waktu: {quiz.time_limit} menit</span>
            </div>
            <div className="info-item">
              <span className="info-icon">📊</span>
              <span>Lulus: {quiz.passing_score}%</span>
            </div>
            <div className="info-item">
              <span className="info-icon">❓</span>
              <span>Pertanyaan: {questions.length}</span>
            </div>
          </div>
          {previousAttempts.length > 0 && (
            <div className="previous-attempts-preview">
              <h3>Hasil Percobaan Terakhir</h3>
              <div className="last-attempt">
                <span>Skor: {previousAttempts[0].score}%</span>
                <span>Status: {previousAttempts[0].passed ? 'Lulus' : 'Tidak Lulus'}</span>
              </div>
            </div>
          )}
          <button className="btn btn-primary start-quiz-btn" onClick={startQuiz}>
            Mulai Quiz
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const timePercentage = quiz.time_limit > 0 ? (timeLeft / (quiz.time_limit * 60)) * 100 : 100;

  return (
    <div className="quiz-taking">
      <div className="quiz-header">
        <div className="quiz-title">
          <h2>{quiz.title}</h2>
          <span className="question-counter">
            Pertanyaan {currentQuestionIndex + 1} dari {questions.length}
          </span>
        </div>
        <div className="quiz-controls">
          <div className="timer-container">
            <div className="timer">
              <span className={`timer-text ${timeLeft < 300 ? 'warning' : ''}`}>
                ⏱️ {formatTime(timeLeft)}
              </span>
            </div>
            <div className="time-bar">
              <div
                className={`time-fill ${timeLeft < 300 ? 'warning' : ''}`}
                style={{ width: `${timePercentage}%` }}
              />
            </div>
          </div>
          <button className="close-btn" onClick={() => {
            if (window.confirm('Apakah Anda yakin ingin keluar? Progress akan hilang.')) {
              onClose();
            }
          }}>×</button>
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="question-container">
        {/* Gamification Elements */}
        <div className="gamification-bar">
          {streakCount > 0 && (
            <div className="streak-counter">
              <span className="streak-icon">🔥</span>
              <span className="streak-text">{streakCount} streak</span>
            </div>
          )}
          {motivationalMessage && (
            <div className="motivational-message">
              {motivationalMessage}
            </div>
          )}
        </div>

        <div className={`question ${questionTransition ? 'transitioning' : ''}`}>
          <h3>{currentQuestion.question_text}</h3>
          <div className="options">
            {currentQuestion.options.map((option, index) => (
              <label key={index} className={`option ${answers[currentQuestion.id] === index ? (option.is_correct ? 'correct' : 'selected') : ''}`}>
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={index}
                  checked={answers[currentQuestion.id] === index}
                  onChange={() => handleAnswerChange(currentQuestion.id, index)}
                />
                <span className="option-text">{option.text}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Feedback Animation */}
        {showFeedback && (
          <div className={`feedback-overlay ${feedbackType}`}>
            <div className="feedback-content">
              {feedbackType === 'correct' && (
                <>
                  <div className="feedback-icon">✅</div>
                  <div className="feedback-text">Benar! 🎉</div>
                  <div className="feedback-subtext">Kerja bagus!</div>
                </>
              )}
              {feedbackType === 'incorrect' && (
                <>
                  <div className="feedback-icon">❌</div>
                  <div className="feedback-text">Belum tepat 😅</div>
                  <div className="feedback-subtext">Coba lagi ya!</div>
                </>
              )}
              {feedbackType === 'streak' && (
                <>
                  <div className="feedback-icon">🔥</div>
                  <div className="feedback-text">{motivationalMessage}</div>
                  <div className="feedback-subtext">Kamu sedang panas!</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Particle Effects */}
        {particles.length > 0 && (
          <div className="particles-container">
            {particles.map((particle) => (
              <div
                key={particle.id}
                className="particle"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  backgroundColor: particle.color,
                  '--velocity-x': `${particle.velocity.x}px`,
                  '--velocity-y': `${particle.velocity.y}px`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Achievement Badge */}
      {showAchievement && (
        <div className="achievement-badge">
          {achievementMessage}
        </div>
      )}

      {/* Completion Celebration */}
      {showCompletion && (
        <div className="completion-celebration">
          <div className="celebration-content">
            <div className="celebration-icon">🎉</div>
            <div className="celebration-text">Quiz Selesai!</div>
            <div>Selamat atas pencapaian Anda! 🌟</div>
          </div>
        </div>
      )}

      {/* Confetti Effect */}
      {confetti.length > 0 && (
        <div className="confetti-container">
          {confetti.map((piece) => (
            <div
              key={piece.id}
              className="confetti-piece"
              style={{
                left: `${piece.x}%`,
                top: `${piece.y}%`,
                width: `${piece.size}px`,
                height: `${piece.size}px`,
                backgroundColor: piece.color,
                '--velocity-x': `${piece.velocity.x}px`,
                '--velocity-y': `${piece.velocity.y}px`,
                '--rotation': `${piece.rotation}deg`,
              }}
            />
          ))}
        </div>
      )}

      <div className="quiz-navigation">
        <button
          className="nav-btn prev"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          ← Sebelumnya
        </button>
        <div className="question-dots">
          {questions.map((_, index) => (
            <span
              key={index}
              className={`dot ${index === currentQuestionIndex ? 'active' : ''} ${answers[questions[index].id] !== undefined ? 'answered' : ''}`}
              onClick={() => setCurrentQuestionIndex(index)}
            />
          ))}
        </div>
        {currentQuestionIndex === questions.length - 1 ? (
          <button
            className="nav-btn submit"
            onClick={handleSubmitQuiz}
            disabled={submitting}
          >
            {submitting ? 'Mengirim...' : 'Kirim Quiz'}
          </button>
        ) : (
          <button
            className="nav-btn next"
            onClick={handleNext}
          >
            Berikutnya →
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizTaking;