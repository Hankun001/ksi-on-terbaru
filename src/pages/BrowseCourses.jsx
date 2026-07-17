import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

// Education level options
const EDUCATION_LEVELS = [
  { value: '', label: 'Semua Jenjang' },
  { value: 'sd', label: 'SD (Sekolah Dasar)' },
  { value: 'smp', label: 'SMP (Sekolah Menengah Pertama)' },
  { value: 'sma', label: 'SMA (Sekolah Menengah Atas)' }
];

// Grade level options based on education level
const getGradeLevels = (eduLevel) => {
  const allGrades = [
    { value: '', label: 'Semua Kelas' }
  ];
  
  if (eduLevel === 'sd') {
    return [
      ...allGrades,
      ...Array.from({ length: 6 }, (_, i) => ({
        value: i + 1,
        label: `Kelas ${i + 1}`
      }))
    ];
  } else if (eduLevel === 'smp' || eduLevel === 'sma') {
    return [
      ...allGrades,
      ...Array.from({ length: 3 }, (_, i) => ({
        value: i + 1,
        label: `Kelas ${i + 1}`
      }))
    ];
  }
  
  return [
    { value: '', label: 'Semua Kelas' },
    ...Array.from({ length: 6 }, (_, i) => ({
      value: i + 1,
      label: `Kelas ${i + 1}`
    }))
  ];
};

// Subject options
const SUBJECTS = [
  { value: '', label: 'Semua Pelajaran' },
  { value: 'matematika', label: '🔢 Matematika' },
  { value: 'bahasa_indonesia', label: '📝 Bahasa Indonesia' },
  { value: 'bahasa_inggris', label: '🌍 Bahasa Inggris' },
  { value: 'ipa', label: '🔬 IPA' },
  { value: 'ips', label: '📚 IPS' },
  { value: 'pkn', label: '🏛️ PKN' },
  { value: 'penjas', label: '⚽ Penjasorkes' },
  { value: 'seni_budaya', label: '🎨 Seni Budaya' },
  { value: 'prakarya', label: '🔧 Prakarya' },
  { value: 'agama', label: '🙏 Agama' },
  { value: 'ti', label: '💻 TI/Informatika' }
];

// Get display text for education level
const getEducationLevelDisplay = (level) => {
  const found = EDUCATION_LEVELS.find(l => l.value === level);
  return found ? found.label.replace('SD (Sekolah Dasar)', 'SD')
    .replace('SMP (Sekolah Menengah Pertama)', 'SMP')
    .replace('SMA (Sekolah Menengah Atas)', 'SMA') : '';
};

// Get display text for subject
const getSubjectDisplay = (subject) => {
  const found = SUBJECTS.find(s => s.value === subject);
  return found ? found.label : subject || '';
};

const BrowseCourses = ({ activeSection = 'browse-courses', onNavigate }) => {
  const { user } = useAuth();
  const [allCourses, setAllCourses] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseMaterials, setCourseMaterials] = useState([]);
  const [enrolling, setEnrolling] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filter, setFilter] = useState('all'); // 'all', 'enrolled', 'available'
  
  // New filter states
  const [educationLevel, setEducationLevel] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subject, setSubject] = useState('');

  // Fetch all courses and user's enrollments
  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      // Get all published courses with instructor info
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          profiles:profiles!courses_instructor_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      // Get user's enrollments
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('course_id, enrolled_at')
        .eq('student_id', user.id);

      if (enrollmentError) throw enrollmentError;

      setAllCourses(coursesData || []);
      setMyEnrollments(enrollmentData || []);

    } catch (error) {
      console.error('Error fetching data:', error.message);
      setError('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch course materials when a course is selected
  const fetchCourseMaterials = async (courseId) => {
    try {
      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: true });

      if (materialsError) throw materialsError;
      setCourseMaterials(materialsData || []);
    } catch (error) {
      console.error('Error fetching materials:', error.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseMaterials(selectedCourse.id);
    }
  }, [selectedCourse]);

  // Check if user is enrolled in a course
  const isEnrolled = (courseId) => {
    return myEnrollments.some(e => e.course_id === courseId);
  };

  // Handle enrollment
  const handleEnroll = async (courseId) => {
    try {
      setEnrolling(true);

      // Check if already enrolled
      if (isEnrolled(courseId)) {
        alert('Anda sudah terdaftar di kursus ini.');
        return;
      }

      const { error } = await supabase
        .from('enrollments')
        .insert({
          student_id: user.id,
          course_id: courseId,
          enrolled_at: new Date().toISOString()
        });

      if (error) throw error;

      // Refresh enrollments
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select('course_id, enrolled_at')
        .eq('student_id', user.id);

      setMyEnrollments(enrollmentData || []);
      alert('Berhasil mendaftar kursus! 🎉\n\nSekarang Anda dapat mengakses materi dan tugas kursus ini.');

    } catch (error) {
      alert('Gagal mendaftar: ' + error.message);
    } finally {
      setEnrolling(false);
    }
  };

  // Filter courses with all filters
  const filteredCourses = allCourses.filter(course => {
    // Search filter
    const matchesSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.subject_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Enrollment filter
    let matchesEnrollment = true;
    if (filter === 'enrolled') {
      matchesEnrollment = isEnrolled(course.id);
    } else if (filter === 'available') {
      matchesEnrollment = !isEnrolled(course.id);
    }
    
    // Education level filter
    const matchesEducationLevel = !educationLevel || course.education_level === educationLevel;
    
    // Grade level filter
    const matchesGradeLevel = !gradeLevel || course.grade_level === parseInt(gradeLevel);
    
    // Subject filter
    const matchesSubject = !subject || course.subject === subject;
    
    return matchesSearch && matchesEnrollment && matchesEducationLevel && matchesGradeLevel && matchesSubject;
  });

  // Get instructor name
  const getInstructorName = (course) => {
    if (course.profiles?.full_name) return course.profiles.full_name;
    if (course.profiles?.email) return course.profiles.email.split('@')[0];
    return 'Guru';
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="spinner spinner-medium"></div>
          <p>Memuat kursus...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
        <button onClick={fetchData} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>📚 Jelajahi Kursus</h1>
          <p>Temukan kursus menarik dari guru-guru terbaik</p>
        </div>
        <div className="view-toggle">
          <button 
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('grid')}
          >
            ⊞ Grid
          </button>
          <button 
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('list')}
          >
            ☰ List
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filter-section" style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="🔍 Cari kursus..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          style={{ 
            width: '100%', 
            maxWidth: '400px',
            padding: '0.75rem 1rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            marginBottom: '1rem'
          }}
        />
        
        {/* Advanced Filters */}
        <div className="advanced-filters" style={{ 
          display: 'flex', 
          gap: '1rem', 
          flexWrap: 'wrap',
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          {/* Education Level Filter */}
          <div className="filter-group" style={{ minWidth: '180px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              marginBottom: '0.25rem',
              color: '#374151'
            }}>
              Jenjang Pendidikan
            </label>
            <select
              value={educationLevel}
              onChange={(e) => {
                setEducationLevel(e.target.value);
                setGradeLevel(''); // Reset grade level when education level changes
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                backgroundColor: 'white'
              }}
            >
              {EDUCATION_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>
          
          {/* Grade Level Filter */}
          <div className="filter-group" style={{ minWidth: '150px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              marginBottom: '0.25rem',
              color: '#374151'
            }}>
              Kelas
            </label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              disabled={!educationLevel}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                backgroundColor: !educationLevel ? '#f3f4f6' : 'white'
              }}
            >
              {getGradeLevels(educationLevel).map(grade => (
                <option key={grade.value} value={grade.value}>{grade.label}</option>
              ))}
            </select>
          </div>
          
          {/* Subject Filter */}
          <div className="filter-group" style={{ minWidth: '200px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              marginBottom: '0.25rem',
              color: '#374151'
            }}>
              Pelajaran
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                backgroundColor: 'white'
              }}
            >
              {SUBJECTS.map(sub => (
                <option key={sub.value} value={sub.value}>{sub.label}</option>
              ))}
            </select>
          </div>
          
          {/* Reset Filters Button */}
          <div className="filter-group" style={{ alignSelf: 'flex-end' }}>
            <button
              onClick={() => {
                setEducationLevel('');
                setGradeLevel('');
                setSubject('');
                setSearchTerm('');
                setFilter('all');
              }}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
            >
              🔄 Reset
            </button>
          </div>
        </div>
        
        <div className="filter-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('all')}
          >
            Semua ({allCourses.length})
          </button>
          <button 
            className={`btn btn-sm ${filter === 'enrolled' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('enrolled')}
          >
            ✓ Terdaftar ({myEnrollments.length})
          </button>
          <button 
            className={`btn btn-sm ${filter === 'available' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('available')}
          >
            Tersedia ({allCourses.length - myEnrollments.length})
          </button>
        </div>
      </div>

      {/* Course List */}
      {filteredCourses.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="cards-grid">
            {filteredCourses.map(course => (
              <CourseCard 
                key={course.id}
                course={course}
                instructorName={getInstructorName(course)}
                enrolled={isEnrolled(course.id)}
                onEnroll={() => handleEnroll(course.id)}
                onViewDetails={() => setSelectedCourse(course)}
                enrolling={enrolling}
              />
            ))}
          </div>
        ) : (
          <div className="course-list">
            {filteredCourses.map(course => (
              <CourseListItem
                key={course.id}
                course={course}
                instructorName={getInstructorName(course)}
                enrolled={isEnrolled(course.id)}
                onEnroll={() => handleEnroll(course.id)}
                onViewDetails={() => setSelectedCourse(course)}
                enrolling={enrolling}
              />
            ))}
          </div>
        )
      ) : (
        <div className="empty-state">
          <span className="empty-icon">📚</span>
          <p>Tidak ada kursus ditemukan.</p>
          {searchTerm && (
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Coba kata kunci lain.
            </p>
          )}
        </div>
      )}

      {/* Course Detail Modal */}
      {selectedCourse && (
        <CourseDetailModal
          course={selectedCourse}
          instructorName={getInstructorName(selectedCourse)}
          materials={courseMaterials}
          enrolled={isEnrolled(selectedCourse.id)}
          onEnroll={() => handleEnroll(selectedCourse.id)}
          onClose={() => setSelectedCourse(null)}
          enrolling={enrolling}
        />
      )}
    </div>
  );
};

// Course Card Component
const CourseCard = ({ course, instructorName, enrolled, onEnroll, onViewDetails, enrolling }) => (
  <div className="card card-course">
    {course.thumbnail_url && (
      <img 
        src={course.thumbnail_url} 
        alt={course.title}
        style={{ 
          width: '100%', 
          height: '140px', 
          objectFit: 'cover', 
          borderRadius: '8px 8px 0 0',
          marginBottom: '0.75rem'
        }}
      />
    )}
    <div className="card-header">
      <span className="course-code">{course.title?.substring(0, 3).toUpperCase() || 'KURSUS'}</span>
      {enrolled && <span className="enrolled-badge">✓ Terdaftar</span>}
    </div>
    <h3>{course.title}</h3>
    <p style={{ 
      overflow: 'hidden', 
      textOverflow: 'ellipsis', 
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical'
    }}>
      {course.description}
    </p>
    
    {/* Education Level and Subject Tags */}
    {(course.education_level || course.subject) && (
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '0.75rem',
        flexWrap: 'wrap'
      }}>
        {course.education_level && (
          <span style={{ 
            background: '#e0e7ff', 
            color: '#4338ca',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            {getEducationLevelDisplay(course.education_level)}
            {course.grade_level && ` Kelas ${course.grade_level}`}
          </span>
        )}
        {course.subject && (
          <span style={{ 
            background: '#dcfce7', 
            color: '#166534',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            fontSize: '0.75rem'
          }}>
            {getSubjectDisplay(course.subject)}
          </span>
        )}
      </div>
    )}
    
    <div className="instructor-info">
      <span style={{ fontSize: '0.875rem' }}>👨‍🏫 {instructorName}</span>
    </div>
    <div className="card-footer">
      <small>📅 Dibuat: {new Date(course.created_at).toLocaleDateString()}</small>
      <div className="card-actions" style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
        <button onClick={onViewDetails} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
          📄 Lihat
        </button>
        {!enrolled && (
          <button 
            onClick={onEnroll} 
            className="btn btn-primary btn-sm" 
            style={{ flex: 1 }}
            disabled={enrolling}
          >
            {enrolling ? '...' : '📝 Daftar'}
          </button>
        )}
      </div>
    </div>
  </div>
);

// Course List Item Component
const CourseListItem = ({ course, instructorName, enrolled, onEnroll, onViewDetails, enrolling }) => (
  <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
    {course.thumbnail_url ? (
      <img 
        src={course.thumbnail_url} 
        alt={course.title}
        style={{ 
          width: '120px', 
          height: '80px', 
          objectFit: 'cover', 
          borderRadius: '8px',
          flexShrink: 0
        }}
      />
    ) : (
      <div style={{ 
        width: '120px', 
        height: '80px', 
        background: '#eef2ff', 
        borderRadius: '8px',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '2rem',
        flexShrink: 0
      }}>
        📚
      </div>
    )}
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0 }}>{course.title}</h3>
        {enrolled && <span className="enrolled-badge">✓ Terdaftar</span>}
      </div>
      
      {/* Education Level and Subject Tags */}
      {(course.education_level || course.subject) && (
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          margin: '0.5rem 0',
          flexWrap: 'wrap'
        }}>
          {course.education_level && (
            <span style={{ 
              background: '#e0e7ff', 
              color: '#4338ca',
              padding: '0.2rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.7rem',
              fontWeight: '600'
            }}>
              {getEducationLevelDisplay(course.education_level)}
              {course.grade_level && ` Kelas ${course.grade_level}`}
            </span>
          )}
          {course.subject && (
            <span style={{ 
              background: '#dcfce7', 
              color: '#166534',
              padding: '0.2rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.7rem'
            }}>
              {getSubjectDisplay(course.subject)}
            </span>
          )}
        </div>
      )}
      
      <p style={{ margin: '0.25rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
        👨‍🏫 {instructorName}
      </p>
      <p style={{ margin: '0.25rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
        📅 {new Date(course.created_at).toLocaleDateString()}
      </p>
    </div>
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button onClick={onViewDetails} className="btn btn-secondary btn-sm">
        📄 Lihat
      </button>
      {!enrolled && (
        <button 
          onClick={onEnroll} 
          className="btn btn-primary btn-sm"
          disabled={enrolling}
        >
          {enrolling ? '...' : '📝 Daftar'}
        </button>
      )}
    </div>
  </div>
);

// Course Detail Modal Component
const CourseDetailModal = ({ course, instructorName, materials, enrolled, onEnroll, onClose, enrolling }) => {
  // Determine file type icon
  const getFileIcon = (url) => {
    if (!url) return '📄';
    const ext = url.split('.').pop().toLowerCase();
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return '🎬';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    if (['pdf'].includes(ext)) return '📑';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx'].includes(ext)) return '📊';
    if (['ppt', 'pptx'].includes(ext)) return '📽️';
    if (['zip', 'rar', '7z'].includes(ext)) return '📦';
    return '📎';
  };

  // Get file type category
  const getFileType = (url) => {
    if (!url) return 'other';
    const ext = url.split('.').pop().toLowerCase();
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    return 'document';
  };

  // Group materials by type
  const videos = materials.filter(m => getFileType(m.file_url) === 'video');
  const images = materials.filter(m => getFileType(m.file_url) === 'image');
  const documents = materials.filter(m => getFileType(m.file_url) === 'document' || !m.file_url);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2>📚 {course.title}</h2>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          {/* Course Info */}
          {course.thumbnail_url && (
            <img 
              src={course.thumbnail_url} 
              alt={course.title}
              style={{ 
                width: '100%', 
                height: '250px', 
                objectFit: 'cover', 
                borderRadius: '8px',
                marginBottom: '1rem'
              }}
            />
          )}
          
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>{course.description}</p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              👨‍🏫 Guru: <strong>{instructorName}</strong>
            </p>
            
            {/* Education Level and Subject Info */}
            {(course.education_level || course.subject) && (
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginTop: '0.75rem',
                flexWrap: 'wrap'
              }}>
                {course.education_level && (
                  <span style={{ 
                    background: '#e0e7ff', 
                    color: '#4338ca',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    📚 {getEducationLevelDisplay(course.education_level)}
                    {course.grade_level && ` Kelas ${course.grade_level}`}
                  </span>
                )}
                {course.subject && (
                  <span style={{ 
                    background: '#dcfce7', 
                    color: '#166534',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}>
                    📖 {getSubjectDisplay(course.subject)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Enrollment Status */}
          {enrolled ? (
            <div style={{ 
              padding: '1rem', 
              background: '#d1fae5', 
              borderRadius: '8px', 
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '1.5rem' }}>✅</span>
              <p style={{ margin: '0.5rem 0 0 0', color: '#059669', fontWeight: '600' }}>
                Anda sudah terdaftar di kursus ini
              </p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#047857' }}>
                Silakan akses materi dan tugas yang tersedia.
              </p>
              <button 
                onClick={() => onNavigate && onNavigate(`course-view-${course.id}`)}
                className="btn btn-primary"
                style={{ marginTop: '1rem', padding: '0.75rem 1.5rem' }}
              >
                🎬 Masuk ke Kursus
              </button>
            </div>
          ) : (
            <button 
              onClick={onEnroll}
              disabled={enrolling}
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginBottom: '1.5rem' }}
            >
              {enrolling ? 'Memproses...' : '📝 Daftar Kursus Ini'}
            </button>
          )}

          {/* Materials Section */}
          {enrolled && materials.length > 0 && (
            <div className="materials-section">
              <h3 style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
                📚 Materi Pembelajaran
              </h3>

              {/* Videos */}
              {videos.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ color: '#4f46e5', marginBottom: '0.75rem' }}>🎬 Video Pembelajaran</h4>
                  <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                    {videos.map(material => (
                      <div key={material.id} className="card" style={{ padding: '1rem' }}>
                        <div style={{ 
                          background: '#1f2937', 
                          borderRadius: '8px', 
                          height: '120px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          marginBottom: '0.5rem'
                        }}>
                          <span style={{ fontSize: '3rem' }}>🎬</span>
                        </div>
                        <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>{material.title}</h5>
                        {material.description && (
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                            {material.description}
                          </p>
                        )}
                        <a 
                          href={material.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{ marginTop: '0.5rem', width: '100%', display: 'block', textAlign: 'center' }}
                        >
                          ▶️ Tonton Video
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Images */}
              {images.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ color: '#10b981', marginBottom: '0.75rem' }}>🖼️ Gambar & Infografis</h4>
                  <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                    {images.map(material => (
                      <div key={material.id} className="card" style={{ padding: '1rem' }}>
                        <img 
                          src={material.file_url} 
                          alt={material.title}
                          style={{ 
                            width: '100%', 
                            height: '120px', 
                            objectFit: 'cover', 
                            borderRadius: '8px',
                            marginBottom: '0.5rem'
                          }}
                        />
                        <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>{material.title}</h5>
                        <a 
                          href={material.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ marginTop: '0.5rem', width: '100%', display: 'block', textAlign: 'center' }}
                        >
                          🔍 Lihat Gambar
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {documents.length > 0 && (
                <div>
                  <h4 style={{ color: '#f59e0b', marginBottom: '0.75rem' }}>📄 Dokumen & Materi</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {documents.map(material => (
                      <div 
                        key={material.id}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '1rem',
                          padding: '1rem',
                          background: '#f9fafb',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <span style={{ fontSize: '2rem' }}>{getFileIcon(material.file_url)}</span>
                        <div style={{ flex: 1 }}>
                          <h5 style={{ margin: 0, fontSize: '1rem' }}>{material.title}</h5>
                          {material.description && (
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                              {material.description}
                            </p>
                          )}
                        </div>
                        <a 
                          href={material.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                        >
                          📥 Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {enrolled && materials.length === 0 && (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <span className="empty-icon">📄</span>
              <p>Belum ada materi untuk kursus ini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseCourses;
