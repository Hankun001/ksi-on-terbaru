import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { ClipboardList, Calendar, BookOpen, Clock, Plus, Save, Trash2, FileText, Printer } from 'lucide-react';

const TeachingJournal = () => {
  const { user, profile } = useAuth();
  const [journals, setJournals] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJournal, setEditingJournal] = useState(null);
  const [formData, setFormData] = useState({
    class_id: '',
    date: new Date().toISOString().split('T')[0],
    subject: '',
    material: '',
    notes: '',
    duration_minutes: 45,
    teaching_method: ''
  });

  useEffect(() => {
    fetchJournals();
    fetchClasses();
  }, [user]);

  const fetchJournals = async () => {
    try {
      const { data, error } = await supabase
        .from('teaching_journals')
        .select(`
          *,
          classes (name, education_level, grade_level)
        `)
        .eq('teacher_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setJournals(data || []);
    } catch (error) {
      console.error('Error fetching journals:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingJournal) {
        const { error } = await supabase
          .from('teaching_journals')
          .update({
            class_id: formData.class_id,
            date: formData.date,
            subject: formData.subject,
            material: formData.material,
            notes: formData.notes,
            duration_minutes: parseInt(formData.duration_minutes),
            teaching_method: formData.teaching_method
          })
          .eq('id', editingJournal.id);

        if (error) throw error;
        alert('Jurnal berhasil diperbarui!');
      } else {
        const { error } = await supabase
          .from('teaching_journals')
          .insert([{
            teacher_id: user.id,
            class_id: formData.class_id,
            date: formData.date,
            subject: formData.subject,
            material: formData.material,
            notes: formData.notes,
            duration_minutes: parseInt(formData.duration_minutes),
            teaching_method: formData.teaching_method
          }]);

        if (error) throw error;
        alert('Jurnal berhasil disimpan!');
      }

      resetForm();
      fetchJournals();
    } catch (error) {
      console.error('Error saving journal:', error.message);
      alert('Error: ' + error.message);
    }
  };

  const handleEdit = (journal) => {
    setFormData({
      class_id: journal.class_id,
      date: journal.date,
      subject: journal.subject,
      material: journal.material || '',
      notes: journal.notes || '',
      duration_minutes: journal.duration_minutes || 45,
      teaching_method: journal.teaching_method || ''
    });
    setEditingJournal(journal);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus jurnal ini?')) return;
    
    try {
      const { error } = await supabase
        .from('teaching_journals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchJournals();
      alert('Jurnal berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting journal:', error.message);
      alert('Error: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      class_id: '',
      date: new Date().toISOString().split('T')[0],
      subject: '',
      material: '',
      notes: '',
      duration_minutes: 45,
      teaching_method: ''
    });
    setEditingJournal(null);
    setShowForm(false);
  };

  const handlePrint = (journal) => {
    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Jurnal Mengajar - ${journal.date}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #8b5cf6; margin-bottom: 5px; }
            .info { margin-bottom: 20px; }
            .info p { margin: 5px 0; }
            .section { margin-top: 20px; }
            .section-title { font-weight: bold; border-bottom: 2px solid #8b5cf6; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f3ff; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>JURNAL MENGAJAR</h1>
            <p>PKBM - Sistem Administrasi Pendidikan</p>
          </div>
          <div class="info">
            <p><strong>Guru:</strong> ${profile?.display_name || profile?.full_name || 'Guru'}</p>
            <p><strong>Tanggal:</strong> ${new Date(journal.date).toLocaleDateString('id-ID')}</p>
            <p><strong>Kelas:</strong> ${journal.classes?.name || 'N/A'}</p>
            <p><strong>Mata Pelajaran:</strong> ${journal.subject}</p>
            <p><strong>Durasi:</strong> ${journal.duration_minutes} menit</p>
            ${journal.teaching_method ? `<p><strong>Metode:</strong> ${journal.teaching_method}</p>` : ''}
          </div>
          <div class="section">
            <div class="section-title">Materi yang Diajarkan</div>
            <p>${journal.material || '-'}</p>
          </div>
          <div class="section">
            <div class="section-title">Catatan</div>
            <p>${journal.notes || '-'}</p>
          </div>
          <div class="footer">
            Dicetak pada: ${new Date().toLocaleString('id-ID')}
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return <div className="dashboard-container">Memuat jurnal mengajar...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>
            <ClipboardList size={28} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
            Jurnal Mengajar
          </h1>
          <p>Catat aktivitas pembelajaran harian Anda</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus size={18} style={{ marginRight: '8px' }} />
            Tambah Jurnal
          </button>
        </div>
      </div>

      {showForm && (
        <div className="form-container">
          <h2>{editingJournal ? 'Edit Jurnal' : 'Jurnal Mengajar Baru'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="class_id">Kelas <span style={{ color: 'red' }}>*</span></label>
              <select
                id="class_id"
                name="class_id"
                value={formData.class_id}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.education_level?.toUpperCase()} - Kelas {cls.grade_level})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="date">Tanggal <span style={{ color: 'red' }}>*</span></label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Mata Pelajaran <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                placeholder="Contoh: Matematika, IPA, dll"
              />
            </div>

            <div className="form-group">
              <label htmlFor="material">Materi yang Diajarkan</label>
              <textarea
                id="material"
                name="material"
                value={formData.material}
                onChange={handleInputChange}
                rows="3"
                placeholder="Jelaskan materi yang Anda ajarkan hari ini..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Catatan</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                placeholder="Catatan tambahan (opsional)..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="duration_minutes">Durasi (menit)</label>
                <input
                  type="number"
                  id="duration_minutes"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleInputChange}
                  min="1"
                  max="480"
                />
              </div>

              <div className="form-group">
                <label htmlFor="teaching_method">Metode Pengajaran</label>
                <input
                  type="text"
                  id="teaching_method"
                  name="teaching_method"
                  value={formData.teaching_method}
                  onChange={handleInputChange}
                  placeholder="Contoh: Ceramah, Diskusi, Demonstrasi"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                <Save size={18} style={{ marginRight: '8px' }} />
                {editingJournal ? 'Perbarui' : 'Simpan'}
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
            <Calendar size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Daftar Jurnal Mengajar
          </h2>

          {journals.length > 0 ? (
            <div className="cards-grid">
              {journals.map(journal => (
                <div key={journal.id} className="card">
                  <div className="card-header">
                    <span className="course-code">
                      <BookOpen size={16} style={{ marginRight: '4px' }} />
                      {journal.classes?.name || 'Kelas Tidak Diketahui'}
                    </span>
                    <span className="course-icon">
                      <Calendar size={16} />
                    </span>
                  </div>
                  <h3>{journal.subject}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    <Calendar size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    {new Date(journal.date).toLocaleDateString('id-ID')}
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    <Clock size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    {journal.duration_minutes} menit
                  </p>
                  {journal.material && (
                    <p style={{ marginTop: '0.5rem' }}>
                      {journal.material.substring(0, 80)}...
                    </p>
                  )}
                  <div className="card-actions" style={{ marginTop: '1rem' }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handlePrint(journal)}
                      title="Cetak Jurnal"
                    >
                      <Printer size={16} />
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEdit(journal)}
                    >
                      <FileText size={16} />
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(journal.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon"><ClipboardList size={48} /></span>
              <p>Belum ada jurnal mengajar.</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Klik tombol "Tambah Jurnal" untuk membuat jurnal pertama Anda.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TeachingJournal;