import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Eye, EyeOff, AlertCircle, ArrowRight, BookOpen, Users, BarChart3, Shield } from 'lucide-react';

const LoginPage = ({ setCurrentPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();

  useEffect(() => {
    if (error) setError('');
  }, [email, password]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Email wajib diisi'); return; }
    if (!validateEmail(email)) { setError('Format email tidak valid'); return; }
    if (!password) { setError('Kata sandi wajib diisi'); return; }
    if (password.length < 6) { setError('Kata sandi minimal 6 karakter'); return; }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      switch (err.message) {
        case 'Invalid login credentials': setError('Email atau kata sandi salah'); break;
        case 'Email not confirmed': setError('Email belum diverifikasi. Silakan cek inbox email Anda'); break;
        case 'User not found': setError('Pengguna dengan email ini tidak ditemukan'); break;
        case 'Invalid password': setError('Kata sandi salah'); break;
        default: setError('Gagal masuk: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-surface-container-low to-surface-container">
      {/* Left Side - Branding / Welcome */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary-container to-primary-fixed-dim items-center justify-center p-xl">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-secondary-container/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        
        <div className="relative z-10 text-center max-w-lg">
          <div className="w-24 h-24 mx-auto mb-xl rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shadow-lg p-3">
            <img src="/logo.png" alt="KSI-ON" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-display-lg font-display font-bold text-white mb-md leading-tight">
            KSI-ON LMS
          </h1>
          <p className="text-headline-md font-display text-primary-fixed/90 mb-xl">
            Academic Excellence
          </p>
          <p className="text-body-lg font-body text-white/80 max-w-sm mx-auto leading-relaxed">
            Sistem Manajemen Pembelajaran terintegrasi untuk mendukung perjalanan akademik Anda.
          </p>
          <div className="grid grid-cols-2 gap-md mt-xl">
            <div className="flex items-center gap-sm bg-white/10 rounded-xl p-md text-left">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <BookOpen size={20} className="text-white" />
              </div>
              <div>
                <p className="text-label-sm font-label text-white/90 font-semibold">Materi Digital</p>
                <p className="text-[11px] text-white/60">Akses 24/7</p>
              </div>
            </div>
            <div className="flex items-center gap-sm bg-white/10 rounded-xl p-md text-left">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <BarChart3 size={20} className="text-white" />
              </div>
              <div>
                <p className="text-label-sm font-label text-white/90 font-semibold">Lacak Progres</p>
                <p className="text-[11px] text-white/60">Nilai & Laporan</p>
              </div>
            </div>
            <div className="flex items-center gap-sm bg-white/10 rounded-xl p-md text-left">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <p className="text-label-sm font-label text-white/90 font-semibold">Multi Peran</p>
                <p className="text-[11px] text-white/60">Murid, Guru, Admin</p>
              </div>
            </div>
            <div className="flex items-center gap-sm bg-white/10 rounded-xl p-md text-left">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <p className="text-label-sm font-label text-white/90 font-semibold">Terintegrasi</p>
                <p className="text-[11px] text-white/60">PKBM & LMS</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-margin-mobile md:p-margin-desktop">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-sm mb-xl">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center p-1.5">
              <img src="/logo.png" alt="KSI-ON" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-headline-md font-display font-extrabold text-primary">KSI-ON LMS</h1>
              <p className="text-label-sm font-label text-on-surface-variant">Academic Excellence</p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-surface rounded-2xl p-xl border border-outline-variant/30 shadow-[0px_10px_40px_rgba(0,0,0,0.08)]">
            <div className="text-center mb-lg">
              <h2 className="text-headline-md font-display font-semibold text-on-surface mb-xs">
                Selamat Datang
              </h2>
              <p className="text-body-sm font-body text-on-surface-variant">
                Silakan masuk dengan akun Anda
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-sm p-sm mb-md rounded-xl bg-error-container border border-error/20">
                <AlertCircle size={18} className="text-error shrink-0" />
                <p className="text-body-sm font-body text-on-error-container">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-md">
              {/* Email Field */}
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-label-sm font-label text-on-surface-variant">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh@email.com"
                  disabled={loading}
                  autoComplete="email"
                  className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface-container-low text-body-md font-body text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                />
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1">
                <label htmlFor="password" className="text-label-sm font-label text-on-surface-variant">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    disabled={loading}
                    autoComplete="current-password"
                    className="w-full px-md py-sm pr-xl rounded-xl border border-outline-variant bg-surface-container-low text-body-md font-body text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-sm py-sm px-md rounded-xl bg-primary text-on-primary font-label-md font-label hover:bg-primary-container hover:text-on-primary-container transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0px_4px_14px_rgba(53,37,205,0.3)] hover:shadow-[0px_6px_20px_rgba(53,37,205,0.4)]"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Masuk</span>
                  </>
                )}
              </button>
            </form>

            {/* Forgot Password */}
            <div className="mt-md text-center">
              <button
                type="button"
                onClick={() => setCurrentPage('forgot-password')}
                disabled={loading}
                className="text-label-md font-label text-primary hover:text-primary-container transition-colors"
              >
                Lupa kata sandi?
              </button>
            </div>

            {/* Registration Info */}
            <div className="mt-lg p-md rounded-xl bg-warning-light/50 border border-warning/20 text-center">
              <p className="text-body-sm font-body text-on-surface-variant">
                <strong className="text-warning">📝 Belum punya akun?</strong>
                <br />
                Silakan hubungi Admin KSI untuk membuat akun Anda.
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-body-sm font-body text-outline mt-lg">
            &copy; {new Date().getFullYear()} KSI-ON LMS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
