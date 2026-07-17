import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import AnnouncementModule from '../modules/AnnouncementModule';
import ProfileModule from '../modules/ProfileModule';
import QuizManagement from '../modules/QuizManagement';
import MaterialsModule from '../modules/MaterialsModule';
import { TeacherCourseManagement } from './CourseManagement';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ProgressModule from '../modules/ProgressModule';
import TeachingJournal from '../modules/TeachingJournal';
import SimpleStudentAttendance from '../modules/SimpleStudentAttendance';
import ExamModule from '../modules/exams/pages/ExamModule';
import ExamResultsOverviewPage from '../modules/exams/pages/ExamResultsOverviewPage';
import TeacherExamDashboardPage from '../modules/exams/pages/TeacherExamDashboardPage';
import StudentResultDetailPage from '../modules/exams/pages/StudentResultDetailPage';
import SimpleStudentEvaluation from '../modules/SimpleStudentEvaluation';
import AttendanceReport from '../modules/AttendanceReport';
import EvaluationReport from '../modules/EvaluationReport';
import MessagingPage from '../modules/MessagingModule';
import {
  BookOpen, FileText, Users, Bell,
  BarChart3, AlertCircle, CheckCircle,
  Clock, Trash2, RefreshCw,
  GraduationCap, Plus, Save
} from 'lucide-react';

