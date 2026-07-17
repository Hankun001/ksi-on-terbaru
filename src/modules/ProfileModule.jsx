import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle, AlertCircle } from 'lucide-react';

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
    <div className="p-margin-mobile md:p-margin-desktop max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-primary to-primary-container rounded-2xl p-4 md:p-6 text-white shadow-md mb-xl flex flex-col sm:flex-row items-center gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          {formData.avatar_url ? (
            <img src={formData.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white/30" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl border-4 border-white/30">👤</div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-success border-2 border-white flex items-center justify-center hover:bg-success/90 transition-colors text-sm"
          >📷</button>
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-title-lg font-bold m-0">👤 {getDisplayName()}</h2>
          <p className="text-body-md text-white/90 mt-1 m-0">{user?.email}</p>
          <p className="text-body-sm text-white/70 mt-0.5 m-0">
            {profile?.role === 'murid' ? '🎓 Murid' : profile?.role === 'guru' ? '👨‍🏫 Guru' : '⚙️ Admin'}
          </p>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="flex items-center gap-2 text-body-sm text-on-success-container bg-success-container/50 px-4 py-3 rounded-xl mb-md">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {message}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-body-sm text-on-error-container bg-error-container/50 px-4 py-3 rounded-xl mb-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-xl border-b border-outline-variant pb-0.5 overflow-x-auto">
        {[
          { id: 'profile', label: '📝 Edit Profil' },
          ...(!isMurid ? [{ id: 'password', label: '🔒 Ubah Kata Sandi' }] : []),
          { id: 'info', label: 'ℹ️ Info Akun' }
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMessage(''); setError(''); }}
            className={"px-4 py-2.5 rounded-t-xl text-label-lg font-medium transition-all border-b-2 -mb-px " +
              (activeTab === tab.id
                ? 'border-primary text-primary bg-primary-container/20'
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-dim/50')}
          >{tab.label}</button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-surface rounded-2xl border border-outline-variant p-4 md:p-6 shadow-sm">
          <h2 className="text-title-md font-semibold text-on-surface mb-md">📝 Edit Profil</h2>
          <form onSubmit={handleSaveProfile} className="max-w-xl space-y-5">
            {formData.avatar_url && (
              <div className="flex items-center gap-4 bg-success-container/20 p-4 rounded-xl">
                <img src={formData.avatar_url} alt="Preview" className="w-14 h-14 rounded-full object-cover" />
                <div>
                  <p className="text-body-sm font-medium text-on-surface m-0">Avatar baru dipilih</p>
                  <button type="button" onClick={handleRemoveAvatar} className="text-label-sm text-error hover:text-error/80 mt-0.5 bg-transparent border-none cursor-pointer p-0">Hapus avatar</button>
                </div>
              </div>
            )}
            <div>
              <label className="block text-label-lg font-medium text-on-surface mb-1.5">Email</label>
              <input type="email" value={user?.email || ''} disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface-dim/50 text-on-surface-variant text-body-md cursor-not-allowed" />
              <p className="text-label-xs text-on-surface-variant mt-1">Email tidak dapat diubah</p>
            </div>
            <div>
              <label className="block text-label-lg font-medium text-on-surface mb-1.5">Nama Lengkap <span className="text-error">*</span></label>
              <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange}
                placeholder="Masukkan nama lengkap Anda"
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md" />
            </div>
            <div>
              <label className="block text-label-lg font-medium text-on-surface mb-1.5">Nama Tampilan</label>
              <input type="text" name="display_name" value={formData.display_name} onChange={handleInputChange}
                placeholder="Masukkan nama tampilan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md" />
            </div>
            <div>
              <label className="block text-label-lg font-medium text-on-surface mb-1.5">Bio / Deskripsi Diri</label>
              <textarea name="bio" value={formData.bio} onChange={handleInputChange}
                placeholder="Ceritakan tentang diri Anda..." rows={4}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md resize-none" />
            </div>
            <button type="submit" disabled={saving || uploadingAvatar}
              className="inline-flex items-center gap-xs px-5 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all duration-200 shadow-sm text-label-lg font-medium disabled:opacity-50">
              {saving ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
            </button>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="bg-surface rounded-2xl border border-outline-variant p-4 md:p-6 shadow-sm">
          <h2 className="text-title-md font-semibold text-on-surface mb-md">🔒 Ubah Kata Sandi</h2>
          <form onSubmit={handleChangePassword} className="max-w-md space-y-5">
            <div>
              <label className="block text-label-lg font-medium text-on-surface mb-1.5">Kata Sandi Baru <span className="text-error">*</span></label>
              <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange}
                placeholder="Min. 8 karakter" minLength={8}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md" />
            </div>
            <div>
              <label className="block text-label-lg font-medium text-on-surface mb-1.5">Konfirmasi Kata Sandi <span className="text-error">*</span></label>
              <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange}
                placeholder="Konfirmasi kata sandi baru"
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md" />
            </div>
            <button type="submit" disabled={changingPassword}
              className="inline-flex items-center gap-xs px-5 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all duration-200 shadow-sm text-label-lg font-medium disabled:opacity-50">
              {changingPassword ? '⏳ Mengubah...' : '🔒 Ubah Kata Sandi'}
            </button>
            <div className="bg-warning-container/30 p-4 rounded-xl text-body-sm text-on-warning-container">
              💡 <strong>Tips Keamanan:</strong> Gunakan kata sandi yang kuat dengan kombinasi huruf besar, huruf kecil, angka, dan simbol.
            </div>
          </form>
        </div>
      )}

      {/* Info Tab */}
      {activeTab === 'info' && (
        <div className="bg-surface rounded-2xl border border-outline-variant p-4 md:p-6 shadow-sm">
          <h2 className="text-title-md font-semibold text-on-surface mb-md">ℹ️ Informasi Akun</h2>
          <div className="bg-surface-dim/30 p-5 rounded-xl max-w-xl space-y-3">
            <div className="flex justify-between text-body-sm"><span className="font-medium text-on-surface-variant">Role:</span><span>{
              profile?.role === 'murid' ? '🎓 Murid' : profile?.role === 'guru' ? '👨‍🏫 Guru' : profile?.role === 'admin' ? '⚙️ Admin' : 'Tidak diketahui'
            }</span></div>
            <div className="flex justify-between text-body-sm"><span className="font-medium text-on-surface-variant">Status:</span><span className="text-success">✅ Aktif</span></div>
            <div className="flex justify-between text-body-sm"><span className="font-medium text-on-surface-variant">Email:</span><span>{user?.email}</span></div>
            <div className="flex justify-between text-body-sm"><span className="font-medium text-on-surface-variant">ID Akun:</span><code className="text-label-xs bg-surface-dim px-2 py-0.5 rounded">{user?.id}</code></div>
            <div className="flex justify-between text-body-sm"><span className="font-medium text-on-surface-variant">Bergabung:</span><span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Tidak diketahui'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileModule;
