import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
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
import { Construction, Bell, HelpCircle, RefreshCw } from 'lucide-react';
import './App.css';

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
            <DashboardLayout role={role} user={user} profile={profile} />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}

// Dashboard Layout Component with New MD3 Design
const DashboardLayout = ({ role, user, profile }) => {
  const [activeSection, setActiveSection] = useState('dashboard-' + role);
  const [currentCourseId, setCurrentCourseId] = useState(null);

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
      <Sidebar 
        role={role} 
        onNavigate={handleSidebarNavigation} 
        activeSection={activeSection} 
      />
      
      {/* Main Content Area */}
      <main className="flex-1 ml-0 md:ml-sidebar-width min-h-screen flex flex-col bg-surface-bright">
        {/* Desktop Top Bar */}
        <header className="hidden md:flex bg-surface/70 backdrop-blur-md justify-between items-center px-margin-desktop py-xs w-full z-40 shadow-sm sticky top-0 border-b border-outline-variant">
          {/* Breadcrumb */}
          <div className="flex items-center gap-sm">
            <span className="text-body-sm text-on-surface-variant font-body">
              {getSectionTitle()}
            </span>
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center gap-sm">
            {/* Refresh button */}
            <button className="p-sm rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
              <RefreshCw size={18} />
            </button>
            {/* Notification Bell */}
            <button className="p-sm rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant relative group">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full ring-2 ring-surface"></span>
            </button>
            {/* Help */}
            <button className="p-sm rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
              <HelpCircle size={18} />
            </button>
            {/* Divider */}
            <div className="h-6 w-px bg-outline-variant mx-xs"></div>
            {/* User Profile */}
            <div className="flex items-center gap-sm cursor-pointer hover:bg-surface-container-high p-xs pr-md rounded-full transition-colors border border-outline-variant/30">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-title-md text-sm font-bold border-2 border-primary-fixed">
                {getUserInitials()}
              </div>
              <div className="hidden sm:block">
                <p className="text-label-sm font-label text-on-surface leading-tight">{getDisplayName()}</p>
                <p className="text-[10px] text-on-surface-variant font-label leading-tight">{getRoleLabel()}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto">
          {renderDashboard()}
        </div>
      </main>
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