const TeacherDashboard = ({ activeSection = 'dashboard-guru', onNavigate }) => {
  const { user, profile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalAssignments: 0,
    totalStudents: 0,
    pendingSubmissions: 0,
    gradedSubmissions: 0
  });
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [viewExamId, setViewExamId] = useState(null);
  const [viewStudentDetailId, setViewStudentDetailId] = useState(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      // Get courses taught by this teacher
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false });

      if (courseError) throw courseError;

      setCourses(courseData || []);
      
      // Set selected course ID if not already set
      if (!selectedCourseId && courseData && courseData.length > 0) {
        setSelectedCourseId(courseData[0].id);
      }
      
      const courseIds = courseData?.map(course => course.id) || [];

      // Get assignments for teacher's courses
      let assignmentData = [];
      if (courseIds.length > 0) {
        const { data: assignData, error: assignmentError } = await supabase
          .from('assignments')
          .select('*')
          .in('course_id', courseIds)
          .order('due_date', { ascending: true });

        if (assignmentError) throw assignmentError;
        assignmentData = assignData || [];
        setAssignments(assignmentData);
      }

      // Get materials for teacher's courses
      if (courseIds.length > 0) {
        const { data: materialData, error: materialError } = await supabase
          .from('materials')
          .select('*')
          .in('course_id', courseIds)
          .order('created_at', { ascending: false });

        if (materialError) throw materialError;
        setMaterials(materialData || []);
      }

      // Get all enrollments for teacher's courses
      if (courseIds.length > 0) {
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('student_id')
          .in('course_id', courseIds);

        if (enrollmentError) throw enrollmentError;

        const studentIds = [...new Set(enrollmentData?.map(e => e.student_id) || [])];
        let studentData = [];
        if (studentIds.length > 0) {
          const { data: studentProfiles, error: studentError } = await supabase
            .from('profiles')
            .select('id, email, role')
            .in('id', studentIds);

          if (studentError) throw studentError;
          studentData = studentProfiles || [];
        }
        setStudents(studentData);
      }

      // Get all submissions for teacher's courses with enriched data
      let submissionData = [];
      if (courseIds.length > 0) {
        // Get assignments to filter submissions
        const { data: assignmentData } = await supabase
          .from('assignments')
          .select('id, title, course_id, max_points')
          .in('course_id', courseIds);

        const assignmentMap = {};
        (assignmentData || []).forEach(a => {
          assignmentMap[a.id] = a;
        });

        const assignmentIds = assignmentData?.map(a => a.id) || [];
        
        // Get course info
        const { data: courseDataInfo } = await supabase
          .from('courses')
          .select('id, title')
          .in('id', courseIds);

        const courseMap = {};
        (courseDataInfo || []).forEach(c => {
          courseMap[c.id] = c;
        });

        if (assignmentIds.length > 0) {
          const { data: subData, error: subError } = await supabase
            .from('submissions')
            .select('*')
            .in('assignment_id', assignmentIds)
            .order('submitted_at', { ascending: false });

          if (subError) throw subError;
          
          // Get unique student IDs from submissions
          const studentIds = [...new Set((subData || []).map(s => s.student_id) || [])];
          
          // Get student info
          let studentMap = {};
          if (studentIds.length > 0) {
            const { data: studentProfiles } = await supabase
              .from('profiles')
              .select('id, email')
              .in('id', studentIds);

            (studentProfiles || []).forEach(s => {
              studentMap[s.id] = s;
            });
          }

          // Enrich submission data with student, course, and assignment info
          submissionData = (subData || []).map(sub => {
            const assignment = assignmentMap[sub.assignment_id];
            const course = assignment ? courseMap[assignment.course_id] : null;
            const student = studentMap[sub.student_id];
            return {
              ...sub,
              student_email: student?.email || null,
              assignment_title: assignment?.title || 'Tugas',
              course_title: course?.title || 'Kursus',
              max_points: assignment?.max_points || 100
            };
          });
        }
      }
      setSubmissions(submissionData);

      // Calculate stats
      setStats({
        totalCourses: courseData?.length || 0,
        totalAssignments: assignmentData?.length || 0,
        totalStudents: students?.length || 0,
        pendingSubmissions: submissionData?.filter(s => s.grade === null).length || 0,
        gradedSubmissions: submissionData?.filter(s => s.grade !== null).length || 0
      });

      // Get notifications for this teacher
      const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (notifError) throw notifError;
      setNotifications(notifData || []);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Gagal memuat data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [user, selectedCourseId, students?.length]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Fetch data on mount
  useEffect(() => {
    if (!user) return;

    fetchData();

    // Real-time subscriptions for courses
    const courseChannel = supabase
      .channel('teacher-courses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses',
          filter: `instructor_id=eq.${user.id}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    // Real-time subscriptions for notifications
    const notifChannel = supabase
      .channel('teacher-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    // Real-time for submissions (for courses taught by this teacher)
    const submissionsChannel = supabase
      .channel('teacher-submissions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'submissions'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(courseChannel);
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(submissionsChannel);
    };
  }, [user]);

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard-guru':
        return <DashboardOverview 
          stats={stats} 
          courses={courses} 
          assignments={assignments} 
          submissions={submissions} 
          notifications={notifications} 
          onRefresh={handleRefresh} 
          refreshing={refreshing}
        />;
      case 'courses-guru':
        return <TeacherCourseManagement 
          activeSection={activeSection}
          onSectionChange={(section) => {
            // Handle section changes if needed
          }}
        />;
      case 'materials-guru':
        if (courses.length === 0) {
          return (
            <div className="dashboard-content">
              <div style={{ 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '16px',
                padding: '1.5rem',
                color: 'white',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
                <FileText size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Manajemen Materi
              </h2>
                <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
                  Anda belum memiliki kursus. Buat kursus terlebih dahulu.
                </p>
              </div>
            </div>
          );
        }
        return <MaterialsModule 
          courseId={selectedCourseId}
          materials={materials.filter(m => m.course_id === selectedCourseId)}
          onRefresh={handleRefresh}
          courses={courses}
        />;
      case 'assignments-guru':
        return <AssignmentsView 
          assignments={assignments}
          submissions={submissions}
          courses={courses}
          onRefresh={handleRefresh}
        />;
      case 'quiz-guru':
        return <QuizManagement courses={courses} />;
      case 'submissions-guru':
        return <SubmissionsView submissions={submissions} onRefresh={handleRefresh} onGradeSubmit={fetchData} />;
      case 'progress-guru':
        return <ProgressModule />;
      case 'exam-results-guru':
        if (viewExamId && viewStudentDetailId) {
          return (
            <StudentResultDetailPage
              examId={viewExamId}
              attemptId={viewStudentDetailId}
              onBack={() => { setViewStudentDetailId(null); }}
            />
          );
        }
        if (viewExamId) {
          return (
            <TeacherExamDashboardPage
              examId={viewExamId}
              onBack={() => setViewExamId(null)}
              onViewStudentDetail={(examId, attemptId) => {
                setViewStudentDetailId(attemptId);
              }}
            />
          );
        }
        return (
          <ExamResultsOverviewPage
            onViewExamResults={(examId) => setViewExamId(examId)}
            onBack={() => onNavigate && onNavigate('dashboard-guru')}
          />
        );
      case 'exams-guru':
        return <ExamModule role="guru" onNavigate={onNavigate} />;
      case 'announcements-guru':
      case 'announcements-admin':
        return <AnnouncementModule />;
      case 'students-guru':
        return <StudentsView students={students} courses={courses} submissions={submissions} />;
      case 'journal-guru':
        return <TeachingJournal />;
      case 'attendance-guru':
        return <SimpleStudentAttendance />;
      case 'evaluation-guru':
        return <SimpleStudentEvaluation />;
      case 'attendance-report-guru':
        return <AttendanceReport />;
      case 'evaluation-report-guru':
        return <EvaluationReport />;
      case 'messages-guru':
        return <MessagingPage />;
      case 'profile-guru':
        return <ProfileModule onRefresh={handleRefresh} />;
      default:
        return (
          <DashboardOverview 
            stats={stats} 
            courses={courses} 
            assignments={assignments} 
            submissions={submissions} 
            notifications={notifications} 
            onRefresh={handleRefresh} 
            refreshing={refreshing}
          />
        );
    }
  };

  if (loading) {
    return <LoadingSpinner message="Memuat data..." />;
  }

  if (error) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto">
        <div className="flex items-center gap-sm p-md rounded-xl bg-error-container border border-error/20 mb-md">
          <AlertCircle size={20} className="text-error shrink-0" />
          <p className="text-body-sm font-body text-on-error-container">{error}</p>
        </div>
        <button onClick={handleRefresh} className="flex items-center gap-sm py-sm px-md rounded-xl bg-primary text-on-primary font-label-md hover:bg-primary-container hover:text-on-primary-container transition-all">
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} /> Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto w-full flex flex-col gap-lg">
      {renderContent()}
    </div>
  );
};

// Dashboard Overview Component
const DashboardOverview = ({ stats, courses, assignments, submissions = [], notifications = [], onRefresh, refreshing }) => {
  const pendingSubmissions = submissions.filter(s => s?.grade === null).length;
  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) return 'Selamat Pagi';
    if (currentHour < 15) return 'Selamat Siang';
    if (currentHour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex flex-col gap-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-md">
        <div>
          <h2 className="text-headline-lg font-display text-on-background flex items-center gap-sm">
            <GraduationCap size={28} className="text-secondary" />
            Dasbor Guru
          </h2>
          <p className="text-body-md font-body text-on-surface-variant mt-1">Selamat datang kembali! Semangat mengajar hari ini!</p>
        </div>
        <button onClick={onRefresh} disabled={refreshing} className="flex items-center gap-xs bg-surface-container px-sm py-xs rounded-xl text-primary font-label-md font-label hover:bg-primary/10 transition-colors border border-primary/20">
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh Data
        </button>
      </div>

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-surface-tint p-xl shadow-[0px_10px_30px_rgba(53,37,205,0.2)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-10 w-40 h-40 bg-secondary-container/20 rounded-full blur-2xl translate-y-1/2" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center py-sm">
          <h3 className="text-headline-md font-display text-white mb-2">{getGreeting()}! 👋</h3>
          <p className="text-body-md font-body text-primary-fixed max-w-xl">Hai Guru! Selamat mengajar. Semoga hari Anda penuh berkah dan inspirasi untuk para murid.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div>
        <h3 className="text-title-lg font-title text-on-background flex items-center gap-xs mb-md">
          <BarChart3 size={20} className="text-outline" /> Statistik Saya
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
          <div className="bg-surface rounded-xl p-md border border-outline-variant/30 flex flex-col items-center text-center group hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-sm group-hover:scale-110 transition-transform">
              <BookOpen size={24} className="text-primary" />
            </div>
            <p className="text-3xl font-display font-bold text-on-background mb-1">{stats.totalCourses}</p>
            <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-wider">Kursus Saya</p>
          </div>
          <div className="bg-surface rounded-xl p-md border border-outline-variant/30 flex flex-col items-center text-center group hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-sm group-hover:scale-110 transition-transform">
              <FileText size={24} className="text-emerald-600" />
            </div>
            <p className="text-3xl font-display font-bold text-on-background mb-1">{stats.totalAssignments}</p>
            <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-wider">Total Tugas</p>
          </div>
          <div className="bg-surface rounded-xl p-md border border-outline-variant/30 flex flex-col items-center text-center group hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-sm group-hover:scale-110 transition-transform">
              <Clock size={24} className="text-amber-600" />
            </div>
            <p className="text-3xl font-display font-bold text-on-background mb-1">{pendingSubmissions}</p>
            <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-wider">Menunggu Penilaian</p>
          </div>
          <div className="bg-surface rounded-xl p-md border border-outline-variant/30 flex flex-col items-center text-center group hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-sm group-hover:scale-110 transition-transform">
              <Users size={24} className="text-primary" />
            </div>
            <p className="text-3xl font-display font-bold text-on-background mb-1">{stats.totalStudents}</p>
            <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-wider">Total Murid</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div>
          <h3 className="text-title-lg font-title text-on-background flex items-center gap-xs mb-md">
            <Bell size={20} className="text-error" /> Notifikasi
            {unreadCount > 0 && <span className="bg-error text-on-error text-label-sm font-label px-2 py-0.5 rounded-full">{unreadCount}</span>}
          </h3>
          <div className="flex flex-col gap-sm">
            {notifications.slice(0, 5).map(n => (
              <div key={n.id} className={`rounded-xl p-md border flex gap-md items-start shadow-sm ${!n.is_read ? 'bg-surface-container-low border-outline-variant/20' : 'bg-surface border-outline-variant/20 opacity-80'}`}>
                <span className="mt-1">{n.type === 'submission' ? '📤' : n.type === 'announcement' ? '📢' : '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-body text-on-background">{n.message}</p>
                  <p className="text-label-sm text-outline mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Courses */}
      <div className="pb-xl">
        <h3 className="text-title-lg font-title text-on-background flex items-center gap-xs mb-md">
          <BookOpen size={20} className="text-outline" /> Kursus Saya
        </h3>
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            {courses.slice(0, 6).map(course => (
              <div key={course.id} className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden hover:shadow-md transition-all">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-secondary-container/30 flex items-center justify-center">
                    <BookOpen size={40} className="text-primary/40" />
                  </div>
                )}
                <div className="p-md">
                  <h4 className="text-title-md font-title text-on-background line-clamp-1">{course.title}</h4>
                  <p className="text-body-sm font-body text-on-surface-variant line-clamp-2">{course.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-dashed border-outline-variant flex flex-col items-center justify-center p-xl text-center">
            <BookOpen size={48} className="text-outline/60 mb-md" />
            <p className="text-body-sm font-body text-on-surface-variant">Anda belum membuat kursus.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Materials View with Welcome Message
const MaterialsView = ({ materials, courses, onRefresh, refreshing }) => (
  <div className="flex flex-col gap-lg">
    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-xl text-center shadow-md">
      <h2 className="text-headline-md font-display text-white mb-sm">📄 Manajemen Materi</h2>
      <p className="text-body-md font-body text-white/80">Bagikan pengetahuan Anda melalui materi pembelajaran yang berkualitas.</p>
    </div>
    <div className="bg-surface rounded-2xl p-xl border border-outline-variant/30">
      <h3 className="text-title-lg font-title text-on-background mb-md">📄 Materi Pembelajaran</h3>
      {materials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {materials.slice(0, 10).map(material => (
            <div key={material.id} className="bg-surface-container-low rounded-xl p-md border border-outline-variant/30">
              <h4 className="text-title-md font-title text-on-background mb-1">{material.title}</h4>
              <p className="text-body-sm font-body text-on-surface-variant line-clamp-2">{material.content}</p>
              <p className="text-label-sm text-outline mt-sm">📅 {new Date(material.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-xl text-center opacity-60">
          <FileText size={48} className="text-outline mb-sm" />
          <p className="text-body-sm font-body text-on-surface-variant">Belum ada materi.</p>
        </div>
      )}
    </div>
  </div>
);

// Assignments View with Create/Delete functionality
const AssignmentsView = ({ assignments, submissions, courses, onRefresh, refreshing }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [newAssignment, setNewAssignment] = useState({
    title: '', description: '', due_date: '', max_points: 100, external_link: '', external_link_type: '', course_id: ''
  });

  const filteredAssignments = selectedCourseFilter === 'all' 
    ? assignments : assignments.filter(a => a.course_id === selectedCourseFilter);

  const getCourseName = (courseId) => courses.find(c => c.id === courseId)?.title || 'Unknown';

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newAssignment.course_id) { alert('Silakan pilih kursus terlebih dahulu!'); return; }
    try {
      const { error } = await supabase.from('assignments').insert([{
        title: newAssignment.title, description: newAssignment.description,
        due_date: newAssignment.due_date, max_points: parseInt(newAssignment.max_points),
        external_link: newAssignment.external_link, external_link_type: newAssignment.external_link_type,
        course_id: newAssignment.course_id, status: 'open', created_at: new Date().toISOString()
      }]);
      if (error) throw error;
      setShowCreateForm(false);
      setNewAssignment({ title: '', description: '', due_date: '', max_points: 100, external_link: '', external_link_type: '', course_id: '' });
      alert('Tugas berhasil dibuat!');
      onRefresh();
    } catch (err) { alert('Gagal membuat tugas: ' + err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus tugas ini?')) return;
    try {
      const { error } = await supabase.from('assignments').delete().eq('id', id);
      if (error) throw error;
      alert('Tugas berhasil dihapus.');
      onRefresh();
    } catch (err) { alert('Gagal menghapus tugas: ' + err.message); }
  };

  return (
    <div className="flex flex-col gap-lg">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-xl text-center shadow-md">
        <h2 className="text-headline-md font-display text-white mb-sm">📝 Manajemen Tugas</h2>
        <p className="text-body-md font-body text-white/80">Buat dan kelola tugas untuk murid Anda.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-md items-start sm:items-center justify-between">
        <div className="flex items-center gap-md">
          <label className="text-label-sm font-label text-on-surface-variant">Filter Kursus:</label>
          <select value={selectedCourseFilter} onChange={(e) => setSelectedCourseFilter(e.target.value)} className="px-md py-sm rounded-xl border border-outline-variant bg-surface-container-low text-body-sm font-body text-on-surface outline-none focus:border-primary transition-colors">
            <option value="all">Semua Kursus</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <button onClick={() => setShowCreateForm(true)} className="flex items-center gap-sm py-sm px-md rounded-xl bg-primary text-on-primary font-label-md hover:bg-primary-container hover:text-on-primary-container transition-all shadow-md">
          <Plus size={18} /> Buat Tugas Baru
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreate} className="bg-surface rounded-2xl p-xl border border-outline-variant/30">
          <h3 className="text-title-lg font-title text-on-background mb-md">📝 Buat Tugas Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div className="flex flex-col gap-1">
              <label className="text-label-sm font-label text-on-surface-variant">Kursus <span className="text-error">*</span></label>
              <select value={newAssignment.course_id} onChange={(e) => setNewAssignment({...newAssignment, course_id: e.target.value})} required className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface-container-low text-body-md outline-none focus:border-primary">
                <option value="">-- Pilih --</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-label-sm font-label text-on-surface-variant">Judul Tugas</label>
              <input type="text" value={newAssignment.title} onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})} required className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface-container-low text-body-md outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-label-sm font-label text-on-surface-variant">Tanggal Jatuh Tempo</label>
              <input type="datetime-local" value={newAssignment.due_date} onChange={(e) => setNewAssignment({...newAssignment, due_date: e.target.value})} className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface-container-low text-body-md outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-label-sm font-label text-on-surface-variant">Nilai Maksimal</label>
              <input type="number" value={newAssignment.max_points} onChange={(e) => setNewAssignment({...newAssignment, max_points: parseInt(e.target.value)})} min="1" className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface-container-low text-body-md outline-none focus:border-primary" />
            </div>
            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="text-label-sm font-label text-on-surface-variant">Deskripsi</label>
              <textarea value={newAssignment.description} onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})} rows="3" className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface-container-low text-body-md outline-none focus:border-primary resize-none" />
            </div>
          </div>
          <div className="flex items-center gap-md mt-lg">
            <button type="submit" className="flex items-center gap-sm py-sm px-lg rounded-xl bg-primary text-on-primary font-label-md hover:bg-primary-container hover:text-on-primary-container transition-all">
              <Save size={18} /> Simpan
            </button>
            <button type="button" onClick={() => setShowCreateForm(false)} className="py-sm px-lg rounded-xl border border-outline-variant text-on-surface-variant font-label-md hover:bg-surface-container-low transition-colors">Batal</button>
          </div>
        </form>
      )}

      <div className="bg-surface rounded-2xl border border-outline-variant/30 overflow-hidden">
        <div className="p-md border-b border-outline-variant/30 bg-surface-container-lowest">
          <h3 className="text-title-lg font-title text-on-surface">📚 Daftar Tugas</h3>
        </div>
        {filteredAssignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/50">
                  <th className="py-sm px-lg text-label-sm font-label text-outline uppercase tracking-wider">Kursus</th>
                  <th className="py-sm px-lg text-label-sm font-label text-outline uppercase tracking-wider">Judul</th>
                  <th className="py-sm px-lg text-label-sm font-label text-outline uppercase tracking-wider">Jatuh Tempo</th>
                  <th className="py-sm px-lg text-label-sm font-label text-outline uppercase tracking-wider">Poin</th>
                  <th className="py-sm px-lg text-label-sm font-label text-outline uppercase tracking-wider">Status</th>
                  <th className="py-sm px-lg text-label-sm font-label text-outline uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {filteredAssignments.map(a => (
                  <tr key={a.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-sm px-lg"><span className="text-label-sm font-label bg-primary/10 text-primary px-2 py-1 rounded-md">{getCourseName(a.course_id)}</span></td>
                    <td className="py-sm px-lg text-body-sm font-body text-on-surface">{a.title}</td>
                    <td className="py-sm px-lg text-body-sm font-body text-on-surface-variant">{a.due_date ? new Date(a.due_date).toLocaleDateString() : '-'}</td>
                    <td className="py-sm px-lg text-body-sm font-body text-on-surface-variant">{a.max_points}</td>
                    <td className="py-sm px-lg"><span className={`text-label-sm font-label px-2 py-0.5 rounded-full ${a.status === 'open' ? 'bg-success-light text-success' : 'bg-surface-variant text-on-surface-variant'}`}>{a.status === 'open' ? 'Aktif' : 'Ditutup'}</span></td>
                    <td className="py-sm px-lg">
                      <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg hover:bg-error-container text-error transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-xl text-center">
            <FileText size={48} className="text-outline/60 mb-sm" />
            <p className="text-body-sm font-body text-on-surface-variant">Belum ada tugas.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Submissions View
const SubmissionsView = ({ submissions, onRefresh, onGradeSubmit }) => {
  const [filter, setFilter] = useState('all');

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'pending') return sub.grade === null;
    if (filter === 'graded') return sub.grade !== null;
    return true;
  });

  const gradedCount = submissions.filter(s => s.grade !== null).length;
  const pendingCount = submissions.filter(s => s.grade === null).length;
  const avgGrade = submissions.filter(s => s.grade !== null).length > 0
    ? Math.round(submissions.filter(s => s.grade !== null).reduce((sum, s) => sum + s.grade, 0) / submissions.filter(s => s.grade !== null).length)
    : 0;

  const getFileName = (url) => url ? url.split('/').pop() || 'File' : null;

  const handleDownload = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || 'submission';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download error:', err);
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex flex-col gap-lg">
      <div className="bg-gradient-to-r from-primary to-surface-tint rounded-2xl p-xl text-center shadow-md">
        <h2 className="text-headline-md font-display text-white mb-sm">📥 Submission & Penilaian</h2>
        <p className="text-body-md font-body text-primary-fixed/80">Tinjau dan nilai tugas yang dikumpulkan oleh murid Anda.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <div className="bg-surface rounded-xl p-md border border-outline-variant/30 text-center">
          <p className="text-2xl font-display font-bold text-primary">{submissions.length}</p>
          <p className="text-label-sm font-label text-outline uppercase tracking-wider">Total</p>
        </div>
        <div className="bg-surface rounded-xl p-md border border-outline-variant/30 text-center">
          <p className="text-2xl font-display font-bold text-emerald-600">{gradedCount}</p>
          <p className="text-label-sm font-label text-outline uppercase tracking-wider">Dinilai</p>
        </div>
        <div className="bg-surface rounded-xl p-md border border-outline-variant/30 text-center">
          <p className="text-2xl font-display font-bold text-amber-600">{pendingCount}</p>
          <p className="text-label-sm font-label text-outline uppercase tracking-wider">Menunggu</p>
        </div>
        <div className="bg-surface rounded-xl p-md border border-outline-variant/30 text-center">
          <p className="text-2xl font-display font-bold text-primary">{avgGrade}</p>
          <p className="text-label-sm font-label text-outline uppercase tracking-wider">Rata-rata</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-sm">
        {['all', 'pending', 'graded'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-md py-sm rounded-xl font-label-md font-label transition-all ${filter === f ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-low'}`}>
            {f === 'all' ? 'Semua' : f === 'pending' ? '⏳ Menunggu' : '✅ Dinilai'}
          </button>
        ))}
      </div>

      {/* Submission Cards */}
      {filteredSubmissions.length > 0 ? (
        <div className="flex flex-col gap-md">
          {filteredSubmissions.map(submission => (
            <div key={submission.id} className={`bg-surface rounded-2xl p-xl border-2 ${submission.grade === null ? 'border-amber-400/50' : 'border-emerald-400/50'} shadow-sm`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-md">
                <div className="flex items-center gap-md">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-title-md">
                    {(submission.student_email || 'M').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-title-md font-title text-on-background">{submission.student_email || `Murid: ${submission.student_id?.substring(0, 8)}...`}</h4>
                    <p className="text-label-sm text-outline">📚 {submission.course_title} • 📝 {submission.assignment_title}</p>
                  </div>
                </div>
                <span className={`px-md py-0.5 rounded-full text-label-sm font-label ${submission.grade !== null ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {submission.grade !== null ? `⭐ ${submission.grade}/${submission.max_points || 100}` : '⏳ Menunggu'}
                </span>
              </div>

              {submission.content && (
                <div className="bg-surface-container-low rounded-xl p-md mb-md">
                  <p className="text-body-sm font-body text-on-surface">{submission.content.substring(0, 200)}{submission.content.length > 200 ? '...' : ''}</p>
                </div>
              )}

              {submission.attachment_url && (
                <div className="flex items-center gap-md bg-surface-container-low rounded-xl p-md mb-md">
                  <span className="text-lg">📎</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-body text-on-surface truncate">{getFileName(submission.attachment_url)}</p>
                    <p className="text-label-sm text-outline">Klik untuk mengunduh</p>
                  </div>
                  <button onClick={() => handleDownload(submission.attachment_url, getFileName(submission.attachment_url))} className="flex items-center gap-1 py-sm px-md rounded-xl bg-primary text-on-primary text-label-sm font-label hover:bg-primary-container hover:text-on-primary-container transition-all">⬇️ Unduh</button>
                </div>
              )}

              <div className="flex items-center justify-between text-label-sm text-outline mb-md">
                <span>🕐 Dikumpulkan: {new Date(submission.submitted_at).toLocaleString()}</span>
                {submission.graded_at && <span className="text-emerald-600">✅ Dinilai: {new Date(submission.graded_at).toLocaleString()}</span>}
              </div>

              {submission.feedback && (
                <div className="bg-amber-50 rounded-xl p-md mb-md border border-amber-200">
                  <p className="text-body-sm font-body text-amber-800"><strong>💬 Feedback:</strong> {submission.feedback}</p>
                </div>
              )}

              <div className="flex gap-md">
                <button onClick={() => {
                  const grade = prompt('Masukkan nilai (0-100):', submission.grade || '');
                  if (grade !== null && !isNaN(grade)) {
                    const feedback = prompt('Masukkan feedback (opsional):', submission.feedback || '');
                    supabase.from('submissions').update({ grade: parseInt(grade), feedback: feedback || '', graded_at: new Date().toISOString() }).eq('id', submission.id)
                      .then(() => { alert('Nilai berhasil disimpan!'); onGradeSubmit(); })
                      .catch(err => alert('Gagal: ' + err.message));
                  }
                }} className="flex-1 flex items-center justify-center gap-sm py-sm rounded-xl bg-primary text-on-primary font-label-md hover:bg-primary-container hover:text-on-primary-container transition-all">
                  {submission.grade === null ? '⭐ Beri Nilai' : '✏️ Edit Nilai'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-dashed border-outline-variant flex flex-col items-center justify-center p-xl text-center">
          <FileText size={48} className="text-outline/60 mb-md" />
          <p className="text-body-sm font-body text-on-surface-variant">Belum ada submission.</p>
        </div>
      )}
    </div>
  );
};
  
// Enhanced Students View
const StudentsView = ({ students, courses, submissions }) => {
  const getStudentStats = (studentId) => {
    const studentSubs = submissions.filter(s => s.student_id === studentId);
    const graded = studentSubs.filter(s => s.grade !== null);
    const avgGrade = graded.length > 0 ? Math.round(graded.reduce((sum, s) => sum + s.grade, 0) / graded.length) : 0;
    return { total: studentSubs.length, graded: graded.length, avgGrade };
  };

  return (
    <div className="flex flex-col gap-lg">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-xl text-center shadow-md">
        <h2 className="text-headline-md font-display text-white mb-sm">👥 Daftar Murid</h2>
        <p className="text-body-md font-body text-white/80">Kelola dan pantau progres belajar murid Anda.</p>
      </div>

      {students && students.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {students.map(student => {
            const stats = getStudentStats(student.id);
            return (
              <div key={student.id} className="bg-surface rounded-xl p-md border border-outline-variant/30 hover:shadow-md transition-all">
                <h3 className="text-title-md font-title text-on-background mb-1 line-clamp-1">{student.email}</h3>
                <p className="text-label-sm text-outline mb-md">🎓 Murid</p>
                <div className="grid grid-cols-3 gap-sm py-md border-t border-outline-variant/30">
                  <div className="text-center">
                    <p className="text-title-lg font-title text-primary">{stats.total}</p>
                    <p className="text-label-sm text-outline">Submission</p>
                  </div>
                  <div className="text-center">
                    <p className="text-title-lg font-title text-emerald-600">{stats.graded}</p>
                    <p className="text-label-sm text-outline">Dinilai</p>
                  </div>
                  <div className="text-center">
                    <p className="text-title-lg font-title text-amber-600">{stats.avgGrade}</p>
                    <p className="text-label-sm text-outline">Rata-rata</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-dashed border-outline-variant flex flex-col items-center justify-center p-xl text-center">
          <Users size={48} className="text-outline/60 mb-md" />
          <p className="text-body-sm font-body text-on-surface-variant">Belum ada murid terdaftar.</p>
        </div>
      )}
    </div>
  );
};

// Messages View Component for Teachers
const MessagesView = ({ notifications }) => {
  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;
  return (
    <div className="flex flex-col gap-lg">
      <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl p-xl text-center shadow-md">
        <h2 className="text-headline-md font-display text-white mb-sm">✉️ Notifikasi & Pesan</h2>
        <p className="text-body-md font-body text-white/80">Pantau notifikasi dari murid dan sistem.</p>
      </div>
      <div>
        <h3 className="text-title-lg font-title text-on-background flex items-center gap-xs mb-md">
          🔔 Notifikasi
          {unreadCount > 0 && <span className="bg-error text-on-error text-label-sm font-label px-2 py-0.5 rounded-full">{unreadCount}</span>}
        </h3>
        {notifications && notifications.length > 0 ? (
          <div className="flex flex-col gap-sm">
            {notifications.map(n => (
              <div key={n.id} className={`rounded-xl p-md border flex gap-md items-start shadow-sm ${!n.is_read ? 'bg-surface-container-low border-outline-variant/20' : 'bg-surface border-outline-variant/20 opacity-80'}`}>
                <span className="text-lg">{n.type === 'grade' ? '📝' : n.type === 'submission' ? '📤' : n.type === 'announcement' ? '📢' : '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-body-sm font-body ${!n.is_read ? 'font-semibold text-on-background' : 'text-on-surface-variant'}`}>{n.message}</p>
                  <p className="text-label-sm text-outline mt-1">📅 {new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && <span className="bg-primary text-on-primary text-label-sm font-label px-2 py-0.5 rounded-full text-[10px]">Baru</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-xl text-center opacity-60">
            <Bell size={48} className="text-outline mb-sm" />
            <p className="text-body-sm font-body text-on-surface-variant">Tidak ada notifikasi.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Profile View Component
const ProfileView = ({ onRefresh }) => {
  const { user, profile, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
    else if (user?.email) setDisplayName(user.email.split('@')[0]);
  }, [profile, user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('Nama tampilan tidak boleh kosong'); return; }
    try {
      setLoading(true); setError(''); setMessage('');
      await updateProfile({ display_name: displayName.trim() });
      setMessage('Profil berhasil diperbarui!');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error updating profile:', err);
      if (err.message.includes('display_name')) setError('Kolom display_name belum ada di tabel. Silakan jalankan migration SQL di Supabase.');
      else if (err.message.includes('null value in column "email"')) setError('Email tidak ditemukan. Silakan logout dan login kembali.');
      else setError('Gagal memperbarui profil: ' + err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-lg max-w-2xl">
      <div className="bg-gradient-to-r from-primary to-surface-tint rounded-2xl p-xl text-center shadow-md">
        <h2 className="text-headline-md font-display text-white mb-sm">👤 Profil Saya</h2>
        <p className="text-body-md font-body text-primary-fixed/90">Kelola informasi profil Anda.</p>
      </div>
      <div className="bg-surface rounded-2xl p-xl border border-outline-variant/30">
        <h3 className="text-title-lg font-title text-on-background mb-lg">📝 Edit Profil</h3>
        {message && <div className="flex items-center gap-sm p-sm mb-md rounded-xl bg-success-light/50 border border-success/20 text-body-sm font-body text-on-surface-variant">{message}</div>}
        {error && <div className="flex items-center gap-sm p-sm mb-md rounded-xl bg-error-container border border-error/20"><AlertCircle size={18} className="text-error shrink-0" /><p className="text-body-sm font-body text-on-error-container">{error}</p></div>}
        <form onSubmit={handleSave} className="flex flex-col gap-md">
          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-label text-on-surface-variant">Email</label>
            <input type="email" value={user?.email || ''} disabled className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface-container text-on-surface-variant text-body-md outline-none cursor-not-allowed" />
            <p className="text-label-sm text-outline">Email tidak dapat diubah</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-label text-on-surface-variant">Nama Tampilan</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Masukkan nama tampilan" className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface-container-low text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            <p className="text-label-sm text-outline">Nama ini akan terlihat oleh siswa dan admin</p>
          </div>
          <button type="submit" disabled={loading} className="self-start flex items-center gap-sm py-sm px-lg rounded-xl bg-primary text-on-primary font-label-md hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-60 shadow-md">
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</> : '💾 Simpan Perubahan'}
          </button>
        </form>
      </div>
      <div className="bg-surface rounded-2xl p-xl border border-outline-variant/30">
        <h3 className="text-title-lg font-title text-on-background mb-lg">ℹ️ Informasi Akun</h3>
        <div className="grid grid-cols-1 gap-md">
          <div className="flex items-center gap-md p-sm bg-surface-container-low rounded-xl">
            <span className="text-label-sm font-label text-outline w-20">Role</span>
            <span className="text-body-sm font-body text-on-surface">Guru</span>
          </div>
          <div className="flex items-center gap-md p-sm bg-surface-container-low rounded-xl">
            <span className="text-label-sm font-label text-outline w-20">Status</span>
            <span className="text-body-sm font-body text-on-surface flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block" /> Aktif</span>
          </div>
          <div className="flex items-center gap-md p-sm bg-surface-container-low rounded-xl">
            <span className="text-label-sm font-label text-outline w-20">ID</span>
            <code className="text-label-sm font-mono text-on-surface-variant truncate">{user?.id}</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
