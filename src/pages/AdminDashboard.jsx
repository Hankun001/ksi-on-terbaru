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
  Users, BookOpen, Settings, User,
  Trash2, Search, X, Mail, Calendar, Award, Eye,
  Plus, BarChart3, RefreshCw, TrendingUp, Shield,
  AlertCircle, CheckCircle
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

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');

      const { count: userCount, error: userError } = await supabase
        .from('profiles').select('*', { count: 'exact', head: true });
      if (userError) throw userError;

      const { data: usersByRoleData, error: usersByRoleError } = await supabase
        .from('profiles').select('role');
      if (usersByRoleError) throw usersByRoleError;

      const usersByRole = usersByRoleData.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
      }, { murid: 0, guru: 0, admin: 0 });

      const { count: activeUsers } = await supabase
        .from('profiles').select('*', { count: 'exact', head: true });

      const { count: courseCount, error: courseError } = await supabase
        .from('courses').select('*', { count: 'exact', head: true });
      if (courseError) throw courseError;

      const { count: assignmentCount, error: assignmentError } = await supabase
        .from('assignments').select('*', { count: 'exact', head: true });
      if (assignmentError) throw assignmentError;

      const { count: submissionCount, error: submissionError } = await supabase
        .from('submissions').select('*', { count: 'exact', head: true });
      if (submissionError) throw submissionError;

      const { data: recentSubmissions, error: subError } = await supabase
        .from('submissions')
        .select('id, submitted_at, grade, student_id, assignment_id')
        .order('submitted_at', { ascending: false })
        .limit(20);
      if (subError) throw subError;

      const submissionWithInfo = await Promise.all(
        (recentSubmissions || []).map(async (submission) => {
          const { data: studentData } = await supabase
            .from('profiles').select('email, role').eq('id', submission.student_id).single();
          const { data: assignmentData } = await supabase
            .from('assignments').select('title, course_id').eq('id', submission.assignment_id).single();
          const { data: courseData } = await supabase
            .from('courses').select('title').eq('id', assignmentData?.course_id).single();
          return {
            ...submission,
            studentEmail: studentData?.email || 'Unknown',
            studentRole: studentData?.role || 'unknown',
            assignmentTitle: assignmentData?.title || 'Unknown',
            courseTitle: courseData?.title || 'Unknown'
          };
        })
      );

      const { data: allUsers, error: allUsersError } = await supabase
        .from('profiles').select('*').order('created_at', { ascending: false });
      if (allUsersError) throw allUsersError;

      const { data: allCourses, error: allCoursesError } = await supabase
        .from('courses').select('*').order('created_at', { ascending: false });
      if (allCoursesError) throw allCoursesError;

      const { data: allAssignments, error: allAssignmentsError } = await supabase
        .from('assignments').select('*').order('created_at', { ascending: false });
      if (allAssignmentsError) throw allAssignmentsError;

      const activityRate = userCount > 0 ? Math.round((activeUsers / userCount) * 100) : 0;
      const completionRate = assignmentCount > 0 ? Math.round((submissionCount / assignmentCount) * 100) : 0;

      setStats({
        totalUsers: userCount || 0, totalCourses: courseCount || 0,
        totalAssignments: assignmentCount || 0, totalSubmissions: submissionCount || 0,
        usersByRole, activeUsers: activeUsers || 0, activityRate, completionRate
      });
      setRecentActivity(submissionWithInfo);
      setUsers(allUsers || []);
      setCourses(allCourses || []);

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

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = () => { setRefreshing(true); fetchData().finally(() => setRefreshing(false)); };

  useEffect(() => {
    if (!user) return;
    fetchData();
    const channel = supabase
      .channel('admin-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => { fetchData(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData, user]);

  const handleCreateUser = async (userData) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: userData.email, password: userData.password,
        options: {
          data: { role: userData.role, display_name: userData.displayName || userData.email.split('@')[0] },
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
      if (data.user) {
        const { data: existingProfile } = await supabase
          .from('profiles').select('*').eq('id', data.user.id).single();
        if (!existingProfile) {
          await supabase.from('profiles').insert([{
            id: data.user.id, email: userData.email, role: userData.role,
            display_name: userData.displayName || userData.email.split('@')[0]
          }]);
        } else {
          await supabase.from('profiles').update({
            role: userData.role, display_name: userData.displayName || userData.email.split('@')[0]
          }).eq('id', data.user.id);
        }
      }
      alert('Pengguna berhasil dibuat! Email verifikasi telah dikirim ke ' + userData.email);
      fetchData();
      return { success: true };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    } finally { setLoading(false); }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      setLoading(true);
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setStats(prev => ({
        ...prev, usersByRole: { ...prev.usersByRole, [newRole]: prev.usersByRole[newRole] + 1 }
      }));
      alert('Peran pengguna berhasil diubah!');
      fetchData();
    } catch (error) {
      alert('Gagal mengubah peran: ' + error.message);
    } finally { setLoading(false); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      const deletedUser = users.find(u => u.id === userId);
      setUsers(users.filter(u => u.id !== userId));
      if (deletedUser) {
        setStats(prev => ({
          ...prev, totalUsers: prev.totalUsers - 1,
          usersByRole: { ...prev.usersByRole, [deletedUser.role]: prev.usersByRole[deletedUser.role] - 1 }
        }));
      }
      alert('Pengguna berhasil dihapus!');
      fetchData();
    } catch (error) {
      alert('Gagal menghapus pengguna: ' + error.message);
    } finally { setLoading(false); }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kursus ini?')) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) throw error;
      setCourses(courses.filter(c => c.id !== courseId));
      setStats(prev => ({ ...prev, totalCourses: prev.totalCourses - 1 }));
      alert('Kursus berhasil dihapus!');
      fetchData();
    } catch (error) {
      alert('Gagal menghapus kursus: ' + error.message);
    } finally { setLoading(false); }
  };

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
      <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-md">
          <div className="flex items-center gap-sm bg-error-container text-on-error-container px-lg py-md rounded-xl">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button onClick={handleRefresh} className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-xl font-medium hover:bg-primary-container hover:text-on-primary-container transition-all duration-200">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto">
      {renderContent()}
    </div>
  );
};

