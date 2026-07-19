import { useState, useEffect, useRef } from 'react';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabaseClient';
import Sidebar from './components/Sidebar';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import BrowseCourses from './pages/BrowseCourses';
import CourseView from './modules/CourseView';
import { ForgotPasswordPage, ResetPasswordPage } from './pages/AuthPages';
import LoginPage from './pages/LoginPage';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import { Construction, Bell, HelpCircle, RefreshCw, X, LogOut, User, ChevronDown, CheckSquare, Menu } from 'lucide-react';

function App() {
  const { user, role, loading, signOut, profile } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');

  if (loading) {
    return (
      <div className="app">
        <LoadingSpinner message="Memuat aplikasi..." />
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      setCurrentPage('home');
    } catch (error) {
      alert('Error saat keluar: ' + error.message);
    }
  };

  return (
    <ErrorBoundary>
      <div className="app">
        {/* Main Content */}
        <main className="main-content">
          {!user ? (
            currentPage === 'login' ? <LoginPage setCurrentPage={setCurrentPage} /> :
            currentPage === 'forgot-password' ? <ForgotPasswordPage setCurrentPage={setCurrentPage} /> :
            currentPage === 'reset-password' ? <ResetPasswordPage setCurrentPage={setCurrentPage} /> :
            <LoginPage setCurrentPage={setCurrentPage} />
          ) : (
            <DashboardLayout role={role} user={user} profile={profile} onSignOut={handleSignOut} />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}

// Dashboard Layout Component with New MD3 Design
const DashboardLayout = ({ role, user, profile, onSignOut }) => {
  const [activeSection, setActiveSection] = useState('dashboard-' + role);
  const [currentCourseId, setCurrentCourseId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
        if (!error && data) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.is_read).length);
        }
      } catch (e) {
        console.error('Error fetching notifications:', e.message);
      }
    };
    fetchNotifications();
    // Subscribe to realtime notifications
    const channel = supabase
      .channel('notifications-channel')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark notification as read
  const markAsRead = async (notifId) => {
    try {
      await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) { console.error('Error marking notification as read:', e.message); }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('user_id', user.id).eq('is_read', false);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) { console.error('Error marking all as read:', e.message); }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    // Force re-render by toggling a key state
    setActiveSection(prev => prev);
  };

  // Handle navigation actions
  const handleSidebarNavigation = (action) => {
    if (action.startsWith('course-view-')) {
      const courseId = action.replace('course-view-', '');
      setCurrentCourseId(courseId);
      setActiveSection('course-view');
    } else {
      setActiveSection(action);
      setCurrentCourseId(null);
    }
  };

  // Development message component
  const InDevelopmentMessage = ({ title, description }) => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-xl text-center">
      <Construction size={64} className="text-primary mb-lg" />
      <h2 className="text-title-lg font-title font-semibold text-on-surface mb-sm">{title}</h2>
      <p className="text-body-md font-body text-on-surface-variant max-w-md leading-relaxed">{description}</p>
    </div>
  );

  // Get display name
  const getDisplayName = () => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.full_name) return profile.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Pengguna';
  };

  // Get user initials
  const getUserInitials = () => {
    const name = getDisplayName();
    return name.charAt(0).toUpperCase();
  };

  // Get role label
  const getRoleLabel = () => {
    switch (role) {
      case 'murid': return 'Murid';
      case 'guru': return 'Guru';
      case 'admin': return 'Admin';
      default: return 'Pengguna';
    }
  };

  // Get section title for breadcrumb
  const getSectionTitle = () => {
    if (activeSection === 'course-view' && currentCourseId) return 'Kursus';
    const sectionMap = {
      'dashboard-murid': 'Dashboard Murid',
      'dashboard-guru': 'Dashboard Guru',
      'dashboard-admin': 'Dashboard Admin',
      'courses-murid': 'Kursus',
      'courses-guru': 'Kursus',
      'courses-admin': 'Kursus',
      'browse-courses': 'Jelajahi Kursus',
      'assignments-murid': 'Tugas',
      'assignments-guru': 'Tugas',
      'exams-murid': 'Ujian',
      'exams-guru': 'Ujian',
      'exams-admin': 'Ujian',
      'progress-murid': 'Progres',
      'progress-guru': 'Progres',
      'announcements-murid': 'Pengumuman',
      'announcements-guru': 'Pengumuman',
      'announcements-admin': 'Pengumuman',
      'profile-murid': 'Profil',
      'profile-guru': 'Profil',
      'profile-admin': 'Profil',
      'users-admin': 'Pengguna',
      'activity-admin': 'Aktivitas',
      'settings-admin': 'Pengaturan',
      'classes-admin': 'Data Kelas',
      'teachers-admin': 'Data Pengajar',
      'students-guru': 'Murid',
      'students-admin': 'Data Siswa',
      'attendance-guru': 'Absensi Siswa',
      'attendance-admin': 'Monitoring Absensi',
      'evaluation-guru': 'Penilaian Siswa',
      'teacher-eval-admin': 'Evaluasi Pengajar',
      'attendance-report-guru': 'Laporan Absensi',
      'evaluation-report-guru': 'Laporan Penilaian',
      'reports-admin': 'Laporan',
      'journal-guru': 'Jurnal Mengajar',
      'materials-guru': 'Materi',
      'quiz-guru': 'Quiz',
      'submissions-guru': 'Kumpulan Tugas',
      'exam-results-guru': 'Rekap Hasil Ujian',
    };
    return sectionMap[activeSection] || 'Dashboard';
  };

  // Render the appropriate dashboard based on role
  const renderDashboard = () => {
    // Handle course view
    if (activeSection === 'course-view' && currentCourseId) {
      return <CourseView courseId={currentCourseId} onNavigate={handleSidebarNavigation} />;
    }

    // Handle messaging - show under development message
    if (activeSection.includes('messages')) {
      return (
        <InDevelopmentMessage 
          title="Fitur Pesan Sedang Dikembangkan"
          description="Kami sedang bekerja keras untuk menghadirkan fitur pesan yang lebih baik. Segera hadir!"
        />
      );
    }

    switch (role) {
      case 'murid':
        if (activeSection === 'browse-courses') {
          return <BrowseCourses activeSection={activeSection} onNavigate={handleSidebarNavigation} />;
        }
        return <StudentDashboard activeSection={activeSection} onNavigate={handleSidebarNavigation} />;
      case 'guru':
        return <TeacherDashboard activeSection={activeSection} onNavigate={handleSidebarNavigation} />;
      case 'admin':
        return <AdminDashboard activeSection={activeSection} onNavigate={handleSidebarNavigation} />;
      default:
        return <div className="flex items-center justify-center h-full text-on-surface-variant text-body-md">Peran tidak dikenali</div>;
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      {/* Sidebar */}
      <Sidebar 
        role={role} 
        onNavigate={handleSidebarNavigation} 
        activeSection={activeSection}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
      />
      
      {/* Overlay when mobile sidebar is open - hides desktop navbar */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-[90] lg:hidden bg-black/30 backdrop-blur-sm animate-fadeIn"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      
      {/* Main Content Area */}
      <main className={`flex-1 ml-0 min-h-screen flex flex-col bg-surface-bright transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-sidebar-width'
        }`}>
        {/* Desktop Top Bar - with hamburger toggle for all sizes */}
        <header className="hidden lg:flex bg-surface/70 backdrop-blur-md justify-between items-center px-margin-desktop py-xs w-full z-40 shadow-sm sticky top-0 border-b border-outline-variant">
          {/* Breadcrumb with toggle */}
          <div className="flex items-center gap-sm">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-sm rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant hidden xl:block"
              title={sidebarCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            >
              {sidebarCollapsed ? <Menu size={18} /> : <Menu size={18} />}
            </button>
            <div className="h-4 w-px bg-outline-variant hidden xl:block"></div>
            <span className="text-body-sm text-on-surface-variant font-body">
              {getSectionTitle()}
            </span>
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center gap-sm">
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              className="p-sm rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
              title="Refresh Data"
            >
              <RefreshCw size={18} />
            </button>
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-sm rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant relative"
                title="Notifikasi"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-surface">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-xs w-80 md:w-96 bg-surface rounded-2xl shadow-xl border border-outline-variant overflow-hidden z-50 animate-scaleIn">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface-dim/30">
                    <h3 className="text-title-sm font-semibold text-on-surface flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Notifikasi
                      {unreadCount > 0 && (
                        <span className="bg-error text-on-error text-label-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                      )}
                    </h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-label-sm text-primary hover:text-primary/80 transition-colors">
                        Tandai Dibaca
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(notif => (
                        <button
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`w-full text-left px-4 py-3 border-b border-outline-variant/30 hover:bg-surface-dim/50 transition-colors flex items-start gap-3 ${
                            !notif.is_read ? 'bg-primary-container/10' : ''
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!notif.is_read ? 'bg-primary' : 'bg-outline-variant'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-body-sm ${!notif.is_read ? 'font-semibold text-on-surface' : 'text-on-surface'}`}>
                              {notif.title || 'Notifikasi'}
                            </p>
                            <p className="text-body-xs text-on-surface-variant mt-0.5 line-clamp-2">{notif.message}</p>
                            <p className="text-label-xs text-on-surface-variant/60 mt-1">
                              {new Date(notif.created_at).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {!notif.is_read && (
                            <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <CheckSquare className="w-3 h-3 text-primary" />
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="py-8 text-center">
                        <Bell className="w-10 h-10 mx-auto text-on-surface-variant/30 mb-2" />
                        <p className="text-body-sm text-on-surface-variant">Tidak ada notifikasi</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Help */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="p-sm rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
              title="Bantuan"
            >
              <HelpCircle size={18} />
            </button>
            {/* Divider */}
            <div className="h-6 w-px bg-outline-variant mx-xs"></div>
            {/* User Profile */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-sm cursor-pointer hover:bg-surface-container-high p-xs pr-md rounded-full transition-colors border border-outline-variant/30"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-title-md text-sm font-bold border-2 border-primary-fixed">
                  {getUserInitials()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-label-sm font-label text-on-surface leading-tight">{getDisplayName()}</p>
                  <p className="text-[10px] text-on-surface-variant font-label leading-tight">{getRoleLabel()}</p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-on-surface-variant transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>
              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-xs w-56 bg-surface rounded-2xl shadow-xl border border-outline-variant overflow-hidden z-50 animate-scaleIn">
                  <div className="px-4 py-3 border-b border-outline-variant/30 bg-surface-dim/20">
                    <p className="text-title-sm font-semibold text-on-surface truncate">{getDisplayName()}</p>
                    <p className="text-label-xs text-on-surface-variant truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { setActiveSection('profile-' + role); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-body-sm text-on-surface hover:bg-surface-dim/50 transition-colors"
                    >
                      <User className="w-4 h-4 text-primary" />
                      Profil Saya
                    </button>
                    <button
                      onClick={() => { onSignOut(); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-body-sm text-error hover:bg-error-container/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div key={refreshKey} className="flex-1 overflow-y-auto">
          {renderDashboard()}
        </div>
      </main>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowHelpModal(false)}>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-primary to-[#5a4fcf] text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-title-md font-semibold text-white flex items-center gap-sm">
                <HelpCircle className="w-5 h-5" />
                Pusat Bantuan
              </h2>
              <button onClick={() => setShowHelpModal(false)} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-primary-container/10 rounded-xl p-4">
                <h3 className="text-title-sm font-semibold text-on-surface mb-2">📚 Tentang KSI-ON LMS</h3>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  KSI-ON Learning Management System adalah platform pembelajaran digital untuk PKBM
                  yang membantu proses belajar mengajar secara efisien dan terstruktur.
                </p>
              </div>

              <div>
                <h3 className="text-title-sm font-semibold text-on-surface mb-3">❓ Fitur & Panduan</h3>
                <div className="space-y-2">
                  {[
                    { icon: '📊', title: 'Dashboard', desc: 'Lihat ringkasan aktivitas, statistik, dan notifikasi terbaru.' },
                    { icon: '📚', title: 'Materi Pembelajaran', desc: 'Akses materi belajar yang disediakan oleh guru pengajar.' },
                    { icon: '📝', title: 'Tugas & Quiz', desc: 'Kerjakan tugas dan quiz yang diberikan oleh guru.' },
                    { icon: '✅', title: 'Absensi', desc: 'Guru mencatat kehadiran siswa, admin melihat rekap absensi.' },
                    { icon: '📈', title: 'Penilaian', desc: 'Lihat nilai dan evaluasi hasil belajar.' },
                    { icon: '👤', title: 'Profil', desc: 'Kelola informasi akun dan pengaturan pribadi.' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-surface-dim/50 transition-colors">
                      <span className="text-lg shrink-0">{item.icon}</span>
                      <div>
                        <p className="text-body-sm font-semibold text-on-surface">{item.title}</p>
                        <p className="text-body-xs text-on-surface-variant">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface-dim/30 rounded-xl p-4 text-center">
                <p className="text-body-sm text-on-surface-variant">
                  Butuh bantuan lebih lanjut? Hubungi administrator.
                </p>
              </div>

              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all text-label-lg font-medium"
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

// Helper function to get role name in Indonesian
const getRoleName = (role) => {
  switch (role) {
    case 'murid':
      return 'Murid';
    case 'guru':
      return 'Guru';
    case 'admin':
      return 'Admin';
    default:
      return 'Pengguna';
  }
};

export default App;
