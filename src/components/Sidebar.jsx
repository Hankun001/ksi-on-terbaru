import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Home, BookOpen, Search, FileText, Bell,
  BarChart3, User, Users, Settings,
  LogOut, Upload, GraduationCap, HelpCircle,
  ClipboardList, UserCheck, Award, Printer,
  FileCheck, Building2, UserCog, TrendingUp,
  FileSignature, X, School,
  Menu, ChevronLeft, ChevronRight
} from 'lucide-react';

const Sidebar = ({ role, onNavigate, activeSection, sidebarCollapsed, setSidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen }) => {
  const { signOut, profile, user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
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

  const handleNavigation = (action) => {
    if (onNavigate) {
      onNavigate(action);
    }
    setMobileSidebarOpen(false);
  };

  // Define menu items based on role
  const getMenuItems = () => {
    switch (role) {
      case 'murid':
        return [
          { name: 'Dashboard', icon: Home, action: 'dashboard-murid' },
          { name: 'Kursus', icon: School, action: 'courses-murid' },
          { name: 'Jelajahi', icon: Search, action: 'browse-courses' },
          { name: 'Tugas', icon: FileText, action: 'assignments-murid' },
          { name: 'Ujian', icon: FileSignature, action: 'exams-murid' },
          { name: 'Progres', icon: BarChart3, action: 'progress-murid' },
          { name: 'Pengumuman', icon: Bell, action: 'announcements-murid' },
          { name: 'Profil', icon: User, action: 'profile-murid' },
        ];
      case 'guru':
        return [
          { name: 'Dashboard', icon: Home, action: 'dashboard-guru' },
          { name: 'Kursus', icon: BookOpen, action: 'courses-guru' },
          { name: 'Ujian', icon: FileSignature, action: 'exams-guru' },
          { name: 'Materi', icon: FileText, action: 'materials-guru' },
          { name: 'Tugas', icon: HelpCircle, action: 'assignments-guru' },
          { name: 'Quiz', icon: HelpCircle, action: 'quiz-guru' },
          { name: 'Kumpul', icon: Upload, action: 'submissions-guru' },
          { name: 'Progres', icon: BarChart3, action: 'progress-guru' },
          { name: 'Pengumuman', icon: Bell, action: 'announcements-guru' },
          { name: 'Murid', icon: GraduationCap, action: 'students-guru' },
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
          { name: 'Dashboard', icon: Home, action: 'dashboard-admin' },
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

  // Get display name
  const getDisplayName = () => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.full_name) return profile.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Pengguna';
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    const name = getDisplayName();
    return name.charAt(0).toUpperCase();
  };

  // Get role display name
  const getRoleLabel = () => {
    switch (role) {
      case 'murid': return 'Murid';
      case 'guru': return 'Guru';
      case 'admin': return 'Admin';
      default: return 'Pengguna';
    }
  };

  // ====== DESKTOP SIDEBAR ======
  const renderDesktopSidebar = () => (
    <aside className={`hidden lg:flex ${sidebarCollapsed ? 'w-[72px]' : 'w-sidebar-width'} h-screen fixed left-0 top-0 bg-surface flex-col border-r border-outline-variant shadow-[0px_4px_20px_rgba(0,0,0,0.05)] z-50 overflow-y-auto transition-all duration-300`}>
      {/* Logo Area + Toggle */}
      <div className="px-lg py-lg border-b border-outline-variant/30 flex items-center shrink-0 justify-between">
        <div className={`flex items-center gap-sm ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center p-1.5">
            <img src="/logo.png" alt="KSI-ON" className="w-full h-full object-contain" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-headline-md font-display font-extrabold text-primary leading-tight">KSI-ON LMS</h1>
              <p className="text-label-sm text-on-surface-variant font-label">Academic Excellence</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`p-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-primary shrink-0 ${sidebarCollapsed ? 'mx-auto' : ''}`}
          title={sidebarCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-md flex flex-col gap-0.5 px-0">
        {allMenuItems.map((item, index) => {
          // Divider items (section headers)
          if (item.type === 'divider') {
            return (
              <div key={index} className={`${sidebarCollapsed ? 'px-0 py-md flex justify-center' : 'px-lg pt-md pb-xs mt-sm'}`}>
                {sidebarCollapsed ? (
                  <div className="w-8 h-px bg-outline-variant/50" />
                ) : (
                  <span className="text-label-sm text-outline uppercase tracking-wider font-label font-semibold">
                    {item.name}
                  </span>
                )}
              </div>
            );
          }

          const isActive = activeSection === item.action;
          return (
            <button
              key={index}
              onClick={() => handleNavigation(item.action)}
              className={`
                flex items-center gap-md py-md ${sidebarCollapsed ? 'px-0 justify-center mx-2' : 'px-lg mr-sm'} transition-all duration-200 ease-in-out group
                ${isActive 
                  ? 'bg-primary/10 text-primary border-l-4 border-primary rounded-r-full font-semibold' 
                  : 'text-on-surface-variant border-l-4 border-transparent hover:bg-surface-container-low hover:text-primary rounded-r-full'
                }
              `}
            >
              <span className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}>
                <item.icon size={sidebarCollapsed ? 22 : 20} />
              </span>
              {!sidebarCollapsed && <span className="text-label-md font-label">{item.name}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className={`p-md border-t border-outline-variant/30 shrink-0 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
        <button
          onClick={handleSignOut}
          className={`text-on-surface-variant py-sm flex items-center gap-md hover:bg-error-container hover:text-error transition-all duration-200 ease-in-out rounded-lg group ${sidebarCollapsed ? 'px-0 justify-center w-10 h-10' : 'px-md w-full'}`}
          title="Logout"
        >
          <LogOut size={20} className="transition-transform duration-200 group-hover:scale-110" />
          {!sidebarCollapsed && <span className="text-label-md font-label">Logout</span>}
        </button>
      </div>
    </aside>
  );

  // ====== MOBILE LAYOUT (hanya top bar + slide-out sidebar, TIDAK ADA bottom nav) ======
  const renderMobileLayout = () => (
    <>
      {/* Mobile Top Bar - clean design, hamburger kiri, logo tengah, avatar kanan */}
      <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-surface/90 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant/50 shadow-sm">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-surface-container-high transition-all text-on-surface-variant active:scale-95"
          aria-label="Buka menu navigasi"
        >
          <Menu size={22} />
        </button>
        
        <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center p-1">
            <img src="/logo.png" alt="KSI-ON" className="w-full h-full object-contain" />
          </div>
          <span className="text-title-md font-semibold text-primary hidden xs:inline">KSI-ON</span>
        </div>
        
        <button
          onClick={() => handleNavigation('profile-' + role)}
          className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-surface-container-high transition-all active:scale-95"
        >
          <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-sm font-bold">
            {getUserInitials()}
          </div>
        </button>
      </header>

      {/* Mobile/Tablet Slide-out Sidebar - satu-satunya navigasi mobile */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[300px] bg-surface shadow-2xl flex flex-col animate-slideInLeft">
            {/* Sidebar Header */}
            <div className="px-lg py-lg border-b border-outline-variant/30 flex items-center gap-sm">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center p-1.5">
                <img src="/logo.png" alt="KSI-ON" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1">
                <h1 className="text-title-md font-display font-extrabold text-primary leading-tight">KSI-ON LMS</h1>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-surface-container-high transition-colors text-on-surface-variant"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Info */}
            <div className="px-lg py-sm border-b border-outline-variant/20 bg-surface-container-low/50">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-title-md">
                  {getUserInitials()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm font-semibold text-on-surface truncate">{getDisplayName()}</p>
                  <p className="text-label-xs text-on-surface-variant">{getRoleLabel()}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto sidebar-scroll py-sm px-2">
              {allMenuItems.map((item, index) => {
                if (item.type === 'divider') {
                  return (
                    <div key={index} className="px-lg pt-md pb-xs mt-sm">
                      <span className="text-label-xs text-outline uppercase tracking-wider font-semibold">
                        {item.name}
                      </span>
                    </div>
                  );
                }
                const isActive = activeSection === item.action;
                return (
                  <button
                    key={index}
                    onClick={() => handleNavigation(item.action)}
                    className={`w-full flex items-center gap-md py-2.5 px-lg my-0.5 transition-all duration-200 rounded-xl ${
                      isActive 
                        ? 'bg-primary/10 text-primary font-semibold' 
                        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                    }`}
                  >
                    <span className={`shrink-0 ${isActive ? 'scale-110' : ''}`}>
                      <item.icon size={20} />
                    </span>
                    <span className="text-label-md">{item.name}</span>
                  </button>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-md border-t border-outline-variant/30">
              <button
                onClick={handleSignOut}
                className="w-full text-on-surface-variant py-2.5 px-md flex items-center gap-md hover:bg-error-container/30 hover:text-error transition-all duration-200 rounded-xl"
              >
                <LogOut size={20} />
                <span className="text-label-md font-label">Keluar</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );

  if (!role || !allMenuItems) {
    return null;
  }

  return (
    <>
      {renderDesktopSidebar()}
      {renderMobileLayout()}
    </>
  );
};

export default Sidebar;
