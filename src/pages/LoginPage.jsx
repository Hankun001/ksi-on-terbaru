import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = ({ setCurrentPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();

  // Reset error when inputs change
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

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter');
      return;
    }

    setLoading(true);

    try {
      await signIn(email, password);
      // Sign in successful - AuthContext will handle redirect
    } catch (err) {
      // Handle specific Supabase error codes
      switch (err.message) {
        case 'Invalid login credentials':
          setError('Email atau kata sandi salah');
          break;
        case 'Email not confirmed':
          setError('Email belum diverifikasi. Silakan cek inbox email Anda');
          break;
        case 'User not found':
          setError('Pengguna dengan email ini tidak ditemukan');
          break;
        case 'Invalid password':
          setError('Kata sandi salah');
          break;
        default:
          setError('Gagal masuk: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <div className="auth-logo">
          <img src="/logo.png" alt="KSI-ON Logo" className="auth-logo-img" />
        </div>
        <h2>Masuk ke KSI-ON</h2>
        <p className="auth-subtitle">Silakan masuk dengan akun Anda</p>
        
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh@email.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Kata Sandi</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                disabled={loading}
                autoComplete="current-password"
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
              'Masuk'
            )}
          </button>
        </form>
        
        <div className="auth-links">
          <button
            type="button"
            onClick={() => setCurrentPage('forgot-password')}
            className="link-button"
            disabled={loading}
          >
            Lupa kata sandi?
          </button>
        </div>

        {/* Registration Info Message */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#fef3c7',
          borderRadius: '8px',
          border: '1px solid #fcd34d'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#92400e', textAlign: 'center' }}>
            <strong>📝 Belum punya akun?</strong>
            <br />
            Silakan hubungi Admin KSI untuk membuat akun Anda.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
