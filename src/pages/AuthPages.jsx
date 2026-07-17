import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, GraduationCap, Send } from 'lucide-react';

// Forgot Password Page Component
const ForgotPasswordPage = ({ setCurrentPage }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const { resetPassword } = useAuth();

  useEffect(() => {
    if (error) setError('');
  }, [email]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!email.trim()) { setError('Email wajib diisi'); setLoading(false); return; }
    if (!validateEmail(email)) { setError('Format email tidak valid'); setLoading(false); return; }

    try {
      await resetPassword(email);
      setSuccess('Link reset kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk (atau folder spam).');
    } catch (err) {
      switch (err.message) {
        case 'User not found':
        case 'No user found with this email':
          setError('Email tidak ditemukan dalam sistem'); break;
        case 'Email rate limit exceeded':
          setError('Terlalu banyak percobaan. Silakan tunggu beberapa menit'); break;
        default: setError('Gagal mengirim link reset: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface-container-low to-surface-container p-margin-mobile md:p-margin-desktop">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-sm mb-lg">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <GraduationCap size={22} className="text-primary" />
          </div>
          <span className="text-headline-md font-display font-extrabold text-primary">KSI-ON LMS</span>
        </div>

        <div className="bg-surface rounded-2xl p-xl border border-outline-variant/30 shadow-[0px_10px_40px_rgba(0,0,0,0.08)]">
          {success ? (
            <div className="flex flex-col items-center text-center gap-md">
              <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center">
                <CheckCircle size={36} className="text-success" />
              </div>
              <h2 className="text-headline-md font-display font-semibold text-on-surface">Link Terkirim!</h2>
              <p className="text-body-sm font-body text-on-surface-variant">{success}</p>
              <button
                onClick={() => setCurrentPage('login')}
                className="w-full flex items-center justify-center gap-sm py-sm px-md rounded-xl bg-primary text-on-primary font-label-md font-label hover:bg-primary-container hover:text-on-primary-container transition-all duration-200"
              >
                <ArrowLeft size={18} />
                Kembali ke Login
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-lg">
                <div className="w-12 h-12 mx-auto mb-md rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock size={24} className="text-primary" />
                </div>
                <h2 className="text-headline-md font-display font-semibold text-on-surface mb-xs">Lupa Kata Sandi</h2>
                <p className="text-body-sm font-body text-on-surface-variant">
                  Masukkan email Anda untuk menerima link reset kata sandi
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-sm p-sm mb-md rounded-xl bg-error-container border border-error/20">
                  <AlertCircle size={18} className="text-error shrink-0" />
                  <p className="text-body-sm font-body text-on-error-container">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-md">
                <div className="flex flex-col gap-1">
                  <label htmlFor="forgot-email" className="text-label-sm font-label text-on-surface-variant">Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                    <input
                      id="forgot-email"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-sm py-sm px-md rounded-xl bg-primary text-on-primary font-label-md font-label hover:bg-primary-container hover:text-on-primary-container transition-all duration-200 disabled:opacity-60 shadow-[0px_4px_14px_rgba(53,37,205,0.3)]"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Mengirim...</span></>
                  ) : (
                    <><Send size={18} /><span>Kirim Link Reset</span></>
                  )}
                </button>
              </form>

              <div className="mt-md text-center">
                <button
                  type="button"
                  onClick={() => setCurrentPage('login')}
                  disabled={loading}
                  className="flex items-center justify-center gap-1 text-label-md font-label text-primary hover:text-primary-container transition-colors mx-auto"
                >
                  <ArrowLeft size={16} /> Kembali ke login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Reset Password Page Component
const ResetPasswordPage = ({ setCurrentPage }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { updatePassword } = useAuth();

  useEffect(() => {
    if (error) setError('');
  }, [password, confirmPassword]);

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
    if (!hasSpecialChar) errors.push('karakter khusus');

    return { isValid: errors.length === 0, errors };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
      await updatePassword(password);
      setSuccess('Kata sandi berhasil diperbarui!');
      setTimeout(() => setCurrentPage('login'), 2000);
    } catch (err) {
      switch (err.message) {
        case 'New password should be different from the old password':
          setError('Kata sandi baru harus berbeda dari kata sandi lama'); break;
        case 'Password should be at least 6 characters':
          setError('Kata sandi minimal 6 karakter'); break;
        case 'Weak password': setError('Kata sandi terlalu lemah'); break;
        default: setError('Gagal mengubah kata sandi: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface-container-low to-surface-container p-margin-mobile md:p-margin-desktop">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-sm mb-lg">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <GraduationCap size={22} className="text-primary" />
          </div>
          <span className="text-headline-md font-display font-extrabold text-primary">KSI-ON LMS</span>
        </div>

        <div className="bg-surface rounded-2xl p-xl border border-outline-variant/30 shadow-[0px_10px_40px_rgba(0,0,0,0.08)]">
          {success ? (
            <div className="flex flex-col items-center text-center gap-md">
              <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center">
                <CheckCircle size={36} className="text-success" />
              </div>
              <h2 className="text-headline-md font-display font-semibold text-on-surface">Berhasil!</h2>
              <p className="text-body-sm font-body text-on-surface-variant">{success}</p>
              <p className="text-body-sm font-body text-outline">Mengalihkan ke halaman login...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-lg">
                <div className="w-12 h-12 mx-auto mb-md rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock size={24} className="text-primary" />
                </div>
                <h2 className="text-headline-md font-display font-semibold text-on-surface mb-xs">Ubah Kata Sandi</h2>
                <p className="text-body-sm font-body text-on-surface-variant">Masukkan kata sandi baru Anda</p>
              </div>

              {error && (
                <div className="flex items-center gap-sm p-sm mb-md rounded-xl bg-error-container border border-error/20">
                  <AlertCircle size={18} className="text-error shrink-0" />
                  <p className="text-body-sm font-body text-on-error-container">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-md">
                <div className="flex flex-col gap-1">
                  <label htmlFor="reset-password" className="text-label-sm font-label text-on-surface-variant">Kata Sandi Baru</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                    <input
                      id="reset-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi baru"
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
                  <p className="text-label-sm text-outline mt-1">Min. 8 karakter dengan huruf besar, kecil, angka, dan simbol</p>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="confirm-password" className="text-label-sm font-label text-on-surface-variant">Konfirmasi Kata Sandi</label>
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    disabled={loading}
                    autoComplete="new-password"
                    className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface-container-low text-body-md font-body text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-sm py-sm px-md rounded-xl bg-primary text-on-primary font-label-md font-label hover:bg-primary-container hover:text-on-primary-container transition-all duration-200 disabled:opacity-60 shadow-[0px_4px_14px_rgba(53,37,205,0.3)]"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Memproses...</span></>
                  ) : (
                    <><Lock size={18} /><span>Ubah Kata Sandi</span></>
                  )}
                </button>
              </form>

              <div className="mt-md text-center">
                <button
                  type="button"
                  onClick={() => setCurrentPage('login')}
                  disabled={loading}
                  className="flex items-center justify-center gap-1 text-label-md font-label text-primary hover:text-primary-container transition-colors mx-auto"
                >
                  <ArrowLeft size={16} /> Kembali ke login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export { ForgotPasswordPage, ResetPasswordPage };
