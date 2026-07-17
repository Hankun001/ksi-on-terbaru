import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { StudentSubmission } from './AssignmentModule';
import AnnouncementModule from '../modules/AnnouncementModule';
import ProfileModule from '../modules/ProfileModule';
import MessagingPage from '../modules/MessagingModule';
import StudentProgressModule from '../modules/StudentProgressModule';
import ExamModule from '../modules/exams/pages/ExamModule';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  BookOpen, FileText, Bell, Mail, User, BarChart3,
  CheckCircle, Clock, RefreshCw, ChevronRight, LogOut,
  Award, GraduationCap, Calendar, FolderOpen, Eye,
  AlertTriangle, Plus, Search, Grid, List, FileCheck
} from 'lucide-react';

const StudentDashboard = ({ activeSection = 'dashboard-murid', onNavigate }) => {
  const { user, profile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedAssignments: 0,
    pendingAssignments: 0,
    averageGrade: 0
  });
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      // Get enrolled courses
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('course_id, enrolled_at')
        .eq('student_id', user.id);

      if (enrollmentError) throw enrollmentError;

      const courseIds = enrollmentData.map(enrollment => enrollment.course_id);
      let courseList = [];
      if (courseIds.length > 0) {
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id, title, description, created_at, instructor_id, thumbnail_url')
          .in('id', courseIds);

        if (courseError) throw courseError;

        // Get instructor info
        const instructorIds = [...new Set(courseData?.map(c => c.instructor_id) || [])];
        let instructorMap = {};
        if (instructorIds.length > 0) {
          const { data: instructorData } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', instructorIds);
          
          instructorData?.forEach(inst => {
            instructorMap[inst.id] = inst;
          });
        }

        courseList = courseData?.map(course => ({
          ...course,
          instructor: instructorMap[course.instructor_id]?.email
        })) || [];
        
        setCourses(courseList);
      }

      // Get assignments for enrolled courses
      let assignmentList = [];
      if (courseIds.length > 0) {
        const { data: assignData, error: assignmentError } = await supabase
          .from('assignments')
          .select('id, title, description, due_date, max_points, course_id, created_at')
          .in('course_id', courseIds)
          .order('due_date', { ascending: true });

        if (assignmentError) throw assignmentError;
        
        assignmentList = assignData;
        setAssignments(assignData);
      }

      // Get materials for enrolled courses
      if (courseIds.length > 0) {
        const { data: materialData, error: materialError } = await supabase
          .from('materials')
          .select('*')
          .in('course_id', courseIds)
          .order('created_at', { ascending: false });

        if (materialError) throw materialError;
        setMaterials(materialData || []);
      }

      // Get submissions for this student
      const { data: subData, error: subError } = await supabase
        .from('submissions')
        .select('id, submitted_at, grade, assignment_id, feedback, content, attachment_url')
        .eq('student_id', user.id);

      if (subError) throw subError;

      // Get assignment and course info for submissions
      const submissionsWithInfo = await Promise.all(
        subData.map(async (submission) => {
          const { data: assignmentData, error: assignmentError } = await supabase
            .from('assignments')
            .select('title, max_points, course_id, due_date')
            .eq('id', submission.assignment_id)
            .single();

            let courseData = null;
            if (assignmentData && assignmentData.course_id) {
              const { data: courseResult } = await supabase
                .from('courses')
                .select('title, instructor_id')
                .eq('id', assignmentData.course_id)
                .single();
              courseData = courseResult;
            }

            return {
              ...submission,
              assignments: assignmentError ? null : assignmentData,
              courses: courseData
            };
        })
      );

      setSubmissions(submissionsWithInfo);

      // Calculate stats
      const completedCount = submissionsWithInfo.filter(sub => sub.grade !== null).length;
      const pendingCount = submissionsWithInfo.filter(sub => sub.grade === null && sub.content).length;
      
      // Calculate average grade
      const gradedSubmissions = submissionsWithInfo.filter(sub => sub.grade !== null);
      const averageGrade = gradedSubmissions.length > 0
        ? Math.round(gradedSubmissions.reduce((acc, sub) => acc + (sub.grade / sub.assignments?.max_points * 100), 0) / gradedSubmissions.length)
        : 0;

      setStats({
        enrolledCourses: courseList.length,
        completedAssignments: completedCount,
        pendingAssignments: pendingCount,
        averageGrade: averageGrade
      });

      // Fetch notifications
      await fetchNotifications();

    } catch (error) {
      console.error('Error fetching data:', error.message);
      setError('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (notifData) {
        setNotifications(notifData);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error.message);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Submit assignment
  const handleSubmitAssignment = async (assignmentId, content, attachmentUrl) => {
    try {
      // Check if already submitted
      const existing = submissions.find(s => s.assignment_id === assignmentId);
      
      if (existing) {
        // Update existing submission
        const { error } = await supabase
          .from('submissions')
          .update({
            content,
            attachment_url: attachmentUrl,
            submitted_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new submission
        const { error } = await supabase
          .from('submissions')
          .insert({
            assignment_id: assignmentId,
            student_id: user.id,
            content,
            attachment_url: attachmentUrl,
            submitted_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      // Notify teacher
      const assignment = assignments.find(a => a.id === assignmentId);
      if (assignment?.course_id) {
        const { data: course } = await supabase
          .from('courses')
          .select('instructor_id')
          .eq('id', assignment.course_id)
          .single();
        
        if (course?.instructor_id) {
          await supabase.from('notifications').insert({
            user_id: course.instructor_id,
            type: 'submission',
            message: `Murid ${user.email} telah mengumpulkan tugas "${assignment.title}"`
          });
        }
      }

      // Refresh data
      fetchData();
    } catch (error) {
      throw error;
    }
  };

  // Subscribe to real-time changes
  useEffect(() => {
    if (!user) return;

    fetchData();

    // Real-time subscription for submissions
    const submissionsChannel = supabase
      .channel('student-submissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `student_id=eq.${user.id}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    // Real-time subscription for notifications
    const notificationsChannel = supabase
      .channel('student-notifications-changes')
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

    // Real-time for enrollments (when enrolled in new courses)
    const enrollmentsChannel = supabase
      .channel('student-enrollments-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'enrollments',
          filter: `student_id=eq.${user.id}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(submissionsChannel);
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(enrollmentsChannel);
    };
  }, [user]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error.message);
    }
  };

  // Handle notification click - navigate to relevant section
  const handleNotificationClick = (notification) => {
    // Mark as read if not already
    if (!notification?.is_read) {
      markAsRead(notification?.id);
    }
    
    // Navigate based on notification type
    if (notification?.type === 'assignment' || notification?.type === 'submission') {
      onNavigate && onNavigate('assignments-murid');
    } else if (notification?.type === 'announcement') {
      onNavigate && onNavigate('announcements-murid');
    } else if (notification?.type === 'enrollment') {
      onNavigate && onNavigate('courses-murid');
    }
  };

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard-murid':
        return <DashboardOverview 
          stats={stats} 
          courses={courses} 
          assignments={assignments} 
          submissions={submissions} 
          notifications={notifications} 
          onRefresh={handleRefresh} 
          refreshing={refreshing}
          onNotificationClick={handleNotificationClick}
        />;
      case 'courses-murid':
        return <CoursesView 
          courses={courses} 
          materials={materials}
          onRefresh={handleRefresh} 
          refreshing={refreshing}
          onNavigate={onNavigate}
        />;
      case 'assignments-murid':
        return (
          <div className="dashboard-content">
            {/* Welcome Message */}
            <div style={{ 
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              color: 'white',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>📝 Tugas Saya</h2>
              <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
                Kerjakan dan kumpulkan tugas Anda tepat waktu.
              </p>
            </div>
            <StudentSubmission 
              assignments={assignments}
              studentSubmissions={submissions}
              onSubmitAssignment={handleSubmitAssignment}
            />
          </div>
        );
      case 'progress-murid':
        return <StudentProgressModule />;
      case 'announcements-murid':
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
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>📢 Pengumuman</h2>
              <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
                Ikuti informasi dan pengumuman penting dari sekolah.
              </p>
            </div>
            <AnnouncementModule />
          </div>
        );
      case 'exams-murid':
        return <ExamModule role="murid" onNavigate={onNavigate} />;
      case 'messages-murid':
        return <MessagingPage />;
      case 'profile-murid':
        return <ProfileModule onRefresh={handleRefresh} />;
      default:
        return <DashboardOverview 
          stats={stats} 
          courses={courses} 
          assignments={assignments} 
          submissions={submissions} 
          notifications={notifications} 
          onRefresh={handleRefresh} 
          refreshing={refreshing}
          onNotificationClick={handleNotificationClick}
        />;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Memuat data..." />;
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
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
            Dasbor Murid
          </h1>
          <p>Selamat datang, {profile?.display_name || user?.email?.split('@')[0] || 'Murid'}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={handleRefresh} 
            className="btn btn-secondary"
            disabled={refreshing}
          >
            {refreshing ? <RefreshCw size={18} className="spinning" /> : <RefreshCw size={18} />} Refresh
          </button>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};


const DashboardOverview = ({ stats, courses, assignments, submissions = [], notifications = [], onRefresh, refreshing, onNotificationClick }) => {
  const unreadCount = notifications.filter(n => !n.is_read).length || 0;
  
  // Get time-based greeting
  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) return 'Selamat Pagi';
    if (currentHour < 15) return 'Selamat Siang';
    if (currentHour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };
   
  // Get upcoming assignments (not submitted and not overdue)
  const upcomingAssignments = assignments
    .filter(a => {
      const isSubmitted = submissions.some(s => s?.assignment_id === a.id);
      const isOverdue = a.due_date && new Date(a.due_date) < new Date();
      return !isSubmitted && !isOverdue;
    })
    .slice(0, 3);

  return (
    <div className="dashboard-content">
      {/* Welcome Message */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '2rem 1.5rem',
        color: 'white',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{
          margin: '0 0 0.5rem 0',
          fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
          lineHeight: 1.2
        }}>
          {getGreeting()} 👋
        </h1>
        <p style={{
          margin: 0,
          fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
          opacity: 0.9,
          lineHeight: 1.4
        }}>
          Hai Murid! Selamat belajar. Semangat mencapai prestasi terbaikmu!
        </p>
      </div>

      <section className="dashboard-stats">
        <h2>
            <BarChart3 size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Statistik Saya
          </h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <h3>{stats.enrolledCourses}</h3>
            <p>Kursus Diambil</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <h3>{stats.completedAssignments}</h3>
            <p>Tugas Selesai</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Clock size={24} /></div>
            <h3>{stats.pendingAssignments}</h3>
            <p>Menunggu Nilai</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <h3>{stats.averageGrade}%</h3>
            <p>Rata-rata Nilai</p>
          </div>
        </div>
      </section>

      {notifications && notifications.length > 0 && (
        <section className="dashboard-section">
          <h2>
            <Bell size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Notifikasi 
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </h2>
          <div className="notifications-list">
            {notifications.slice(0, 5).map(notification => (
              <div 
                key={notification?.id} 
                className={`notification-item ${!notification?.is_read ? 'unread' : ''}`}
                onClick={() => onNotificationClick && onNotificationClick(notification)}
                style={{ cursor: 'pointer' }}
              >
                <span className="notification-icon">
                  {notification?.type === 'assignment' ? '📝' :
                   notification?.type === 'grade' ? '📝' : 
                   notification?.type === 'submission' ? '📤' :
                   notification?.type === 'announcement' ? '📢' : 
                   notification?.type === 'enrollment' ? '🎉' :
                   notification?.type === 'reminder' ? '⏰' : '🔔'}
                </span>
                <div className="notification-content">
                  <p>{notification?.message}</p>
                  <small>{notification?.created_at ? new Date(notification.created_at).toLocaleString() : '-'}</small>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="dashboard-section">
        <h2>📅 Tugas Mendatang</h2>
        {upcomingAssignments.length > 0 ? (
          <div className="cards-grid">
            {upcomingAssignments.map(assignment => (
              <div key={assignment.id} className="card">
                <h3>{assignment.title}</h3>
                <p>{assignment.description?.substring(0, 100)}...</p>
                <div className="card-footer">
                  <small><Calendar size={14} style={{ marginRight: '4px' }} /> Batas: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : '-'}</small>
                  <small><FileText size={14} style={{ marginRight: '4px' }} /> Max: {assignment.max_points} poin</small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">✅</span>
            <p>Tidak ada tugas mendatang! 🎉</p>
          </div>
        )}
      </section>

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
                {course.instructor && (
                  <small style={{ color: '#6b7280' }}>👨‍🏫 {course.instructor}</small>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">📚</span>
            <p>Anda belum terdaftar di kursus.</p>
          </div>
        )}
      </section>
    </div>
  );
};

// Courses View Component
const CoursesView = ({ courses, materials, onRefresh, refreshing, onNavigate }) => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter courses based on search
  const filteredCourses = courses.filter(course =>
    course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-content courses-view">
      {/* Hero Section */}
      <div className="courses-hero">
        <div className="hero-content">
          <div className="hero-icon">
            <BookOpen size={32} />
          </div>
          <div className="hero-text">
            <h1>Kursus Saya</h1>
            <p>Jelajahi dan pelajari materi dari kursus yang Anda ambil</p>
          </div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat-item">
            <span className="hero-stat-number">{courses.length}</span>
            <span className="hero-stat-label">Total Kursus</span>
          </div>
          <div className="hero-stat-item">
            <span className="hero-stat-number">{materials.length}</span>
            <span className="hero-stat-label">Total Materi</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="courses-toolbar" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div className="search-box" style={{
          position: 'relative',
          width: '100%'
        }}>
          <Search size={18} className="search-icon" style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6b7280',
            zIndex: 1
          }} />
          <input
            type="text"
            placeholder="Cari kursus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 0.75rem 0.75rem 2.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem',
              background: 'white',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>
        <div className="view-toggle" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Tampilan Grid"
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: viewMode === 'grid' ? '#8b5cf6' : 'white',
              color: viewMode === 'grid' ? 'white' : '#6b7280',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Grid size={18} />
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Tampilan List"
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: viewMode === 'list' ? '#8b5cf6' : 'white',
              color: viewMode === 'list' ? 'white' : '#6b7280',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Courses Grid/List */}
      {filteredCourses.length > 0 ? (
        <div className={`courses-${viewMode}`}>
          {filteredCourses.map((course, index) => {
            const courseMaterials = materials.filter(m => m.course_id === course.id);
            const completedMaterials = 0; // Could be calculated from progress
            const progressPercent = courseMaterials.length > 0 
              ? Math.round((completedMaterials / courseMaterials.length) * 100) 
              : 0;
            
            return (
              <div 
                key={course.id} 
                className="course-card-modern"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Course Thumbnail */}
                <div className="course-thumbnail-wrapper">
                  {course.thumbnail_url ? (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className="course-thumbnail-img"
                    />
                  ) : (
                    <div className="course-thumbnail-placeholder">
                      <BookOpen size={40} />
                    </div>
                  )}
                  <div className="course-overlay">
                    <button 
                      onClick={() => onNavigate && onNavigate(`course-view-${course.id}`)}
                      className="btn-access-material"
                    >
                      <Eye size={18} />
                      <span>Lihat Materi</span>
                    </button>
                  </div>
                  <div className="course-badge">
                    {courseMaterials.length} Materi
                  </div>
                </div>

                {/* Course Info */}
                <div className="course-info-modern">
                  <h3 className="course-title">{course.title}</h3>
                  <p className="course-description">
                    {course.description?.substring(0, 100)}
                    {course.description?.length > 100 ? '...' : ''}
                  </p>
                  
                  {/* Course Meta */}
                  <div className="course-meta-modern">
                    <div className="meta-item">
                      <User size={14} />
                      <span>{course.instructor ? course.instructor.split('@')[0] : 'Instruktur'}</span>
                    </div>
                    <div className="meta-item">
                      <FileText size={14} />
                      <span>{courseMaterials.length} Materi</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="course-progress-section">
                    <div className="progress-header">
                      <span>Progress</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="progress-bar-modern">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <button 
                    onClick={() => onNavigate && onNavigate(`course-view-${course.id}`)}
                    className="btn-course-action"
                  >
                    <BookOpen size={18} />
                    <span>Akses Materi</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state-modern">
          <div className="empty-icon-wrapper">
            <BookOpen size={48} />
          </div>
          <h3>Tidak Ada Kursus Ditemukan</h3>
          <p>
            {searchQuery 
              ? 'Tidak ada kursus yang cocok dengan pencarian Anda.'
              : 'Anda belum terdaftar di kursus mana pun.'}
          </p>
          {!searchQuery && (
            <p className="empty-hint">Hubungi guru Anda untuk mendaftar ke kursus.</p>
          )}
        </div>
      )}
    </div>
  );
};

// Progress View Component
const ProgressView = ({ stats, courses, materials, submissions = [], onRefresh, refreshing }) => {
  // Calculate progress per course
  const courseProgress = courses.map(course => {
    
    const completedCount = submissions.filter(s => 
      s?.courses?.id === course.id && s.grade !== null
    ).length;
    
    const totalAssignments = submissions.filter(s => 
      s?.courses?.id === course.id
    ).length;

    return {
      ...course,
      completedAssignments: completedCount,
      totalAssignments,
      progressPercentage: totalAssignments > 0 
        ? Math.round((completedCount / totalAssignments) * 100) 
        : 0
    };
  });

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
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>📈 Progress Kursus</h2>
        <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
          Pantau perkembangan dan prestasi belajar Anda.
        </p>
      </div>

      <section className="dashboard-section">
        <div className="section-header">
          <h2>📈 Progress Kursus</h2>
          <button onClick={onRefresh} className="btn btn-secondary btn-sm" disabled={refreshing}>
            {refreshing ? '↻' : '🔄'} Refresh
          </button>
        </div>

        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <h3>{stats.enrolledCourses}</h3>
            <p>Kursus Diambil</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <h3>{stats.completedAssignments}</h3>
            <p>Tugas Selesai</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <h3>{stats.averageGrade}%</h3>
            <p>Rata-rata Nilai</p>
          </div>
        </div>

        {courseProgress.length > 0 ? (
          <div className="cards-grid">
            {courseProgress.map(course => (
              <div key={course.id} className="card">
                <h3>{course.title}</h3>
                <p>{course.description?.substring(0, 60)}...</p>
                
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <small>Progress Tugas</small>
                    <small>{course.completedAssignments}/{course.totalAssignments}</small>
                  </div>
                  <div style={{ 
                    background: '#e5e7eb', 
                    borderRadius: '9999px', 
                    height: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${course.progressPercentage}%`,
                      background: course.progressPercentage === 100 ? '#10b981' : '#3b82f6',
                      height: '100%',
                      borderRadius: '9999px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <small style={{ display: 'block', marginTop: '0.25rem', textAlign: 'right' }}>
                    {course.progressPercentage}%
                  </small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">📈</span>
            <p>Belum ada data progress.</p>
          </div>
        )}
      </section>
    </div>
  );
};

// Messages/Notifications View Component
const MessagesView = ({ notifications, onMarkAsRead }) => {
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
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>🔔 Notifikasi & Pesan</h2>
        <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
          Tetap terupdate dengan informasi penting dari guru dan admin.
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
                onClick={() => !notification.is_read && onMarkAsRead(notification.id)}
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
            <span className="empty-icon">🔔</span>
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
              Nama ini akan terlihat oleh guru dan admin
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
            <strong>Role:</strong> Murid
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

export default StudentDashboard;
