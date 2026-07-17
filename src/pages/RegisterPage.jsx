import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = ({ setCurrentPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  // Reset error when inputs change
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
    if (password.length < minLength) {
      errors.push('minimal 8 karakter');
    }
    if (!hasUpperCase) {
      errors.push('huruf besar');
    }
    if (!hasLowerCase) {
      errors.push('huruf kecil');
    }
    if (!hasNumbers) {
      errors.push('angka');
    }
    if (!hasSpecialChar) {
      errors.push('karakter khusus (!@#$%^&*)');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validasi input
    if (!email.trim()) {
      setError('Email wajib diisi');
      return;
    }

    if (!validateEmail(email)) {
      setError('Format email tidak valid');
      return;
    }

    if (!password) {
      setError('Kata sandi wajib diisi');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError('Kata sandi harus mengandung: ' + passwordValidation.errors.join(', '));
      return;
    }

    if (!confirmPassword) {
      setError('Konfirmasi kata sandi wajib diisi');
      return;
    }

    if (password !== confirmPassword) {
      setError('Kata sandi tidak cocok');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      setSuccess(true);
    } catch (err) {
      // Handle specific Supabase error codes
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
      <div className="auth-container">
        <div className="auth-form auth-form-success">
          <div className="success-icon">✅</div>
          <h2>Pendaftaran Berhasil!</h2>
          <p>Silakan cek email <strong>{email}</strong> untuk verifikasi akun.</p>
          <p className="success-note">Jika email tidak muncul, cek folder spam.</p>
          <button
            onClick={() => setCurrentPage('login')}
            className="btn btn-primary btn-full"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <div className="auth-logo">
          <img src="/logo.png" alt="KSI-ON Logo" className="auth-logo-img" />
        </div>
        <h2>Daftar ke KSI-ON</h2>
        <p className="auth-subtitle">Buat akun baru untuk memulai</p>
        
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh@email.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="reg-password">Kata Sandi</label>
            <div className="password-input-wrapper">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <small className="password-requirement">
              Kata sandi harus mengandung huruf besar, kecil, angka, dan karakter khusus
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Konfirmasi Kata Sandi</label>
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi"
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full"
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Mendaftarkan...
              </>
            ) : (
              'Daftar'
            )}
          </button>
        </form>
        
        <div className="auth-links">
          <div className="auth-divider">
            <span>atau</span>
          </div>
          
          <p className="auth-switch">
            Sudah punya akun?{' '}
            <button
              type="button"
              onClick={() => setCurrentPage('login')}
              className="link-button link-button-bold"
              disabled={loading}
            >
              Masuk di sini
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
