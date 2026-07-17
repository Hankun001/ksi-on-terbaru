import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import AnnouncementModule from '../modules/AnnouncementModule';
import ProfileModule from '../modules/ProfileModule';
import MessagingPage from '../modules/MessagingModule';
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
import {
  BookOpen, FileText, FolderOpen, Users, Bell,
  BarChart3, Mail, User, AlertCircle, CheckCircle,
  Clock, Trash2, Download, Edit, ChevronRight,
  GraduationCap, Settings, LogOut, Plus, CloudUpload,
  Save
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
      <div className="dashboard-container">
        <div className="error-message">
          <AlertCircle size={20} className="error-icon" />
          {error}
        </div>
        <button onClick={handleRefresh} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>
            <GraduationCap size={28} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
            Dasbor Guru
          </h1>
          <p>Selamat datang, {profile?.display_name || user?.email?.split('@')[0] || 'Guru'}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={handleRefresh} 
            className="btn btn-secondary"
            disabled={refreshing}
          >
            {refreshing ? '↻ Memuat...' : '↻ Refresh'}
          </button>
        </div>
      </div>
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

  return (
    <div className="dashboard-content">
      {/* Welcome Message */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '2rem',
        color: 'white',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem' }}>
          {getGreeting()}! 👋
        </h1>
        <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
          Hai Guru! Selamat mengajar. Semoga hari Anda penuh berkah dan inspirasi untuk para murid.
        </p>
      </div>

      <section className="dashboard-stats">
        <h2>
          <BarChart3 size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Statistik Saya
        </h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon"><BookOpen size={24} /></div>
            <h3>{stats.totalCourses}</h3>
            <p>Kursus Saya</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FileText size={24} /></div>
            <h3>{stats.totalAssignments}</h3>
            <p>Total Tugas</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><CloudUpload size={24} /></div>
            <h3>{pendingSubmissions}</h3>
            <p>Menunggu Penilaian</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Users size={24} /></div>
            <h3>{stats.totalStudents}</h3>
            <p>Total Murid</p>
          </div>
        </div>
      </section>

      {notifications && notifications.length > 0 && (
        <section className="dashboard-section">
          <h2>
            <Bell size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Notifikasi 
            <span className="badge">{notifications.filter(n => !n.is_read).length}</span>
          </h2>
          <div className="notifications-list">
            {notifications.slice(0, 5).map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
              >
                <span className="notification-icon">
                  {notification.type === 'grade' ? <FileText size={20} /> : 
                   notification.type === 'submission' ? <CloudUpload size={20} /> :
                   notification.type === 'announcement' ? <Bell size={20} /> : <Bell size={20} />}
                </span>
                <div className="notification-content">
                  <p>{notification.message}</p>
                  <small>{new Date(notification.created_at).toLocaleString()}</small>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="dashboard-section">
        <h2>📚 Kursus Saya</h2>
        {courses.length > 0 ? (
          <div className="cards-grid">
            {courses.slice(0, 3).map(course => (
              <div key={course.id} className="card card-course">
                {course.thumbnail_url && (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px 8px 0 0' }}
                  />
                )}
                <div className="card-header">
                  <span className="course-code">{course.title?.substring(0, 3).toUpperCase() || 'KURSUS'}</span>
                  <span className="course-icon">📚</span>
                </div>
                <h3>{course.title}</h3>
                <p>{course.description?.substring(0, 60)}...</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">📚</span>
            <p>Anda belum membuat kursus.</p>
          </div>
        )}
      </section>
    </div>
  );
};

// Materials View with Welcome Message
const MaterialsView = ({ materials, courses, onRefresh, refreshing }) => (
  <div className="dashboard-content">
    {/* Welcome Message */}
    <div style={{ 
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      borderRadius: '16px',
      padding: '1.5rem',
      color: 'white',
      marginBottom: '1.5rem',
      textAlign: 'center'
    }}>
      <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>📄 Manajemen Materi</h2>
      <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
        Bagikan pengetahuan Anda melalui materi pembelajaran yang berkualitas.
      </p>
    </div>

    <section className="dashboard-section">
      <h2>📄 Materi Pembelajaran</h2>
      <p style={{ color: '#6b7280' }}>Fitur manajemen materi dalam pengembangan.</p>
      {materials.length > 0 ? (
        <div className="cards-grid">
          {materials.slice(0, 10).map(material => (
            <div key={material.id} className="card">
              <h3>{material.title}</h3>
              <p>{material.content?.substring(0, 100)}...</p>
              <small style={{ color: '#6b7280' }}>
                📅 {new Date(material.created_at).toLocaleDateString()}
              </small>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">📄</span>
          <p>Belum ada materi.</p>
        </div>
      )}
    </section>
  </div>
);

// Assignments View with Create/Delete functionality
const AssignmentsView = ({ assignments, submissions, courses, onRefresh, refreshing }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    due_date: '',
    max_points: 100,
    external_link: '',
    external_link_type: '',
    course_id: ''
  });

  // Filter assignments by course
  const filteredAssignments = selectedCourseFilter === 'all' 
    ? assignments 
    : assignments.filter(a => a.course_id === selectedCourseFilter);

  // Get course name by ID
  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course?.title || 'Unknown Course';
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!newAssignment.course_id) {
      alert('Silakan pilih kursus terlebih dahulu!');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('assignments')
        .insert([{
          title: newAssignment.title,
          description: newAssignment.description,
          due_date: newAssignment.due_date,
          max_points: parseInt(newAssignment.max_points),
          external_link: newAssignment.external_link,
          external_link_type: newAssignment.external_link_type,
          course_id: newAssignment.course_id,
          status: 'open',
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      setShowCreateForm(false);
      setNewAssignment({
        title: '',
        description: '',
        due_date: '',
        max_points: 100,
        external_link: '',
        external_link_type: '',
        course_id: ''
      });
      alert('Tugas berhasil dibuat! Murid akan melihat tugas baru ini.');
      onRefresh();
    } catch (err) {
      alert('Gagal membuat tugas: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tugas ini?')) return;
    
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Tugas berhasil dihapus.');
      onRefresh();
    } catch (err) {
      alert('Gagal menghapus tugas: ' + err.message);
    }
  };

  return (
    <div className="dashboard-content">
      <div style={{ 
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        color: 'white',
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
          <FileText size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Manajemen Tugas
        </h2>
        <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
          Buat dan kelola tugas untuk murid Anda.
        </p>
      </div>

      {/* Course Filter */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <label style={{ fontWeight: '500' }}>Filter Kursus:</label>
        <select
          value={selectedCourseFilter}
          onChange={(e) => setSelectedCourseFilter(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '0.95rem',
            minWidth: '200px'
          }}
        >
          <option value="all">Semua Kursus</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
      </div>

      <button 
        className="btn btn-primary"
        onClick={() => setShowCreateForm(true)}
        style={{ marginBottom: '1rem' }}
      >
        <Plus size={18} style={{ marginRight: '8px' }} />
        Buat Tugas Baru
      </button>

      {showCreateForm && (
        <form onSubmit={handleCreate} className="form-container" style={{ marginBottom: '2rem' }}>
          <h3>
            <FileText size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Buat Tugas Baru
          </h3>
          <div className="form-group">
            <label>Pilih Kursus <span style={{ color: 'red' }}>*</span></label>
            <select
              value={newAssignment.course_id}
              onChange={(e) => setNewAssignment({ ...newAssignment, course_id: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '1rem'
              }}
            >
              <option value="">-- Pilih Kursus --</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Judul Tugas</label>
            <input
              type="text"
              value={newAssignment.title}
              onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Deskripsi</label>
            <textarea
              value={newAssignment.description}
              onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>Tanggal Jatuh Tempo</label>
            <input
              type="datetime-local"
              value={newAssignment.due_date}
              onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Nilai Maksimal</label>
            <input
              type="number"
              value={newAssignment.max_points}
              onChange={(e) => setNewAssignment({ ...newAssignment, max_points: parseInt(e.target.value) })}
              min="1"
              max="1000"
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={18} style={{ marginRight: '8px' }} />
              Simpan
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>Batal</button>
          </div>
        </form>
      )}

      <section className="dashboard-section">
        <h2>
          <BookOpen size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Daftar Tugas
        </h2>
        {filteredAssignments.length > 0 ? (
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Kursus</th>
                  <th>Judul</th>
                  <th>Deskripsi</th>
                  <th>Jatuh Tempo</th>
                  <th>Max Poin</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map(assignment => (
                  <tr key={assignment.id}>
                    <td>
                      <span style={{ 
                        background: '#e0e7ff', 
                        color: '#4338ca',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: '500'
                      }}>
                        {getCourseName(assignment.course_id)}
                      </span>
                    </td>
                    <td>{assignment.title}</td>
                    <td>{assignment.description?.substring(0, 50)}...</td>
                    <td>{assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : '-'}</td>
                    <td>{assignment.max_points}</td>
                    <td>
                      <span className={`badge ${assignment.status === 'open' ? 'badge-success' : 'badge-secondary'}`}>
                        {assignment.status === 'open' ? 'Aktif' : 'Ditutup'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(assignment.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <FileText size={48} className="empty-icon" />
            <p>Belum ada tugas. Buat tugas pertama Anda!</p>
          </div>
        )}
      </section>
    </div>
  );
};

// Enhanced Submissions View with detailed grading info and file download
const SubmissionsView = ({ submissions, onRefresh, onGradeSubmit }) => {
  const [filter, setFilter] = useState('all'); // all, pending, graded
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  
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

  // Get file name from URL
  const getFileName = (url) => {
    if (!url) return null;
    const parts = url.split('/');
    return parts[parts.length - 1] || 'File';
  };

  // Handle file download
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
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  return (
    <div className="dashboard-content">
      {/* Welcome Message */}
      <div style={{ 
        background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        color: 'white',
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>📥 Submission & Penilaian</h2>
        <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
          Tinjau dan nilai tugas yang dikumpulkan oleh murid Anda.
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: 0, fontSize: '1.5rem' }}>{submissions.length}</h4>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.9 }}>Total Submission</p>
        </div>
        <div style={{ 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: 0, fontSize: '1.5rem' }}>{gradedCount}</h4>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.9 }}>Sudah Dinilai</p>
        </div>
        <div style={{ 
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: 0, fontSize: '1.5rem' }}>{pendingCount}</h4>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.9 }}>Menunggu Nilai</p>
        </div>
        <div style={{ 
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: 0, fontSize: '1.5rem' }}>{avgGrade}</h4>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.9 }}>Rata-rata Nilai</p>
        </div>
      </div>

      <section className="dashboard-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>📥 Submission Terbaru</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('all')}
            >
              Semua
            </button>
            <button 
              className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('pending')}
            >
              Menunggu
            </button>
            <button 
              className={`btn ${filter === 'graded' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('graded')}
            >
              Sudah Dinilai
            </button>
          </div>
        </div>

        {filteredSubmissions.length > 0 ? (
          <div className="submissions-grid">
            {filteredSubmissions.map(submission => (
              <div 
                key={submission.id} 
                className={`submission-card ${submission.grade === null ? 'pending' : 'graded'}`}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: submission.grade === null ? '2px solid #f59e0b' : '2px solid #10b981',
                  marginBottom: '1rem'
                }}
              >
                {/* Header - Student Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}>
                        {(submission.student_email || submission.student_id || 'M').charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', color: '#1f2937' }}>
                          {submission.student_email || `Murid: ${submission.student_id?.substring(0, 8)}...`}
                        </h4>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                          📚 {submission.course_title || 'Kursus'} • 📝 {submission.assignment_title || 'Tugas'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {submission.grade !== null ? (
                      <span style={{ 
                        background: '#10b981', 
                        color: 'white', 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '20px',
                        fontWeight: '600',
                        fontSize: '0.875rem'
                      }}>
                        ⭐ {submission.grade}/{submission.max_points || 100}
                      </span>
                    ) : (
                      <span style={{ 
                        background: '#f59e0b', 
                        color: 'white', 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '20px',
                        fontWeight: '600',
                        fontSize: '0.75rem'
                      }}>
                        ⏳ Menunggu
                      </span>
                    )}
                  </div>
                </div>

                {/* Submission Content */}
                {submission.content && (
                  <div style={{ 
                    background: '#f9fafb', 
                    padding: '0.75rem', 
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151' }}>
                      {submission.content.substring(0, 200)}
                      {submission.content.length > 200 ? '...' : ''}
                    </p>
                  </div>
                )}

                {/* File Attachment */}
                {submission.attachment_url && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    background: '#eef2ff',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>📎</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                        {getFileName(submission.attachment_url)}
                      </p>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                        Klik untuk mengunduh
                      </p>
                    </div>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleDownload(submission.attachment_url, getFileName(submission.attachment_url))}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      ⬇️ Unduh
                    </button>
                  </div>
                )}

                {/* Submission Time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    🕐 Dikumpulkan: {new Date(submission.submitted_at).toLocaleString()}
                  </span>
                  {submission.graded_at && (
                    <span style={{ fontSize: '0.75rem', color: '#10b981' }}>
                      ✅ Dinilai: {new Date(submission.graded_at).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Feedback */}
                {submission.feedback && (
                  <div style={{ 
                    background: '#fef3c7', 
                    padding: '0.75rem', 
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#92400e' }}>
                      <strong>💬 Feedback:</strong> {submission.feedback}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {submission.grade === null ? (
                    <button 
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      onClick={() => {
                        const grade = prompt('Masukkan nilai (0-100):');
                        if (grade !== null && !isNaN(grade)) {
                          const feedback = prompt('Masukkan feedback (opsional):');
                          supabase
                            .from('submissions')
                            .update({ 
                              grade: parseInt(grade), 
                              feedback: feedback || '',
                              graded_at: new Date().toISOString()
                            })
                            .eq('id', submission.id)
                            .then(() => {
                              alert('Nilai berhasil disimpan!');
                              onGradeSubmit();
                            })
                            .catch(err => alert('Gagal menyimpan nilai: ' + err.message));
                        }
                      }}
                    >
                      ⭐ Beri Nilai
                    </button>
                  ) : (
                    <button 
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                      onClick={() => {
                        const grade = prompt('Masukkan nilai baru (0-100):', submission.grade);
                        if (grade !== null && !isNaN(grade)) {
                          const feedback = prompt('Masukkan feedback (opsional):', submission.feedback || '');
                          supabase
                            .from('submissions')
                            .update({ 
                              grade: parseInt(grade), 
                              feedback: feedback || '',
                              graded_at: new Date().toISOString()
                            })
                            .eq('id', submission.id)
                            .then(() => {
                              alert('Nilai berhasil diperbarui!');
                              onGradeSubmit();
                            })
                            .catch(err => alert('Gagal menyimpan nilai: ' + err.message));
                        }
                      }}
                    >
                      ✏️ Edit Nilai
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">📥</span>
            <p>Belum ada submission untuk tugas Anda.</p>
          </div>
        )}
      </section>
    </div>
  );
};

// Enhanced Students View
const StudentsView = ({ students, courses, submissions }) => {
  const { user } = useAuth();

  const getStudentSubmissions = (studentId) => {
    return submissions.filter(s => s.student_id === studentId);
  };

  const getStudentStats = (studentId) => {
    const studentSubs = getStudentSubmissions(studentId);
    const graded = studentSubs.filter(s => s.grade !== null);
    const avgGrade = graded.length > 0
      ? Math.round(graded.reduce((sum, s) => sum + s.grade, 0) / graded.length)
      : 0;
    return { total: studentSubs.length, graded: graded.length, avgGrade };
  };

  return (
    <div className="dashboard-content">
      {/* Welcome Message */}
      <div style={{ 
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        color: 'white',
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>👥 Daftar Murid</h2>
        <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
          Kelola dan pantau progres belajar murid Anda.
        </p>
      </div>

      <section className="dashboard-section">
        <h2>🎓 Murid Terdaftar</h2>
        {students && students.length > 0 ? (
          <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {students.map(student => {
              const studentCourses = courses || [];
              const stats = getStudentStats(student.id);
              
              return (
                <div 
                  key={student.id} 
                  className="card"
                  style={{ 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    background: 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', color: '#1f2937' }}>{student.email}</h3>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                        🎓 Murid
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '0.5rem',
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#3b82f6' }}>{stats.total}</p>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: '#6b7280' }}>Submission</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#10b981' }}>{stats.graded}</p>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: '#6b7280' }}>Dinilai</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#f59e0b' }}>{stats.avgGrade}</p>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: '#6b7280' }}>Rata-rata</p>
                    </div>
                  </div>
                  
                  {studentCourses.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                        <strong>Kursus:</strong> {studentCourses.map(c => c.title).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">👥</span>
            <p>Belum ada murid terdaftar.</p>
          </div>
        )}
      </section>
    </div>
  );
};

// Messages View Component for Teachers
const MessagesView = ({ notifications }) => {
  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  return (
    <div className="dashboard-content">
      {/* Welcome Message */}
      <div style={{ 
        background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        color: 'white',
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>✉️ Notifikasi & Pesan</h2>
        <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
          Pantau notifikasi dari murid dan sistem.
        </p>
      </div>

      <section className="dashboard-section">
        <h2>
          🔔 Notifikasi 
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </h2>

        {notifications && notifications.length > 0 ? (
          <div className="notifications-list">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
              >
                <span className="notification-icon" style={{ fontSize: '1.5rem' }}>
                  {notification.type === 'grade' ? '📝' : 
                   notification.type === 'submission' ? '📤' :
                   notification.type === 'announcement' ? '📢' : 
                   notification.type === 'enrollment' ? '🎉' :
                   notification.type === 'reminder' ? '⏰' : '🔔'}
                </span>
                <div className="notification-content">
                  <p style={{ fontSize: '1rem', fontWeight: notification.is_read ? 'normal' : 'bold' }}>
                    {notification.message}
                  </p>
                  <small style={{ color: '#6b7280' }}>
                    📅 {new Date(notification.created_at).toLocaleString()}
                  </small>
                </div>
                {!notification.is_read && (
                  <span className="badge" style={{ marginLeft: 'auto' }}>Baru</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">✉️</span>
            <p>Tidak ada notifikasi.</p>
          </div>
        )}
      </section>
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
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    } else if (user?.email) {
      setDisplayName(user.email.split('@')[0]);
    }
  }, [profile, user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Nama tampilan tidak boleh kosong');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

      await updateProfile({ display_name: displayName.trim() });
      setMessage('Profil berhasil diperbarui!');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error updating profile:', err);
      if (err.message.includes('display_name')) {
        setError('Kolom display_name belum ada di tabel. Silakan jalankan migration SQL di Supabase.');
      } else if (err.message.includes('null value in column "email"')) {
        setError('Email tidak ditemukan. Silakan logout dan login kembali.');
      } else {
        setError('Gagal memperbarui profil: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-content">
      {/* Welcome Message */}
      <div style={{ 
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        color: 'white',
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>👤 Profil Saya</h2>
        <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
          Kelola informasi profil Anda.
        </p>
      </div>

      <section className="dashboard-section">
        <h2>📝 Edit Profil</h2>
        
        {message && (
          <div className="success-message" style={{ 
            background: '#dcfce7', 
            color: '#166534', 
            padding: '0.75rem', 
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            {message}
          </div>
        )}
        
        {error && (
          <div className="error-message" style={{ 
            background: '#fee2e2', 
            color: '#dc2626', 
            padding: '0.75rem', 
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSave} style={{ maxWidth: '500px' }}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              color: '#374151'
            }}>
              Email
            </label>
            <input 
              type="email" 
              value={user?.email || ''} 
              disabled
              style={{ 
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                backgroundColor: '#f3f4f6',
                color: '#6b7280'
              }}
            />
            <small style={{ color: '#6b7280', fontSize: '0.85rem' }}>
              Email tidak dapat diubah
            </small>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              color: '#374151'
            }}>
              Nama Tampilan
            </label>
            <input 
              type="text" 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Masukkan nama tampilan"
              style={{ 
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '1rem'
              }}
            />
            <small style={{ color: '#6b7280', fontSize: '0.85rem' }}>
              Nama ini akan terlihat oleh siswa dan admin
            </small>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
            style={{ minWidth: '150px' }}
          >
            {loading ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
          </button>
        </form>
      </section>

      <section className="dashboard-section" style={{ marginTop: '2rem' }}>
        <h2>ℹ️ Informasi Akun</h2>
        <div style={{ 
          background: '#f9fafb', 
          padding: '1.5rem', 
          borderRadius: '12px',
          maxWidth: '500px'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Role:</strong> Guru
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Status:</strong> Aktif
          </div>
          <div>
            <strong>ID:</strong> <code style={{ fontSize: '0.85rem' }}>{user?.id}</code>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TeacherDashboard;
