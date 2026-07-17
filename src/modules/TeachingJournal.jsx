import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { ClipboardList, Calendar, BookOpen, Clock, Plus, Trash2, FileText, Printer, X, GraduationCap } from 'lucide-react';

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
            <ClipboardList className="w-7 h-7 text-primary" />
            Jurnal Mengajar
          </h1>
          <p className="text-body-md text-on-surface-variant mt-xs">Catat aktivitas pembelajaran harian Anda</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-xs px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all duration-200 shadow-sm text-label-lg font-medium"
        >
          <Plus className="w-4 h-4" />
          Tambah Jurnal
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={resetForm}>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-title-md font-semibold text-white flex items-center gap-sm">
                <ClipboardList className="w-5 h-5" />
                {editingJournal ? 'Edit Jurnal' : 'Jurnal Mengajar Baru'}
              </h2>
              <button onClick={resetForm} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-label-lg font-medium text-on-surface mb-1.5">
                  Kelas <span className="text-error">*</span>
                </label>
                <select
                  name="class_id"
                  value={formData.class_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.education_level?.toUpperCase()} - Kelas {cls.grade_level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-lg font-medium text-on-surface mb-1.5">
                    Tanggal <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
                  />
                </div>
                <div>
                  <label className="block text-label-lg font-medium text-on-surface mb-1.5">
                    Mata Pelajaran <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    placeholder="Contoh: Matematika, IPA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-label-lg font-medium text-on-surface mb-1.5">Materi yang Diajarkan</label>
                <textarea
                  name="material"
                  value={formData.material}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Jelaskan materi yang Anda ajarkan hari ini..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md resize-none"
                />
              </div>

              <div>
                <label className="block text-label-lg font-medium text-on-surface mb-1.5">Catatan</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Catatan tambahan (opsional)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-lg font-medium text-on-surface mb-1.5">Durasi (menit)</label>
                  <input
                    type="number"
                    name="duration_minutes"
                    value={formData.duration_minutes}
                    onChange={handleInputChange}
                    min="1" max="480"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
                  />
                </div>
                <div>
                  <label className="block text-label-lg font-medium text-on-surface mb-1.5">Metode Pengajaran</label>
                  <input
                    type="text"
                    name="teaching_method"
                    value={formData.teaching_method}
                    onChange={handleInputChange}
                    placeholder="Contoh: Ceramah, Diskusi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
                  />
                </div>
              </div>

              <div className="flex gap-sm pt-2 border-t border-outline-variant">
                <button type="submit" className="flex-1 inline-flex items-center justify-center gap-xs px-4 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all duration-200 shadow-sm text-label-lg font-medium">
                  <FileText className="w-4 h-4" />
                  {editingJournal ? 'Perbarui' : 'Simpan'}
                </button>
                <button type="button" onClick={resetForm} className="px-4 py-2.5 rounded-full border border-outline text-on-surface-variant hover:bg-surface-dim transition-colors text-label-lg">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Journal List */}
      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant p-4 md:p-6">
        <h2 className="text-title-md font-semibold text-on-surface flex items-center gap-sm mb-md">
          <Calendar className="w-5 h-5 text-primary" />
          Daftar Jurnal Mengajar
          <span className="bg-primary-container text-on-primary-container text-label-sm px-2 py-0.5 rounded-full ml-auto">
            {journals.length}
          </span>
        </h2>

        {journals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {journals.map(journal => (
              <div key={journal.id} className="bg-surface-dim/30 rounded-xl border border-outline-variant hover:border-primary/30 hover:shadow-md transition-all duration-300 p-4 group">
                {/* Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1 text-label-sm text-primary bg-primary-container/50 px-2.5 py-1 rounded-full">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {journal.classes?.name || 'Kelas Tidak Diketahui'}
                  </span>
                  <span className="text-label-xs text-on-surface-variant">
                    {new Date(journal.date).toLocaleDateString('id-ID')}
                  </span>
                </div>

                <h3 className="text-title-sm font-semibold text-on-surface mb-2">{journal.subject}</h3>

                <div className="space-y-1.5 text-body-sm text-on-surface-variant">
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{journal.duration_minutes} menit</span>
                  </p>
                  {journal.teaching_method && (
                    <p className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span>Metode: {journal.teaching_method}</span>
                    </p>
                  )}
                  {journal.material && (
                    <p className="text-body-sm text-on-surface-variant/70 line-clamp-2 mt-1">
                      {journal.material}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-outline-variant opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handlePrint(journal)}
                    className="p-2 rounded-full bg-surface-dim hover:bg-surface-dim/80 transition-colors text-on-surface-variant"
                    title="Cetak Jurnal"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(journal)}
                    className="p-2 rounded-full bg-primary-container text-on-primary-container hover:bg-primary-container/80 transition-colors"
                    title="Edit Jurnal"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(journal.id)}
                    className="p-2 rounded-full bg-error-container text-on-error-container hover:bg-error-container/80 transition-colors"
                    title="Hapus Jurnal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ClipboardList className="w-16 h-16 mx-auto text-on-surface-variant/30 mb-4" />
            <p className="text-body-lg text-on-surface-variant mb-2">Belum ada jurnal mengajar.</p>
            <p className="text-body-sm text-on-surface-variant/70">
              Klik tombol "Tambah Jurnal" untuk membuat jurnal pertama Anda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeachingJournal;