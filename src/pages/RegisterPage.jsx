import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft, Mail, Lock } from 'lucide-react';

const RegisterPage = ({ setCurrentPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  useEffect(() => {
    if (error) setError('');
  }, [email, password, confirmPassword]);

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
    if (password.length < minLength) errors.push('minimal 8 karakter');
    if (!hasUpperCase) errors.push('huruf besar');
    if (!hasLowerCase) errors.push('huruf kecil');
    if (!hasNumbers) errors.push('angka');
    if (!hasSpecialChar) errors.push('karakter khusus (!@#$%^&*)');

    return { isValid: errors.length === 0, errors };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email.trim()) { setError('Email wajib diisi'); return; }
    if (!validateEmail(email)) { setError('Format email tidak valid'); return; }
    if (!password) { setError('Kata sandi wajib diisi'); return; }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError('Kata sandi harus mengandung: ' + passwordValidation.errors.join(', '));
      return;
    }

    if (!confirmPassword) { setError('Konfirmasi kata sandi wajib diisi'); return; }
    if (password !== confirmPassword) { setError('Kata sandi tidak cocok'); return; }

    setLoading(true);
    try {
      await signUp(email, password);
      setSuccess(true);
    } catch (err) {
      switch (err.message) {
        case 'User already registered':
          setError('Email sudah terdaftar. Silakan masuk atau gunakan email lain');
          break;
        case 'Password should be at least 6 characters':
          setError('Kata sandi minimal 6 karakter');
          break;
        case 'Invalid email':
          setError('Format email tidak valid');
          break;
        default:
          setError('Gagal mendaftar: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface-container-low to-surface-container p-margin-mobile md:p-margin-desktop">
        <div className="w-full max-w-md">            <div className="flex items-center justify-center gap-sm mb-lg">
            <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center p-1.5">
              <img src="/logo.png" alt="KSI-ON" className="w-full h-full object-contain" />
            </div>
            <span className="text-headline-md font-display font-extrabold text-primary">KSI-ON LMS</span>
          </div>

          <div className="bg-surface rounded-2xl p-xl border border-outline-variant/30 shadow-[0px_10px_40px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col items-center text-center gap-md">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle size={36} className="text-success" />
              </div>
              <h2 className="text-headline-md font-display font-semibold text-on-surface">Pendaftaran Berhasil!</h2>
              <p className="text-body-sm font-body text-on-surface-variant">
                Silakan cek email <strong className="text-primary">{email}</strong> untuk verifikasi akun.
              </p>
              <p className="text-label-sm font-label text-outline">Jika email tidak muncul, cek folder spam.</p>
              <button
                onClick={() => setCurrentPage('login')}
                className="w-full flex items-center justify-center gap-sm py-sm px-md rounded-xl bg-primary text-on-primary font-label-md font-label hover:bg-primary-container hover:text-on-primary-container transition-all duration-200"
              >
                <ArrowLeft size={18} />
                Kembali ke Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-surface-container-low to-surface-container">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary-container to-primary-fixed-dim items-center justify-center p-xl">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-secondary-container/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

        <div className="relative z-10 text-center max-w-lg">
          <div className="w-20 h-20 mx-auto mb-xl rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shadow-lg p-3">
            <img src="/logo.png" alt="KSI-ON" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-display-lg font-display font-bold text-white mb-md leading-tight">
            KSI-ON LMS
          </h1>
          <p className="text-headline-md font-display text-primary-fixed/90 mb-xl">
            Academic Excellence
          </p>
          <p className="text-body-lg font-body text-white/80 max-w-sm mx-auto leading-relaxed">
            Bergabunglah dengan platform pembelajaran terintegrasi untuk mendukung perjalanan akademik Anda.
          </p>
          <div className="flex justify-center gap-xl mt-xl">
            <div className="text-center">
              <p className="text-headline-md font-display font-bold text-white">6+</p>
              <p className="text-label-sm font-label text-white/70">Kursus</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <p className="text-headline-md font-display font-bold text-white">40+</p>
              <p className="text-label-sm font-label text-white/70">Pengguna</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <p className="text-headline-md font-display font-bold text-white">100%</p>
              <p className="text-label-sm font-label text-white/70">Terintegrasi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
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
                Daftar Akun Baru
              </h2>
              <p className="text-body-sm font-body text-on-surface-variant">
                Buat akun untuk memulai pembelajaran
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
                <label htmlFor="reg-email" className="text-label-sm font-label text-on-surface-variant">
                  Email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contoh@email.com"
                    disabled={loading}
                    autoComplete="email"
                    className="w-full pl-xl pr-md py-sm rounded-xl border border-outline-variant bg-surface-container-low text-body-md font-body text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1">
                <label htmlFor="reg-password" className="text-label-sm font-label text-on-surface-variant">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    disabled={loading}
                    autoComplete="new-password"
                    className="w-full pl-xl pr-xl py-sm rounded-xl border border-outline-variant bg-surface-container-low text-body-md font-body text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
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
                <p className="text-label-sm text-outline mt-1">
                  Min. 8 karakter dengan huruf besar, kecil, angka, dan simbol
                </p>
              </div>

              {/* Confirm Password Field */}
              <div className="flex flex-col gap-1">
                <label htmlFor="confirm-password" className="text-label-sm font-label text-on-surface-variant">
                  Konfirmasi Kata Sandi
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi"
                    disabled={loading}
                    autoComplete="new-password"
                    className="w-full pl-xl pr-md py-sm rounded-xl border border-outline-variant bg-surface-container-low text-body-md font-body text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                  />
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
                    <span>Mendaftarkan...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    <span>Daftar</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-sm my-lg">
              <div className="flex-1 h-px bg-outline-variant/40" />
              <span className="text-label-sm font-label text-outline">atau</span>
              <div className="flex-1 h-px bg-outline-variant/40" />
            </div>

            {/* Switch to Login */}
            <div className="text-center">
              <p className="text-body-sm font-body text-on-surface-variant">
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={() => setCurrentPage('login')}
                  disabled={loading}
                  className="text-label-md font-label text-primary hover:text-primary-container transition-colors font-medium"
                >
                  Masuk di sini
                </button>
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

export default RegisterPage;
