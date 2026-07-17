  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Kata sandi tidak cocok');
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password);
      alert('Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Daftar ke KSI-ON</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-email">Email:</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="reg-password">Kata Sandi:</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Konfirmasi Kata Sandi:</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>
        <p>
          Sudah punya akun?{' '}
          <button
            type="button"
            onClick={() => setCurrentPage('login')}
            className="link-button"
          >
            Masuk di sini
          </button>
        </p>
      </div>
    </div>
  );
};

// Helper function to get role name in Indonesian
const getRoleName = (role) => {
  switch (role) {
    case 'murid':
      return 'Murid';
    case 'guru':
      return 'Guru';
    case 'admin':
      return 'Admin';
    default:
      return 'Pengguna';
  }
};

export default App;
