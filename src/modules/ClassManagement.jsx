import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Building2, Plus, Edit, Trash2, BookOpen, Users, MapPin, Calendar } from 'lucide-react';

const ClassManagement = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    education_level: 'sd',
    grade_level: 1,
    teacher_id: '',
    schedule: '',
    room_number: '',
    academic_year: '',
    is_active: true
  });

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, [user]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, education_level, grade_level, teacher_id, schedule, room_number, academic_year, is_active, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const teacherIds = [...new Set(data.map(c => c.teacher_id).filter(Boolean))];
        let teacherMap = {};

        if (teacherIds.length > 0) {
          const { data: teachers } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', teacherIds);

          if (teachers) {
            teachers.forEach(teacher => {
              teacherMap[teacher.id] = teacher;
            });
          }
        }

        const enrichedData = data.map(cls => ({
          ...cls,
          profiles: cls.teacher_id ? teacherMap[cls.teacher_id] || null : null
        }));

        setClasses(enrichedData);
      } else {
        setClasses([]);
      }
    } catch (error) {
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'guru');

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      setTeachers([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      education_level: formData.education_level,
      grade_level: parseInt(formData.grade_level),
      teacher_id: formData.teacher_id || null,
      schedule: formData.schedule || '',
      room_number: formData.room_number || '',
      academic_year: formData.academic_year || '',
      is_active: formData.is_active
    };

    try {
      if (editingClass) {
        const { error } = await supabase
          .from('classes')
          .update(payload)
          .eq('id', editingClass.id);

        if (error) throw error;
        alert('Kelas berhasil diperbarui!');
      } else {
        const { error } = await supabase
          .from('classes')
          .insert([payload]);

        if (error) throw error;
        alert('Kelas berhasil dibuat!');
      }

      resetForm();
      await fetchClasses();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleEdit = (cls) => {
    setFormData({
      name: cls.name,
      education_level: cls.education_level || 'sd',
      grade_level: cls.grade_level || 1,
      teacher_id: cls.teacher_id || '',
      schedule: cls.schedule || '',
      room_number: cls.room_number || '',
      academic_year: cls.academic_year || '',
      is_active: cls.is_active !== false
    });
    setEditingClass(cls);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kelas ini?')) return;

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchClasses();
      alert('Kelas berhasil dihapus!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      education_level: 'sd',
      grade_level: 1,
      teacher_id: '',
      schedule: '',
      room_number: '',
      academic_year: '',
      is_active: true
    });
    setEditingClass(null);
    setShowForm(false);
  };

  const printClassList = () => {
    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daftar Kelas</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #8b5cf6; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f5f3ff; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DAFTAR KELAS</h1>
            <p>PKBM - Sistem Administrasi Pendidikan</p>
            <p>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Kelas</th>
                <th>Jenjang</th>
                <th>Tingkat</th>
                <th>Wali Kelas</th>
                <th>Tahun Ajaran</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${classes.map((cls, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${cls.name}</strong></td>
                  <td>${cls.education_level?.toUpperCase()}</td>
                  <td>Kelas ${cls.grade_level}</td>
                  <td>${cls.profiles?.full_name || cls.profiles?.email || 'Belum ditentukan'}</td>
                  <td>${cls.academic_year || '-'}</td>
                  <td>${cls.is_active ? '<span style="color: #10b981">Aktif</span>' : '<span style="color: #ef4444">Non-aktif</span>'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            Total: ${classes.length} kelas
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return <div className="dashboard-container">Memuat data kelas...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>
            <Building2 size={28} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
            Data Kelas
          </h1>
          <p>Kelola informasi kelas PKBM</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            onClick={printClassList}
            disabled={classes.length === 0}
          >
            <BookOpen size={18} style={{ marginRight: '8px' }} />
            Cetak
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus size={18} style={{ marginRight: '8px' }} />
            Tambah Kelas
          </button>
        </div>
      </div>

      {showForm && (
        <div className="form-container">
          <h2>{editingClass ? 'Edit Kelas' : 'Tambah Kelas Baru'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Nama Kelas <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Contoh: Kelas 6 A"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="education_level">Jenjang Pendidikan <span style={{ color: 'red' }}>*</span></label>
                <select
                  id="education_level"
                  name="education_level"
                  value={formData.education_level}
                  onChange={handleInputChange}
                  required
                >
                  <option value="sd">SD (Sekolah Dasar)</option>
                  <option value="smp">SMP (Sekolah Menengah Pertama)</option>
                  <option value="sma">SMA (Sekolah Menengah Atas)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="grade_level">Tingkat/Kelas <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="number"
                  id="grade_level"
                  name="grade_level"
                  value={formData.grade_level}
                  onChange={handleInputChange}
                  min="1"
                  max="6"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="teacher_id">Wali Kelas (Guru)</label>
              <select
                id="teacher_id"
                name="teacher_id"
                value={formData.teacher_id}
                onChange={handleInputChange}
              >
                <option value="">-- Pilih Guru --</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name || teacher.email}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="schedule">Jadwal</label>
                <input
                  type="text"
                  id="schedule"
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleInputChange}
                  placeholder="Contoh: Senin-Rabu, 08:00-10:00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="room_number">Nomor Ruangan</label>
                <input
                  type="text"
                  id="room_number"
                  name="room_number"
                  value={formData.room_number}
                  onChange={handleInputChange}
                  placeholder="Contoh: R101"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="academic_year">Tahun Ajaran</label>
              <input
                type="text"
                id="academic_year"
                name="academic_year"
                value={formData.academic_year}
                onChange={handleInputChange}
                placeholder="Contoh: 2024/2025"
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  style={{ marginRight: '8px' }}
                />
                Kelas Aktif
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingClass ? 'Perbarui' : 'Simpan'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="dashboard-content">
        <section className="dashboard-section">
          <h2>
            <BookOpen size={20} style={{ marginRight: '8px' }} />
            Daftar Kelas
          </h2>

          {classes.length > 0 ? (
            <div className="cards-grid">
              {classes.map(cls => (
                <div key={cls.id} className="card">
                  <div className="card-header">
                    <span className="course-code">
                      <MapPin size={16} style={{ marginRight: '4px' }} />
                      {cls.education_level?.toUpperCase()}
                    </span>
                    <span className={`course-icon ${cls.is_active ? '' : 'inactive'}`}>
                      {cls.is_active ? '✓' : '✗'}
                    </span>
                  </div>
                  <h3>{cls.name}</h3>

                  <div style={{ marginTop: '1rem' }}>
                    <p><strong>Wali Kelas:</strong> {cls.profiles?.full_name || 'Belum ada'}</p>
                    <p><strong>Jadwal:</strong> {cls.schedule || 'Belum diisi'}</p>
                    <p><strong>Ruangan:</strong> {cls.room_number || 'Belum diisi'}</p>
                    <p><strong>Tahun Ajaran:</strong> {cls.academic_year || 'Belum diisi'}</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        background: cls.is_active ? '#d1fae5' : '#fee2e2',
                        color: cls.is_active ? '#059669' : '#dc2626',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        {cls.is_active ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEdit(cls)}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(cls.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon"><Building2 size={48} /></span>
              <p>Belum ada data kelas.</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Jalankan script <code>sql/create_default_classes.sql</code> di Supabase SQL Editor untuk membuat kelas default, atau klik tombol "Tambah Kelas" untuk membuat kelas manual.
              </p>
              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#ef4444', background: '#fef2f2', padding: '0.5rem', borderRadius: '4px', border: '1px solid #fecaca' }}>
                <strong>Penting:</strong> Kelas diperlukan untuk fitur absensi, penilaian, dan jurnal mengajar.
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ClassManagement;