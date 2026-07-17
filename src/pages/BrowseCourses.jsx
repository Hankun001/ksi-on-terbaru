import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { BookOpen, Search, X, RefreshCw, CheckCircle, Eye, AlertCircle, Grid3X3, List } from 'lucide-react';

const EDUCATION_LEVELS = [
  { value: '', label: 'Semua Jenjang' },
  { value: 'sd', label: 'SD (Sekolah Dasar)' },
  { value: 'smp', label: 'SMP (Sekolah Menengah Pertama)' },
  { value: 'sma', label: 'SMA (Sekolah Menengah Atas)' }
];

const getGradeLevels = (eduLevel) => {
  const allGrades = [{ value: '', label: 'Semua Kelas' }];
  if (eduLevel === 'sd') return [...allGrades, ...Array.from({ length: 6 }, (_, i) => ({ value: i + 1, label: `Kelas ${i + 1}` }))];
  if (eduLevel === 'smp' || eduLevel === 'sma') return [...allGrades, ...Array.from({ length: 3 }, (_, i) => ({ value: i + 1, label: `Kelas ${i + 1}` }))];
  return [...allGrades, ...Array.from({ length: 6 }, (_, i) => ({ value: i + 1, label: `Kelas ${i + 1}` }))];
};

const SUBJECTS = [
  { value: '', label: 'Semua Pelajaran' },
  { value: 'matematika', label: '🔢 Matematika' }, { value: 'bahasa_indonesia', label: '📝 Bahasa Indonesia' },
  { value: 'bahasa_inggris', label: '🌍 Bahasa Inggris' }, { value: 'ipa', label: '🔬 IPA' },
  { value: 'ips', label: '📚 IPS' }, { value: 'pkn', label: '🏛️ PKN' }, { value: 'penjas', label: '⚽ Penjasorkes' },
  { value: 'seni_budaya', label: '🎨 Seni Budaya' }, { value: 'prakarya', label: '🔧 Prakarya' },
  { value: 'agama', label: '🙏 Agama' }, { value: 'ti', label: '💻 TI/Informatika' }
];

