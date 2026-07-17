import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Forgot Password Page Component
const ForgotPasswordPage = ({ setCurrentPage }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { resetPassword } = useAuth();

  // Reset messages when input changes
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

    // Validasi input
    if (!email.trim()) {
      setError('Email wajib diisi');
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError('Format email tidak valid');
      setLoading(false);
      return;
    }

    try {
      await resetPassword(email);
      setSuccess('Link reset kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk (atau folder spam).');
    } catch (err) {
      // Handle specific Supabase error codes
      switch (err.message) {
        case 'User not found':
        case 'No user found with this email':
          setError('Email tidak ditemukan dalam sistem');
          break;
        case 'Email rate limit exceeded':
          setError('Terlalu banyak percobaan. Silakan tunggu beberapa menit');
          break;
        default:
          setError('Gagal mengirim link reset: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Lupa Kata Sandi</h2>
        <p className="auth-subtitle">Masukkan email Anda untuk menerima link reset kata sandi</p>
        
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
        
        {success ? (
          <div className="success-message-container">
            <div className="success-icon">✅</div>
            <p>{success}</p>
            <button
              onClick={() => setCurrentPage('login')}
              className="btn btn-primary btn-full"
            >
              Kembali ke Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh@email.com"
                disabled={loading}
                autoComplete="email"
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
                  Mengirim...
                </>
              ) : (
                'Kirim Link Reset'
              )}
            </button>
          </form>
        )}
        
        <div className="auth-links">
          <button
            type="button"
            onClick={() => setCurrentPage('login')}
            className="link-button"
            disabled={loading}
          >
            ← Kembali ke login
          </button>
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

  // Reset messages when inputs change
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
      errors.push('karakter khusus');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(false);
    setError('');
    setSuccess('');

    // Validasi input
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
      await updatePassword(password);
      setSuccess('Kata sandi berhasil diperbarui! Anda akan dialihkan ke halaman login.');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        setCurrentPage('login');
      }, 2000);
    } catch (err) {
      // Handle specific Supabase error codes
      switch (err.message) {
        case 'New password should be different from the old password':
          setError('Kata sandi baru harus berbeda dari kata sandi lama');
          break;
        case 'Password should be at least 6 characters':
          setError('Kata sandi minimal 6 karakter');
          break;
        case 'Weak password':
          setError('Kata sandi terlalu lemah');
          break;
        default:
          setError('Gagal mengubah kata sandi: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Ubah Kata Sandi</h2>
        <p className="auth-subtitle">Masukkan kata sandi baru Anda</p>
        
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
        
        {success ? (
          <div className="success-message-container">
            <div className="success-icon">✅</div>
            <p>{success}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="reset-password">Kata Sandi Baru</label>
              <div className="password-input-wrapper">
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru"
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
              <label htmlFor="confirm-password">Konfirmasi Kata Sandi Baru</label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
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
                  Memproses...
                </>
              ) : (
                'Ubah Kata Sandi'
              )}
            </button>
          </form>
        )}
        
        <div className="auth-links">
          <button
            type="button"
            onClick={() => setCurrentPage('login')}
            className="link-button"
            disabled={loading}
          >
            ← Kembali ke login
          </button>
        </div>
      </div>
    </div>
  );
};

export { ForgotPasswordPage, ResetPasswordPage };
