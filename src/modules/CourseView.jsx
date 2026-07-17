import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import VideoPlayer from './VideoPlayer';
import MaterialViewer from './MaterialViewer';
import QuizTaking from './QuizTaking';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { normalizeYouTubeUrl } from '../utils/contentUtils';
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, Circle, BookOpen, X } from 'lucide-react';
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
      <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-md">
          <div className="bg-error-container text-on-error-container px-lg py-md rounded-xl text-center">
            <h2 className="text-title-md font-display mb-xs">Terjadi Kesalahan</h2>
            <p className="text-body-sm">{error}</p>
          </div>
          <button onClick={fetchData} className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-xl font-medium hover:bg-primary-container hover:text-on-primary-container transition-all">Coba Lagi</button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-md text-center">
          <BookOpen className="w-12 h-12 text-on-surface-variant opacity-40" />
          <h2 className="text-title-md font-display text-on-surface">Kursus Tidak Ditemukan</h2>
          <p className="text-body-sm text-on-surface-variant">Kursus yang Anda cari tidak ditemukan.</p>
          <button onClick={() => onNavigate('courses-murid')} className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-xl font-medium hover:bg-primary-container hover:text-on-primary-container transition-all">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Kursus
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto space-y-md">
      {/* Header */}
      <div className="bg-surface rounded-xl p-md md:p-lg border border-outline-variant/30">
        <button onClick={() => onNavigate('courses-murid')} className="inline-flex items-center gap-xs text-label-lg text-primary hover:text-primary-container transition-all mb-sm">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div>
            <h1 className="text-title-lg md:text-headline-sm font-display text-on-surface">{course.title}</h1>
            <p className="text-body-sm text-on-surface-variant">👨‍🏫 {course.instructor?.full_name || 'Instruktur'}</p>
          </div>
          <div className="flex items-center gap-md">
            <div className="flex-1 md:w-32">
              <div className="h-2 bg-surface-dim rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
              </div>
              <p className="text-label-sm text-on-surface-variant mt-xs">{completedCount}/{materials.length} ({progressPercentage}%)</p>
            </div>
            {quiz && (
              <button onClick={() => setShowQuiz(true)}
                className={`inline-flex items-center gap-xs px-md py-sm rounded-xl font-medium text-label-sm transition-all ${
                  quizAttempts.length > 0 
                    ? 'bg-tertiary-container text-on-tertiary-container hover:bg-tertiary hover:text-on-tertiary' 
                    : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container'
                }`}>
                {quizAttempts.length > 0 ? '🔄 Coba Lagi' : '📝 Kerjakan Quiz'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Materials List - Horizontal Scroll */}
      <div className="flex gap-sm overflow-x-auto pb-sm">
        {materials.map((material, index) => (
          <button key={material.id}
            onClick={() => handleSelectMaterial(index)}
            className={`flex-shrink-0 flex flex-col items-center gap-xs px-md py-sm rounded-xl border transition-all duration-200 ${
              index === currentMaterialIndex
                ? 'bg-primary-container text-on-primary-container border-primary'
                : progress[material.id]
                  ? 'bg-success-container text-on-success-container border-success-container'
                  : 'bg-surface text-on-surface-variant border-outline-variant/30 hover:border-primary/30 hover:bg-surface-container-low'
            }`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-label-sm font-bold ${
              index === currentMaterialIndex
                ? 'bg-primary text-on-primary'
                : progress[material.id]
                  ? 'bg-success text-on-success'
                  : 'bg-surface-dim text-on-surface-variant'
            }`}>
              {progress[material.id] ? <CheckCircle className="w-4 h-4" /> : index + 1}
            </span>
            <span className="text-label-sm font-medium whitespace-nowrap max-w-[100px] truncate">{material.title}</span>
            <span className="text-label-sm text-on-surface-variant">{getMaterialTypeLabel(material.material_type)}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden">
        {currentMaterial ? (
          <>
            {/* Material Header */}
            <div className="flex items-start justify-between gap-md p-lg border-b border-outline-variant/20 bg-surface-container-low">
              <div>
                <span className="inline-flex items-center bg-primary-container text-on-primary-container px-sm py-0.5 rounded-full text-label-xs font-medium mb-xs">
                  Materi {currentMaterialIndex + 1} dari {materials.length}
                </span>
                <h2 className="text-title-md font-display text-on-surface">{currentMaterial.title}</h2>
              </div>
              <button onClick={handleMarkComplete}
                disabled={isCompleting || isCurrentCompleted}
                className={`flex-shrink-0 inline-flex items-center gap-xs px-md py-sm rounded-xl font-medium text-label-sm transition-all ${
                  isCurrentCompleted
                    ? 'bg-success-container text-on-success-container cursor-default'
                    : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container'
                } disabled:opacity-50`}>
                {isCompleting ? 'Menyimpan...' : isCurrentCompleted ? (
                  <><CheckCircle className="w-4 h-4" /> Selesai</>
                ) : (
                  <><Circle className="w-4 h-4" /> Tandai Selesai</>
                )}
              </button>
            </div>

            {/* Material Content */}
            <div className="p-lg">
              <DynamicMaterialRenderer material={currentMaterial} />
            </div>

            {/* Material Description */}
            {currentMaterial.description && (
              <div className="px-lg pb-lg">
                <h3 className="text-title-sm font-display text-on-surface mb-sm">Deskripsi</h3>
                <p className="text-body-sm text-on-surface-variant">{currentMaterial.description}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-md p-lg border-t border-outline-variant/20 bg-surface-container-low">
              <button onClick={handlePrevious}
                disabled={currentMaterialIndex === 0}
                className="inline-flex items-center gap-xs px-md py-sm rounded-xl bg-surface text-on-surface-variant font-medium text-label-sm hover:bg-surface-container hover:text-on-surface transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" /> Sebelumnya
              </button>
              <span className="text-label-sm text-on-surface-variant">{currentMaterialIndex + 1} / {materials.length}</span>
              <button onClick={handleNext}
                disabled={currentMaterialIndex === materials.length - 1}
                className="inline-flex items-center gap-xs px-md py-sm rounded-xl bg-primary text-on-primary font-medium text-label-sm hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                Selanjutnya <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-2xl text-on-surface-variant">
            <BookOpen className="w-12 h-12 mb-sm opacity-40" />
            <p>Pilih materi dari daftar di atas untuk memulai belajar</p>
          </div>
        )}
      </div>

      {/* Quiz Modal */}
      {showQuiz && quiz && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-md" onClick={() => setShowQuiz(false)}>
          <div className="bg-surface rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
            {loadingQuiz ? (
              <div className="flex flex-col items-center justify-center py-2xl">
                <div className="w-8 h-8 rounded-full border-[3px] border-outline-variant border-t-primary animate-spin mb-md" />
                <p className="text-body-sm text-on-surface-variant">Memuat quiz...</p>
              </div>
            ) : (
              <>
                <div className="relative bg-gradient-to-br from-primary to-[#5a4fcf] rounded-t-2xl p-xl text-white">
                  <h2 className="text-title-lg font-display">{quiz.title}</h2>
                  <button onClick={() => setShowQuiz(false)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-lg space-y-md">
                  <p className="text-body-sm text-on-surface-variant">{quiz.description || 'Quiz untuk menguji pemahaman Anda'}</p>
                  <div className="flex gap-md">
                    <span className="inline-flex items-center gap-xs bg-surface-container-low px-md py-sm rounded-lg text-label-sm text-on-surface">⏱️ {quiz.time_limit} menit</span>
                    <span className="inline-flex items-center gap-xs bg-surface-container-low px-md py-sm rounded-lg text-label-sm text-on-surface">📊 Lulus: {quiz.passing_score}%</span>
                  </div>
                  
                  {/* Previous Attempt Info */}
                  {quizAttempts.length > 0 && (
                    <div className={`rounded-xl p-md text-center ${
                      quizAttempts[0].passed ? 'bg-success-container text-on-success-container' : 'bg-error-container text-on-error-container'
                    }`}>
                      <div className="text-2xl mb-xs">{quizAttempts[0].passed ? '🎉' : '📚'}</div>
                      <p className="text-label-lg font-bold">Hasil Percobaan Terakhir</p>
                      <p className="text-display-sm font-display font-bold my-xs">Skor: {quizAttempts[0].score}%</p>
                      <p className="text-label-sm font-medium">{quizAttempts[0].passed ? '✅ LULUS' : '❌ TIDAK LULUS'}</p>
                      <p className="text-label-xs mt-xs opacity-70">({quizAttempts.length} percobaan)</p>
                    </div>
                  )}
                  
                  <button onClick={() => setLoadingQuiz(true)}
                    className="w-full inline-flex items-center justify-center gap-xs bg-primary text-on-primary px-lg py-md rounded-xl font-medium text-body-md hover:bg-primary-container hover:text-on-primary-container transition-all mt-md">
                    {quizAttempts.length > 0 ? '🔄 Coba Lagi' : '🎯 Mulai Quiz Sekarang'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Quiz Taking Fullscreen */}
      {loadingQuiz && quiz && (
        <div className="fixed inset-0 bg-surface z-[10001] overflow-auto">
          <QuizTaking
            quiz={{ ...quiz, course_id: courseId }}
            onClose={() => {
              setLoadingQuiz(false);
              setShowQuiz(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CourseView;