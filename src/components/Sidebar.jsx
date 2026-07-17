import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Home, BookOpen, Search, FileText, Bell,
  BarChart3, User, Users, Settings,
  LogOut, Upload, GraduationCap, HelpCircle,
  ClipboardList, UserCheck, Award, Printer,
  FileCheck, Building2, UserCog, TrendingUp,
  FileSignature, MoreVertical, X, School,
  Menu
} from 'lucide-react';

const Sidebar = ({ role, onNavigate, activeSection }) => {
  const { signOut, profile, user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
    setShowMoreMenu(false);
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

  // Separate primary and additional menu items for mobile
  const getMobileMenuConfig = () => {
    if (!role) return { primary: [], additional: [] };

    switch (role) {
      case 'murid':
        return {
          primary: [
            { name: 'Beranda', icon: Home, action: 'dashboard-murid' },
            { name: 'Kursus', icon: School, action: 'courses-murid' },
            { name: 'Ujian', icon: FileSignature, action: 'exams-murid' },
            { name: 'Progres', icon: BarChart3, action: 'progress-murid' },
            { name: 'Profil', icon: User, action: 'profile-murid' },
          ],
          additional: [
            { name: 'Jelajahi', icon: Search, action: 'browse-courses' },
            { name: 'Tugas', icon: FileText, action: 'assignments-murid' },
            { name: 'Pengumuman', icon: Bell, action: 'announcements-murid' },
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
            { name: 'Tugas', icon: HelpCircle, action: 'assignments-guru' },
            { name: 'Quiz', icon: HelpCircle, action: 'quiz-guru' },
            { name: 'Kumpul', icon: Upload, action: 'submissions-guru' },
            { name: 'Progres', icon: BarChart3, action: 'progress-guru' },
            { name: 'Rekap Hasil Ujian', icon: TrendingUp, action: 'exam-results-guru' },
            { name: 'Pengumuman', icon: Bell, action: 'announcements-guru' },
            { type: 'divider', name: 'ADMINISTRASI' },
            { name: 'Jurnal Mengajar', icon: ClipboardList, action: 'journal-guru' },
            { name: 'Absensi Siswa', icon: UserCheck, action: 'attendance-guru' },
            { name: 'Penilaian Siswa', icon: Award, action: 'evaluation-guru' },
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
            { type: 'divider', name: 'DATA & MONITORING' },
            { name: 'Data Pengajar', icon: UserCog, action: 'teachers-admin' },
            { name: 'Data Siswa', icon: GraduationCap, action: 'students-admin' },
            { name: 'Monitoring Absensi', icon: UserCheck, action: 'attendance-admin' },
            { name: 'Evaluasi Pengajar', icon: Award, action: 'teacher-eval-admin' },
            { type: 'divider', name: 'LAPORAN' },
            { name: 'Laporan Sistem', icon: Printer, action: 'reports-admin' },
          ]
        };
      default:
        return { primary: [], additional: [] };
    }
  };

  const { primary: primaryMenuItems = [], additional: additionalMenuItems = [] } = getMobileMenuConfig();

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
    <aside className="hidden md:flex w-sidebar-width h-screen fixed left-0 top-0 bg-surface flex-col border-r border-outline-variant shadow-[0px_4px_20px_rgba(0,0,0,0.05)] z-50 overflow-y-auto">
      {/* Logo Area */}
      <div className="px-lg py-lg border-b border-outline-variant/30 flex items-center gap-sm shrink-0">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <School className="text-primary fill-current" size={22} />
        </div>
        <div>
          <h1 className="text-headline-md font-display font-extrabold text-primary leading-tight">KSI-ON LMS</h1>
          <p className="text-label-sm text-on-surface-variant font-label">Academic Excellence</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-md flex flex-col gap-0.5 px-0">
        {allMenuItems.map((item, index) => {
          // Divider items (section headers)
          if (item.type === 'divider') {
            return (
              <div key={index} className="px-lg pt-md pb-xs mt-sm">
                <span className="text-label-sm text-outline uppercase tracking-wider font-label font-semibold">
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
              className={`
                flex items-center gap-md py-md px-lg mr-sm transition-all duration-200 ease-in-out group
                ${isActive 
                  ? 'bg-primary/10 text-primary border-l-4 border-primary rounded-r-full font-semibold' 
                  : 'text-on-surface-variant border-l-4 border-transparent hover:bg-surface-container-low hover:text-primary rounded-r-full'
                }
              `}
            >
              <span className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}>
                <item.icon size={20} />
              </span>
              <span className="text-label-md font-label">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-md border-t border-outline-variant/30 shrink-0">
        <button
          onClick={handleSignOut}
          className="w-full text-on-surface-variant py-sm px-md flex items-center gap-md hover:bg-error-container hover:text-error transition-all duration-200 ease-in-out rounded-lg group"
        >
          <LogOut size={20} className="transition-transform duration-200 group-hover:scale-110" />
          <span className="text-label-md font-label">Logout</span>
        </button>
      </div>
    </aside>
  );

  // ====== MOBILE BOTTOM NAV ======
  const renderMobileBottomNav = () => (
    <>
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-md py-sm bg-surface/80 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant/50">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="p-xs rounded-full hover:bg-surface-container-high transition-colors text-primary"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-sm">
          <School className="text-primary" size={20} />
          <span className="text-title-md font-title font-semibold text-primary">KSI-ON</span>
        </div>
        <div className="flex items-center gap-xs">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-label-sm font-bold">
            {getUserInitials()}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant/50 px-xs pb-[env(safe-area-inset-bottom,0px)] z-50 flex justify-around safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {primaryMenuItems.map((item, index) => {
          const isActive = activeSection === item.action;
          return (
            <button
              key={index}
              onClick={() => handleNavigation(item.action)}
              className={`flex flex-col items-center justify-center py-sm px-1 min-w-0 flex-1 transition-colors duration-200 ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <span className={`mb-0.5 ${isActive ? 'scale-110' : ''}`}>
                <item.icon size={20} />
              </span>
              <span className={`text-[10px] font-label font-medium leading-tight ${isActive ? 'font-semibold' : ''}`}>
                {item.name}
              </span>
            </button>
          );
        })}

        {/* More button if there are additional items */}
        {additionalMenuItems.filter(item => item.type !== 'divider').length > 0 && (
          <button
            onClick={() => setShowMoreMenu(true)}
            className="flex flex-col items-center justify-center py-sm px-1 min-w-0 text-on-surface-variant"
          >
            <span className="mb-0.5">
              <MoreVertical size={20} />
            </span>
            <span className="text-[10px] font-label font-medium">Lainnya</span>
          </button>
        )}

        {/* Logout on mobile */}
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center justify-center py-sm px-1 min-w-0 text-on-surface-variant"
        >
          <LogOut size={20} />
          <span className="text-[10px] font-label font-medium">Keluar</span>
        </button>
      </div>

      {/* Mobile Slide-out Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-surface shadow-2xl flex flex-col animate-slideInLeft">
            <div className="px-lg py-lg border-b border-outline-variant/30 flex items-center gap-sm">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <School className="text-primary" size={22} />
              </div>
              <div className="flex-1">
                <h1 className="text-headline-md font-display font-extrabold text-primary leading-tight">KSI-ON LMS</h1>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-xs rounded-full hover:bg-surface-container-high transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-md py-sm border-b border-outline-variant/20 bg-surface-container-low/50">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-title-md">
                  {getUserInitials()}
                </div>
                <div>
                  <p className="text-body-sm font-body font-semibold text-on-surface">{getDisplayName()}</p>
                  <p className="text-label-sm font-label text-on-surface-variant">{getRoleLabel()}</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto sidebar-scroll py-sm">
              {allMenuItems.map((item, index) => {
                if (item.type === 'divider') {
                  return (
                    <div key={index} className="px-lg pt-md pb-xs mt-sm">
                      <span className="text-label-sm text-outline uppercase tracking-wider font-label font-semibold">
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
                    className={`w-full flex items-center gap-md py-md px-lg mr-sm transition-all duration-200 group ${
                      isActive 
                        ? 'bg-primary/10 text-primary border-l-4 border-primary rounded-r-full font-semibold' 
                        : 'text-on-surface-variant border-l-4 border-transparent hover:bg-surface-container-low hover:text-primary rounded-r-full'
                    }`}
                  >
                    <span className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}>
                      <item.icon size={20} />
                    </span>
                    <span className="text-label-md font-label">{item.name}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-md border-t border-outline-variant/30">
              <button
                onClick={handleSignOut}
                className="w-full text-on-surface-variant py-sm px-md flex items-center gap-md hover:bg-error-container hover:text-error transition-colors rounded-lg"
              >
                <LogOut size={20} />
                <span className="text-label-md font-label">Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* More Menu Modal */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-md md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMoreMenu(false)}
          />
          <div
            className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] overflow-hidden animate-scaleIn"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-lg py-md border-b border-outline-variant/30 bg-surface-container-low">
              <h3 className="text-title-md font-title font-semibold text-on-surface">Menu Lengkap</h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-full hover:bg-surface-container-high transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-60px)] p-sm">
              <div className="grid grid-cols-2 gap-sm">
                {additionalMenuItems.map((item, index) => {
                  if (item.type === 'divider') {
                    return (
                      <div key={index} className="col-span-2 px-sm pt-md pb-xs">
                        <span className="text-label-sm text-outline uppercase tracking-wider font-label font-semibold">
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
                      className={`flex flex-col items-center justify-center gap-sm p-md rounded-xl border transition-all duration-200 min-h-[80px] ${
                        isActive
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-surface border-outline-variant/30 text-on-surface-variant hover:border-primary/30 hover:bg-surface-container-low'
                      }`}
                    >
                      <item.icon size={24} />
                      <span className="text-label-sm font-label text-center leading-tight">{item.name}</span>
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

  if (!role || !allMenuItems) {
    return null;
  }

  return (
    <>
      {renderDesktopSidebar()}
      {renderMobileBottomNav()}
    </>
  );
};

export default Sidebar;
