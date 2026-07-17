import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const ProfileModule = ({ onRefresh }) => {
  const { user, profile, updateProfile, updatePassword } = useAuth();
  const isMurid = profile?.role === 'murid';
  const [formData, setFormData] = useState({
    full_name: '',
    display_name: '',
    bio: '',
    avatar_url: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  // Get display name - prefer display_name, then full_name, then email username
  const getDisplayName = () => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.full_name) return profile.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Pengguna';
  };

  // Handle profile form changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setMessage('');
    setError('');
  };

  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setMessage('');
    setError('');
  };

  // Upload avatar to Supabase Storage
  const uploadAvatar = async (file) => {
    try {
      setUploadingAvatar(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      return data.publicUrl;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      throw err;
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle file selection
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran file maksimal 2MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar');
      return;
    }

    try {
      const avatarUrl = await uploadAvatar(file);
      setFormData(prev => ({ ...prev, avatar_url: avatarUrl }));
      setMessage('Avatar berhasil diupload! Klik Simpan untuk menerapkan.');
    } catch (err) {
      setError('Gagal mengupload avatar: ' + err.message);
    }
  };

  // Remove avatar
  const handleRemoveAvatar = () => {
    setFormData(prev => ({ ...prev, avatar_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setMessage('Avatar dihapus. Klik Simpan untuk menerapkan.');
  };

  // Save profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim() && !formData.display_name.trim()) {
      setError('Nama lengkap atau nama tampilan tidak boleh kosong');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');

      await updateProfile({
        full_name: formData.full_name.trim(),
        display_name: formData.display_name.trim(),
        bio: formData.bio.trim(),
        avatar_url: formData.avatar_url
      });

      setMessage('Profil berhasil diperbarui!');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error updating profile:', err);
      if (err.message.includes('display_name') || err.message.includes('full_name')) {
        setError('Kolom display_name/full_name belum ada di tabel. Silakan jalankan migration SQL.');
      } else {
        setError('Gagal memperbarui profil: ' + err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword) {
      setError('Kata sandi saat ini diperlukan');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Kata sandi baru minimal 8 karakter');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok');
      return;
    }

    try {
      setChangingPassword(true);
      setError('');
      setMessage('');

      // Note: Supabase doesn't support current password verification via client
      // This is a limitation - we'll just update the password directly
      await updatePassword(passwordData.newPassword);
      
      setMessage('Kata sandi berhasil diubah!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Error changing password:', err);
      setError('Gagal mengubah kata sandi: ' + err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="dashboard-content">
      {/* Welcome / Profile Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        borderRadius: '16px',
        padding: '2rem',
        color: 'white',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          {formData.avatar_url ? (
            <img 
              src={formData.avatar_url} 
              alt="Avatar"
              style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                objectFit: 'cover',
                border: '4px solid rgba(255,255,255,0.3)'
              }}
            />
          ) : (
            <div style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '50%', 
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              border: '4px solid rgba(255,255,255,0.3)'
            }}>
              👤
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#10b981',
              border: '2px solid white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            📷
          </button>
        </div>
        
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>👤 {getDisplayName()}</h2>
          <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>{user?.email}</p>
          <p style={{ margin: '0.25rem 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>
            {profile?.role === 'murid' ? '🎓 Murid' : profile?.role === 'guru' ? '👨‍🏫 Guru' : '⚙️ Admin'}
          </p>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="success-message" style={{ 
          background: '#dcfce7', 
          color: '#166534', 
          padding: '1rem', 
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          {message}
        </div>
      )}
      
      {error && (
        <div className="error-message" style={{ 
          background: '#fee2e2', 
          color: '#dc2626', 
          padding: '1rem', 
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1.5rem',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '0.5rem'
      }}>
        <button
          onClick={() => { setActiveTab('profile'); setMessage(''); setError(''); }}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: activeTab === 'profile' ? '#8b5cf6' : 'transparent',
            color: activeTab === 'profile' ? 'white' : '#6b7280',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
        >
          📝 Edit Profil
        </button>
        {!isMurid && (
          <button
            onClick={() => { setActiveTab('password'); setMessage(''); setError(''); }}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'password' ? '#8b5cf6' : 'transparent',
              color: activeTab === 'password' ? 'white' : '#6b7280',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            🔒 Ubah Kata Sandi
          </button>
        )}
        <button
          onClick={() => { setActiveTab('info'); setMessage(''); setError(''); }}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: activeTab === 'info' ? '#8b5cf6' : 'transparent',
            color: activeTab === 'info' ? 'white' : '#6b7280',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
        >
          ℹ️ Info Akun
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <section className="dashboard-section">
          <h2>📝 Edit Profil</h2>
          
          <form onSubmit={handleSaveProfile} style={{ maxWidth: '600px' }}>
            {/* Avatar Upload Info */}
            {formData.avatar_url && (
              <div style={{ 
                marginBottom: '1.5rem',
                padding: '1rem',
                background: '#f0fdf4',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <img 
                  src={formData.avatar_url} 
                  alt="Avatar preview"
                  style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '50%', 
                    objectFit: 'cover' 
                  }}
                />
                <div>
                  <p style={{ margin: 0, fontWeight: '500' }}>Avatar baru dipilih</p>
                  <button 
                    type="button"
                    onClick={handleRemoveAvatar}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      padding: 0,
                      marginTop: '0.25rem'
                    }}
                  >
                    Hapus avatar
                  </button>
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Email
              </label>
              <input 
                type="email" 
                value={user?.email || ''} 
                disabled
                style={{ 
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280'
                }}
              />
              <small style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                Email tidak dapat diubah
              </small>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Nama Lengkap *
              </label>
              <input 
                type="text" 
                name="full_name"
                value={formData.full_name} 
                onChange={handleInputChange}
                placeholder="Masukkan nama lengkap Anda"
                style={{ 
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem'
                }}
              />
              <small style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                Nama lengkap Anda (akan ditampilkan sebagai nama akun)
              </small>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Nama Tampilan
              </label>
              <input 
                type="text" 
                name="display_name"
                value={formData.display_name} 
                onChange={handleInputChange}
                placeholder="Masukkan nama tampilan"
                style={{ 
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem'
                }}
              />
              <small style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                Nama alternatif yang akan ditampilkan (opsional)
              </small>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Bio / Deskripsi Diri
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Ceritakan tentang diri Anda..."
                rows="4"
                style={{ 
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
              <small style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                Tentang Anda (akan terlihat oleh pengguna lain)
              </small>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving || uploadingAvatar}
              style={{ minWidth: '180px' }}
            >
              {saving ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
            </button>
          </form>
        </section>
      )}

      {activeTab === 'password' && (
        <section className="dashboard-section">
          <h2>🔒 Ubah Kata Sandi</h2>
          
          <form onSubmit={handleChangePassword} style={{ maxWidth: '500px' }}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Kata Sandi Baru *
              </label>
              <input 
                type="password" 
                name="newPassword"
                value={passwordData.newPassword} 
                onChange={handlePasswordChange}
                placeholder="Masukkan kata sandi baru (min. 8 karakter)"
                minLength={8}
                style={{ 
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem'
                }}
              />
              <small style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                Minimal 8 karakter
              </small>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Konfirmasi Kata Sandi *
              </label>
              <input 
                type="password" 
                name="confirmPassword"
                value={passwordData.confirmPassword} 
                onChange={handlePasswordChange}
                placeholder="Konfirmasi kata sandi baru"
                style={{ 
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem'
                }}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={changingPassword}
              style={{ minWidth: '180px' }}
            >
              {changingPassword ? '⏳ Mengubah...' : '🔒 Ubah Kata Sandi'}
            </button>

            <p style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              background: '#fef3c7', 
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: '#92400e'
            }}>
              💡 <strong>Tips Keamanan:</strong> Gunakan kata sandi yang kuat dengan kombinasi huruf besar, huruf kecil, angka, dan simbol.
            </p>
          </form>
        </section>
      )}

      {activeTab === 'info' && (
        <section className="dashboard-section">
          <h2>ℹ️ Informasi Akun</h2>
          
          <div style={{ 
            background: '#f9fafb', 
            padding: '1.5rem', 
            borderRadius: '12px',
            maxWidth: '600px'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Role:</strong> {
                profile?.role === 'murid' ? ' 🎓 Murid' : 
                profile?.role === 'guru' ? ' 👨‍🏫 Guru' : 
                profile?.role === 'admin' ? ' ⚙️ Admin' : 'Tidak diketahui'
              }
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Status:</strong> ✅ Aktif
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Email:</strong> {user?.email}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>ID Akun:</strong> <code style={{ fontSize: '0.85rem', background: '#e5e7eb', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{user?.id}</code>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Bergabung:</strong> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'Tidak diketahui'}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProfileModule;
