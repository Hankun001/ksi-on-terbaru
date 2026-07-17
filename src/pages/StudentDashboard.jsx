import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { StudentSubmission } from './AssignmentModule';
import AnnouncementModule from '../modules/AnnouncementModule';
import ProfileModule from '../modules/ProfileModule';
import StudentProgressModule from '../modules/StudentProgressModule';
import ExamModule from '../modules/exams/pages/ExamModule';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MessagingPage from '../modules/MessagingModule';
import {
  BookOpen, FileText, Bell, BarChart3,
  CheckCircle, Clock, RefreshCw,
  GraduationCap, Calendar, Eye,
  AlertCircle, Search,
  TrendingUp
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
      <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto">
        <div className="flex items-center gap-sm p-md rounded-xl bg-error-container border border-error/20 mb-md">
          <AlertCircle size={20} className="text-error shrink-0" />
          <p className="text-body-sm font-body text-on-error-container">{error}</p>
        </div>
        <button onClick={handleRefresh} className="flex items-center gap-sm py-sm px-md rounded-xl bg-primary text-on-primary font-label-md hover:bg-primary-container hover:text-on-primary-container transition-all">
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          Coba Lagi
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


const DashboardOverview = ({ stats, courses, assignments, submissions = [], notifications = [], onRefresh, refreshing, onNotificationClick }) => {
  const unreadCount = notifications.filter(n => !n.is_read).length || 0;

  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) return 'Selamat Pagi';
    if (currentHour < 15) return 'Selamat Siang';
    if (currentHour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const upcomingAssignments = assignments
    .filter(a => {
      const isSubmitted = submissions.some(s => s?.assignment_id === a.id);
      const isOverdue = a.due_date && new Date(a.due_date) < new Date();
      return !isSubmitted && !isOverdue;
    })
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-lg">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-md">
        <div>
          <h2 className="text-headline-lg font-display text-on-background flex items-center gap-sm">
            <GraduationCap size={28} className="text-secondary" />
            Dasbor Murid
          </h2>
          <p className="text-body-md font-body text-on-surface-variant mt-1">
            Selamat datang kembali! Siap untuk belajar hari ini?
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-xs bg-surface-container px-sm py-xs rounded-xl text-primary font-label-md font-label hover:bg-primary/10 transition-colors border border-primary/20"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-surface-tint p-xl shadow-[0px_10px_30px_rgba(53,37,205,0.2)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-10 w-40 h-40 bg-secondary-container/20 rounded-full blur-2xl translate-y-1/2" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center py-sm">
          <h3 className="text-headline-md font-display text-white mb-2 flex items-center gap-2">
            {getGreeting()} <span className="text-2xl inline-block animate-bounce">👋</span>
          </h3>
          <p className="text-body-md font-body text-primary-fixed max-w-xl">
            Hai Murid! Selamat belajar. Semangat mencapai prestasi terbaikmu di KSI-ON LMS!
          </p>
        </div>
      </div>

      {/* Stats Grid - Bento Style */}
      <div>
        <h3 className="text-title-lg font-title text-on-background flex items-center gap-xs mb-md">
          <BarChart3 size={20} className="text-outline" />
          Statistik Saya
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
          {/* Stat 1: Enrolled Courses */}
          <div className="bg-surface rounded-xl p-md border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center relative overflow-hidden group hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] transition-all">
            <div className="w-12 h-12 rounded-full bg-secondary-container/30 flex items-center justify-center mb-sm group-hover:scale-110 transition-transform">
              <BookOpen size={24} className="text-secondary fill-current" />
            </div>
            <h4 className="text-3xl font-display font-bold text-on-background mb-1">{stats.enrolledCourses}</h4>
            <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-wider">Kursus Diambil</p>
            <div className="absolute bottom-0 left-0 h-1 bg-secondary w-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </div>

          {/* Stat 2: Completed Assignments */}
          <div className="bg-surface rounded-xl p-md border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center relative overflow-hidden group hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] transition-all">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-sm group-hover:scale-110 transition-transform">
              <CheckCircle size={24} className="text-emerald-600 fill-current" />
            </div>
            <h4 className="text-3xl font-display font-bold text-on-background mb-1">{stats.completedAssignments}</h4>
            <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-wider">Tugas Selesai</p>
            <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 w-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </div>

          {/* Stat 3: Pending Grades */}
          <div className="bg-surface rounded-xl p-md border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center relative overflow-hidden group hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] transition-all">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-sm group-hover:scale-110 transition-transform">
              <Clock size={24} className="text-amber-600" />
            </div>
            <h4 className="text-3xl font-display font-bold text-on-background mb-1">{stats.pendingAssignments}</h4>
            <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-wider">Menunggu Nilai</p>
            <div className="absolute bottom-0 left-0 h-1 bg-amber-500 w-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </div>

          {/* Stat 4: Average Grade */}
          <div className="bg-surface rounded-xl p-md border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center relative overflow-hidden group hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] transition-all">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-sm group-hover:scale-110 transition-transform">
              <TrendingUp size={24} className="text-primary" />
            </div>
            <h4 className="text-3xl font-display font-bold text-primary mb-1">{stats.averageGrade}%</h4>
            <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-wider">Rata-rata Nilai</p>
            <div className="absolute bottom-0 left-0 h-1 bg-primary w-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </div>
        </div>
      </div>

      {/* Two Column: Notifications & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg pb-xl">
        {/* Notifications Column */}
        <div className="flex flex-col gap-md">
          <div className="flex items-center justify-between border-b border-outline-variant/50 pb-sm">
            <h3 className="text-title-lg font-title text-on-background flex items-center gap-xs">
              <Bell size={20} className="text-error fill-current" />
              Notifikasi
              {unreadCount > 0 && <span className="bg-error text-on-error text-label-sm font-label px-2 py-0.5 rounded-full ml-1">{unreadCount}</span>}
            </h3>
          </div>
          <div className="flex flex-col gap-sm">
            {notifications.length > 0 ? notifications.slice(0, 5).map((notification) => (
              <div
                key={notification?.id}
                onClick={() => onNotificationClick && onNotificationClick(notification)}
                className={`rounded-xl p-md border hover:border-primary/30 transition-colors flex gap-md items-start shadow-sm cursor-pointer ${
                  !notification?.is_read ? 'bg-surface-container-low border-outline-variant/20' : 'bg-surface border-outline-variant/20 opacity-80'
                }`}
              >
                <span className="mt-1 text-lg">
                  {notification?.type === 'assignment' || notification?.type === 'grade' ? '📝' :
                   notification?.type === 'submission' ? '📤' :
                   notification?.type === 'announcement' ? '📢' :
                   notification?.type === 'enrollment' ? '🎉' :
                   notification?.type === 'reminder' ? '⏰' : '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-title-md font-title text-on-background line-clamp-1">{notification?.message}</p>
                  <p className="text-label-sm text-[11px] text-outline mt-2 flex items-center gap-1">
                    <Clock size={14} />
                    {notification?.created_at ? new Date(notification.created_at).toLocaleString() : '-'}
                  </p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-xl text-center opacity-60">
                <Bell size={40} className="text-outline mb-sm" />
                <p className="text-body-sm font-body text-on-surface-variant">Belum ada notifikasi</p>
              </div>
            )}
          </div>
        </div>

        {/* Tasks Column */}
        <div className="flex flex-col gap-md">
          <div className="flex items-center justify-between border-b border-outline-variant/50 pb-sm">
            <h3 className="text-title-lg font-title text-on-background flex items-center gap-xs">
              <FileText size={20} className="text-secondary" />
              Tugas Mendatang
            </h3>
          </div>
          {upcomingAssignments.length > 0 ? (
            <div className="flex flex-col gap-sm">
              {upcomingAssignments.map((assignment) => (
                <div key={assignment.id} className="bg-surface rounded-xl p-md border border-outline-variant/30 hover:border-primary/30 transition-colors shadow-sm">
                  <h4 className="text-title-md font-title text-on-background mb-1">{assignment.title}</h4>
                  <p className="text-body-sm font-body text-on-surface-variant line-clamp-2 mb-sm">{assignment.description}</p>
                  <div className="flex items-center gap-md text-label-sm text-outline">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : '-'}</span>
                    <span className="flex items-center gap-1"><FileText size={14} /> {assignment.max_points} poin</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface rounded-xl border border-dashed border-outline-variant flex flex-col items-center justify-center p-xl text-center min-h-[200px]">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-md border-4 border-white shadow-sm">
                <CheckCircle size={36} className="text-emerald-500 fill-current" />
              </div>
              <h4 className="text-title-md font-title text-on-background mb-1">Semua tugas selesai!</h4>
              <p className="text-body-sm font-body text-on-surface-variant max-w-[250px]">Tidak ada tugas mendatang. Nikmati waktu luang Anda! 🏖️</p>
            </div>
          )}
        </div>
      </div>

      {/* My Courses Section */}
      <div className="pb-xl">
        <h3 className="text-title-lg font-title text-on-background flex items-center gap-xs mb-md">
          <BookOpen size={20} className="text-outline" />
          Kursus Saya
        </h3>
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            {courses.slice(0, 6).map((course) => (
              <div key={course.id} className="bg-surface rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden group hover:shadow-[0px_8px_30px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-secondary-container/30 flex items-center justify-center">
                    <BookOpen size={40} className="text-primary/40" />
                  </div>
                )}
                <div className="p-md">
                  <h4 className="text-title-md font-title text-on-background mb-1 line-clamp-1">{course.title}</h4>
                  <p className="text-body-sm font-body text-on-surface-variant line-clamp-2 mb-sm">{course.description}</p>
                  {course.instructor && (
                    <p className="text-label-sm font-label text-outline">👨‍🏫 {course.instructor}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-dashed border-outline-variant flex flex-col items-center justify-center p-xl text-center">
            <BookOpen size={48} className="text-outline/60 mb-md" />
            <h4 className="text-title-md font-title text-on-background mb-1">Belum Ada Kursus</h4>
            <p className="text-body-sm font-body text-on-surface-variant">Anda belum terdaftar di kursus manapun.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Courses View Component
const CoursesView = ({ courses, materials, onRefresh, refreshing, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = courses.filter(course =>
    course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md bg-gradient-to-r from-primary/5 to-surface-container-low rounded-2xl p-lg border border-primary/10">
        <div className="flex items-center gap-md">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen size={28} className="text-primary" />
          </div>
          <div>
            <h2 className="text-headline-md font-display font-semibold text-on-surface">Kursus Saya</h2>
            <p className="text-body-sm font-body text-on-surface-variant">Jelajahi dan pelajari materi dari kursus yang Anda ambil</p>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <div className="text-center px-md py-sm bg-surface rounded-xl border border-outline-variant/30">
            <p className="text-headline-md font-display font-bold text-primary">{courses.length}</p>
            <p className="text-label-sm font-label text-outline">Kursus</p>
          </div>
          <div className="text-center px-md py-sm bg-surface rounded-xl border border-outline-variant/30">
            <p className="text-headline-md font-display font-bold text-secondary">{materials.length}</p>
            <p className="text-label-sm font-label text-outline">Materi</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
        <input
          type="text"
          placeholder="Cari kursus..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-xl pr-md py-sm rounded-xl border border-outline-variant bg-surface-container-low text-body-md font-body text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
        />
      </div>

      {/* Course Cards */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {filteredCourses.map((course, index) => {
            const courseMaterials = materials.filter(m => m.course_id === course.id);
            return (
              <div key={course.id} className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden group hover:shadow-[0px_8px_30px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5" style={{ animationDelay: `${index * 0.05}s` }}>
                {/* Thumbnail */}
                <div className="relative h-40 overflow-hidden">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary-container/30 flex items-center justify-center">
                      <BookOpen size={48} className="text-primary/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-md">
                    <button onClick={() => onNavigate && onNavigate(`course-view-${course.id}`)} className="flex items-center gap-1 bg-white/90 text-primary px-md py-xs rounded-full text-label-sm font-label hover:bg-white transition-colors shadow-md">
                      <Eye size={16} /> Lihat Materi
                    </button>
                  </div>
                  <span className="absolute top-2 right-2 bg-surface/90 text-on-surface-variant text-label-sm font-label px-2 py-0.5 rounded-full text-[11px]">
                    {courseMaterials.length} Materi
                  </span>
                </div>
                {/* Info */}
                <div className="p-md flex flex-col gap-sm">
                  <h3 className="text-title-md font-title text-on-background line-clamp-1">{course.title}</h3>
                  <p className="text-body-sm font-body text-on-surface-variant line-clamp-2">{course.description}</p>
                  <div className="flex items-center gap-md text-label-sm text-outline">
                    <span>👨‍🏫 {course.instructor ? course.instructor.split('@')[0] : 'Instruktur'}</span>
                    <span>📄 {courseMaterials.length} Materi</span>
                  </div>
                  <button onClick={() => onNavigate && onNavigate(`course-view-${course.id}`)} className="w-full flex items-center justify-center gap-1 py-sm rounded-xl bg-primary/10 text-primary font-label-md font-label hover:bg-primary hover:text-on-primary transition-all duration-200 mt-xs">
                    <BookOpen size={16} /> Akses Materi
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-dashed border-outline-variant flex flex-col items-center justify-center p-xl text-center min-h-[300px]">
          <BookOpen size={48} className="text-outline/60 mb-md" />
          <h3 className="text-title-md font-title text-on-background mb-1">Tidak Ada Kursus</h3>
          <p className="text-body-sm font-body text-on-surface-variant max-w-xs">
            {searchQuery ? 'Tidak ada kursus yang cocok dengan pencarian Anda.' : 'Anda belum terdaftar di kursus mana pun.'}
          </p>
        </div>
      )}
    </div>
  );
};

// Progress View Component
const ProgressView = ({ stats, courses, submissions = [], onRefresh, refreshing }) => {
  const courseProgress = courses.map(course => {
    const completedCount = submissions.filter(s => s?.courses?.id === course.id && s.grade !== null).length;
    const totalAssignments = submissions.filter(s => s?.courses?.id === course.id).length;
    return {
      ...course,
      completedAssignments: completedCount,
      totalAssignments,
      progressPercentage: totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0
    };
  });

  return (
    <div className="flex flex-col gap-lg">
      <div className="bg-gradient-to-r from-primary to-surface-tint rounded-2xl p-xl text-center shadow-[0px_10px_30px_rgba(53,37,205,0.15)]">
        <h2 className="text-headline-md font-display text-white mb-sm">📈 Progress Kursus</h2>
        <p className="text-body-md font-body text-primary-fixed/90">Pantau perkembangan dan prestasi belajar Anda.</p>
      </div>

      <div className="grid grid-cols-3 gap-md">
        <div className="bg-surface rounded-xl p-md border border-outline-variant/30 text-center">
          <p className="text-3xl font-display font-bold text-primary">{stats.enrolledCourses}</p>
          <p className="text-label-sm font-label text-outline uppercase tracking-wider">Kursus</p>
        </div>
        <div className="bg-surface rounded-xl p-md border border-outline-variant/30 text-center">
          <p className="text-3xl font-display font-bold text-emerald-600">{stats.completedAssignments}</p>
          <p className="text-label-sm font-label text-outline uppercase tracking-wider">Selesai</p>
        </div>
        <div className="bg-surface rounded-xl p-md border border-outline-variant/30 text-center">
          <p className="text-3xl font-display font-bold text-primary">{stats.averageGrade}%</p>
          <p className="text-label-sm font-label text-outline uppercase tracking-wider">Rata-rata</p>
        </div>
      </div>

      {courseProgress.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {courseProgress.map(course => (
            <div key={course.id} className="bg-surface rounded-xl p-md border border-outline-variant/30">
              <h3 className="text-title-md font-title text-on-background mb-1">{course.title}</h3>
              <div className="flex justify-between text-label-sm text-outline mb-sm">
                <span>Progress Tugas</span>
                <span>{course.completedAssignments}/{course.totalAssignments}</span>
              </div>
              <div className="w-full h-2 bg-outline-variant/50 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${course.progressPercentage === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${course.progressPercentage}%` }} />
              </div>
              <p className="text-right text-label-sm text-outline mt-1">{course.progressPercentage}%</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-dashed border-outline-variant flex flex-col items-center justify-center p-xl text-center">
          <TrendingUp size={48} className="text-outline/60 mb-md" />
          <p className="text-body-sm font-body text-on-surface-variant">Belum ada data progress.</p>
        </div>
      )}
    </div>
  );
};

// Messages/Notifications View Component
const MessagesView = ({ notifications, onMarkAsRead }) => {
  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  return (
    <div className="flex flex-col gap-lg">
      <div className="bg-gradient-to-r from-secondary to-secondary-fixed-dim rounded-2xl p-xl text-center shadow-md">
        <h2 className="text-headline-md font-display text-white mb-sm">🔔 Notifikasi & Pesan</h2>
        <p className="text-body-md font-body text-white/80">Tetap terupdate dengan informasi penting dari guru dan admin.</p>
      </div>

      <div>
        <h3 className="text-title-lg font-title text-on-background flex items-center gap-xs mb-md">
          <Bell size={20} className="text-error" />
          Notifikasi
          {unreadCount > 0 && <span className="bg-error text-on-error text-label-sm font-label px-2 py-0.5 rounded-full">{unreadCount}</span>}
        </h3>

        {notifications && notifications.length > 0 ? (
          <div className="flex flex-col gap-sm">
            {notifications.map(notification => (
              <div key={notification.id} onClick={() => !notification.is_read && onMarkAsRead && onMarkAsRead(notification.id)} className={`rounded-xl p-md border transition-colors flex gap-md items-start shadow-sm cursor-pointer ${!notification.is_read ? 'bg-surface-container-low border-outline-variant/20' : 'bg-surface border-outline-variant/20 opacity-80'}`}>
                <span className="mt-1 text-lg">
                  {notification.type === 'grade' ? '📝' : notification.type === 'submission' ? '📤' : notification.type === 'announcement' ? '📢' : notification.type === 'enrollment' ? '🎉' : notification.type === 'reminder' ? '⏰' : '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-body-md font-body text-on-background ${!notification.is_read ? 'font-semibold' : ''}`}>{notification.message}</p>
                  <p className="text-label-sm text-outline mt-1">📅 {new Date(notification.created_at).toLocaleString()}</p>
                </div>
                {!notification.is_read && <span className="bg-primary text-on-primary text-label-sm font-label px-2 py-0.5 rounded-full text-[10px]">Baru</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-dashed border-outline-variant flex flex-col items-center justify-center p-xl text-center">
            <Bell size={48} className="text-outline/60 mb-md" />
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
    if (profile?.display_name) { setDisplayName(profile.display_name); }
    else if (user?.email) { setDisplayName(user.email.split('@')[0]); }
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
      if (err.message.includes('display_name')) { setError('Kolom display_name belum ada di tabel. Silakan jalankan migration SQL di Supabase.'); }
      else if (err.message.includes('null value in column "email"')) { setError('Email tidak ditemukan. Silakan logout dan login kembali.'); }
      else { setError('Gagal memperbarui profil: ' + err.message); }
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
            <input type="email" value={user?.email || ''} disabled className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface-container text-on-surface-variant text-body-md font-body outline-none cursor-not-allowed" />
            <p className="text-label-sm text-outline">Email tidak dapat diubah</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-label text-on-surface-variant">Nama Tampilan</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Masukkan nama tampilan" className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface-container-low text-body-md font-body text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none" />
            <p className="text-label-sm text-outline">Nama ini akan terlihat oleh guru dan admin</p>
          </div>
          <button type="submit" disabled={loading} className="self-start flex items-center gap-sm py-sm px-lg rounded-xl bg-primary text-on-primary font-label-md font-label hover:bg-primary-container hover:text-on-primary-container transition-all duration-200 disabled:opacity-60 shadow-[0px_4px_14px_rgba(53,37,205,0.3)]">
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</> : '💾 Simpan Perubahan'}
          </button>
        </form>
      </div>

      <div className="bg-surface rounded-2xl p-xl border border-outline-variant/30">
        <h3 className="text-title-lg font-title text-on-background mb-lg">ℹ️ Informasi Akun</h3>
        <div className="grid grid-cols-1 gap-md">
          <div className="flex items-center gap-md p-sm bg-surface-container-low rounded-xl">
            <span className="text-label-sm font-label text-outline w-20">Role</span>
            <span className="text-body-sm font-body text-on-surface">Murid</span>
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

export default StudentDashboard;
