import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { ForgotPasswordPage, ResetPasswordPage } from './pages/AuthPages';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import './App.css';

function App() {
  const { user, role, loading, signOut } = useAuth();
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
        {/* Navigation Bar */}
        <nav className="navbar">
          <div className="nav-brand">KSI-ON</div>
          {user ? (
            <div className="nav-user">
              <span>Halo, {user.email} ({getRoleName(role)})</span>
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
              <button
                onClick={() => setCurrentPage('register')}
                className={`btn ${currentPage === 'register' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Daftar
              </button>
            </div>
          )}
        </nav>

        {/* Main Content */}
        <main className="main-content">
          {!user ? (
            currentPage === 'login' ? <LoginPage setCurrentPage={setCurrentPage} /> :
            currentPage === 'register' ? <RegisterPage setCurrentPage={setCurrentPage} /> :
            currentPage === 'forgot-password' ? <ForgotPasswordPage setCurrentPage={setCurrentPage} /> :
            currentPage === 'reset-password' ? <ResetPasswordPage setCurrentPage={setCurrentPage} /> :
            <LoginPage setCurrentPage={setCurrentPage} />
          ) : (
            <DashboardLayout
              role={role}
              user={user}
            />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}

// Dashboard Layout Component
const DashboardLayout = ({ role, user }) => {
  // Render the appropriate dashboard based on role
  const renderDashboard = () => {
    switch (role) {
      case 'murid':
        return <StudentDashboard />;
      case 'guru':
        return <TeacherDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <div>Peran tidak dikenali</div>;
    }
  };

  const handleSidebarNavigation = (action) => {
    // For now, we'll just refresh the page to simulate navigation
    // In a real implementation, you would set state to show different sections
    window.location.reload();
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role={role} onNavigate={handleSidebarNavigation} />
      <div className="dashboard-content-area">
        {renderDashboard()}
      </div>
    </div>
  );
};

// Login Page Component
const LoginPage = ({ setCurrentPage }) => {
  const [email, setEmail] = useState('');