/* ─── DASHBOARD OVERVIEW ─── */
const DashboardOverview = ({ stats, recentActivity, users, courses, onRefresh, refreshing, onNavigate }) => {
  const sections = [
    { id: 'users-admin', label: 'Tambah Pengguna', icon: '👤', color: 'from-[#3b82f6] to-[#2563eb]' },
    { id: 'courses-admin', label: 'Buat Kursus', icon: '📚', color: 'from-primary to-[#5a4fcf]' },
    { id: 'announcements-admin', label: 'Pengumuman', icon: '📢', color: 'from-primary to-[#5a4fcf]' },
    { id: 'activity-admin', label: 'Aktivitas', icon: '📊', color: 'from-[#8b5cf6] to-[#7c3aed]' },
    { id: 'settings-admin', label: 'Pengaturan', icon: '⚙️', color: 'from-primary to-[#5a4fcf]' },
    { id: 'profile-admin', label: 'Profil Saya', icon: '👤', color: 'from-primary to-[#5a4fcf]' },
  ];

  return (
    <div className="space-y-lg">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-[#764ba2] rounded-2xl p-xl md:p-2xl text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative">
          <div className="flex items-center gap-sm mb-sm">
            <Shield className="w-8 h-8" />
            <h1 className="text-headline-sm md:text-headline-md font-display">Dasbor Admin</h1>
          </div>
          <p className="text-body-lg opacity-90 max-w-xl">
            Hai Admin! Selamat mengelola platform pembelajaran ini dengan penuh tanggung jawab.
          </p>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        {[
          { icon: Users, label: 'Total Pengguna', value: stats.totalUsers, color: 'text-primary', bg: 'bg-primary-container' },
          { icon: BookOpen, label: 'Total Kursus', value: stats.totalCourses, color: 'text-success', bg: 'bg-success-container' },
          { icon: BarChart3, label: 'Total Tugas', value: stats.totalAssignments, color: 'text-warning', bg: 'bg-warning-container' },
          { icon: TrendingUp, label: 'Pengumpulan', value: stats.totalSubmissions, color: 'text-tertiary', bg: 'bg-tertiary-container' },
        ].map((item, idx) => (
          <div key={idx} className="bg-surface rounded-xl p-lg border border-outline-variant/30 hover:border-primary/30 hover:shadow-md transition-all duration-200 group">
            <div className={`${item.bg} w-10 h-10 rounded-lg flex items-center justify-center mb-sm group-hover:scale-110 transition-transform duration-200`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <p className="text-display-sm font-display font-bold text-on-surface">{item.value}</p>
            <p className="text-body-sm text-on-surface-variant">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Role Distribution */}
      <div className="bg-surface rounded-xl p-lg border border-outline-variant/30">
        <h2 className="text-title-md font-display text-on-surface mb-md">Pengguna Berdasarkan Peran</h2>
        <div className="grid grid-cols-3 gap-md">
          {[
            { role: 'Murid', count: stats.usersByRole.murid, icon: '🎓', gradient: 'from-primary to-[#5a4fcf]' },
            { role: 'Guru', count: stats.usersByRole.guru, icon: '👨‍🏫', gradient: 'from-primary to-[#5a4fcf]' },
            { role: 'Admin', count: stats.usersByRole.admin, icon: '⚙️', gradient: 'from-primary to-[#5a4fcf]' },
          ].map((item, idx) => (
            <div key={idx} className={`bg-gradient-to-br ${item.gradient} rounded-xl p-md text-white text-center`}>
              <span className="text-3xl block mb-xs">{item.icon}</span>
              <p className="text-display-sm font-display font-bold">{item.count}</p>
              <p className="text-body-sm opacity-90">{item.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden">
        <div className="px-lg py-md border-b border-outline-variant/30 bg-surface-container-low">
          <h2 className="text-title-md font-display text-on-surface">Aktivitas Terbaru</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-outline-variant/20">
                <th className="text-left px-lg py-sm font-medium text-on-surface-variant">Siswa</th>
                <th className="text-left px-lg py-sm font-medium text-on-surface-variant">Tugas</th>
                <th className="text-left px-lg py-sm font-medium text-on-surface-variant">Kursus</th>
                <th className="text-left px-lg py-sm font-medium text-on-surface-variant">Waktu</th>
                <th className="text-left px-lg py-sm font-medium text-on-surface-variant">Nilai</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.slice(0, 5).map((activity, idx) => (
                <tr key={activity.id} className={`border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors ${idx % 2 === 0 ? '' : 'bg-surface-container-low/30'}`}>
                  <td className="px-lg py-sm">
                    <span className="inline-flex items-center gap-xs">
                      <span>{activity.studentRole === 'murid' ? '🎓' : activity.studentRole === 'guru' ? '👨‍🏫' : '⚙️'}</span>
                      <span className="text-on-surface">{activity.studentEmail}</span>
                    </span>
                  </td>
                  <td className="px-lg py-sm text-on-surface">{activity.assignmentTitle}</td>
                  <td className="px-lg py-sm text-on-surface-variant">{activity.courseTitle}</td>
                  <td className="px-lg py-sm text-on-surface-variant">{new Date(activity.submitted_at).toLocaleString()}</td>
                  <td className="px-lg py-sm">
                    <span className={`inline-flex items-center px-sm py-0.5 rounded-full text-label-sm font-medium ${
                      activity.grade !== null ? 'bg-success-container text-on-success-container' : 'bg-warning-container text-on-warning-container'
                    }`}>
                      {activity.grade !== null ? `${activity.grade}/100` : 'Belum dinilai'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-surface rounded-xl p-lg border border-outline-variant/30">
        <h2 className="text-title-md font-display text-on-surface mb-md">⚡ Akses Cepat</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-md">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => onNavigate && onNavigate(sec.id)}
              className="flex flex-col items-center gap-xs bg-surface-container-low hover:bg-primary-container hover:text-on-primary-container rounded-xl p-md border border-outline-variant/20 hover:border-primary/30 transition-all duration-200 group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{sec.icon}</span>
              <span className="text-label-lg font-medium">{sec.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-xl font-medium hover:bg-primary-container hover:text-on-primary-container transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Memuat...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
};

/* ─── STATS VIEW ─── */
const StatsView = ({ stats }) => (
  <div className="space-y-lg">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
      {[
        { icon: '👥', label: 'Total Pengguna', value: stats.totalUsers },
        { icon: '📚', label: 'Total Kursus', value: stats.totalCourses },
        { icon: '📝', label: 'Total Tugas', value: stats.totalAssignments },
        { icon: '📤', label: 'Total Pengumpulan', value: stats.totalSubmissions },
      ].map((item, idx) => (
        <div key={idx} className="bg-surface rounded-xl p-lg border border-outline-variant/30 text-center">
          <div className="text-3xl mb-xs">{item.icon}</div>
          <p className="text-display-sm font-display font-bold text-on-surface">{item.value}</p>
          <p className="text-body-sm text-on-surface-variant">{item.label}</p>
        </div>
      ))}
    </div>

    <div className="grid md:grid-cols-2 gap-md">
      <div className="bg-surface rounded-xl p-lg border border-outline-variant/30">
        <h3 className="text-title-md font-display text-on-surface mb-md">Distribusi Pengguna</h3>
        <div className="flex items-end gap-md h-40">
          {[
            { label: 'Murid', value: stats.usersByRole.murid, color: 'bg-primary' },
            { label: 'Guru', value: stats.usersByRole.guru, color: 'bg-success' },
            { label: 'Admin', value: stats.usersByRole.admin, color: 'bg-warning' },
          ].map((bar, idx) => {
            const maxVal = Math.max(stats.usersByRole.murid, stats.usersByRole.guru, stats.usersByRole.admin, 1);
            const height = (bar.value / maxVal) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-xs">
                <span className="text-display-xs font-display font-bold text-on-surface">{bar.value}</span>
                <div className="w-full rounded-t-lg relative" style={{ height: `${Math.max(height, 5)}%` }}>
                  <div className={`absolute bottom-0 left-0 right-0 ${bar.color} rounded-t-lg transition-all duration-500`} style={{ height: '100%' }} />
                </div>
                <span className="text-label-sm text-on-surface-variant">{bar.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-sm">
        {[
          { label: 'Tingkat Aktivitas', value: `${stats.activityRate || 0}%`, gradient: 'from-[#3b82f6] to-[#1d4ed8]' },
          { label: 'Tingkat Penyelesaian', value: `${stats.completionRate || 0}%`, gradient: 'from-primary to-[#5a4fcf]' },
          { label: 'Rasio Kursus/Tugas', value: stats.totalCourses > 0 ? (stats.totalAssignments / stats.totalCourses).toFixed(1) : '0', gradient: 'from-[#8b5cf6] to-[#6d28d9]' },
        ].map((metric, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${metric.gradient} rounded-xl p-md text-white`}>
            <p className="text-label-sm opacity-90 mb-xs">{metric.label}</p>
            <p className="text-display-sm font-display font-bold">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-3 gap-md">
      {[
        { icon: '🎓', label: 'Murid', value: stats.usersByRole.murid, color: 'border-l-primary' },
        { icon: '👨‍🏫', label: 'Guru', value: stats.usersByRole.guru, color: 'border-l-success' },
        { icon: '⚙️', label: 'Admin', value: stats.usersByRole.admin, color: 'border-l-warning' },
      ].map((role, idx) => (
        <div key={idx} className={`bg-surface rounded-xl p-md border border-outline-variant/30 border-l-4 ${role.color}`}>
          <span className="text-2xl block mb-xs">{role.icon}</span>
          <p className="text-display-sm font-display font-bold text-on-surface">{role.value}</p>
          <p className="text-label-sm text-on-surface-variant">Total {role.label}</p>
        </div>
      ))}
    </div>
  </div>
);

/* ─── USERS MANAGEMENT VIEW ─── */
const UsersManagementView = ({ users, onUpdateRole, onDeleteUser, onCreateUser, loading }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', confirmPassword: '', role: 'murid', displayName: '' });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleViewProfile = (user) => { setSelectedUser(user); setShowProfileModal(true); };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'murid': return { icon: '🎓', label: 'Murid', badgeClass: 'bg-success-container text-on-success-container' };
      case 'guru': return { icon: '👨‍🏫', label: 'Guru', badgeClass: 'bg-primary-container text-on-primary-container' };
      case 'admin': return { icon: '⚙️', label: 'Admin', badgeClass: 'bg-tertiary-container text-on-tertiary-container' };
      default: return { icon: '❓', label: role, badgeClass: 'bg-surface-dim text-on-surface-variant' };
    }
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('minimal 8 karakter');
    if (!/[A-Z]/.test(password)) errors.push('huruf besar');
    if (!/[a-z]/.test(password)) errors.push('huruf kecil');
    if (!/\d/.test(password)) errors.push('angka');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('karakter khusus');
    return { isValid: errors.length === 0, errors };
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!newUser.email.trim()) { setCreateError('Email wajib diisi'); return; }
    if (!validateEmail(newUser.email)) { setCreateError('Format email tidak valid'); return; }
    if (!newUser.password) { setCreateError('Kata sandi wajib diisi'); return; }
    const passwordValidation = validatePassword(newUser.password);
    if (!passwordValidation.isValid) { setCreateError('Kata sandi harus mengandung: ' + passwordValidation.errors.join(', ')); return; }
    if (!newUser.confirmPassword) { setCreateError('Konfirmasi kata sandi wajib diisi'); return; }
    if (newUser.password !== newUser.confirmPassword) { setCreateError('Kata sandi tidak cocok'); return; }

    setCreateLoading(true);
    const result = await onCreateUser({ email: newUser.email, password: newUser.password, role: newUser.role, displayName: newUser.displayName });
    setCreateLoading(false);
    if (result.success) {
      setNewUser({ email: '', password: '', confirmPassword: '', role: 'murid', displayName: '' });
      setShowCreateForm(false);
    } else {
      let errorMessage = result.error;
      if (result.error === 'User already registered') errorMessage = 'Email sudah terdaftar. Gunakan email lain.';
      else if (result.error === 'Password should be at least 6 characters') errorMessage = 'Kata sandi minimal 6 karakter';
      else if (result.error === 'Invalid email') errorMessage = 'Format email tidak valid';
      setCreateError(errorMessage);
    }
  };

  return (
    <div className="space-y-lg">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-[#1d4ed8] rounded-2xl p-xl text-white">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/4 translate-x-1/4" />
        <div className="relative flex items-center gap-sm">
          <Users className="w-7 h-7" />
          <div>
            <h2 className="text-title-lg font-display">Manajemen Pengguna</h2>
            <p className="text-body-sm opacity-90">Kelola semua pengguna platform termasuk murid, guru, dan admin.</p>
          </div>
        </div>
      </div>

      {/* Create User Section */}
      <div className="bg-surface rounded-xl p-lg border border-outline-variant/30">
        <div className="flex items-center justify-between mb-md">
          <h3 className="text-title-md font-display text-on-surface flex items-center gap-xs">
            <Plus className="w-5 h-5" /> Tambah Pengguna Baru
          </h3>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={`inline-flex items-center gap-xs px-md py-sm rounded-xl font-medium text-label-lg transition-all duration-200 ${
              showCreateForm ? 'bg-surface-dim text-on-surface-variant hover:bg-outline-variant' : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container'
            }`}
          >
            {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreateForm ? 'Batal' : 'Tambah Pengguna'}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-surface-container-low rounded-xl p-lg border border-outline-variant/30">
            {createError && (
              <div className="flex items-center gap-xs bg-error-container text-on-error-container px-md py-sm rounded-lg mb-md">
                <AlertCircle className="w-4 h-4" />
                <span className="text-label-lg">{createError}</span>
              </div>
            )}
            <form onSubmit={handleCreateUser}>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-md mb-lg">
                {[
                  { id: 'email', label: 'Email *', type: 'email', placeholder: 'contoh@email.com', value: newUser.email, onChange: (v) => setNewUser({ ...newUser, email: v }) },
                  { id: 'displayName', label: 'Nama Tampilan', type: 'text', placeholder: 'Nama pengguna', value: newUser.displayName, onChange: (v) => setNewUser({ ...newUser, displayName: v }) },
                  { id: 'password', label: 'Kata Sandi *', type: 'password', placeholder: 'Masukkan kata sandi', value: newUser.password, onChange: (v) => setNewUser({ ...newUser, password: v }), hint: 'Minimal 8 karakter, huruf besar/kecil, angka, dan karakter khusus' },
                  { id: 'confirmPassword', label: 'Konfirmasi Kata Sandi *', type: 'password', placeholder: 'Ulangi kata sandi', value: newUser.confirmPassword, onChange: (v) => setNewUser({ ...newUser, confirmPassword: v }) },
                  {
                    id: 'role', label: 'Peran *', type: 'select',
                    value: newUser.role, onChange: (v) => setNewUser({ ...newUser, role: v }),
                    options: [
                      { value: 'murid', label: '🎓 Murid' },
                      { value: 'guru', label: '👨‍🏫 Guru' },
                      { value: 'admin', label: '⚙️ Admin' },
                    ]
                  },
                ].map((field) => (
                  <div key={field.id}>
                    <label className="block text-label-lg font-medium text-on-surface mb-xs">{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        disabled={createLoading}
                        className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      >
                        {field.options.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder={field.placeholder}
                        disabled={createLoading}
                        className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    )}
                    {field.hint && <p className="text-label-sm text-on-surface-variant mt-xs">{field.hint}</p>}
                  </div>
                ))}
              </div>
              <div className="flex gap-sm">
                <button type="submit" disabled={createLoading} className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-xl font-medium hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50">
                  {createLoading ? '⏳ Membuat...' : '✓ Buat Pengguna'}
                </button>
                <button type="button" onClick={() => { setShowCreateForm(false); setNewUser({ email: '', password: '', confirmPassword: '', role: 'murid', displayName: '' }); setCreateError(''); }} disabled={createLoading} className="inline-flex items-center gap-xs bg-surface-dim text-on-surface-variant px-lg py-sm rounded-xl font-medium hover:bg-outline-variant transition-all">
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Users List */}
      <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden">
        <div className="px-lg py-md border-b border-outline-variant/30 bg-surface-container-low">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
            <h3 className="text-title-md font-display text-on-surface flex items-center gap-xs">
              <User className="w-5 h-5" /> Daftar Pengguna ({filteredUsers.length})
            </h3>
            <div className="flex items-center gap-sm">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text" placeholder="Cari pengguna..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-xl pr-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all w-full sm:w-48"
                />
              </div>
              <select
                value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                className="px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              >
                <option value="all">Semua Peran</option>
                <option value="murid">Murid</option>
                <option value="guru">Guru</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>

        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-left px-lg py-sm font-medium text-on-surface-variant">Pengguna</th>
                  <th className="text-left px-lg py-sm font-medium text-on-surface-variant">Email</th>
                  <th className="text-left px-lg py-sm font-medium text-on-surface-variant">Nama</th>
                  <th className="text-left px-lg py-sm font-medium text-on-surface-variant">Peran</th>
                  <th className="text-left px-lg py-sm font-medium text-on-surface-variant">Dibuat</th>
                  <th className="text-left px-lg py-sm font-medium text-on-surface-variant">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userItem, idx) => {
                  const roleInfo = getRoleBadge(userItem.role);
                  return (
                    <tr key={userItem.id} className={`border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors ${idx % 2 === 0 ? '' : 'bg-surface-container-low/30'}`}>
                      <td className="px-lg py-sm">
                        <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-label-lg font-bold">
                          {(userItem.display_name || userItem.email)?.charAt(0).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-lg py-sm text-on-surface">{userItem.email}</td>
                      <td className="px-lg py-sm text-on-surface-variant">{userItem.display_name || userItem.full_name || '-'}</td>
                      <td className="px-lg py-sm">
                        <span className={`inline-flex items-center gap-xs px-sm py-0.5 rounded-full text-label-sm font-medium ${roleInfo.badgeClass}`}>
                          {roleInfo.icon} {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-lg py-sm text-on-surface-variant">{new Date(userItem.created_at).toLocaleDateString()}</td>
                      <td className="px-lg py-sm">
                        <div className="flex items-center gap-xs">
                          <button onClick={() => handleViewProfile(userItem)} title="Lihat Profil"
                            className="p-xs rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-all">
                            <Eye className="w-4 h-4" />
                          </button>
                          <select
                            value={userItem.role} onChange={(e) => onUpdateRole(userItem.id, e.target.value)}
                            disabled={loading}
                            className="px-sm py-0.5 rounded-lg border border-outline-variant bg-surface text-on-surface text-label-sm focus:outline-none transition-all"
                          >
                            <option value="murid">Murid</option>
                            <option value="guru">Guru</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button onClick={() => onDeleteUser(userItem.id)} disabled={loading} title="Hapus"
                            className="p-xs rounded-lg bg-error-container text-on-error-container hover:bg-error hover:text-on-error transition-all">
                            <Trash2 className="w-4 h-4" />
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
          <div className="flex flex-col items-center py-2xl text-on-surface-variant">
            <Users className="w-12 h-12 mb-sm opacity-40" />
            <p>{searchQuery || roleFilter !== 'all' ? 'Tidak ada pengguna yang cocok dengan pencarian.' : 'Belum ada pengguna.'}</p>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal && selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-md">
          <div className="bg-surface rounded-2xl max-w-md w-full max-h-[90vh] overflow-auto shadow-2xl animate-scaleIn">
            <div className="relative bg-gradient-to-br from-primary to-[#1d4ed8] rounded-t-2xl p-xl text-white text-center">
              <button onClick={() => setShowProfileModal(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
                <X className="w-4 h-4" />
              </button>
              <div className="w-20 h-20 rounded-full bg-white/20 mx-auto mb-md flex items-center justify-center text-3xl font-bold border-2 border-white">
                {(selectedUser.display_name || selectedUser.email)?.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-title-lg font-display">{selectedUser.display_name || selectedUser.full_name || 'Pengguna'}</h3>
              <span className={`inline-flex items-center gap-xs px-sm py-0.5 rounded-full text-label-sm font-medium mt-xs bg-white/20`}>
                {getRoleBadge(selectedUser.role).icon} {getRoleBadge(selectedUser.role).label}
              </span>
            </div>
            <div className="p-lg space-y-sm">
              {[
                { icon: Mail, label: 'Email', value: selectedUser.email, color: 'text-primary' },
                { icon: User, label: 'Nama Lengkap', value: selectedUser.full_name || '-', color: 'text-success' },
                { icon: Award, label: 'Nama Tampilan', value: selectedUser.display_name || '-', color: 'text-warning' },
                { icon: Calendar, label: 'Tanggal Dibuat', value: new Date(selectedUser.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), color: 'text-tertiary' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-md p-md rounded-xl bg-surface-container-low">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <div>
                    <p className="text-label-sm text-on-surface-variant">{item.label}</p>
                    <p className="text-body-sm font-medium text-on-surface">{item.value}</p>
                  </div>
                </div>
              ))}
              {selectedUser.bio && (
                <div className="p-md rounded-xl bg-surface-container-low">
                  <p className="text-label-sm text-on-surface-variant mb-xs">Bio</p>
                  <p className="text-body-sm text-on-surface">{selectedUser.bio}</p>
                </div>
              )}
            </div>
            <div className="px-lg py-md border-t border-outline-variant/30 flex justify-end">
              <button onClick={() => setShowProfileModal(false)}
                className="px-lg py-sm rounded-xl bg-surface-dim text-on-surface-variant font-medium hover:bg-outline-variant transition-all">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── COURSES ADMIN VIEW ─── */
const CoursesAdminView = ({ courses, onDeleteCourse, loading }) => (
  <div className="space-y-lg">
    <div className="relative overflow-hidden bg-gradient-to-br from-primary to-[#5a4fcf] rounded-2xl p-xl text-white">
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/4 translate-x-1/4" />
      <div className="relative flex items-center gap-sm">
        <BookOpen className="w-7 h-7" />
        <div>
          <h2 className="text-title-lg font-display">Manajemen Kursus</h2>
          <p className="text-body-sm opacity-90">Pantau dan kelola semua kursus yang tersedia di platform.</p>
        </div>
      </div>
    </div>

    <div className="bg-surface rounded-xl p-lg border border-outline-variant/30">
      <h3 className="text-title-md font-display text-on-surface mb-md">Kursus ({courses.length})</h3>
      {courses.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-md">
          {courses.map(course => (
            <div key={course.id} className="bg-surface-container-low rounded-xl p-md border border-outline-variant/30 hover:border-primary/30 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-center justify-between mb-sm">
                <span className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center text-title-md font-bold group-hover:scale-110 transition-transform">
                  {course.title?.substring(0, 2).toUpperCase() || 'KS'}
                </span>
                <span className="text-2xl">📚</span>
              </div>
              <h4 className="text-title-sm font-display text-on-surface mb-xs font-semibold">{course.title}</h4>
              <p className="text-body-sm text-on-surface-variant line-clamp-2 mb-sm">{course.description}</p>
              <div className="flex items-center justify-between pt-sm border-t border-outline-variant/20">
                <span className="text-label-sm text-on-surface-variant">Dibuat: {new Date(course.created_at).toLocaleDateString()}</span>
                <button onClick={() => onDeleteCourse(course.id)} disabled={loading}
                  className="text-label-sm font-medium text-error hover:text-error-container transition-all px-sm py-0.5 rounded-lg hover:bg-error-container">
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-2xl text-on-surface-variant">
          <BookOpen className="w-12 h-12 mb-sm opacity-40" />
          <p>Belum ada kursus.</p>
        </div>
      )}
    </div>
  </div>
);

/* ─── ACTIVITY VIEW ─── */
const ActivityView = ({ recentActivity }) => {
  const gradedCount = recentActivity.filter(a => a.grade !== null).length;
  const pendingCount = recentActivity.filter(a => a.grade === null).length;
  const today = new Date().toDateString();
  const todayActivity = recentActivity.filter(a => new Date(a.submitted_at).toDateString() === today).length;

  return (
    <div className="space-y-lg">
      <div className="relative overflow-hidden bg-gradient-to-br from-tertiary to-[#5b21b6] rounded-2xl p-xl text-white">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/4 translate-x-1/4" />
        <div className="relative flex items-center gap-sm">
          <BarChart3 className="w-7 h-7" />
          <div>
            <h2 className="text-title-lg font-display">Aktivitas Sistem</h2>
            <p className="text-body-sm opacity-90">Lacak semua aktivitas dan interaksi pengguna dalam platform.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        {[
          { icon: '📊', label: 'Total Aktivitas', value: recentActivity.length, gradient: 'from-[#3b82f6] to-[#1d4ed8]' },
          { icon: '✅', label: 'Sudah Dinilai', value: gradedCount, gradient: 'from-primary to-[#5a4fcf]' },
          { icon: '⏳', label: 'Menunggu Nilai', value: pendingCount, gradient: 'from-primary to-[#5a4fcf]' },
          { icon: '📅', label: 'Hari Ini', value: todayActivity, gradient: 'from-[#8b5cf6] to-[#6d28d9]' },
        ].map((stat, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-md text-white text-center`}>
            <div className="text-2xl mb-xs">{stat.icon}</div>
            <p className="text-display-sm font-display font-bold">{stat.value}</p>
            <p className="text-label-sm opacity-90">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden">
        <div className="px-lg py-md border-b border-outline-variant/30 bg-surface-container-low">
          <h3 className="text-title-md font-display text-on-surface">📋 Riwayat Aktivitas Terbaru</h3>
        </div>
        {recentActivity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-left px-lg py-sm font-medium text-on-surface-variant">Siswa</th>
                  <th className="text-left px-lg py-sm font-medium text-on-surface-variant">Tugas</th>
                  <th className="text-left px-lg py-sm font-medium text-on-surface-variant">Kursus</th>
                  <th className="text-left px-lg py-sm font-medium text-on-surface-variant">Waktu</th>
                  <th className="text-left px-lg py-sm font-medium text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((activity, idx) => (
                  <tr key={activity.id} className={`border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors ${idx % 2 === 0 ? '' : 'bg-surface-container-low/30'}`}>
                    <td className="px-lg py-sm">
                      <span className="inline-flex items-center gap-xs">
                        <span>{activity.studentRole === 'murid' ? '🎓' : activity.studentRole === 'guru' ? '👨‍🏫' : '⚙️'}</span>
                        <span className="text-on-surface font-medium">{activity.studentEmail}</span>
                      </span>
                    </td>
                    <td className="px-lg py-sm text-on-surface">{activity.assignmentTitle}</td>
                    <td className="px-lg py-sm text-on-surface-variant">{activity.courseTitle}</td>
                    <td className="px-lg py-sm">
                      <div className="flex flex-col">
                        <span className="text-on-surface font-medium">{new Date(activity.submitted_at).toLocaleDateString('id-ID')}</span>
                        <span className="text-label-sm text-on-surface-variant">{new Date(activity.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-lg py-sm">
                      <span className={`inline-flex items-center gap-xs px-sm py-0.5 rounded-full text-label-sm font-medium ${
                        activity.grade !== null ? 'bg-success-container text-on-success-container' : 'bg-warning-container text-on-warning-container'
                      }`}>
                        {activity.grade !== null ? `✅ ${activity.grade}` : '⏳ Menunggu'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-2xl text-on-surface-variant">
            <span className="text-5xl mb-sm">📭</span>
            <p>Belum ada aktivitas.</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── SETTINGS VIEW ─── */
const SettingsView = () => (
  <div className="space-y-lg">
    <div className="relative overflow-hidden bg-gradient-to-br from-surface-dim to-[#4b5563] rounded-2xl p-xl text-white">
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/4 translate-x-1/4" />
      <div className="relative flex items-center gap-sm">
        <Settings className="w-7 h-7" />
        <div>
          <h2 className="text-title-lg font-display">Pengaturan Sistem</h2>
          <p className="text-body-sm opacity-90">Kelola notifikasi, keamanan, dan konfigurasi platform.</p>
        </div>
      </div>
    </div>

    <div className="space-y-md">
      {/* Notification Settings */}
      <div className="bg-surface rounded-xl p-lg border border-outline-variant/30">
        <h3 className="text-title-md font-display text-on-surface flex items-center gap-xs mb-md">
          🔔 Notifikasi
        </h3>
        <div className="space-y-sm">
          {[
            { label: 'Notifikasi Email', desc: 'Kirim notifikasi ke email pengguna' },
            { label: 'Notifikasi Tugas Baru', desc: 'Beritahu siswa saat tugas baru ditambahkan' },
            { label: 'Notifikasi Nilai', desc: 'Beritahu siswa saat tugas dinilai' },
          ].map((item, idx) => (
            <label key={idx} className="flex items-center justify-between p-md rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container transition-all">
              <div>
                <span className="text-label-lg font-medium text-on-surface">{item.label}</span>
                <p className="text-label-sm text-on-surface-variant">{item.desc}</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-primary" />
            </label>
          ))}
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-surface rounded-xl p-lg border border-outline-variant/30">
        <h3 className="text-title-md font-display text-on-surface flex items-center gap-xs mb-md">
          🔒 Keamanan
        </h3>
        <div className="space-y-sm">
          {[
            { label: 'Verifikasi Email', desc: 'Wajibkan verifikasi email saat daftar' },
            { label: 'Reset Password', desc: 'Izinkan pengguna reset password' },
          ].map((item, idx) => (
            <label key={idx} className="flex items-center justify-between p-md rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container transition-all">
              <div>
                <span className="text-label-lg font-medium text-on-surface">{item.label}</span>
                <p className="text-label-sm text-on-surface-variant">{item.desc}</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-primary" />
            </label>
          ))}
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-surface rounded-xl p-lg border border-outline-variant/30">
        <h3 className="text-title-md font-display text-on-surface flex items-center gap-xs mb-md">
          🖥️ Sistem
        </h3>
        <div className="space-y-sm">
          <label className="flex items-center justify-between p-md rounded-xl bg-warning-container cursor-pointer hover:bg-warning-container/80 transition-all">
            <div>
              <span className="text-label-lg font-medium text-on-warning-container">Mode Maintenance</span>
              <p className="text-label-sm text-on-warning-container/80">Matikan akses sementara untuk maintenance</p>
            </div>
            <input type="checkbox" className="w-5 h-5 rounded accent-primary" />
          </label>
          <div className="flex items-center justify-between p-md rounded-xl bg-surface-container-low">
            <div>
              <span className="text-label-lg font-medium text-on-surface">Versi Sistem</span>
              <p className="text-label-sm text-on-surface-variant">v1.0.0 - Build 2024.01</p>
            </div>
            <span className="bg-primary-container text-on-primary-container px-sm py-0.5 rounded-full text-label-sm font-medium">Terbaru</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-sm">
        <button className="px-lg py-sm rounded-xl bg-surface-dim text-on-surface-variant font-medium hover:bg-outline-variant transition-all">Batal</button>
        <button className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-xl font-medium hover:bg-primary-container hover:text-on-primary-container transition-all">💾 Simpan Pengaturan</button>
      </div>
    </div>
  </div>
);

/* ─── QUICK ACTIONS VIEW ─── */
const QuickActionsView = ({ onNavigate }) => {
  const quickActions = [
    { title: 'Tambah Pengguna Baru', description: 'Buat akun baru untuk murid, guru, atau admin', icon: '👤➕', action: 'users-admin', color: '#3b82f6' },
    { title: 'Buat Kursus', description: 'Buat kursus baru untuk platform pembelajaran', icon: '📚➕', action: 'courses-admin', color: '#3525cd' },
    { title: 'Buat Pengumuman', description: 'Umumkan informasi penting ke semua pengguna', icon: '📢➕', action: 'announcements-admin', color: '#3525cd' },
    { title: 'Lihat Aktivitas', description: 'Pantau aktivitas terbaru di platform', icon: '📊', action: 'activity-admin', color: '#8b5cf6' },
    { title: 'Kelola Pengaturan', description: 'Konfigurasi notifikasi, keamanan, dan sistem', icon: '⚙️', action: 'settings-admin', color: '#6b7280' },
    { title: 'Kembali ke Dashboard', description: 'Lihat ringkasan dan statistik utama', icon: '🏠', action: 'dashboard-admin', color: '#1f2937' },
  ];

  return (
    <div className="space-y-lg">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-[#5a4fcf] rounded-2xl p-xl text-white">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/4 translate-x-1/4" />
        <div className="relative">
          <h2 className="text-title-lg font-display">⚡ Quick Actions</h2>
          <p className="text-body-sm opacity-90">Akses cepat ke semua fitur dan tindakan administratif.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-md">
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => onNavigate(action.action)}
            className="bg-surface rounded-xl p-lg border border-outline-variant/30 hover:border-primary/30 hover:shadow-md transition-all duration-200 text-left group"
          >
            <div className="flex items-start gap-md">
              <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform" style={{ backgroundColor: `${action.color}15` }}>
                {action.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-title-sm font-display text-on-surface font-semibold mb-xs">{action.title}</h3>
                <p className="text-body-sm text-on-surface-variant">{action.description}</p>
              </div>
            </div>
            <div className="flex justify-end mt-sm">
              <span className="text-label-sm font-medium" style={{ color: action.color }}>Klik untuk mengakses →</span>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-gradient-to-br from-primary to-[#764ba2] rounded-2xl p-xl text-white text-center">
        <h3 className="text-title-md font-display mb-md">📊 Ringkasan Cepat</h3>
        <div className="grid grid-cols-3 gap-md">
          <div>
            <p className="text-display-sm font-display font-bold">6</p>
            <p className="text-label-sm opacity-90">Menu Tersedia</p>
          </div>
          <div>
            <p className="text-display-sm font-display font-bold">5</p>
            <p className="text-label-sm opacity-90">Fitur Utama</p>
          </div>
          <div>
            <p className="text-display-sm font-display font-bold">⚡</p>
            <p className="text-label-sm opacity-90">Akses Cepat</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── PROFILE VIEW ─── */
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
    <div className="space-y-lg">
      <div className="relative overflow-hidden bg-gradient-to-br from-tertiary to-[#7c3aed] rounded-2xl p-xl text-white">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/4 translate-x-1/4" />
        <div className="relative flex items-center gap-sm">
          <User className="w-7 h-7" />
          <div>
            <h2 className="text-title-lg font-display">Profil Saya</h2>
            <p className="text-body-sm opacity-90">Kelola informasi profil Anda.</p>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl p-lg border border-outline-variant/30 max-w-lg">
        <h3 className="text-title-md font-display text-on-surface mb-md">📝 Edit Profil</h3>

        {message && (
          <div className="flex items-center gap-xs bg-success-container text-on-success-container px-md py-sm rounded-lg mb-md">
            <CheckCircle className="w-4 h-4" />
            <span className="text-label-lg">{message}</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-xs bg-error-container text-on-error-container px-md py-sm rounded-lg mb-md">
            <AlertCircle className="w-4 h-4" />
            <span className="text-label-lg">{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-md">
          <div>
            <label className="block text-label-lg font-medium text-on-surface mb-xs">Email</label>
            <input type="email" value={user?.email || ''} disabled
              className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface-dim text-on-surface-variant text-body-md cursor-not-allowed" />
            <p className="text-label-sm text-on-surface-variant mt-xs">Email tidak dapat diubah</p>
          </div>
          <div>
            <label className="block text-label-lg font-medium text-on-surface mb-xs">Nama Tampilan</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Masukkan nama tampilan"
              className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            <p className="text-label-sm text-on-surface-variant mt-xs">Nama ini akan terlihat oleh semua pengguna</p>
          </div>
          <button type="submit" disabled={loading}
            className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-xl font-medium hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50">
            {loading ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
          </button>
        </form>
      </div>

      <div className="bg-surface rounded-xl p-lg border border-outline-variant/30 max-w-lg">
        <h3 className="text-title-md font-display text-on-surface mb-md">ℹ️ Informasi Akun</h3>
        <div className="bg-surface-container-low rounded-xl p-md space-y-sm">
          <div className="flex items-center gap-sm"><span className="font-medium text-on-surface">Role:</span><span className="text-on-surface-variant">Admin</span></div>
          <div className="flex items-center gap-sm"><span className="font-medium text-on-surface">Status:</span><span className="inline-flex items-center gap-xs text-success"><CheckCircle className="w-4 h-4" /> Aktif</span></div>
          <div className="flex items-center gap-sm"><span className="font-medium text-on-surface">ID:</span><code className="text-label-sm text-on-surface-variant bg-surface px-sm py-0.5 rounded">{user?.id}</code></div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
