import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import VideoPlayer from './VideoPlayer';
import MaterialViewer from './MaterialViewer';
import QuizTaking from './QuizTaking';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { normalizeYouTubeUrl } from '../utils/contentUtils';
import './CourseView.css';

const DynamicMaterialRenderer = ({ material }) => {
  const contentType = material.content_type || material.material_type;
  const sourceType = material.source_type || 'internal';
  const fileUrl = material.file_url || material.resource_url;
  
  if (contentType === 'link') {
    return (
      <div className="materialviewer-link simple-link">
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          🔗 Buka Tautan
        </a>
      </div>
    );
  }
  
  if (contentType === 'video') {
    if (sourceType === 'youtube') {
      const embedUrl = normalizeYouTubeUrl(fileUrl);
      if (embedUrl) {
        return (
          <div className="youtube-embed-container">
            <iframe
              src={embedUrl}
              title={material.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="youtube-iframe"
            />
          </div>
        );
      }
    }
    
    return (
      <VideoPlayer 
        url={fileUrl}
        title={material.title}
      />
    );
  }
  
  if (contentType === 'document') {
    return (
      <MaterialViewer 
        material={material}
        materialType="pdf"
      />
    );
  }
  
  if (contentType === 'image') {
    return (
      <MaterialViewer 
        material={material}
        materialType="image"
      />
    );
  }
  
  return (
    <MaterialViewer 
      material={material}
      materialType="text"
    />
  );
};

const CourseView = ({ courseId, onNavigate }) => {
  const { user, profile } = useAuth();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [progress, setProgress] = useState({});
  const [currentMaterialIndex, setCurrentMaterialIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizAttempts, setQuizAttempts] = useState([]);

  const fetchData = useCallback(async () => {
    if (!user || !courseId) return;

    try {
      setLoading(true);
      setError('');

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`*, instructor:instructor_id (full_name, avatar_url, bio, email)`)
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      if (materialsError) throw materialsError;
      setMaterials(materialsData || []);

      // Get progress from material_access_log (is_completed field)
      const { data: progressData, error: progressError } = await supabase
        .from('material_access_log')
        .select('material_id, is_completed')
        .eq('student_id', user.id)
        .eq('course_id', courseId);

      if (progressError) throw progressError;

      const progressMap = {};
      progressData?.forEach(p => {
        if (p.is_completed) {
          progressMap[p.material_id] = true;
        }
      });
      setProgress(progressMap);

      // Fetch quiz if available
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .single();

      if (quizData) {
        setQuiz(quizData);
        
        // Fetch quiz attempts for this student
        const { data: attemptsData } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('quiz_id', quizData.id)
          .eq('student_id', user.id)
          .not('submitted_at', 'is', null)
          .order('submitted_at', { ascending: false });
        
        setQuizAttempts(attemptsData || []);
      }
    } catch (err) {
      console.error('Error fetching course data:', err);
      setError('Gagal memuat data kursus: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [user, courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMarkComplete = async () => {
    if (!user || !courseId || materials.length === 0) return;

    const currentMaterial = materials[currentMaterialIndex];
    if (!currentMaterial) return;

    try {
      setIsCompleting(true);

      // Update or insert into material_access_log
      const { data: existingLog } = await supabase
        .from('material_access_log')
        .select('id, access_count')
        .eq('student_id', user.id)
        .eq('material_id', currentMaterial.id)
        .single();

      if (existingLog) {
        // Update existing log
        const { error } = await supabase
          .from('material_access_log')
          .update({
            is_completed: true,
            completed_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString()
          })
          .eq('id', existingLog.id);

        if (error) throw error;
      } else {
        // Create new log entry
        const { error } = await supabase
          .from('material_access_log')
          .insert({
            student_id: user.id,
            course_id: courseId,
            material_id: currentMaterial.id,
            is_completed: true,
            completed_at: new Date().toISOString(),
            first_accessed_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString(),
            access_count: 1
          });

        if (error) throw error;
      }

      setProgress(prev => ({
        ...prev,
        [currentMaterial.id]: true
      }));

      // Note: learning_sessions will be automatically created by database trigger
      // when material_access_log is updated with is_completed = true

    } catch (err) {
      console.error('Error marking complete:', err);
      alert('Gagal menandai selesai: ' + err.message);
    } finally {
      setIsCompleting(false);
    }
  };

  const handlePrevious = () => {
    if (currentMaterialIndex > 0) {
      setCurrentMaterialIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentMaterialIndex < materials.length - 1) {
      setCurrentMaterialIndex(prev => prev + 1);
    }
  };

  const handleSelectMaterial = (index) => {
    setCurrentMaterialIndex(index);
    
    // Track material access
    if (user && materials[index]) {
      trackMaterialAccess(materials[index]);
    }
  };

  const trackMaterialAccess = async (material) => {
    try {
      // Track material access in material_access_log
      const { data: existingLog } = await supabase
        .from('material_access_log')
        .select('id, access_count, first_accessed_at')
        .eq('student_id', user.id)
        .eq('material_id', material.id)
        .single();

      if (existingLog) {
        // Update existing log
        await supabase
          .from('material_access_log')
          .update({
            last_accessed_at: new Date().toISOString(),
            access_count: existingLog.access_count + 1
          })
          .eq('id', existingLog.id);
      } else {
        // Create new log entry
        await supabase
          .from('material_access_log')
          .insert([{
            student_id: user.id,
            course_id: courseId,
            material_id: material.id,
            first_accessed_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString(),
            access_count: 1,
            time_spent_seconds: 0 // Will be updated when material is completed
          }]);
      }
    } catch (err) {
      // Silently fail - tracking is optional
      console.debug('Material access tracking (optional):', err.message);
    }
  };

  const calculateProgress = () => {
    if (materials.length === 0) return 0;
    const completedCount = Object.keys(progress).filter(key => progress[key]).length;
    return Math.round((completedCount / materials.length) * 100);
  };

  const getMaterialTypeLabel = (type) => {
    const labels = {
      'video': '📹 Video',
      'pdf': '📄 PDF',
      'image': '🖼️ Gambar',
      'text': '📝 Teks',
      'link': '🔗 Tautan'
    };
    return labels[type] || '📄 Materi';
  };

  const currentMaterial = materials[currentMaterialIndex];
  const isCurrentCompleted = currentMaterial ? progress[currentMaterial?.id] : false;
  const completedCount = Object.keys(progress).filter(key => progress[key]).length;
  const progressPercentage = calculateProgress();

  if (loading) {
    return <LoadingSpinner message="Memuat kursus..." />;
  }

  if (error) {
    return (
      <div className="courseview-error">
        <h2>Terjadi Kesalahan</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchData}>
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="courseview-not-found">
        <h2>Kursus Tidak Ditemukan</h2>
        <p>Kursus yang Anda cari tidak ditemukan.</p>
        <button className="btn btn-primary" onClick={() => onNavigate('courses-murid')}>
          Kembali ke Kursus
        </button>
      </div>
    );
  }

  return (
    <div className="courseview-wrapper-simple">
      {/* Header */}
      <div className="courseview-header-simple">
        <button
          className="back-btn-simple"
          onClick={() => onNavigate('courses-murid')}
          aria-label="Kembali ke kursus"
        >
          ← Kembali
        </button>
        <div className="course-title-simple">
          <h1 className="course-title-mobile">{course.title}</h1>
          <span className="instructor-name">👨‍🏫 {course.instructor?.full_name || 'Instruktur'}</span>
        </div>
        <div className="progress-simple">
          <div className="progress-bar-simple">
            <div
              className="progress-fill-simple" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="progress-text-simple">{completedCount}/{materials.length} selesai ({progressPercentage}%)</span>
          {quiz && (
            <button
              className={`quiz-btn-simple ${quizAttempts.length > 0 ? 'quiz-attempted' : ''}`}
              onClick={() => setShowQuiz(true)}
            >
              {quizAttempts.length > 0 ? (
                <>🔄 Quiz Sudah Dikerjakan - Coba Lagi</>
              ) : (
                <>📝 Kerjakan Quiz</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Remove the old tab-based quiz button since we now have direct button */}
      {/* Materials List - Horizontal */}
      <div className="materials-nav-simple">
        {materials.map((material, index) => (
          <button
            key={material.id}
            className={`material-tab-simple ${index === currentMaterialIndex ? 'active' : ''} ${progress[material.id] ? 'completed' : ''}`}
            onClick={() => handleSelectMaterial(index)}
          >
            <span className="material-number-simple">
              {progress[material.id] ? '✓' : index + 1}
            </span>
            <span className="material-title-simple">{material.title}</span>
            <span className="material-type-simple">{getMaterialTypeLabel(material.material_type)}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="courseview-content-simple">
        {currentMaterial ? (
          <>
            {/* Material Title */}
            <div className="material-header-simple">
              <div className="material-info-simple">
                <span className="material-badge-simple">
                  Materi {currentMaterialIndex + 1} dari {materials.length}
                </span>
                <h2>{currentMaterial.title}</h2>
              </div>
              <button 
                className={`complete-btn-simple ${isCurrentCompleted ? 'completed' : ''}`}
                onClick={handleMarkComplete}
                disabled={isCompleting || isCurrentCompleted}
              >
                {isCompleting ? 'Menyimpan...' : isCurrentCompleted ? '✓ Selesai' : 'Tandai Selesai'}
              </button>
            </div>

            {/* Material Content */}
            <div className="material-content-simple">
              <DynamicMaterialRenderer material={currentMaterial} />
            </div>

            {/* Material Description */}
            {currentMaterial.description && (
              <div className="material-description-simple">
                <h3>Deskripsi</h3>
                <p>{currentMaterial.description}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="material-nav-simple">
              <button 
                className="nav-btn-simple prev"
                onClick={handlePrevious}
                disabled={currentMaterialIndex === 0}
              >
                ← Materi Sebelumnya
              </button>
              <button 
                className="nav-btn-simple next"
                onClick={handleNext}
                disabled={currentMaterialIndex === materials.length - 1}
              >
                Materi Berikutnya →
              </button>
            </div>
          </>
        ) : (
          <div className="no-material-simple">
            <p>Pilih materi dari daftar di atas untuk memulai belajar</p>
          </div>
        )}
      </div>

      {/* Quiz Modal */}
      {showQuiz && quiz && (
        <div className="quiz-modal-overlay" onClick={() => setShowQuiz(false)}>
          <div className="quiz-modal-content" onClick={e => e.stopPropagation()}>
            {loadingQuiz ? (
              <div className="quiz-modal-loading">
                <div className="spinner"></div>
                <p>Memuat quiz...</p>
              </div>
            ) : (
              <>
                <div className="quiz-modal-header">
                  <h2>{quiz.title}</h2>
                  <button className="close-quiz-btn" onClick={() => setShowQuiz(false)}>×</button>
                </div>
                <div className="quiz-modal-body">
                  <p>{quiz.description || 'Quiz untuk menguji pemahaman Anda'}</p>
                  <div className="quiz-info">
                    <span>⏱️ Waktu: {quiz.time_limit} menit</span>
                    <span>📊 Lulus: {quiz.passing_score}%</span>
                  </div>
                  
                  {/* Previous Attempt Info */}
                  {quizAttempts.length > 0 && (
                    <div style={{ 
                      background: quizAttempts[0].passed ? '#d1fae5' : '#fee2e2', 
                      border: `1px solid ${quizAttempts[0].passed ? '#10b981' : '#ef4444'}`,
                      borderRadius: '12px',
                      padding: '1rem',
                      marginBottom: '1rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                        {quizAttempts[0].passed ? '🎉' : '📚'}
                      </div>
                      <div style={{ fontWeight: 'bold', color: quizAttempts[0].passed ? '#065f46' : '#991b1b' }}>
                        Hasil Percobaan Terakhir
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                        Skor: {quizAttempts[0].score}%
                      </div>
                      <div style={{ color: quizAttempts[0].passed ? '#047857' : '#b91c1c' }}>
                        {quizAttempts[0].passed ? '✅ LULUS' : '❌ TIDAK LULUS'}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                        ({quizAttempts.length} percobaan)
                      </div>
                    </div>
                  )}
                  
                  <button
                    className="btn btn-primary start-quiz-btn"
                    style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }}
                    onClick={() => {
                      console.log('Mulai Quiz button clicked, loadingQuiz:', !loadingQuiz);
                      setLoadingQuiz(true);
                    }}
                  >
                    {quizAttempts.length > 0 ? '🔄 Coba Lagi' : '🎯 Mulai Quiz Sekarang'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Quiz Taking Component - Show when loadingQuiz is true */}
      {loadingQuiz && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'white',
          zIndex: 10001,
          overflow: 'auto'
        }}>
          {quiz && (
            <QuizTaking
              quiz={{ ...quiz, course_id: courseId }}
              onClose={() => {
                console.log('QuizTaking onClose called');
                setLoadingQuiz(false);
                setShowQuiz(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default CourseView;