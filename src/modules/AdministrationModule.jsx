import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const AdministrationModule = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userForm, setUserForm] = useState({
    email: '',
    role: 'murid',
    full_name: ''
  });
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    if (role === 'admin') {
      fetchData();
    }
  }, [role]);

  const fetchData = async () => {
    try {
      // Get all users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      setUsers(usersData || []);

      // Get all courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          profiles (
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      setCourses(coursesData || []);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update({
            role: userForm.role,
            full_name: userForm.full_name
          })
          .eq('id', editingUser.id);
          
        if (error) throw error;
        
        alert('Profil pengguna berhasil diperbarui!');
      } else {
        // For creating new users, we need to use Supabase Auth
        // This is a simplified version - in practice, you'd want to use Supabase Auth functions
        alert(`Pengguna baru akan dibuat: ${userForm.email} (${userForm.role})`);
      }
      
      // Reset form and close it
      setUserForm({ email: '', role: 'murid', full_name: '' });
      setEditingUser(null);
      setShowUserForm(false);
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error saving user:', error.message);
      alert('Error menyimpan pengguna: ' + error.message);
    }
  };

  const handleEditUser = (userToEdit) => {
    setUserForm({
      email: userToEdit.email,
      role: userToEdit.role,
      full_name: userToEdit.full_name || ''
    });
    setEditingUser(userToEdit);
    setShowUserForm(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      if (error) throw error;
      
      // Refresh data
      fetchData();
      alert('Pengguna berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting user:', error.message);
      alert('Error menghapus pengguna: ' + error.message);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      // In a real implementation, we might have an 'active' field in the profiles table
      // For now, we'll just show an alert
      alert(`Status pengguna akan diubah menjadi ${currentStatus ? 'non-aktif' : 'aktif'}`);
    } catch (error) {
      console.error('Error toggling user status:', error.message);
      alert('Error mengubah status pengguna: ' + error.message);
    }
  };

  const handleCancelUserForm = () => {
    setUserForm({ email: '', role: 'murid', full_name: '' });
    setEditingUser(null);
    setShowUserForm(false);
  };

  if (loading) {
    return <div className="dashboard-container">Memuat data administrasi...</div>;
  }

  if (role !== 'admin') {
    return <div className="dashboard-container">Hanya admin yang dapat mengakses modul ini.</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Modul Administrasi Sistem</h1>

      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Manajemen Pengguna
        </button>
        <button 
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          Manajemen Kursus
        </button>
        <button 
          className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          Pengaturan Sistem
        </button>
      </div>

      {showUserForm && (
        <div className="form-container">
          <h2>{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={userForm.email}
                onChange={handleUserFormChange}
                required
                disabled={!!editingUser}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="full_name">Nama Lengkap:</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={userForm.full_name}
                onChange={handleUserFormChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="role">Peran:</label>
              <select
                id="role"
                name="role"
                value={userForm.role}
                onChange={handleUserFormChange}
              >
                <option value="murid">Murid</option>
                <option value="guru">Guru</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingUser ? 'Perbarui Pengguna' : 'Tambah Pengguna'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancelUserForm}>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="dashboard-content">
        {activeTab === 'users' && (
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Manajemen Pengguna</h2>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setUserForm({ email: '', role: 'murid', full_name: '' });
                  setEditingUser(null);
                  setShowUserForm(true);
                }}
              >
                + Tambah Pengguna
              </button>
            </div>
            
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Nama Lengkap</th>
                    <th>Peran</th>
                    <th>Status</th>
                    <th>Dibuat</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(userItem => (
                    <tr key={userItem.id}>
                      <td>{userItem.email}</td>
                      <td>{userItem.full_name || '-'}</td>
                      <td>
                        <select
                          value={userItem.role}
                          onChange={(e) => {
                            // In a real implementation, we would update the role in the database
                            alert(`Peran pengguna akan diubah menjadi ${e.target.value}`);
                          }}
                          disabled={userItem.id === user.id} // Don't allow changing own role
                        >
                          <option value="murid">Murid</option>
                          <option value="guru">Guru</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <span className={`status-badge ${userItem.active !== false ? 'active' : 'inactive'}`}>
                          {userItem.active !== false ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </td>
                      <td>{new Date(userItem.created_at).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleEditUser(userItem)}
                        >
                          Edit
                        </button>
                        {userItem.id !== user.id && ( // Don't allow deleting own account
                          <button 
                            className="btn btn-danger" 
                            onClick={() => handleDeleteUser(userItem.id)}
                          >
                            Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        
        {activeTab === 'courses' && (
          <section className="dashboard-section">
            <h2>Manajemen Kursus</h2>
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Judul</th>
                    <th>Deskripsi</th>
                    <th>Pengajar</th>
                    <th>Dibuat</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <tr key={course.id}>
                      <td>{course.title}</td>
                      <td>{course.description?.substring(0, 50)}{course.description?.length > 50 ? '...' : ''}</td>
                      <td>{course.profiles?.email || 'Tidak diketahui'}</td>
                      <td>{new Date(course.created_at).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-secondary">Edit</button>
                        <button className="btn btn-danger">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        
        {activeTab === 'system' && (
          <section className="dashboard-section">
            <h2>Pengaturan Sistem</h2>
            <div className="system-settings">
              <div className="setting-item">
                <h3>Pengaturan Umum</h3>
                <p>Atur pengaturan global untuk sistem LMS</p>
                <button className="btn btn-secondary">Edit Pengaturan</button>
              </div>
              
              <div className="setting-item">
                <h3>Statistik Sistem</h3>
                <p>Lihat statistik penggunaan sistem secara keseluruhan</p>
                <button className="btn btn-secondary">Lihat Statistik</button>
              </div>
              
              <div className="setting-item">
                <h3>Backup Data</h3>
                <p>Buat atau pulihkan backup data sistem</p>
                <button className="btn btn-secondary">Backup Sekarang</button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AdministrationModule;