const getEducationLevelDisplay = (level) => {
  const found = EDUCATION_LEVELS.find(l => l.value === level);
  return found ? found.label.replace('SD (Sekolah Dasar)', 'SD').replace('SMP (Sekolah Menengah Pertama)', 'SMP').replace('SMA (Sekolah Menengah Atas)', 'SMA') : '';
};
const getSubjectDisplay = (subject) => { const found = SUBJECTS.find(s => s.value === subject); return found ? found.label : subject || ''; };

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
  const [viewMode, setViewMode] = useState('grid');
  const [filter, setFilter] = useState('all');
  const [educationLevel, setEducationLevel] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subject, setSubject] = useState('');

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true); setError('');
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses').select('*, profiles:profiles!courses_instructor_id_fkey (id, full_name, email)').order('created_at', { ascending: false });
      if (coursesError) throw coursesError;
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments').select('course_id, enrolled_at').eq('student_id', user.id);
      if (enrollmentError) throw enrollmentError;
      setAllCourses(coursesData || []); setMyEnrollments(enrollmentData || []);
    } catch (error) {
      setError('Gagal memuat data: ' + error.message);
    } finally { setLoading(false); }
  }, [user]);

  const fetchCourseMaterials = async (courseId) => {
    try {
      const { data } = await supabase.from('materials').select('*').eq('course_id', courseId).order('created_at', { ascending: true });
      setCourseMaterials(data || []);
    } catch (error) { console.error('Error fetching materials:', error.message); }
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (selectedCourse) fetchCourseMaterials(selectedCourse.id); }, [selectedCourse]);

  const isEnrolled = (courseId) => myEnrollments.some(e => e.course_id === courseId);

  const handleEnroll = async (courseId) => {
    try {
      setEnrolling(true);
      if (isEnrolled(courseId)) { alert('Anda sudah terdaftar di kursus ini.'); return; }
      const { error } = await supabase.from('enrollments').insert({ student_id: user.id, course_id: courseId, enrolled_at: new Date().toISOString() });
      if (error) throw error;
      const { data: enrollmentData } = await supabase.from('enrollments').select('course_id, enrolled_at').eq('student_id', user.id);
      setMyEnrollments(enrollmentData || []);
      alert('Berhasil mendaftar kursus! 🎉\n\nSekarang Anda dapat mengakses materi dan tugas kursus ini.');
    } catch (error) { alert('Gagal mendaftar: ' + error.message); } finally { setEnrolling(false); }
  };

  const filteredCourses = allCourses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase()) || course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesEnrollment = true;
    if (filter === 'enrolled') matchesEnrollment = isEnrolled(course.id);
    else if (filter === 'available') matchesEnrollment = !isEnrolled(course.id);
    const matchesEducationLevel = !educationLevel || course.education_level === educationLevel;
    const matchesGradeLevel = !gradeLevel || course.grade_level === parseInt(gradeLevel);
    const matchesSubject = !subject || course.subject === subject;
    return matchesSearch && matchesEnrollment && matchesEducationLevel && matchesGradeLevel && matchesSubject;
  });

  const getInstructorName = (course) => {
    if (course.profiles?.full_name) return course.profiles.full_name;
    if (course.profiles?.email) return course.profiles.email.split('@')[0];
    return 'Guru';
  };

  if (loading) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 rounded-full border-[3px] border-outline-variant border-t-primary animate-spin mb-md" />
          <p className="text-body-sm text-on-surface-variant animate-pulse">Memuat kursus...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-md">
          <div className="flex items-center gap-xs bg-error-container text-on-error-container px-lg py-md rounded-xl"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>
          <button onClick={fetchData} className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-xl font-medium hover:bg-primary-container hover:text-on-primary-container transition-all"><RefreshCw className="w-4 h-4" /> Coba Lagi</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto space-y-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-sm md:text-headline-md font-display text-on-surface">📚 Jelajahi Kursus</h1>
          <p className="text-body-sm text-on-surface-variant">Temukan kursus menarik dari guru-guru terbaik</p>
        </div>
        <div className="flex gap-xs">
          <button onClick={() => setViewMode('grid')} className={`p-xs rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-on-primary' : 'bg-surface-dim text-on-surface-variant hover:bg-outline-variant'}`}><Grid3X3 className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('list')} className={`p-xs rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-on-primary' : 'bg-surface-dim text-on-surface-variant hover:bg-outline-variant'}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input type="text" placeholder="🔍 Cari kursus..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md pl-xl pr-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
        </div>

        <div className="flex flex-wrap gap-sm p-md rounded-xl bg-surface-container-low">
          <select value={educationLevel} onChange={(e) => { setEducationLevel(e.target.value); setGradeLevel(''); }}
            className="px-md py-sm rounded-lg border border-outline-variant bg-surface text-on-surface text-body-sm focus:outline-none transition-all min-w-[160px]">
            {EDUCATION_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} disabled={!educationLevel}
            className={`px-md py-sm rounded-lg border border-outline-variant text-body-sm focus:outline-none transition-all min-w-[120px] ${!educationLevel ? 'bg-surface-dim text-on-surface-variant' : 'bg-surface text-on-surface'}`}>
            {getGradeLevels(educationLevel).map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
          <select value={subject} onChange={(e) => setSubject(e.target.value)}
            className="px-md py-sm rounded-lg border border-outline-variant bg-surface text-on-surface text-body-sm focus:outline-none transition-all min-w-[160px]">
            {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button onClick={() => { setEducationLevel(''); setGradeLevel(''); setSubject(''); setSearchTerm(''); setFilter('all'); }}
            className="inline-flex items-center gap-xs px-md py-sm rounded-lg bg-surface-dim text-on-surface-variant text-label-sm font-medium hover:bg-outline-variant transition-all">
            <RefreshCw className="w-3.5 h-3.5" /> Reset</button>
        </div>

        <div className="flex gap-xs flex-wrap">
          {[
            { key: 'all', label: `Semua (${allCourses.length})` },
            { key: 'enrolled', label: `✓ Terdaftar (${myEnrollments.length})` },
            { key: 'available', label: `Tersedia (${allCourses.length - myEnrollments.length})` },
          ].map(btn => (
            <button key={btn.key} onClick={() => setFilter(btn.key)}
              className={`px-md py-sm rounded-xl text-label-sm font-medium transition-all ${filter === btn.key ? 'bg-primary text-on-primary' : 'bg-surface-dim text-on-surface-variant hover:bg-outline-variant'}`}>{btn.label}</button>
          ))}
        </div>
      </div>

      {/* Course Grid/List */}
      {filteredCourses.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-md">
            {filteredCourses.map(course => (
              <CourseCard key={course.id} course={course} instructorName={getInstructorName(course)}
                enrolled={isEnrolled(course.id)} onEnroll={() => handleEnroll(course.id)}
                onViewDetails={() => setSelectedCourse(course)} enrolling={enrolling} />
            ))}
          </div>
        ) : (
          <div className="space-y-sm">
            {filteredCourses.map(course => (
              <CourseListItem key={course.id} course={course} instructorName={getInstructorName(course)}
                enrolled={isEnrolled(course.id)} onEnroll={() => handleEnroll(course.id)}
                onViewDetails={() => setSelectedCourse(course)} enrolling={enrolling} />
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center py-2xl text-on-surface-variant">
          <BookOpen className="w-12 h-12 mb-sm opacity-40" />
          <p>Tidak ada kursus ditemukan.</p>
          {searchTerm && <p className="text-label-sm mt-xs">Coba kata kunci lain.</p>}
        </div>
      )}

      {/* Detail Modal */}
      {selectedCourse && (
        <CourseDetailModal course={selectedCourse} instructorName={getInstructorName(selectedCourse)}
          materials={courseMaterials} enrolled={isEnrolled(selectedCourse.id)}
          onEnroll={() => handleEnroll(selectedCourse.id)} onClose={() => setSelectedCourse(null)} enrolling={enrolling} onNavigate={onNavigate} />
      )}
    </div>
  );
};

const CourseCard = ({ course, instructorName, enrolled, onEnroll, onViewDetails, enrolling }) => (
  <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden hover:border-primary/30 hover:shadow-md transition-all duration-200 group">
    {course.thumbnail_url ? (
      <img src={course.thumbnail_url} alt={course.title} className="w-full h-36 object-cover" />
    ) : (
      <div className="w-full h-36 bg-gradient-to-br from-primary-container to-tertiary-container flex items-center justify-center">
        <BookOpen className="w-10 h-10 text-on-primary-container/40" />
      </div>
    )}
    <div className="p-md">
      <div className="flex items-center justify-between mb-sm">
        <span className="w-9 h-9 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center text-title-sm font-bold">
          {course.title?.substring(0, 2).toUpperCase() || 'KS'}
        </span>
        {enrolled && <span className="inline-flex items-center gap-xs px-sm py-0.5 rounded-full bg-success-container text-on-success-container text-label-xs font-medium"><CheckCircle className="w-3 h-3" /> Terdaftar</span>}
      </div>
      <h3 className="text-title-sm font-display text-on-surface font-semibold mb-xs group-hover:text-primary transition-colors line-clamp-1">{course.title}</h3>
      <p className="text-body-sm text-on-surface-variant line-clamp-2 mb-sm">{course.description}</p>
      {(course.education_level || course.subject) && (
        <div className="flex gap-xs mb-sm flex-wrap">
          {course.education_level && <span className="inline-flex bg-primary-container/50 text-on-primary-container px-sm py-0.5 rounded text-label-xs font-medium">{getEducationLevelDisplay(course.education_level)}{course.grade_level && ` Kelas ${course.grade_level}`}</span>}
          {course.subject && <span className="inline-flex bg-success-container/50 text-on-success-container px-sm py-0.5 rounded text-label-xs">{getSubjectDisplay(course.subject)}</span>}
        </div>
      )}
      <p className="text-label-sm text-on-surface-variant mb-sm">👨‍🏫 {instructorName}</p>
      <div className="flex items-center justify-between pt-sm border-t border-outline-variant/20">
        <span className="text-label-xs text-on-surface-variant">📅 {new Date(course.created_at).toLocaleDateString()}</span>
        <div className="flex gap-xs">
          <button onClick={onViewDetails} className="p-xs rounded-lg bg-surface-dim text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-all"><Eye className="w-3.5 h-3.5" /></button>
          {!enrolled && <button onClick={onEnroll} disabled={enrolling} className="inline-flex items-center gap-xs bg-primary text-on-primary px-sm py-xs rounded-lg text-label-xs font-medium hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50">{enrolling ? '⏳' : '📝 Daftar'}</button>}
        </div>
      </div>
    </div>
  </div>
);

const CourseListItem = ({ course, instructorName, enrolled, onEnroll, onViewDetails, enrolling }) => (
  <div className="bg-surface rounded-xl p-md border border-outline-variant/30 hover:border-primary/30 hover:shadow-sm transition-all flex gap-md items-center">
    {course.thumbnail_url ? (
      <img src={course.thumbnail_url} alt={course.title} className="w-28 h-20 object-cover rounded-lg flex-shrink-0" />
    ) : (
      <div className="w-28 h-20 bg-gradient-to-br from-primary-container to-tertiary-container rounded-lg flex items-center justify-center text-2xl flex-shrink-0">📚</div>
    )}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-sm flex-wrap mb-xs">
        <h3 className="text-title-sm font-display text-on-surface font-semibold">{course.title}</h3>
        {enrolled && <span className="inline-flex items-center gap-xs px-sm py-0.5 rounded-full bg-success-container text-on-success-container text-label-xs font-medium"><CheckCircle className="w-3 h-3" /> Terdaftar</span>}
      </div>
      {(course.education_level || course.subject) && (
        <div className="flex gap-xs mb-xs flex-wrap">
          {course.education_level && <span className="inline-flex bg-primary-container/50 text-on-primary-container px-sm py-0.5 rounded text-label-xs font-medium">{getEducationLevelDisplay(course.education_level)}{course.grade_level && ` Kelas ${course.grade_level}`}</span>}
          {course.subject && <span className="inline-flex bg-success-container/50 text-on-success-container px-sm py-0.5 rounded text-label-xs">{getSubjectDisplay(course.subject)}</span>}
        </div>
      )}
      <p className="text-label-sm text-on-surface-variant">👨‍🏫 {instructorName} • 📅 {new Date(course.created_at).toLocaleDateString()}</p>
    </div>
    <div className="flex gap-xs flex-shrink-0">
      <button onClick={onViewDetails} className="p-xs rounded-lg bg-surface-dim text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-all"><Eye className="w-4 h-4" /></button>
      {!enrolled && <button onClick={onEnroll} disabled={enrolling} className="inline-flex items-center gap-xs bg-primary text-on-primary px-sm py-xs rounded-lg text-label-sm font-medium hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50">{enrolling ? '⏳' : '📝 Daftar'}</button>}
    </div>
  </div>
);

const CourseDetailModal = ({ course, instructorName, materials, enrolled, onEnroll, onClose, enrolling, onNavigate }) => {
  const getFileIcon = (url) => {
    if (!url) return '📄'; const ext = url.split('.').pop().toLowerCase();
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return '🎬';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    if (['pdf'].includes(ext)) return '📑'; if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx'].includes(ext)) return '📊'; if (['ppt', 'pptx'].includes(ext)) return '📽️';
    if (['zip', 'rar', '7z'].includes(ext)) return '📦'; return '📎';
  };
  const getFileType = (url) => {
    if (!url) return 'other'; const ext = url.split('.').pop().toLowerCase();
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image'; return 'document';
  };
  const videos = materials.filter(m => getFileType(m.file_url) === 'video');
  const images = materials.filter(m => getFileType(m.file_url) === 'image');
  const documents = materials.filter(m => getFileType(m.file_url) === 'document' || !m.file_url);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-md" onClick={onClose}>
      <div className="bg-surface rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
        <div className="relative bg-gradient-to-br from-primary to-[#5a4fcf] rounded-t-2xl p-xl text-white">
          <h2 className="text-title-lg font-display">📚 {course.title}</h2>
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all"><X className="w-4 h-4" /></button>
        </div>
        
        <div className="p-lg space-y-md">
          {course.thumbnail_url && <img src={course.thumbnail_url} alt={course.title} className="w-full h-56 object-cover rounded-xl" />}
          
          <p className="text-body-sm text-on-surface-variant">{course.description}</p>
          <p className="text-label-sm text-on-surface-variant">👨‍🏫 Guru: <strong className="text-on-surface">{instructorName}</strong></p>
          
          {(course.education_level || course.subject) && (
            <div className="flex gap-sm flex-wrap">
              {course.education_level && <span className="inline-flex items-center bg-primary-container/50 text-on-primary-container px-md py-sm rounded-lg text-label-sm font-medium">📚 {getEducationLevelDisplay(course.education_level)}{course.grade_level && ` Kelas ${course.grade_level}`}</span>}
              {course.subject && <span className="inline-flex items-center bg-success-container/50 text-on-success-container px-md py-sm rounded-lg text-label-sm">📖 {getSubjectDisplay(course.subject)}</span>}
            </div>
          )}

          {enrolled ? (
            <div className="bg-success-container text-on-success-container rounded-xl p-md text-center">
              <p className="text-2xl mb-xs">✅</p>
              <p className="text-label-lg font-semibold">Anda sudah terdaftar di kursus ini</p>
              <p className="text-label-sm mt-xs opacity-80">Silakan akses materi dan tugas yang tersedia.</p>
              <button onClick={() => onNavigate && onNavigate(`course-view-${course.id}`)}
                className="mt-md inline-flex items-center gap-xs bg-success text-on-success px-lg py-sm rounded-xl font-medium hover:bg-success-container hover:text-on-success-container transition-all">
                🎬 Masuk ke Kursus</button>
            </div>
          ) : (
            <button onClick={onEnroll} disabled={enrolling}
              className="w-full inline-flex items-center justify-center gap-xs bg-primary text-on-primary px-lg py-md rounded-xl font-medium text-body-md hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50">
              {enrolling ? 'Memproses...' : '📝 Daftar Kursus Ini'}</button>
          )}

          {/* Materials */}
          {materials.length > 0 && (
            <div className="border-t border-outline-variant/20 pt-md space-y-sm">
              <h3 className="text-title-sm font-display text-on-surface">📋 Materi Kursus</h3>
              {videos.length > 0 && <div><p className="text-label-sm font-medium text-on-surface mb-xs">🎬 Video ({videos.length})</p>{videos.map(m => <p key={m.id} className="text-label-sm text-on-surface-variant ml-md">• {m.title}</p>)}</div>}
              {documents.length > 0 && <div><p className="text-label-sm font-medium text-on-surface mb-xs">📄 Dokumen ({documents.length})</p>{documents.map(m => <p key={m.id} className="text-label-sm text-on-surface-variant ml-md">• {m.title}</p>)}</div>}
              {images.length > 0 && <div><p className="text-label-sm font-medium text-on-surface mb-xs">🖼️ Gambar ({images.length})</p>{images.map(m => <p key={m.id} className="text-label-sm text-on-surface-variant ml-md">• {m.title}</p>)}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseCourses;
