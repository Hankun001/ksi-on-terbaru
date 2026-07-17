import { useState, useEffect } from 'react';
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
import { Construction } from 'lucide-react';
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

  // Helper function to get display name
  const getDisplayName = () => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.full_name) return profile.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Pengguna';
  };

  return (
    <ErrorBoundary>
      <div className="app">
        {/* Navigation Bar */}
        <nav className="navbar">
          <div className="nav-brand">
            <img src="/logo.png" alt="KSI-ON Logo" className="nav-logo" />
            <span className="nav-title">KSI-ON</span>
          </div>
          {user ? (
            <div className="nav-user">
              <span className="nav-user-name">Halo, {getDisplayName()} ({getRoleName(role)})</span>
              <button onClick={handleSignOut} className="btn btn-secondary">Keluar</button>
            </div>
          ) : (
            <div className="nav-auth">
              <button
                onClick={() => setCurrentPage('login')}
                className={`btn ${currentPage === 'login' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Masuk
              </button>
            </div>
          )}
        </nav>

        {/* Main Content */}
        <main className="main-content">
          {!user ? (
            currentPage === 'login' ? <LoginPage setCurrentPage={setCurrentPage} /> :
            currentPage === 'forgot-password' ? <ForgotPasswordPage setCurrentPage={setCurrentPage} /> :
            currentPage === 'reset-password' ? <ResetPasswordPage setCurrentPage={setCurrentPage} /> :
            <LoginPage setCurrentPage={setCurrentPage} />
          ) : (
            <DashboardLayout role={role} user={user} />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}

// Dashboard Layout Component
const DashboardLayout = ({ role, user }) => {
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
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <Construction size={64} style={{ color: '#8b5cf6', marginBottom: '1.5rem' }} />
      <h2 style={{ color: '#374151', marginBottom: '0.5rem', fontSize: '1.5rem' }}>{title}</h2>
      <p style={{ color: '#6b7280', maxWidth: '400px', lineHeight: '1.6' }}>{description}</p>
    </div>
  );

  // Handle back from course view
  const handleBackFromCourse = () => {
    setCurrentCourseId(null);
    setActiveSection('courses-' + role);
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
        return <div>Peran tidak dikenali</div>;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar 
        role={role} 
        onNavigate={handleSidebarNavigation} 
        activeSection={activeSection} 
      />
      <div className="dashboard-content-area">
        {renderDashboard()}
      </div>
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
