import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Building2, Plus, Edit, Trash2, BookOpen, Users, MapPin, Calendar, X, Save, Printer, AlertCircle } from 'lucide-react';

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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-sm">
          <div className="w-12 h-12 rounded-full bg-surface-dim"></div>
          <div className="h-4 w-48 bg-surface-dim rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-xl">
        <div>
          <h1 className="text-headline-sm md:text-headline-md font-bold text-on-surface flex items-center gap-sm">
            <Building2 className="w-7 h-7 text-primary" />
            Data Kelas
          </h1>
          <p className="text-body-md text-on-surface-variant mt-xs">Kelola informasi kelas PKBM</p>
        </div>
        <div className="flex gap-sm">
          <button
            onClick={printClassList}
            disabled={classes.length === 0}
            className="inline-flex items-center gap-xs px-4 py-2 rounded-full border border-outline text-on-surface-variant hover:bg-surface-dim transition-colors duration-200 text-label-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            Cetak
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-xs px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all duration-200 shadow-sm text-label-lg font-medium"
          >
            <Plus className="w-4 h-4" />
            Tambah Kelas
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={resetForm}>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-title-md font-semibold text-white flex items-center gap-sm">
                <Building2 className="w-5 h-5" />
                {editingClass ? 'Edit Kelas' : 'Tambah Kelas Baru'}
              </h2>
              <button onClick={resetForm} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-label-lg font-medium text-on-surface mb-1.5">
                  Nama Kelas <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Contoh: Kelas 6 A"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-lg font-medium text-on-surface mb-1.5">
                    Jenjang Pendidikan <span className="text-error">*</span>
                  </label>
                  <select
                    name="education_level"
                    value={formData.education_level}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
                  >
                    <option value="sd">SD (Sekolah Dasar)</option>
                    <option value="smp">SMP (Sekolah Menengah Pertama)</option>
                    <option value="sma">SMA (Sekolah Menengah Atas)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-label-lg font-medium text-on-surface mb-1.5">
                    Tingkat/Kelas <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    name="grade_level"
                    value={formData.grade_level}
                    onChange={handleInputChange}
                    min="1" max="6" required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-label-lg font-medium text-on-surface mb-1.5">Wali Kelas (Guru)</label>
                <select
                  name="teacher_id"
                  value={formData.teacher_id}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
                >
                  <option value="">-- Pilih Guru --</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name || teacher.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-lg font-medium text-on-surface mb-1.5">Jadwal</label>
                  <input
                    type="text"
                    name="schedule"
                    value={formData.schedule}
                    onChange={handleInputChange}
                    placeholder="Contoh: Senin-Rabu, 08:00-10:00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
                  />
                </div>
                <div>
                  <label className="block text-label-lg font-medium text-on-surface mb-1.5">Nomor Ruangan</label>
                  <input
                    type="text"
                    name="room_number"
                    value={formData.room_number}
                    onChange={handleInputChange}
                    placeholder="Contoh: R101"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-label-lg font-medium text-on-surface mb-1.5">Tahun Ajaran</label>
                <input
                  type="text"
                  name="academic_year"
                  value={formData.academic_year}
                  onChange={handleInputChange}
                  placeholder="Contoh: 2024/2025"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
                />
              </div>

              <label className="flex items-center gap-sm cursor-pointer p-3 rounded-xl bg-surface-dim/50 hover:bg-surface-dim transition-colors">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-outline text-primary focus:ring-primary"
                />
                <span className="text-body-md text-on-surface">Kelas Aktif</span>
              </label>

              <div className="flex gap-sm pt-2 border-t border-outline-variant">
                <button type="submit" className="flex-1 inline-flex items-center justify-center gap-xs px-4 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all duration-200 shadow-sm text-label-lg font-medium">
                  <Save className="w-4 h-4" />
                  {editingClass ? 'Perbarui' : 'Simpan'}
                </button>
                <button type="button" onClick={resetForm} className="px-4 py-2.5 rounded-full border border-outline text-on-surface-variant hover:bg-surface-dim transition-colors text-label-lg">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class List */}
      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant p-4 md:p-6">
        <h2 className="text-title-md font-semibold text-on-surface flex items-center gap-sm mb-md">
          <BookOpen className="w-5 h-5 text-primary" />
          Daftar Kelas
          <span className="bg-primary-container text-on-primary-container text-label-sm px-2 py-0.5 rounded-full ml-auto">
            {classes.length}
          </span>
        </h2>

        {classes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map(cls => (
              <div key={cls.id} className="bg-surface-dim/30 rounded-xl border border-outline-variant hover:border-primary/30 hover:shadow-md transition-all duration-300 p-4 group">
                {/* Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1 text-label-sm text-primary bg-primary-container/50 px-2.5 py-1 rounded-full">
                    <MapPin className="w-3.5 h-3.5" />
                    {cls.education_level?.toUpperCase()}
                  </span>
                  <span className={"inline-flex items-center gap-1 text-label-xs px-2 py-0.5 rounded-full " + (cls.is_active ? 'bg-success-container text-on-success-container' : 'bg-error-container text-on-error-container')}>
                    {cls.is_active ? 'Aktif' : 'Non-aktif'}
                  </span>
                </div>

                <h3 className="text-title-sm font-semibold text-on-surface mb-2">{cls.name}</h3>

                <div className="space-y-1.5 text-body-sm text-on-surface-variant">
                  <p className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>Wali: {cls.profiles?.full_name || 'Belum ada'}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{cls.schedule || 'Jadwal belum diisi'}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>Ruang: {cls.room_number || '-'}</span>
                  </p>
                  <p className="text-label-sm text-on-surface-variant">
                    TA. {cls.academic_year || '-'}
                  </p>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-outline-variant opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleEdit(cls)}
                    className="p-2 rounded-full bg-primary-container text-on-primary-container hover:bg-primary-container/80 transition-colors"
                    title="Edit Kelas"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cls.id)}
                    className="p-2 rounded-full bg-error-container text-on-error-container hover:bg-error-container/80 transition-colors"
                    title="Hapus Kelas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto text-on-surface-variant/30 mb-4" />
            <p className="text-body-lg text-on-surface-variant mb-2">Belum ada data kelas.</p>
            <p className="text-body-sm text-on-surface-variant/70 max-w-md mx-auto">
              Klik tombol "Tambah Kelas" untuk membuat kelas baru.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-label-sm text-error bg-error-container/50 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              Kelas diperlukan untuk fitur absensi, penilaian, dan jurnal mengajar.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassManagement;