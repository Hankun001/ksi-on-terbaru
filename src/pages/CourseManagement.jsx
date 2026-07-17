import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import AddMaterialModal from '../components/AddMaterialModal';

// Education level options
const EDUCATION_LEVELS = [
  { value: '', label: '-- Pilih Jenjang --' },
  { value: 'sd', label: 'SD (Sekolah Dasar)' },
  { value: 'smp', label: 'SMP (Sekolah Menengah Pertama)' },
  { value: 'sma', label: 'SMA (Sekolah Menengah Atas)' }
];

// Grade level options based on education level
const getGradeLevels = (eduLevel) => {
  const allGrades = [{ value: '', label: '-- Pilih Kelas --' }];
  
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
    { value: '', label: '-- Pilih Kelas --' },
    ...Array.from({ length: 6 }, (_, i) => ({
      value: i + 1,
      label: `Kelas ${i + 1}`
    }))
  ];
};

// Subject options
const SUBJECTS = [
  { value: '', label: '-- Pilih Pelajaran --' },
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

// Course Management Module for Teachers
export const TeacherCourseManagement = ({ activeSection, onSectionChange }) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    education_level: '',
    grade_level: '',
    subject: '',
    subject_name: ''
  });

  const fetchCourses = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (err) {
      setError('Gagal memuat kursus: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Upload thumbnail to Supabase Storage
  const uploadThumbnail = async (file) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `course/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-thumbnails')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCourse.id);

        if (error) throw error;
        alert('Kursus berhasil diperbarui!');
      } else {
        const { error } = await supabase
          .from('courses')
          .insert({
            ...formData,
            instructor_id: user.id,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
        alert('Kursus berhasil dibuat!\n\nMurid sekarang dapat melihat dan mendaftar ke kursus ini.');
      }

      setShowModal(false);
      setEditingCourse(null);
      setFormData({ title: '', description: '', thumbnail_url: '', education_level: '', grade_level: '', subject: '', subject_name: '' });
      fetchCourses();
    } catch (err) {
      alert('Gagal menyimpan kursus: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      thumbnail_url: course.thumbnail_url || '',
      education_level: course.education_level || '',
      grade_level: course.grade_level || '',
      subject: course.subject || '',
      subject_name: course.subject_name || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kursus ini?\n\nSemua materi, tugas, dan submission terkait akan dihapus.')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      alert('Kursus berhasil dihapus!');
      fetchCourses();
    } catch (err) {
      alert('Gagal menghapus kursus: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCourse(null);
    setFormData({ title: '', description: '', thumbnail_url: '', education_level: '', grade_level: '', subject: '', subject_name: '' });
    setShowModal(true);
  };

  const handleThumbnailChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setUploading(true);
        const url = await uploadThumbnail(file);
        setFormData({ ...formData, thumbnail_url: url });
      } catch (err) {
        alert('Gagal upload gambar: ' + err.message);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Manajemen Kursus</h1>
          <p>Kelola kursus yang Anda ajarkan • {courses.length} kursus</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          + Buat Kursus Baru
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner spinner-medium"></div>
          <p>Memuat...</p>
        </div>
      ) : courses.length > 0 ? (
        <div className="cards-grid">
          {courses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onEdit={() => handleEdit(course)}
              onDelete={() => handleDelete(course.id)}
              isTeacher={true}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">📚</span>
          <p>Anda belum memiliki kursus.</p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            Buat kursus pertama Anda untuk mulai mengajar.
          </p>
          <button onClick={openCreateModal} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Buat Kursus Pertama
          </button>
        </div>
      )}

      {showModal && (
        <CourseModal
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowModal(false);
            setEditingCourse(null);
          }}
          isEditing={!!editingCourse}
          loading={loading}
          uploading={uploading}
          onThumbnailChange={handleThumbnailChange}
        />
      )}
    </div>
  );
};

// Student Course Enrollment
export const StudentCourseEnrollment = () => {
  const { user } = useAuth();
  const [allCourses, setAllCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollingId, setEnrollingId] = useState(null);

  const fetchCourses = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get enrolled course IDs
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('course_id, enrolled_at')
        .eq('student_id', user.id);

      if (enrollmentError) throw enrollmentError;

      const enrolledIds = enrollmentData?.map(e => e.course_id) || [];
      setEnrolledCourses(enrolledIds);

      // Get all available courses (not taught by this student)
      let query = supabase
        .from('courses')
        .select('*, profiles(email)')
        .neq('instructor_id', user.id);

      if (enrolledIds.length > 0) {
        query = query.not('id', 'in', enrolledIds);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setAllCourses(data || []);
    } catch (err) {
      setError('Gagal memuat kursus: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleEnroll = async (courseId) => {
    try {
      setEnrollingId(courseId);
      const { error } = await supabase
        .from('enrollments')
        .insert({
          student_id: user.id,
          course_id: courseId,
          enrolled_at: new Date().toISOString()
        });

      if (error) throw error;
      
      // Create notification for teacher
      const course = allCourses.find(c => c.id === courseId);
      if (course?.instructor_id) {
        await supabase.from('notifications').insert({
          user_id: course.instructor_id,
          type: 'enrollment',
          message: `Murid baru telah mendaftar ke kursus "${course.title}"`
        });
      }

      alert('Berhasil mendaftar ke kursus!\n\nAnda sekarang dapat mengakses materi dan tugas.');
      fetchCourses();
    } catch (err) {
      alert('Gagal mendaftar: ' + err.message);
    } finally {
      setEnrollingId(null);
    }
  };

  const handleUnenroll = async (courseId) => {
    if (!window.confirm('Apakah Anda yakin ingin keluar dari kursus ini?\n\nProgress dan submission Anda akan tetap tersimpan.')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('student_id', user.id)
        .eq('course_id', courseId);

      if (error) throw error;
      alert('Berhasil keluar dari kursus!');
      fetchCourses();
    } catch (err) {
      alert('Gagal keluar dari kursus: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Pendaftaran Kursus</h1>
          <p>{enrolledCourses.length} kursus yang Anda ikuti</p>
        </div>
        <button onClick={fetchCourses} className="btn btn-secondary">
          🔄 Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner spinner-medium"></div>
          <p>Memuat...</p>
        </div>
      ) : (
        <>
          {enrolledCourses.length > 0 && (
            <section className="dashboard-section">
              <h2>📖 Kursus Saya</h2>
              <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                {enrolledCourses.length} kursus aktif
              </p>
              <div className="cards-grid">
                {allCourses
                  .filter(c => enrolledCourses.includes(c.id))
                  .map(course => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onUnenroll={() => handleUnenroll(course.id)}
                      isEnrolled={true}
                    />
                  ))}
              </div>
            </section>
          )}

          <section className="dashboard-section">
            <h2>📚 Kursus Tersedia</h2>
            {allCourses.filter(c => !enrolledCourses.includes(c.id)).length > 0 ? (
              <div className="cards-grid">
                {allCourses
                  .filter(c => !enrolledCourses.includes(c.id))
                  .map(course => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      instructor={course.profiles?.full_name || course.profiles?.email || 'Guru'}
                      onEnroll={() => handleEnroll(course.id)}
                      enrolling={enrollingId === course.id}
                    />
                  ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📚</span>
                <p>Tidak ada kursus tersedia untuk saat ini.</p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  Tunggu guru membuat kursus baru.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

// Course Card Component
const CourseCard = ({ course, onEdit, onDelete, onEnroll, onUnenroll, instructor, isTeacher, isEnrolled, enrolling }) => {
  // Helper function to get display text
  const getSubjectDisplay = (subject) => {
    const subjectLabels = {
      'matematika': '🔢 Matematika',
      'bahasa_indonesia': '📝 Bahasa Indonesia',
      'bahasa_inggris': '🌍 Bahasa Inggris',
      'ipa': '🔬 IPA',
      'ips': '📚 IPS',
      'pkn': '🏛️ PKN',
      'penjas': '⚽ Penjasorkes',
      'seni_budaya': '🎨 Seni Budaya',
      'prakarya': '🔧 Prakarya',
      'agama': '🙏 Agama',
      'ti': '💻 TI/Informatika'
    };
    return subjectLabels[subject] || subject || '';
  };

  const getEducationLevelDisplay = (level) => {
    const levelLabels = {
      'sd': 'SD',
      'smp': 'SMP',
      'sma': 'SMA'
    };
    return levelLabels[level] || '';
  };

  return (
    <div className="card card-course">
      {course.thumbnail_url && (
        <img 
          src={course.thumbnail_url} 
          alt={course.title}
          style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px 8px 0 0' }}
        />
      )}
      <div className="card-header">
        <span className="course-code">{course.title?.substring(0, 3).toUpperCase() || 'KURSUS'}</span>
        <span className="course-icon">📚</span>
      </div>
      <h3>{course.title}</h3>
      <p>{course.description}</p>
      
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
      
      {instructor && <p className="instructor-info">👨‍🏫 Guru: {instructor}</p>}
      
      <div className="card-footer">
        <small>📅 Dibuat: {new Date(course.created_at).toLocaleDateString()}</small>
        
        {isTeacher && (
          <div className="card-actions">
            <button onClick={onEdit} className="btn btn-edit btn-sm">
              ✏️ Edit
            </button>
            <button onClick={onDelete} className="btn btn-danger btn-sm">
              🗑️ Hapus
            </button>
          </div>
        )}
        
        {onEnroll && (
          <button 
            onClick={onEnroll} 
            className="btn btn-primary btn-sm" 
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={enrolling}
          >
            {enrolling ? '⏳ Mendaftarkan...' : '📝 Daftar Kursus'}
          </button>
        )}
        
        {onUnenroll && (
          <button 
            onClick={onUnenroll} 
            className="btn btn-secondary btn-sm" 
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            🚪 Keluar dari Kursus
          </button>
        )}
        
        {isEnrolled && (
          <span className="enrolled-badge">✓ Terdaftar</span>
        )}
      </div>
    </div>
  );
};

// Course Modal Component
const CourseModal = ({ formData, setFormData, onSubmit, onClose, isEditing, loading, uploading, onThumbnailChange }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2>{isEditing ? 'Edit Kursus' : 'Buat Kursus Baru'}</h2>
        <button onClick={onClose} className="modal-close">&times;</button>
      </div>
      
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="title">Judul Kursus *</label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Contoh: Matematika Dasar"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Deskripsi Kursus *</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Deskripsi kursus yang akan dipelajari..."
            rows="4"
            required
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
          />
        </div>
        
        {/* Education Level and Subject Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label htmlFor="education_level">Jenjang Pendidikan *</label>
            <select
              id="education_level"
              value={formData.education_level}
              onChange={(e) => {
                setFormData({ 
                  ...formData, 
                  education_level: e.target.value,
                  grade_level: '' // Reset grade level when education level changes
                });
              }}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            >
              {EDUCATION_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="grade_level">Kelas *</label>
            <select
              id="grade_level"
              value={formData.grade_level}
              onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
              disabled={!formData.education_level}
              required
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.375rem',
                backgroundColor: !formData.education_level ? '#f3f4f6' : 'white'
              }}
            >
              {getGradeLevels(formData.education_level).map(grade => (
                <option key={grade.value} value={grade.value}>{grade.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="subject">Pelajaran *</label>
          <select
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
          >
            {SUBJECTS.map(sub => (
              <option key={sub.value} value={sub.value}>{sub.label}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="subject_name">Nama Pelajaran Kustom (opsional)</label>
          <input
            id="subject_name"
            type="text"
            value={formData.subject_name}
            onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
            placeholder="Contoh: Matematika Kelas 5 SD"
          />
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Nama pelajaran kustom akan ditampilkan di kartu kursus
          </p>
        </div>
        
        <div className="form-group">
          <label htmlFor="thumbnail">Thumbnail Kursus</label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={onThumbnailChange}
                disabled={uploading}
                style={{ padding: '0.5rem' }}
              />
              {uploading && <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>📤 Mengupload...</p>}
            </div>
            {formData.thumbnail_url && (
              <img 
                src={formData.thumbnail_url} 
                alt="Thumbnail" 
                style={{ width: '100px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
              />
            )}
          </div>
          {formData.thumbnail_url && (
            <button 
              type="button" 
              onClick={() => setFormData({ ...formData, thumbnail_url: '' })}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '0.5rem' }}
            >
              Hapus Gambar
            </button>
          )}
        </div>
        
        <div className="form-group">
          <p style={{ fontSize: '0.875rem', color: '#6b7280', background: '#f3f4f6', padding: '0.75rem', borderRadius: '4px' }}>
            💡 <strong>Tips:</strong> Setelah kursus dibuat, murid akan dapat melihat dan mendaftar ke kursus ini melalui halaman pendaftaran.
          </p>
        </div>
        
        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Batal
          </button>
          <button type="submit" disabled={loading || uploading} className="btn btn-primary">
            {loading ? 'Memproses...' : (isEditing ? '💾 Simpan Perubahan' : '✅ Buat Kursus')}
          </button>
        </div>
      </form>
    </div>
  </div>
);

// Course Detail Page
export const CourseDetail = ({ courseId }) => {
  const { user, role } = useAuth();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('materi');
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  // Function to refresh materials
  const refreshMaterials = async () => {
    if (!courseId) return;
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });
    if (!error) {
      setMaterials(data || []);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*, profiles(email)')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);

        // Get materials
        const { data: materialsData, error: materialsError } = await supabase
          .from('materials')
          .select('*')
          .eq('course_id', courseId)
          .order('created_at', { ascending: false });

        if (materialsError) throw materialsError;
        setMaterials(materialsData || []);

        // Get assignments
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments')
          .select('*')
          .eq('course_id', courseId)
          .order('due_date', { ascending: true });

        if (assignmentsError) throw assignmentsError;
        setAssignments(assignmentsData || []);
      } catch (err) {
        console.error('Error fetching course:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-medium"></div>
        <p>Memuat...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="dashboard-container">
        <div className="empty-state">
          <span className="empty-icon">❌</span>
          <p>Kursus tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="course-header">
        {course.thumbnail_url && (
          <img 
            src={course.thumbnail_url} 
            alt={course.title}
            style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }}
          />
        )}
        <span className="course-code">{course.title?.substring(0, 3).toUpperCase() || 'KURSUS'}</span>
        <h1>{course.title}</h1>
        <p>{course.description}</p>
        <small>👨‍🏫 Guru: {course.profiles?.full_name || course.profiles?.email || 'Tidak diketahui'}</small>
      </div>

      <div className="course-tabs">
        <button 
          className={`tab ${activeTab === 'materi' ? 'active' : ''}`}
          onClick={() => setActiveTab('materi')}
        >
          📄 Materi ({materials.length})
        </button>
        <button 
          className={`tab ${activeTab === 'tugas' ? 'active' : ''}`}
          onClick={() => setActiveTab('tugas')}
        >
          📝 Tugas ({assignments.length})
        </button>
      </div>

      <div className="course-content">
        {activeTab === 'materi' && (
          <div className="tab-content">
            <div className="tab-header">
              <h3>Daftar Materi</h3>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setEditingMaterial(null);
                  setShowMaterialModal(true);
                }}
              >
                + Tambah Materi
              </button>
            </div>
            {materials.length > 0 ? (
              <div className="materials-list">
                {materials.map(material => (
                  <div key={material.id} className="material-item">
                    <h4>{material.title}</h4>
                    <p>{material.content}</p>
                    <small>📅 {new Date(material.created_at).toLocaleDateString()}</small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📄</span>
                <p>Belum ada materi.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tugas' && (
          <div className="tab-content">
            {assignments.length > 0 ? (
              <div className="assignments-list">
                {assignments.map(assignment => (
                  <div key={assignment.id} className="assignment-item">
                    <h4>{assignment.title}</h4>
                    <p>{assignment.description}</p>
                    <small>📅 Batas Waktu: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'Tidak ada'}</small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📝</span>
                <p>Belum ada tugas.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Material Modal */}
      {course && (
        <AddMaterialModal
          isOpen={showMaterialModal}
          onClose={() => {
            setShowMaterialModal(false);
            setEditingMaterial(null);
          }}
          courseId={course.id}
          material={editingMaterial}
          onSave={() => {
            refreshMaterials();
            setShowMaterialModal(false);
            setEditingMaterial(null);
          }}
        />
      )}
    </div>
  );
};

export default { TeacherCourseManagement, StudentCourseEnrollment, CourseDetail };

// Additional styles for Course Detail
const style = document.createElement('style');
style.textContent = `
  .tab-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .tab-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }
  
  .btn-sm {
    padding: 8px 16px;
    font-size: 14px;
  }
  
  .course-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    border-bottom: 2px solid #e5e7eb;
  }
  
  .course-tabs .tab {
    padding: 12px 20px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
    transition: all 0.2s;
  }
  
  .course-tabs .tab:hover {
    color: #4f46e5;
  }
  
  .course-tabs .tab.active {
    color: #4f46e5;
    border-bottom-color: #4f46e5;
  }
  
  @media (max-width: 640px) {
    .tab-header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }
    
    .course-tabs {
      overflow-x: auto;
    }
  }
`;
document.head.appendChild(style);
