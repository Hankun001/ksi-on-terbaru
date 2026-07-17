import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import AnnouncementModule from '../modules/AnnouncementModule';
import ProfileModule from '../modules/ProfileModule';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TeacherManagement from '../modules/TeacherManagement';
import StudentManagement from '../modules/StudentManagement';
import ExamModule from '../modules/exams/pages/ExamModule';
import TeacherEvaluation from '../modules/TeacherEvaluation';
import ReportsModule from '../modules/ReportsModule';
import AttendanceMonitoring from '../modules/AttendanceMonitoring';
import ClassManagement from '../modules/ClassManagement';
import { 
  Users, BookOpen, Bell, Settings, User, 
  Trash2, Edit, Search, ChevronRight, X,
  Mail, Calendar, Award, GraduationCap, Eye,
  Plus, BarChart3, FileText
} from 'lucide-react';

const AdminDashboard = ({ activeSection = 'dashboard-admin', onNavigate }) => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalAssignments: 0,
    totalSubmissions: 0,
    usersByRole: { murid: 0, guru: 0, admin: 0 },
    activeUsers: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [systemLogs, setSystemLogs] = useState([]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      // Get total users
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (userError) throw userError;

      // Get users by role
      const { data: usersByRoleData, error: usersByRoleError } = await supabase
        .from('profiles')
        .select('role');

      if (usersByRoleError) throw usersByRoleError;

      const usersByRole = usersByRoleData.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
      }, { murid: 0, guru: 0, admin: 0 });

      // Get active users (logged in within last hour)
      const { count: activeUsers, error: activeError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (activeError) throw activeError;

      // Get total courses
      const { count: courseCount, error: courseError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

      if (courseError) throw courseError;

      // Get total assignments
      const { count: assignmentCount, error: assignmentError } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true });

      if (assignmentError) throw assignmentError;

      // Get total submissions
      const { count: submissionCount, error: submissionError } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true });

      if (submissionError) throw submissionError;

      // Get recent submissions
      const { data: recentSubmissions, error: subError } = await supabase
        .from('submissions')
        .select('id, submitted_at, grade, student_id, assignment_id')
        .order('submitted_at', { ascending: false })
        .limit(20);

      if (subError) throw subError;

      // Get user and assignment info
      const submissionWithInfo = await Promise.all(
        recentSubmissions.map(async (submission) => {
          const { data: studentData } = await supabase
            .from('profiles')
            .select('email, role')
            .eq('id', submission.student_id)
            .single();

          const { data: assignmentData } = await supabase
            .from('assignments')
            .select('title, course_id')
            .eq('id', submission.assignment_id)
            .single();

          const { data: courseData } = await supabase
            .from('courses')
            .select('title')
            .eq('id', assignmentData?.course_id)
            .single();

          return {
            ...submission,
            studentEmail: studentData?.email || 'Unknown',
            studentRole: studentData?.role || 'unknown',
            assignmentTitle: assignmentData?.title || 'Unknown',
            courseTitle: courseData?.title || 'Unknown'
          };
        })
      );

      // Get all users
      const { data: allUsers, error: allUsersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (allUsersError) throw allUsersError;

      // Get all courses
      const { data: allCourses, error: allCoursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (allCoursesError) throw allCoursesError;

      // Get all assignments
      const { data: allAssignments, error: allAssignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (allAssignmentsError) throw allAssignmentsError;

      // Calculate system metrics
      const activityRate = userCount > 0 
        ? Math.round((activeUsers / userCount) * 100) 
        : 0;
      
      const completionRate = assignmentCount > 0 
        ? Math.round((submissionCount / assignmentCount) * 100) 
        : 0;

      setStats({
        totalUsers: userCount || 0,
        totalCourses: courseCount || 0,
        totalAssignments: assignmentCount || 0,
        totalSubmissions: submissionCount || 0,
        usersByRole,
        activeUsers: activeUsers || 0,
        activityRate,
        completionRate
      });
      
      setRecentActivity(submissionWithInfo);
      setUsers(allUsers || []);
      setCourses(allCourses || []);
      
      // Generate system logs
      const newLogs = [
        { id: 1, action: 'Data refreshed', timestamp: new Date().toISOString(), status: 'success' },
        { id: 2, action: `${userCount} users loaded`, timestamp: new Date().toISOString(), status: 'info' },
        { id: 3, action: `${courseCount} courses loaded`, timestamp: new Date().toISOString(), status: 'info' },
        { id: 4, action: `${assignmentCount} assignments loaded`, timestamp: new Date().toISOString(), status: 'info' },
        { id: 5, action: `${submissionCount} submissions tracked`, timestamp: new Date().toISOString(), status: 'info' }
      ];
      
      setSystemLogs(newLogs);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh data
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Handle section change from Quick Actions
  const handleSectionChange = (section) => {
    if (onNavigate) {
      onNavigate(section);
    }
  };

  // Subscribe to real-time changes
  useEffect(() => {
    if (!user) return;

    fetchData();

    const channel = supabase
      .channel('admin-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, user]);

  // Handle create new user
  const handleCreateUser = async (userData) => {
    try {
      setLoading(true);
      
      // Create user via Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: { 
            role: userData.role,
            display_name: userData.displayName || userData.email.split('@')[0]
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      // The profile will be created automatically via trigger or we create it manually
      if (data.user) {
        // Check if profile exists, if not create it
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!existingProfile) {
          await supabase.from('profiles').insert([{
            id: data.user.id,
            email: userData.email,
            role: userData.role,
            display_name: userData.displayName || userData.email.split('@')[0]
          }]);
        } else {
          // Update existing profile with correct role
          await supabase
            .from('profiles')
            .update({ 
              role: userData.role,
              display_name: userData.displayName || userData.email.split('@')[0]
            })
            .eq('id', data.user.id);
        }
      }

      alert('Pengguna berhasil dibuat! Email verifikasi telah dikirim ke ' + userData.email);
      fetchData();
      return { success: true };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Handle user role update
  const handleUpdateRole = async (userId, newRole) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        usersByRole: {
          ...prev.usersByRole,
          [newRole]: prev.usersByRole[newRole] + 1
        }
      }));

      alert('Peran pengguna berhasil diubah!');
      fetchData();
    } catch (error) {
      alert('Gagal mengubah peran: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      const deletedUser = users.find(u => u.id === userId);
      setUsers(users.filter(u => u.id !== userId));
      
      // Update stats
      if (deletedUser) {
        setStats(prev => ({
          ...prev,
          totalUsers: prev.totalUsers - 1,
          usersByRole: {
            ...prev.usersByRole,
            [deletedUser.role]: prev.usersByRole[deletedUser.role] - 1
          }
        }));
      }

      alert('Pengguna berhasil dihapus!');
      fetchData();
    } catch (error) {
      alert('Gagal menghapus pengguna: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle course deletion
  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kursus ini?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      setCourses(courses.filter(c => c.id !== courseId));
      setStats(prev => ({
        ...prev,
        totalCourses: prev.totalCourses - 1
      }));

      alert('Kursus berhasil dihapus!');
      fetchData();
    } catch (error) {
      alert('Gagal menghapus kursus: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

   // Render content based on active section
   const renderContent = () => {
     switch (activeSection) {
       case 'users-admin':
         return <UsersManagementView users={users} onUpdateRole={handleUpdateRole} onDeleteUser={handleDeleteUser} onCreateUser={handleCreateUser} loading={loading} />;
       case 'courses-admin':
         return <CoursesAdminView courses={courses} onDeleteCourse={handleDeleteCourse} loading={loading} />;
       case 'activity-admin':
         return <ActivityView recentActivity={recentActivity} />;
       case 'announcements-admin':
         return <AnnouncementModule />;
       case 'settings-admin':
         return <SettingsView />;
       case 'profile-admin':
         return <ProfileModule onRefresh={handleRefresh} />;
        // PKBM Administrative Modules
        case 'classes-admin':
          return <ClassManagement />;
        case 'teachers-admin':
          return <TeacherManagement />;
        case 'students-admin':
          return <StudentManagement />;
        case 'teacher-eval-admin':
          return <TeacherEvaluation />;
         case 'reports-admin':
           return <ReportsModule />;
      case 'exams-admin':
        return <ExamModule role="admin" onNavigate={onNavigate} />;
      case 'attendance-admin':
        return <AttendanceMonitoring />;
        default:
          return <DashboardOverview stats={stats} recentActivity={recentActivity} users={users} courses={courses} onRefresh={handleRefresh} refreshing={refreshing} onNavigate={onNavigate} />;
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
          <h1>Dasbor Admin</h1>
          <p>Selamat datang, {profile?.display_name || user?.email?.split('@')[0] || 'Admin'}</p>
        </div>
        <button 
          onClick={handleRefresh} 
          className="btn btn-secondary"
          disabled={refreshing}
        >
          {refreshing ? '↻ Memuat...' : '↻ Refresh'}
        </button>
      </div>
      {renderContent()}
    </div>
  );
};


const DashboardOverview = ({ stats, recentActivity, users, courses, onRefresh, refreshing, onNavigate }) => (
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
      <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem' }}>Selamat Datang! 👋</h1>
      <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
        Hai Admin! Selamat mengelola platform pembelajaran ini dengan penuh tanggung jawab.
      </p>
    </div>

    <section className="dashboard-stats">
      <h2>Statistik Sistem</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <h3>{stats.totalUsers}</h3>
          <p>Total Pengguna</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <h3>{stats.totalCourses}</h3>
          <p>Total Kursus</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <h3>{stats.totalAssignments}</h3>
          <p>Total Tugas</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📤</div>
          <h3>{stats.totalSubmissions}</h3>
          <p>Total Pengumpulan</p>
        </div>
      </div>
    </section>

    <section className="dashboard-section">
      <h2>Pengguna Berdasarkan Peran</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎓</div>
          <h3>{stats.usersByRole.murid}</h3>
          <p>Murid</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👨‍🏫</div>
          <h3>{stats.usersByRole.guru}</h3>
          <p>Guru</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚙️</div>
          <h3>{stats.usersByRole.admin}</h3>
          <p>Admin</p>
        </div>
      </div>
    </section>

    <section className="dashboard-section">
      <h2>Aktivitas Terbaru</h2>
      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Siswa</th>
              <th>Tugas</th>
              <th>Kursus</th>
              <th>Waktu</th>
              <th>Nilai</th>
            </tr>
          </thead>
          <tbody>
            {recentActivity.slice(0, 5).map((activity) => (
              <tr key={activity.id}>
                <td>
                  <span className="role-badge">
                    {activity.studentRole === 'murid' ? '🎓' : activity.studentRole === 'guru' ? '👨‍🏫' : '⚙️'}
                    {activity.studentEmail}
                  </span>
                </td>
                <td>{activity.assignmentTitle}</td>
                <td>{activity.courseTitle}</td>
                <td>{new Date(activity.submitted_at).toLocaleString()}</td>
                <td>
                  <span className={`grade-badge ${activity.grade !== null ? 'graded' : 'pending'}`}>
                    {activity.grade !== null ? `${activity.grade}/100` : 'Belum dinilai'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
      <button 
        onClick={onRefresh} 
        className="btn btn-primary"
        disabled={refreshing}
      >
        {refreshing ? '↻ Memuat...' : '🔄 Refresh Data'}
      </button>
    </div>

    {/* Quick Actions Section - Mobile Only */}
    <section className="dashboard-section mobile-quick-actions" style={{ marginTop: '2rem' }}>
      <h2>⚡ Akses Cepat</h2>
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginTop: '1rem'
      }}>
        <button
          onClick={() => onNavigate('users-admin')}
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            border: 'none',
            borderRadius: '12px',
            padding: '1.25rem',
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            textAlign: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤➕</div>
          <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Tambah Pengguna</div>
        </button>

        <button
          onClick={() => onNavigate('courses-admin')}
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '12px',
            padding: '1.25rem',
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            textAlign: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📚➕</div>
          <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Buat Kursus</div>
        </button>

        <button
          onClick={() => onNavigate('announcements-admin')}
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            border: 'none',
            borderRadius: '12px',
            padding: '1.25rem',
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            textAlign: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📢➕</div>
          <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Buat Pengumuman</div>
        </button>

        <button
          onClick={() => onNavigate('activity-admin')}
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            border: 'none',
            borderRadius: '12px',
            padding: '1.25rem',
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            textAlign: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
          <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Lihat Aktivitas</div>
        </button>

        <button
          onClick={() => onNavigate('settings-admin')}
          style={{
            background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
            border: 'none',
            borderRadius: '12px',
            padding: '1.25rem',
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            textAlign: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚙️</div>
          <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Pengaturan</div>
        </button>

        <button
          onClick={() => onNavigate('profile-admin')}
          style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
            border: 'none',
            borderRadius: '12px',
            padding: '1.25rem',
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            textAlign: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤</div>
          <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Profil Saya</div>
        </button>
      </div>
    </section>
  </div>
);

// Stats View Component with Charts
const StatsView = ({ stats }) => {
  return (
    <div className="dashboard-content">
      <section className="dashboard-stats">
        <h2>Statistik Detail</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <h3>{stats.totalUsers}</h3>
            <p>Total Pengguna</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <h3>{stats.totalCourses}</h3>
            <p>Total Kursus</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <h3>{stats.totalAssignments}</h3>
            <p>Total Tugas</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📤</div>
            <h3>{stats.totalSubmissions}</h3>
            <p>Total Pengumpulan</p>
          </div>
        </div>
      </section>
      
      <section className="dashboard-section">
        <h2>Analisis Sistem</h2>
        <div className="charts-grid">
          <div className="chart-container">
            <h3>Distribusi Pengguna</h3>
            <div className="bar-chart">
              <div className="bar" style={{ height: stats.usersByRole.murid > 0 ? `${(stats.usersByRole.murid / stats.totalUsers) * 100}%` : '0%', background: '#8b5cf6' }}>
                <span className="bar-label">Murid</span>
                <span className="bar-value">{stats.usersByRole.murid}</span>
              </div>
              <div className="bar" style={{ height: stats.usersByRole.guru > 0 ? `${(stats.usersByRole.guru / stats.totalUsers) * 100}%` : '0%', background: '#10b981' }}>
                <span className="bar-label">Guru</span>
                <span className="bar-value">{stats.usersByRole.guru}</span>
              </div>
              <div className="bar" style={{ height: stats.usersByRole.admin > 0 ? `${(stats.usersByRole.admin / stats.totalUsers) * 100}%` : '0%', background: '#f59e0b' }}>
                <span className="bar-label">Admin</span>
                <span className="bar-value">{stats.usersByRole.admin}</span>
              </div>
            </div>
          </div>
          
          <div className="chart-container">
            <h3>Metrik Utama</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                padding: '1rem',
                borderRadius: '8px'
              }}>
                <p style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '0.25rem' }}>Tingkat Aktivitas</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats.activityRate || 0}%</p>
              </div>
              <div style={{ 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '1rem',
                borderRadius: '8px'
              }}>
                <p style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '0.25rem' }}>Tingkat Penyelesaian</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats.completionRate || 0}%</p>
              </div>
              <div style={{ 
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                color: 'white',
                padding: '1rem',
                borderRadius: '8px'
              }}>
                <p style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '0.25rem' }}>Rasio Kursus/Tugas</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                  {stats.totalCourses > 0 ? (stats.totalAssignments / stats.totalCourses).toFixed(1) : '0'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="dashboard-section">
        <h2>Ringkasan Kartu Peran</h2>
        <div className="role-cards-grid">
          <div className="role-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <div className="role-icon">🎓</div>
            <div className="role-info">
              <h4>Murid</h4>
              <p className="role-count">{stats.usersByRole.murid}</p>
              <p className="role-label">Total Murid</p>
            </div>
          </div>
          <div className="role-card" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="role-icon">👨‍🏫</div>
            <div className="role-info">
              <h4>Guru</h4>
              <p className="role-count">{stats.usersByRole.guru}</p>
              <p className="role-label">Total Guru</p>
            </div>
          </div>
          <div className="role-card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="role-icon">⚙️</div>
            <div className="role-info">
              <h4>Admin</h4>
              <p className="role-count">{stats.usersByRole.admin}</p>
              <p className="role-label">Total Admin</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="dashboard-section">
        <h2>Metrik Cepat</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ 
            background: 'white',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>👥</span>
              <h4 style={{ fontWeight: '600', color: '#374151' }}>Total Pengguna</h4>
            </div>
            <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937' }}>
              {stats.totalUsers}
            </p>
            <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Terdaftar di sistem</p>
          </div>
          
          <div style={{ 
            background: 'white',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📚</span>
              <h4 style={{ fontWeight: '600', color: '#374151' }}>Total Kursus</h4>
            </div>
            <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937' }}>
              {stats.totalCourses}
            </p>
            <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Kursus aktif</p>
          </div>
          
          <div style={{ 
            background: 'white',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📝</span>
              <h4 style={{ fontWeight: '600', color: '#374151' }}>Rata-rata Tugas</h4>
            </div>
            <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937' }}>
              {stats.totalCourses > 0 ? (stats.totalAssignments / stats.totalCourses).toFixed(1) : '0'}
            </p>
            <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Tugas per Kursus</p>
          </div>
          
          <div style={{ 
            background: 'white',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📤</span>
              <h4 style={{ fontWeight: '600', color: '#374151' }}>Rata-rata Submission</h4>
            </div>
            <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937' }}>
              {stats.totalAssignments > 0 ? (stats.totalSubmissions / stats.totalAssignments).toFixed(1) : '0'}
            </p>
            <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Submission per Tugas</p>
          </div>
        </div>
      </section>
    </div>
  );
};

// Users Management View Component
const UsersManagementView = ({ users, onUpdateRole, onDeleteUser, onCreateUser, loading }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'murid',
    displayName: ''
  });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setShowProfileModal(true);
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'murid': return { icon: '🎓', label: 'Murid', color: '#10b981', bg: '#d1fae5' };
      case 'guru': return { icon: '👨‍🏫', label: 'Guru', color: '#3b82f6', bg: '#dbeafe' };
      case 'admin': return { icon: '⚙️', label: 'Admin', color: '#6366f1', bg: '#e0e7ff' };
      default: return { icon: '❓', label: role, color: '#6b7280', bg: '#f3f4f6' };
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength) {
      errors.push('minimal 8 karakter');
    }
    if (!hasUpperCase) {
      errors.push('huruf besar');
    }
    if (!hasLowerCase) {
      errors.push('huruf kecil');
    }
    if (!hasNumbers) {
      errors.push('angka');
    }
    if (!hasSpecialChar) {
      errors.push('karakter khusus (!@#$%^&*)');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');

    // Validation
    if (!newUser.email.trim()) {
      setCreateError('Email wajib diisi');
      return;
    }

    if (!validateEmail(newUser.email)) {
      setCreateError('Format email tidak valid');
      return;
    }

    if (!newUser.password) {
      setCreateError('Kata sandi wajib diisi');
      return;
    }

    const passwordValidation = validatePassword(newUser.password);
    if (!passwordValidation.isValid) {
      setCreateError('Kata sandi harus mengandung: ' + passwordValidation.errors.join(', '));
      return;
    }

    if (!newUser.confirmPassword) {
      setCreateError('Konfirmasi kata sandi wajib diisi');
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      setCreateError('Kata sandi tidak cocok');
      return;
    }

    setCreateLoading(true);
    const result = await onCreateUser({
      email: newUser.email,
      password: newUser.password,
      role: newUser.role,
      displayName: newUser.displayName
    });

    setCreateLoading(false);

    if (result.success) {
      // Reset form
      setNewUser({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'murid',
        displayName: ''
      });
      setShowCreateForm(false);
    } else {
      // Handle specific errors
      let errorMessage = result.error;
      if (result.error === 'User already registered') {
        errorMessage = 'Email sudah terdaftar. Gunakan email lain.';
      } else if (result.error === 'Password should be at least 6 characters') {
        errorMessage = 'Kata sandi minimal 6 karakter';
      } else if (result.error === 'Invalid email') {
        errorMessage = 'Format email tidak valid';
      }
      setCreateError(errorMessage);
    }
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
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
          <Users size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Manajemen Pengguna
        </h2>
        <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
          Kelola semua pengguna platform termasuk murid, guru, dan admin.
        </p>
      </div>

      {/* Create New User Section */}
      <section className="dashboard-section" style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h2 style={{ margin: 0 }}>
            <Plus size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Tambah Pengguna Baru
          </h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn btn-primary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              background: showCreateForm ? '#6b7280' : '#3b82f6'
            }}
          >
            {showCreateForm ? <X size={18} /> : <Plus size={18} />}
            {showCreateForm ? 'Batal' : 'Tambah Pengguna'}
          </button>
        </div>

        {showCreateForm && (
          <div style={{ 
            background: '#f8fafc', 
            padding: '1.5rem', 
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            {createError && (
              <div style={{ 
                background: '#fef2f2', 
                color: '#dc2626', 
                padding: '0.75rem', 
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>⚠️</span>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1rem' 
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="contoh@email.com"
                    disabled={createLoading}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: '8px', 
                      border: '1px solid #d1d5db',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
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
                    value={newUser.displayName}
                    onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                    placeholder="Nama pengguna"
                    disabled={createLoading}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: '8px', 
                      border: '1px solid #d1d5db',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Kata Sandi *
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Masukkan kata sandi"
                    disabled={createLoading}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: '8px', 
                      border: '1px solid #d1d5db',
                      fontSize: '1rem'
                    }}
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                    Minimal 8 karakter, huruf besar/kecil, angka, dan karakter khusus
                  </small>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Konfirmasi Kata Sandi *
                  </label>
                  <input
                    type="password"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                    placeholder="Ulangi kata sandi"
                    disabled={createLoading}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: '8px', 
                      border: '1px solid #d1d5db',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Peran *
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    disabled={createLoading}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: '8px', 
                      border: '1px solid #d1d5db',
                      fontSize: '1rem',
                      background: 'white'
                    }}
                  >
                    <option value="murid">🎓 Murid</option>
                    <option value="guru">👨‍🏫 Guru</option>
                    <option value="admin">⚙️ Admin</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createLoading}
                  style={{ minWidth: '150px' }}
                >
                  {createLoading ? '⏳ Membuat...' : '✓ Buat Pengguna'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewUser({
                      email: '',
                      password: '',
                      confirmPassword: '',
                      role: 'murid',
                      displayName: ''
                    });
                    setCreateError('');
                  }}
                  className="btn btn-secondary"
                  disabled={createLoading}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      {/* Users List Section */}
      <section className="dashboard-section">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <h2 style={{ margin: 0 }}>
            <User size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Daftar Pengguna ({filteredUsers.length} pengguna)
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#6b7280'
              }} />
              <input
                type="text"
                placeholder="Cari pengguna..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.5rem 1rem 0.5rem 2.5rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.95rem',
                  minWidth: '200px'
                }}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '0.95rem'
              }}
            >
              <option value="all">Semua Peran</option>
              <option value="murid">Murid</option>
              <option value="guru">Guru</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        {filteredUsers.length > 0 ? (
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Pengguna</th>
                  <th>Email</th>
                  <th>Nama</th>
                  <th>Peran</th>
                  <th>Dibuat</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(userItem => {
                  const roleInfo = getRoleBadge(userItem.role);
                  return (
                    <tr key={userItem.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: userItem.avatar_url ? `url(${userItem.avatar_url})` : roleInfo.bg,
                            backgroundSize: 'cover',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            color: roleInfo.color
                          }}>
                            {!userItem.avatar_url && (userItem.display_name || userItem.email)?.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      </td>
                      <td>{userItem.email}</td>
                      <td>{userItem.display_name || userItem.full_name || '-'}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          background: roleInfo.bg,
                          color: roleInfo.color
                        }}>
                          {roleInfo.icon} {roleInfo.label}
                        </span>
                      </td>
                      <td>{new Date(userItem.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleViewProfile(userItem)}
                            title="Lihat Profil"
                            style={{ padding: '0.4rem 0.6rem' }}
                          >
                            <Eye size={16} />
                          </button>
                          <select
                            value={userItem.role}
                            onChange={(e) => onUpdateRole(userItem.id, e.target.value)}
                            disabled={loading}
                            className="role-select"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                          >
                            <option value="murid">Murid</option>
                            <option value="guru">Guru</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => onDeleteUser(userItem.id)}
                            disabled={loading}
                            style={{ padding: '0.4rem 0.6rem' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Users size={48} className="empty-icon" />
            <p>{searchQuery || roleFilter !== 'all' ? 'Tidak ada pengguna yang cocok dengan pencarian.' : 'Belum ada pengguna.'}</p>
          </div>
        )}
      </section>

      {/* Profile Modal */}
      {showProfileModal && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              padding: '1.5rem',
              color: 'white',
              borderRadius: '16px 16px 0 0',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowProfileModal(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
                <X size={18} />
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: selectedUser.avatar_url ? `url(${selectedUser.avatar_url})` : 'white',
                  backgroundSize: 'cover',
                  margin: '0 auto 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  border: '3px solid white'
                }}>
                  {!selectedUser.avatar_url && (selectedUser.display_name || selectedUser.email)?.charAt(0).toUpperCase()}
                </div>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>
                  {selectedUser.display_name || selectedUser.full_name || 'Pengguna'}
                </h3>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  background: 'rgba(255,255,255,0.2)'
                }}>
                  {getRoleBadge(selectedUser.role).icon} {getRoleBadge(selectedUser.role).label}
                </span>
              </div>
            </div>
            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <Mail size={20} style={{ color: '#3b82f6' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Email</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>{selectedUser.email}</p>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <User size={20} style={{ color: '#10b981' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Nama Lengkap</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>{selectedUser.full_name || '-'}</p>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <Award size={20} style={{ color: '#f59e0b' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Nama Tampilan</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>{selectedUser.display_name || '-'}</p>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <Calendar size={20} style={{ color: '#6366f1' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Tanggal Dibuat</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>{new Date(selectedUser.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                
                {selectedUser.bio && (
                  <div style={{
                    padding: '1rem',
                    background: '#f8fafc',
                    borderRadius: '8px'
                  }}>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>Bio</p>
                    <p style={{ margin: 0, lineHeight: '1.5' }}>{selectedUser.bio}</p>
                  </div>
                )}
              </div>
            </div>
            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem'
            }}>
              <button
                onClick={() => setShowProfileModal(false)}
                className="btn btn-secondary"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Courses Admin View Component
const CoursesAdminView = ({ courses, onDeleteCourse, loading }) => (
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
      <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>📚 Manajemen Kursus</h2>
      <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
        Pantau dan kelola semua kursus yang tersedia di platform.
      </p>
    </div>

    <section className="dashboard-section">
      <h2>Manajemen Kursus ({courses.length} kursus)</h2>
      {courses.length > 0 ? (
        <div className="cards-grid">
          {courses.map(course => (
            <div key={course.id} className="card">
              <div className="card-header">
                <span className="course-code">{course.title?.substring(0, 3).toUpperCase() || 'KURSUS'}</span>
                <span className="course-icon">📚</span>
              </div>
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <div className="card-footer">
                <small>Dibuat: {new Date(course.created_at).toLocaleDateString()}</small>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => onDeleteCourse(course.id)}
                  disabled={loading}
                  style={{ marginTop: '0.5rem' }}
                >
                  Hapus Kursus
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">📚</span>
          <p>Belum ada kursus.</p>
        </div>
      )}
    </section>
  </div>
);

// Activity View Component
const ActivityView = ({ recentActivity }) => {
  // Calculate activity stats
  const gradedCount = recentActivity.filter(a => a.grade !== null).length;
  const pendingCount = recentActivity.filter(a => a.grade === null).length;
  const today = new Date().toDateString();
  const todayActivity = recentActivity.filter(a => 
    new Date(a.submitted_at).toDateString() === today
  ).length;
  
  return (
    <div className="dashboard-content" style={{ padding: '1.5rem' }}>
      {/* Welcome Message */}
      <div style={{ 
        background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        color: 'white',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>📝 Aktivitas Sistem</h2>
        <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
          Lacak semua aktivitas dan interaksi pengguna dalam platform.
        </p>
      </div>
      
      {/* Activity Stats */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: 'white',
          padding: '1.25rem',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>📊</div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem' }}>{recentActivity.length}</h3>
          <p style={{ opacity: 0.9, fontSize: '0.8rem' }}>Total Aktivitas</p>
        </div>
        
        <div style={{ 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '1.25rem',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>✅</div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem' }}>{gradedCount}</h3>
          <p style={{ opacity: 0.9, fontSize: '0.8rem' }}>Sudah Dinilai</p>
        </div>
        
        <div style={{ 
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          padding: '1.25rem',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>⏳</div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem' }}>{pendingCount}</h3>
          <p style={{ opacity: 0.9, fontSize: '0.8rem' }}>Menunggu Nilai</p>
        </div>
        
        <div style={{ 
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
          color: 'white',
          padding: '1.25rem',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>📅</div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem' }}>{todayActivity}</h3>
          <p style={{ opacity: 0.9, fontSize: '0.8rem' }}>Aktivitas Hari Ini</p>
        </div>
      </div>
      
      {/* Activity Table */}
      <div style={{ 
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ 
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          <h3 style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            color: '#1f2937',
            margin: 0
          }}>
            📋 Riwayat Aktivitas Terbaru
          </h3>
        </div>
        
        {recentActivity.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '0.9rem'
            }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ 
                    padding: '1rem 1.5rem', 
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Siswa
                  </th>
                  <th style={{ 
                    padding: '1rem 1.5rem', 
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Tugas
                  </th>
                  <th style={{ 
                    padding: '1rem 1.5rem', 
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Kursus
                  </th>
                  <th style={{ 
                    padding: '1rem 1.5rem', 
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Waktu
                  </th>
                  <th style={{ 
                    padding: '1rem 1.5rem', 
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((activity, index) => (
                  <tr key={activity.id} style={{ 
                    background: index % 2 === 0 ? 'white' : '#f9fafb',
                    transition: 'background 0.15s ease'
                  }}>
                    <td style={{ 
                      padding: '1rem 1.5rem',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ 
                          fontSize: '1.25rem'
                        }}>
                          {activity.studentRole === 'murid' ? '🎓' : 
                           activity.studentRole === 'guru' ? '👨‍🏫' : '⚙️'}
                        </span>
                        <span style={{ 
                          color: '#1f2937',
                          fontWeight: '500'
                        }}>
                          {activity.studentEmail}
                        </span>
                      </div>
                    </td>
                    <td style={{ 
                      padding: '1rem 1.5rem',
                      borderBottom: '1px solid #e5e7eb',
                      color: '#374151'
                    }}>
                      {activity.assignmentTitle}
                    </td>
                    <td style={{ 
                      padding: '1rem 1.5rem',
                      borderBottom: '1px solid #e5e7eb',
                      color: '#6b7280'
                    }}>
                      {activity.courseTitle}
                    </td>
                    <td style={{ 
                      padding: '1rem 1.5rem',
                      borderBottom: '1px solid #e5e7eb',
                      color: '#6b7280'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: '#1f2937', fontWeight: '500' }}>
                          {new Date(activity.submitted_at).toLocaleDateString('id-ID')}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                          {new Date(activity.submitted_at).toLocaleTimeString('id-ID', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </td>
                    <td style={{ 
                      padding: '1rem 1.5rem',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <span style={{ 
                        padding: '0.35rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        background: activity.grade !== null ? '#d1fae5' : '#fef3c7',
                        color: activity.grade !== null ? '#059669' : '#d97706'
                      }}>
                        {activity.grade !== null ? `✅ Dinilai: ${activity.grade}` : '⏳ Menunggu'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ 
            padding: '3rem 1.5rem',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📭</span>
            <p style={{ fontSize: '1rem', margin: 0 }}>Belum ada aktivitas.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Settings View Component
const SettingsView = () => {
  return (
    <div className="dashboard-content" style={{ padding: '1.5rem' }}>
      {/* Welcome Message */}
      <div style={{ 
        background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        color: 'white',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>⚙️ Pengaturan Sistem</h2>
        <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
          Kelola notifikasi, keamanan, dan konfigurasi platform.
        </p>
      </div>
      
      <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* General Settings */}
      <div style={{ 
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ 
          fontSize: '1.1rem', 
          fontWeight: '600', 
          color: '#1f2937',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🔔 Notifikasi
        </h3>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            <div>
              <span style={{ fontWeight: '500', color: '#374151' }}>Notifikasi Email</span>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Kirim notifikasi ke email pengguna
              </p>
            </div>
            <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
          </label>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            <div>
              <span style={{ fontWeight: '500', color: '#374151' }}>Notifikasi Tugas Baru</span>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Beritahu siswa saat tugas baru ditambahkan
              </p>
            </div>
            <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
          </label>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            <div>
              <span style={{ fontWeight: '500', color: '#374151' }}>Notifikasi Nilai</span>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Beritahu siswa saat tugas dinilai
              </p>
            </div>
            <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
          </label>
        </div>
      </div>
      
      {/* Security Settings */}
      <div style={{ 
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ 
          fontSize: '1.1rem', 
          fontWeight: '600', 
          color: '#1f2937',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🔒 Keamanan
        </h3>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            <div>
              <span style={{ fontWeight: '500', color: '#374151' }}>Verifikasi Email</span>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Wajibkan verifikasi email saat daftar
              </p>
            </div>
            <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
          </label>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            <div>
              <span style={{ fontWeight: '500', color: '#374151' }}>Reset Password</span>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Izinkan pengguna reset password
              </p>
            </div>
            <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
          </label>
        </div>
      </div>
      
      {/* System Settings */}
      <div style={{ 
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ 
          fontSize: '1.1rem', 
          fontWeight: '600', 
          color: '#1f2937',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🖥️ Sistem
        </h3>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#fef3c7',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            <div>
              <span style={{ fontWeight: '500', color: '#92400e' }}>Mode Maintenance</span>
              <p style={{ fontSize: '0.8rem', color: '#b45309', marginTop: '0.25rem' }}>
                Matikan akses sementara untuk maintenance
              </p>
            </div>
            <input type="checkbox" style={{ width: '20px', height: '20px' }} />
          </label>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div>
              <span style={{ fontWeight: '500', color: '#374151' }}>Versi Sistem</span>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                v1.0.0 - Build 2024.01
              </p>
            </div>
            <span style={{ 
              background: '#e0e7ff',
              color: '#4338ca',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '500'
            }}>
              Terbaru
            </span>
          </div>
        </div>
      </div>
      
      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
        <button className="btn btn-secondary">
          Batal
        </button>
        <button className="btn btn-primary">
          💾 Simpan Pengaturan
        </button>
      </div>
    </div>
  </div>
 );
};

// Quick Actions View Component
const QuickActionsView = ({ onNavigate }) => {
  const quickActions = [
    {
      title: 'Tambah Pengguna Baru',
      description: 'Buat akun baru untuk murid, guru, atau admin',
      icon: '👤➕',
      action: 'users-admin',
      color: '#3b82f6'
    },
    {
      title: 'Buat Kursus',
      description: 'Buat kursus baru untuk platform pembelajaran',
      icon: '📚➕',
      action: 'courses-admin',
      color: '#10b981'
    },
    {
      title: 'Buat Pengumuman',
      description: 'Umum kan informasi penting ke semua pengguna',
      icon: '📢➕',
      action: 'announcements-admin',
      color: '#f59e0b'
    },
    {
      title: 'Lihat Aktivitas',
      description: 'Pantau aktivitas terbaru di platform',
      icon: '📊',
      action: 'activity-admin',
      color: '#8b5cf6'
    },
    {
      title: 'Kelola Pengaturan',
      description: 'Konfigurasi notifikasi, keamanan, dan sistem',
      icon: '⚙️',
      action: 'settings-admin',
      color: '#6b7280'
    },
    {
      title: 'Kembali ke Dashboard',
      description: 'Lihat ringkasan dan statistik utama',
      icon: '🏠',
      action: 'dashboard-admin',
      color: '#1f2937'
    }
  ];

  return (
    <div className="dashboard-content" style={{ padding: '1.5rem' }}>
      {/* Welcome Message */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        color: 'white',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>⚡ Quick Actions</h2>
        <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
          Akses cepat ke semua fitur dan tindakan administratif.
        </p>
      </div>
      
      {/* Quick Actions Grid */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem'
      }}>
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => onNavigate(action.action)}
            style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = action.color;
              e.currentTarget.style.boxShadow = `0 4px 12px ${action.color}20`;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.03)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem'
            }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                background: `${action.color}15`,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                {action.icon}
              </div>
              <div>
                <h3 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: '#1f2937',
                  marginBottom: '0.25rem'
                }}>
                  {action.title}
                </h3>
                <p style={{ 
                  fontSize: '0.8rem', 
                  color: '#6b7280',
                  margin: 0
                }}>
                  {action.description}
                </p>
              </div>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-end',
              marginTop: '0.5rem'
            }}>
              <span style={{ 
                fontSize: '0.8rem', 
                color: action.color,
                fontWeight: '500'
              }}>
                Klik untuk mengakses →
              </span>
            </div>
          </button>
        ))}
      </div>
      
      {/* Recent Quick Stats */}
      <div style={{ 
        marginTop: '2.5rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        color: 'white'
      }}>
        <h3 style={{ 
          fontSize: '1.1rem', 
          fontWeight: '600', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📊 Ringkasan Cepat
        </h3>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>6</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.9, margin: 0 }}>Menu Tersedia</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>5</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.9, margin: 0 }}>Fitur Utama</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>⚡</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.9, margin: 0 }}>Akses Cepat</p>
          </div>
        </div>
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
              Nama ini akan terlihat oleh semua pengguna
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
            <strong>Role:</strong> Admin
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

export default AdminDashboard;
