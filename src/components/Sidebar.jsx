import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Home, BookOpen, Search, FileText, Bell,
  BarChart3, Mail, User, Users, Settings,
  LogOut, Upload, GraduationCap, HelpCircle, FileCheck,
  ClipboardList, UserCheck, Award, Eye, PieChart, Printer,
  Building2, UserCog, Activity, BookMarked, MoreVertical, X,
  FileSignature, TrendingUp
} from 'lucide-react';

const Sidebar = ({ role, onNavigate, activeSection }) => {
  const { signOut, profile, user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      alert('Error saat keluar: ' + error.message);
    }
  };

  // Define menu items based on role with proper icons
  const getMenuItems = () => {
    switch (role) {
      case 'murid':
        return [
          { name: 'Beranda', icon: Home, action: 'dashboard-murid' },
          { name: 'Kursus', icon: BookOpen, action: 'courses-murid' },
          { name: 'Jelajahi', icon: Search, action: 'browse-courses' },
          { name: 'Tugas', icon: FileText, action: 'assignments-murid' },
          { name: 'Ujian', icon: FileSignature, action: 'exams-murid' },
          { name: 'Pengumuman', icon: Bell, action: 'announcements-murid' },
          { name: 'Progres', icon: BarChart3, action: 'progress-murid' },
          { name: 'Pesan', icon: Mail, action: 'messages-murid' },
          { name: 'Profil', icon: User, action: 'profile-murid' },
        ];
      case 'guru':
        return [
          { name: 'Beranda', icon: Home, action: 'dashboard-guru' },
          { name: 'Kursus', icon: BookOpen, action: 'courses-guru' },
          { name: 'Ujian', icon: FileSignature, action: 'exams-guru' },
          { name: 'Materi', icon: FileText, action: 'materials-guru' },
          { name: 'Tugas', icon: FileText, action: 'assignments-guru' },
          { name: 'Quiz', icon: HelpCircle, action: 'quiz-guru' },
          { name: 'Kumpul', icon: Upload, action: 'submissions-guru' },
          { name: 'Progres', icon: BarChart3, action: 'progress-guru' },
          { name: 'Pengumuman', icon: Bell, action: 'announcements-guru' },
          { name: 'Murid', icon: GraduationCap, action: 'students-guru' },
          { name: 'Pesan', icon: Mail, action: 'messages-guru' },
           // Hasil Ujian Section
           { type: 'divider', name: 'HASIL UJIAN' },
            { name: 'Rekap Hasil Ujian', icon: TrendingUp, action: 'exam-results-guru' },
           // Administrasi Section
           { type: 'divider', name: 'ADMINISTRASI' },
           { name: 'Jurnal Mengajar', icon: ClipboardList, action: 'journal-guru' },
           { name: 'Absensi Siswa', icon: UserCheck, action: 'attendance-guru' },
           { name: 'Penilaian Siswa', icon: Award, action: 'evaluation-guru' },
           // Laporan Section
           { type: 'divider', name: 'LAPORAN' },
           { name: 'Laporan Absensi', icon: Printer, action: 'attendance-report-guru' },
           { name: 'Laporan Penilaian', icon: FileCheck, action: 'evaluation-report-guru' },
           { name: 'Profil', icon: User, action: 'profile-guru' },
        ];
      case 'admin':
        return [
          { name: 'Beranda', icon: Home, action: 'dashboard-admin' },
          { name: 'Pengguna', icon: Users, action: 'users-admin' },
          { name: 'Kursus', icon: BookOpen, action: 'courses-admin' },
          { name: 'Ujian', icon: FileSignature, action: 'exams-admin' },
          { name: 'Pengumuman', icon: Bell, action: 'announcements-admin' },
          { name: 'Aktivitas', icon: FileText, action: 'activity-admin' },
          { name: 'Pengaturan', icon: Settings, action: 'settings-admin' },
           // Administrasi Section
           { type: 'divider', name: 'ADMINISTRASI' },
            { name: 'Data Kelas', icon: Building2, action: 'classes-admin' },
            { name: 'Data Pengajar', icon: UserCog, action: 'teachers-admin' },
           { name: 'Data Siswa', icon: GraduationCap, action: 'students-admin' },
           { name: 'Monitoring Absensi', icon: UserCheck, action: 'attendance-admin' },
           { name: 'Evaluasi Pengajar', icon: Award, action: 'teacher-eval-admin' },
           { name: 'Laporan', icon: Printer, action: 'reports-admin' },
           { name: 'Profil', icon: User, action: 'profile-admin' },
        ];
      default:
        return [];
    }
  };

  const allMenuItems = role ? getMenuItems() : [];

  // Separate primary and additional menu items for mobile
  const getMobileMenuConfig = () => {
    if (!role) return { primary: [], additional: [] };

    switch (role) {
      case 'murid':
        return {
          primary: [
            { name: 'Beranda', icon: Home, action: 'dashboard-murid' },
            { name: 'Kursus', icon: BookOpen, action: 'courses-murid' },
            { name: 'Ujian', icon: FileSignature, action: 'exams-murid' },
            { name: 'Progres', icon: BarChart3, action: 'progress-murid' },
            { name: 'Profil', icon: User, action: 'profile-murid' },
          ],
          additional: [
            { name: 'Jelajahi', icon: Search, action: 'browse-courses' },
            { name: 'Tugas', icon: FileText, action: 'assignments-murid' },
            { name: 'Pengumuman', icon: Bell, action: 'announcements-murid' },
            { name: 'Pesan', icon: Mail, action: 'messages-murid' },
          ]
        };
      case 'guru':
        return {
          primary: [
            { name: 'Beranda', icon: Home, action: 'dashboard-guru' },
            { name: 'Kursus', icon: BookOpen, action: 'courses-guru' },
            { name: 'Ujian', icon: FileSignature, action: 'exams-guru' },
            { name: 'Murid', icon: GraduationCap, action: 'students-guru' },
            { name: 'Profil', icon: User, action: 'profile-guru' },
          ],
          additional: [
            { name: 'Materi', icon: FileText, action: 'materials-guru' },
            { name: 'Tugas', icon: FileText, action: 'assignments-guru' },
            { name: 'Quiz', icon: HelpCircle, action: 'quiz-guru' },
            { name: 'Kumpul', icon: Upload, action: 'submissions-guru' },
            { name: 'Progres', icon: BarChart3, action: 'progress-guru' },
            { name: 'Rekap Hasil Ujian', icon: TrendingUp, action: 'exam-results-guru' },
            { name: 'Pengumuman', icon: Bell, action: 'announcements-guru' },
            { name: 'Pesan', icon: Mail, action: 'messages-guru' },
            // Administrasi
            { type: 'divider', name: 'ADMINISTRASI' },
            { name: 'Jurnal Mengajar', icon: ClipboardList, action: 'journal-guru' },
            { name: 'Absensi Siswa', icon: UserCheck, action: 'attendance-guru' },
            { name: 'Penilaian Siswa', icon: Award, action: 'evaluation-guru' },
            // Laporan
            { type: 'divider', name: 'LAPORAN' },
            { name: 'Laporan Absensi', icon: Printer, action: 'attendance-report-guru' },
            { name: 'Laporan Penilaian', icon: FileCheck, action: 'evaluation-report-guru' },
          ]
        };
      case 'admin':
        return {
          primary: [
            { name: 'Beranda', icon: Home, action: 'dashboard-admin' },
            { name: 'Pengguna', icon: Users, action: 'users-admin' },
            { name: 'Kursus', icon: BookOpen, action: 'courses-admin' },
            { name: 'Ujian', icon: FileSignature, action: 'exams-admin' },
            { name: 'Profil', icon: User, action: 'profile-admin' },
          ],
          additional: [
            { name: 'Kelas', icon: Building2, action: 'classes-admin' },
            { name: 'Pengumuman', icon: Bell, action: 'announcements-admin' },
            { name: 'Aktivitas', icon: FileText, action: 'activity-admin' },
            { name: 'Pengaturan', icon: Settings, action: 'settings-admin' },
            // Administrasi Section
            { type: 'divider', name: 'DATA & MONITORING' },
            { name: 'Data Pengajar', icon: UserCog, action: 'teachers-admin' },
            { name: 'Data Siswa', icon: GraduationCap, action: 'students-admin' },
            { name: 'Monitoring Absensi', icon: UserCheck, action: 'attendance-admin' },
            { name: 'Evaluasi Pengajar', icon: Award, action: 'teacher-eval-admin' },
            // Laporan Section
            { type: 'divider', name: 'LAPORAN' },
            { name: 'Laporan Sistem', icon: Printer, action: 'reports-admin' },
          ]
        };
      default:
        return { primary: [], additional: [] };
    }
  };

  const { primary: primaryMenuItems = [], additional: additionalMenuItems = [] } = getMobileMenuConfig();

  const handleNavigation = (action) => {
    if (onNavigate) {
      onNavigate(action);
    }
    setShowMoreMenu(false); // Close more menu when navigating
  };

  // Get display name
  const getDisplayName = () => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.full_name) return profile.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Pengguna';
  };

  // Render desktop sidebar
  const renderDesktopSidebar = () => (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="/logo.png" alt="KSI-ON Logo" className="sidebar-logo" />
      </div>
      <nav className="sidebar-nav">
        <ul>
          {allMenuItems.map((item, index) => {
            // Handle divider items (section headers)
            if (item.type === 'divider') {
              return (
                <li key={index} className="sidebar-divider">
                  <span className="sidebar-divider-text">{item.name}</span>
                </li>
              );
            }
            return (
              <li key={index}>
                <button
                  className={`sidebar-link ${activeSection === item.action ? 'active' : ''}`}
                  onClick={() => handleNavigation(item.action)}
                >
                  <span className="nav-icon">
                    <item.icon size={20} />
                  </span>
                  <span className="nav-text">{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleSignOut} className="sidebar-link">
          <span className="nav-icon">
            <LogOut size={20} />
          </span>
          <span className="nav-text">Keluar</span>
        </button>
      </div>
    </aside>
  );

  // Render mobile bottom navigation bar with all features
  const renderMobileBottomNav = () => (
    <>
      <div className="mobile-bottom-nav">
        {primaryMenuItems.map((item, index) => (
          <button
            key={index}
            className={`mobile-bottom-nav-item ${activeSection === item.action ? 'active' : ''}`}
            onClick={() => handleNavigation(item.action)}
            title={item.name}
          >
            <span className="mobile-bottom-nav-icon">
              <item.icon size={20} />
            </span>
            <span className="mobile-bottom-nav-text">{item.name}</span>
          </button>
        ))}

        {/* More menu button if there are additional items */}
        {additionalMenuItems.filter(item => item.type !== 'divider').length > 0 && (
          <button
            className="mobile-bottom-nav-item"
            onClick={() => setShowMoreMenu(true)}
            title="Menu Lainnya"
          >
            <span className="mobile-bottom-nav-icon">
              <MoreVertical size={20} />
            </span>
            <span className="mobile-bottom-nav-text">Lainnya</span>
          </button>
        )}

        {/* Keluar button */}
        <button
          className="mobile-bottom-nav-item"
          onClick={handleSignOut}
          title="Keluar"
        >
          <span className="mobile-bottom-nav-icon">
            <LogOut size={20} />
          </span>
          <span className="mobile-bottom-nav-text">Keluar</span>
        </button>
      </div>

      {/* More Menu Modal */}
      {showMoreMenu && (
        <div
          className="modal-overlay"
          onClick={() => setShowMoreMenu(false)}
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div
            className="modal-content mobile-menu-modal"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              width: '100%',
              maxHeight: '80vh',
              margin: '2rem auto',
              borderRadius: '16px',
              background: 'white',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              animation: 'modalSlideUp 0.3s ease-out',
              overflow: 'hidden'
            }}
          >
            <div
              className="modal-header"
              style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e5e7eb',
                borderRadius: '16px 16px 0 0',
                background: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
                Menu Lengkap
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowMoreMenu(false)}
                aria-label="Tutup menu"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f3f4f6';
                  e.target.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'none';
                  e.target.style.color = '#6b7280';
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div
              className="modal-body"
              style={{
                padding: '1rem',
                maxHeight: 'calc(80vh - 80px)',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="mobile-menu-grid">
                {additionalMenuItems.map((item, index) => {
                  if (item.type === 'divider') {
                    return (
                      <div key={index} className="mobile-menu-divider">
                        <span className="mobile-menu-divider-text">{item.name}</span>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={index}
                      className={`mobile-menu-item ${activeSection === item.action ? 'active' : ''}`}
                      onClick={() => handleNavigation(item.action)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem 0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        background: 'white',
                        color: '#374151',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minHeight: '80px',
                        textAlign: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        position: 'relative',
                        overflow: 'hidden',
                        width: '100%'
                      }}
                    >
                      <span className="mobile-menu-item-icon">
                        <item.icon size={20} />
                      </span>
                      <span className="mobile-menu-item-text">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Don't render until we have role and menu data
  if (!role || !allMenuItems) {
    return null;
  }

  return (
    <>
      {/* Desktop sidebar */}
      {!isMobile && renderDesktopSidebar()}

      {/* Mobile bottom navigation */}
      {isMobile && renderMobileBottomNav()}
    </>
  );
};

export default Sidebar;
