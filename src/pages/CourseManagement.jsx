import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import AddMaterialModal from '../components/AddMaterialModal';
import { BookOpen, Plus, Edit3, Trash2, X, RefreshCw, FileText, CheckCircle, AlertCircle, GraduationCap } from 'lucide-react';

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
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto space-y-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-sm md:text-headline-md font-display text-on-surface flex items-center gap-sm">
            <BookOpen className="w-6 h-6 text-primary" />
            Manajemen Kursus
          </h1>
          <p className="text-body-sm text-on-surface-variant">Kelola kursus yang Anda ajarkan • {courses.length} kursus</p>
        </div>
        <button onClick={openCreateModal} className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-xl font-medium hover:bg-primary-container hover:text-on-primary-container transition-all">
          <Plus className="w-4 h-4" />
          Buat Kursus Baru
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-xs bg-error-container text-on-error-container px-md py-sm rounded-xl">
          <AlertCircle className="w-4 h-4" />
          <span className="text-label-lg">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 rounded-full border-[3px] border-outline-variant border-t-primary animate-spin mb-md" />
          <p className="text-body-sm text-on-surface-variant animate-pulse">Memuat...</p>
        </div>
      ) : courses.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-md">
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
        <div className="flex flex-col items-center py-2xl text-on-surface-variant">
          <BookOpen className="w-12 h-12 mb-sm opacity-40" />
          <p className="text-body-md mb-xs">Anda belum memiliki kursus.</p>
          <p className="text-label-sm mb-md">Buat kursus pertama Anda untuk mulai mengajar.</p>
          <button onClick={openCreateModal} className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-xl font-medium hover:bg-primary-container hover:text-on-primary-container transition-all">
            <Plus className="w-4 h-4" /> Buat Kursus Pertama
          </button>
        </div>
      )}

      {showModal && (
        <CourseModal
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={() => { setShowModal(false); setEditingCourse(null); }}
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
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto space-y-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-sm md:text-headline-md font-display text-on-surface flex items-center gap-sm">
            <GraduationCap className="w-6 h-6 text-primary" />
            Pendaftaran Kursus
          </h1>
          <p className="text-body-sm text-on-surface-variant">{enrolledCourses.length} kursus yang Anda ikuti</p>
        </div>
        <button onClick={fetchCourses} className="inline-flex items-center gap-xs bg-surface-dim text-on-surface-variant px-md py-sm rounded-xl font-medium hover:bg-outline-variant transition-all">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-xs bg-error-container text-on-error-container px-md py-sm rounded-xl">
          <AlertCircle className="w-4 h-4" />
          <span className="text-label-lg">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 rounded-full border-[3px] border-outline-variant border-t-primary animate-spin mb-md" />
          <p className="text-body-sm text-on-surface-variant animate-pulse">Memuat...</p>
        </div>
      ) : (
        <>
          {enrolledCourses.length > 0 && (
            <section>
              <h2 className="text-title-md font-display text-on-surface mb-md flex items-center gap-xs">
                📖 Kursus Saya <span className="text-body-sm text-on-surface-variant">({enrolledCourses.length} aktif)</span>
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-md">
                {allCourses.filter(c => enrolledCourses.includes(c.id)).map(course => (
                  <CourseCard key={course.id} course={course} onUnenroll={() => handleUnenroll(course.id)} isEnrolled={true} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-title-md font-display text-on-surface mb-md">📚 Kursus Tersedia</h2>
            {allCourses.filter(c => !enrolledCourses.includes(c.id)).length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-md">
                {allCourses.filter(c => !enrolledCourses.includes(c.id)).map(course => (
                  <CourseCard key={course.id} course={course} instructor={course.profiles?.full_name || course.profiles?.email || 'Guru'} onEnroll={() => handleEnroll(course.id)} enrolling={enrollingId === course.id} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-xl text-on-surface-variant">
                <BookOpen className="w-12 h-12 mb-sm opacity-40" />
                <p>Tidak ada kursus tersedia untuk saat ini.</p>
                <p className="text-label-sm mt-xs">Tunggu guru membuat kursus baru.</p>
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
    <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden hover:border-primary/30 hover:shadow-md transition-all duration-200 group">
      {course.thumbnail_url ? (
        <img src={course.thumbnail_url} alt={course.title} className="w-full h-32 object-cover" />
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-primary-container to-tertiary-container flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-on-primary-container/40" />
        </div>
      )}
      <div className="p-md">
        <div className="flex items-center justify-between mb-sm">
          <span className="w-9 h-9 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center text-title-sm font-bold">
            {course.title?.substring(0, 2).toUpperCase() || 'KS'}
          </span>
          {isEnrolled && <span className="inline-flex items-center gap-xs px-sm py-0.5 rounded-full bg-success-container text-on-success-container text-label-xs font-medium"><CheckCircle className="w-3 h-3" /> Terdaftar</span>}
        </div>
        <h3 className="text-title-sm font-display text-on-surface font-semibold mb-xs group-hover:text-primary transition-colors">{course.title}</h3>
        <p className="text-body-sm text-on-surface-variant line-clamp-2 mb-sm">{course.description}</p>
        
        {/* Education Level and Subject Tags */}
        {(course.education_level || course.subject) && (
          <div className="flex gap-xs mb-sm flex-wrap">
            {course.education_level && (
              <span className="inline-flex items-center bg-primary-container/50 text-on-primary-container px-sm py-0.5 rounded text-label-xs font-medium">
                {getEducationLevelDisplay(course.education_level)}{course.grade_level && ` Kelas ${course.grade_level}`}
              </span>
            )}
            {course.subject && (
              <span className="inline-flex items-center bg-success-container/50 text-on-success-container px-sm py-0.5 rounded text-label-xs">
                {getSubjectDisplay(course.subject)}
              </span>
            )}
          </div>
        )}
        
        {instructor && <p className="text-label-sm text-on-surface-variant mb-sm">👨‍🏫 {instructor}</p>}
        
        <div className="flex items-center justify-between pt-sm border-t border-outline-variant/20">
          <span className="text-label-xs text-on-surface-variant">📅 {new Date(course.created_at).toLocaleDateString()}</span>
          
          {isTeacher && (
            <div className="flex gap-xs">
              <button onClick={onEdit} className="p-xs rounded-lg bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
              <button onClick={onDelete} className="p-xs rounded-lg bg-error-container text-on-error-container hover:bg-error hover:text-on-error transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}
          
          {onEnroll && (
            <button onClick={onEnroll} disabled={enrolling} className="inline-flex items-center gap-xs bg-primary text-on-primary px-sm py-xs rounded-lg text-label-xs font-medium hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50">
              {enrolling ? '⏳' : '📝 Daftar'}
            </button>
          )}
          
          {onUnenroll && (
            <button onClick={onUnenroll} className="inline-flex items-center gap-xs bg-surface-dim text-on-surface-variant px-sm py-xs rounded-lg text-label-xs font-medium hover:bg-outline-variant transition-all">
              🚪 Keluar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Course Modal Component
const CourseModal = ({ formData, setFormData, onSubmit, onClose, isEditing, loading, uploading, onThumbnailChange }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-md" onClick={onClose}>
    <div className="bg-surface rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
      <div className="relative bg-gradient-to-br from-primary to-[#5a4fcf] rounded-t-2xl p-xl text-white">
        <h2 className="text-title-lg font-display">{isEditing ? 'Edit Kursus' : 'Buat Kursus Baru'}</h2>
        <button onClick={onClose} type="button" className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all"><X className="w-4 h-4" /></button>
      </div>
      
      <form onSubmit={onSubmit} className="p-lg space-y-md">
        <div>
          <label className="block text-label-lg font-medium text-on-surface mb-xs">Judul Kursus *</label>
          <input id="title" type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Contoh: Matematika Dasar" required
            className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
        </div>
        
        <div>
          <label className="block text-label-lg font-medium text-on-surface mb-xs">Deskripsi Kursus *</label>
          <textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Deskripsi kursus yang akan dipelajari..." rows="4" required
            className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
        </div>
        
        <div className="grid md:grid-cols-2 gap-md">
          <div>
            <label className="block text-label-lg font-medium text-on-surface mb-xs">Jenjang Pendidikan *</label>
            <select id="education_level" value={formData.education_level}
              onChange={(e) => { setFormData({ ...formData, education_level: e.target.value, grade_level: '' }); }} required
              className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
              {EDUCATION_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-label-lg font-medium text-on-surface mb-xs">Kelas *</label>
            <select id="grade_level" value={formData.grade_level}
              onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
              disabled={!formData.education_level} required
              className={`w-full px-md py-sm rounded-xl border border-outline-variant text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${!formData.education_level ? 'bg-surface-dim text-on-surface-variant' : 'bg-surface text-on-surface'}`}>
              {getGradeLevels(formData.education_level).map(grade => (
                <option key={grade.value} value={grade.value}>{grade.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-label-lg font-medium text-on-surface mb-xs">Pelajaran *</label>
          <select id="subject" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required
            className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
            {SUBJECTS.map(sub => (
              <option key={sub.value} value={sub.value}>{sub.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-label-lg font-medium text-on-surface mb-xs">Nama Pelajaran Kustom (opsional)</label>
          <input id="subject_name" type="text" value={formData.subject_name} onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })} placeholder="Contoh: Matematika Kelas 5 SD"
            className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
          <p className="text-label-sm text-on-surface-variant mt-xs">Nama pelajaran kustom akan ditampilkan di kartu kursus</p>
        </div>
        
        <div>
          <label className="block text-label-lg font-medium text-on-surface mb-xs">Thumbnail Kursus</label>
          <div className="flex gap-md items-start">
            <div className="flex-1">
              <input id="thumbnail" type="file" accept="image/*" onChange={onThumbnailChange} disabled={uploading}
                className="w-full text-body-sm file:mr-md file:py-sm file:px-md file:rounded-xl file:border-0 file:text-label-sm file:font-medium file:bg-primary-container file:text-on-primary-container hover:file:bg-primary hover:file:text-on-primary transition-all" />
              {uploading && <p className="text-label-sm text-on-surface-variant mt-xs">📤 Mengupload...</p>}
            </div>
            {formData.thumbnail_url && (
              <img src={formData.thumbnail_url} alt="Thumbnail" className="w-24 h-14 object-cover rounded-lg flex-shrink-0" />
            )}
          </div>
          {formData.thumbnail_url && (
            <button type="button" onClick={() => setFormData({ ...formData, thumbnail_url: '' })}
              className="mt-xs inline-flex items-center gap-xs px-sm py-xs rounded-lg bg-error-container text-on-error-container text-label-xs font-medium hover:bg-error hover:text-on-error transition-all">
              <Trash2 className="w-3 h-3" /> Hapus Gambar
            </button>
          )}
        </div>
        
        <div className="bg-surface-container-low rounded-xl p-md">
          <p className="text-label-sm text-on-surface-variant">💡 <strong>Tips:</strong> Setelah kursus dibuat, murid akan dapat melihat dan mendaftar ke kursus ini melalui halaman pendaftaran.</p>
        </div>
        
        <div className="flex justify-end gap-sm pt-sm border-t border-outline-variant/20">
          <button type="button" onClick={onClose} className="px-lg py-sm rounded-xl bg-surface-dim text-on-surface-variant font-medium hover:bg-outline-variant transition-all">Batal</button>
          <button type="submit" disabled={loading || uploading} className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-xl font-medium hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50">
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
      <div className="flex flex-col items-center justify-center min-h-[30vh]">
        <div className="w-8 h-8 rounded-full border-[3px] border-outline-variant border-t-primary animate-spin mb-md" />
        <p className="text-body-sm text-on-surface-variant animate-pulse">Memuat...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center py-2xl text-on-surface-variant">
        <BookOpen className="w-12 h-12 mb-sm opacity-40" />
        <p>Kursus tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto space-y-lg">
      {/* Course Header */}
      <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden">
        {course.thumbnail_url && (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-48 object-cover" />
        )}
        <div className="p-lg">
          <span className="inline-flex items-center bg-primary-container text-on-primary-container px-sm py-0.5 rounded-full text-label-sm font-medium mb-sm">
            {course.title?.substring(0, 3).toUpperCase() || 'KURSUS'}
          </span>
          <h1 className="text-headline-sm font-display text-on-surface">{course.title}</h1>
          <p className="text-body-sm text-on-surface-variant mt-xs">{course.description}</p>
          <p className="text-label-sm text-on-surface-variant mt-sm">👨‍🏫 Guru: {course.profiles?.full_name || course.profiles?.email || 'Tidak diketahui'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-xs border-b border-outline-variant/30">
        <button onClick={() => setActiveTab('materi')}
          className={`px-lg py-sm text-label-lg font-medium transition-all border-b-2 -mb-[1px] ${
            activeTab === 'materi' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface'
          }`}>
          📄 Materi ({materials.length})
        </button>
        <button onClick={() => setActiveTab('tugas')}
          className={`px-lg py-sm text-label-lg font-medium transition-all border-b-2 -mb-[1px] ${
            activeTab === 'tugas' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface'
          }`}>
          📝 Tugas ({assignments.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'materi' && (
        <div>
          <div className="flex items-center justify-between mb-md">
            <h3 className="text-title-md font-display text-on-surface">Daftar Materi</h3>
            <button onClick={() => { setEditingMaterial(null); setShowMaterialModal(true); }}
              className="inline-flex items-center gap-xs bg-primary text-on-primary px-md py-sm rounded-xl text-label-sm font-medium hover:bg-primary-container hover:text-on-primary-container transition-all">
              <Plus className="w-4 h-4" /> Tambah Materi
            </button>
          </div>
          {materials.length > 0 ? (
            <div className="space-y-sm">
              {materials.map(material => (
                <div key={material.id} className="bg-surface rounded-xl p-md border border-outline-variant/30 hover:border-primary/30 transition-all">
                  <h4 className="text-title-sm font-display text-on-surface font-semibold">{material.title}</h4>
                  <p className="text-body-sm text-on-surface-variant mt-xs">{material.content}</p>
                  <p className="text-label-sm text-on-surface-variant mt-sm">📅 {new Date(material.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-xl text-on-surface-variant">
              <FileText className="w-10 h-10 mb-sm opacity-40" />
              <p>Belum ada materi.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tugas' && (
        <div>
          {assignments.length > 0 ? (
            <div className="space-y-sm">
              {assignments.map(assignment => (
                <div key={assignment.id} className="bg-surface rounded-xl p-md border border-outline-variant/30 hover:border-primary/30 transition-all">
                  <h4 className="text-title-sm font-display text-on-surface font-semibold">{assignment.title}</h4>
                  <p className="text-body-sm text-on-surface-variant mt-xs">{assignment.description}</p>
                  <p className="text-label-sm text-on-surface-variant mt-sm">
                    📅 Batas Waktu: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'Tidak ada'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-xl text-on-surface-variant">
              <FileText className="w-10 h-10 mb-sm opacity-40" />
              <p>Belum ada tugas.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Material Modal */}
      {course && (
        <AddMaterialModal
          isOpen={showMaterialModal}
          onClose={() => { setShowMaterialModal(false); setEditingMaterial(null); }}
          courseId={course.id}
          material={editingMaterial}
          onSave={() => { refreshMaterials(); setShowMaterialModal(false); setEditingMaterial(null); }}
        />
      )}
    </div>
  );
};

export default { TeacherCourseManagement, StudentCourseEnrollment, CourseDetail };

document.head.appendChild(style);
