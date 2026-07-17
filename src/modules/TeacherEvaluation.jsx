import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Award, Star, Calendar, Filter, Printer, Save, Trash2, Edit2, X } from 'lucide-react';

const TeacherEvaluation = () => {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState({
    teacher_id: '',
    date_from: '',
    date_to: ''
  });

  const [formData, setFormData] = useState({
    teacher_id: '',
    date: new Date().toISOString().split('T')[0],
    pedagogy_score: 5,
    pedagogy_feedback: '',
    professionalism_score: 5,
    professionalism_feedback: '',
    personality_score: 5,
    personality_feedback: '',
    leadership_score: 5,
    leadership_feedback: '',
    notes: ''
  });

  useEffect(() => {
    fetchEvaluations();
    fetchTeachers();
  }, [user, filter]);

  const fetchEvaluations = async () => {
    try {
      let query = supabase
        .from('teacher_evaluation_sessions')
        .select(`
          *,
          profiles!teacher_id (full_name, email),
          admin:profiles!admin_id (full_name)
        `)
        .order('date', { ascending: false });

      if (filter.teacher_id) {
        query = query.eq('teacher_id', filter.teacher_id);
      }
      if (filter.date_from) {
        query = query.gte('date', filter.date_from);
      }
      if (filter.date_to) {
        query = query.lte('date', filter.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      setEvaluations(data || []);
    } catch (error) {
      console.error('Error fetching evaluations:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'guru');
      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error.message);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openNewForm = () => {
    setEditingId(null);
    setFormData({
      teacher_id: '',
      date: new Date().toISOString().split('T')[0],
      pedagogy_score: 5,
      pedagogy_feedback: '',
      professionalism_score: 5,
      professionalism_feedback: '',
      personality_score: 5,
      personality_feedback: '',
      leadership_score: 5,
      leadership_feedback: '',
      notes: ''
    });
    setShowForm(true);
  };

  const openEditForm = (ev) => {
    setEditingId(ev.id);
    setFormData({
      teacher_id: ev.teacher_id,
      date: ev.date,
      pedagogy_score: ev.pedagogy_score,
      pedagogy_feedback: ev.pedagogy_feedback || '',
      professionalism_score: ev.professionalism_score,
      professionalism_feedback: ev.professionalism_feedback || '',
      personality_score: ev.personality_score,
      personality_feedback: ev.personality_feedback || '',
      leadership_score: ev.leadership_score,
      leadership_feedback: ev.leadership_feedback || '',
      notes: ev.notes || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        admin_id: user.id,
        teacher_id: formData.teacher_id,
        date: formData.date,
        pedagogy_score: parseInt(formData.pedagogy_score),
        pedagogy_feedback: formData.pedagogy_feedback,
        professionalism_score: parseInt(formData.professionalism_score),
        professionalism_feedback: formData.professionalism_feedback,
        personality_score: parseInt(formData.personality_score),
        personality_feedback: formData.personality_feedback,
        leadership_score: parseInt(formData.leadership_score),
        leadership_feedback: formData.leadership_feedback,
        notes: formData.notes
      };

      if (editingId) {
        // Update existing session
        const { error } = await supabase
          .from('teacher_evaluation_sessions')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        alert('Evaluasi berhasil diperbarui!');
      } else {
        // Insert new session
        const { error } = await supabase
          .from('teacher_evaluation_sessions')
          .insert([payload]);

        if (error) throw error;
        alert('Evaluasi berhasil disimpan!');
      }

      setShowForm(false);
      setEditingId(null);
      fetchEvaluations();
    } catch (error) {
      console.error('Error saving evaluation:', error.message);
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus evaluasi ini?')) return;
    try {
      const { error } = await supabase
        .from('teacher_evaluation_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Evaluasi berhasil dihapus!');
      fetchEvaluations();
    } catch (error) {
      console.error('Error deleting evaluation:', error.message);
      alert('Error: ' + error.message);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 5) return '#10b981';
    if (score >= 4) return '#3b82f6';
    if (score >= 3) return '#f59e0b';
    return '#ef4444';
  };

  const getAvgScore = (ev) => {
    return ((ev.pedagogy_score + ev.professionalism_score + ev.personality_score + ev.leadership_score) / 4).toFixed(1);
  };

  const printEvaluationSummary = () => {
    const printWindow = window.open('', '_blank');
    
    const grouped = {};
    evaluations.forEach(ev => {
      if (!grouped[ev.teacher_id]) {
        grouped[ev.teacher_id] = {
          teacher: ev.profiles,
          sessions: [],
          totalAvg: 0
        };
      }
      grouped[ev.teacher_id].sessions.push(ev);
    });

    Object.values(grouped).forEach(group => {
      const total = group.sessions.reduce((sum, ev) => sum + parseFloat(getAvgScore(ev)), 0);
      group.totalAvg = Math.round(total / group.sessions.length * 10) / 10;
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rekap Evaluasi Guru</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #8b5cf6; margin-bottom: 5px; }
            .header p { color: #666; margin: 3px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; font-size: 13px; }
            th { background-color: #f5f3ff; color: #7c3aed; font-weight: bold; }
            tr:nth-child(even) { background-color: #fafafa; }
            .score-good { color: #10b981; font-weight: bold; }
            .score-avg { color: #f59e0b; font-weight: bold; }
            .score-low { color: #ef4444; font-weight: bold; }
            .section-title { background: #8b5cf6; color: white; padding: 8px 12px; margin: 25px 0 10px; border-radius: 4px; }
            .footer { margin-top: 40px; text-align: center; color: #999; font-size: 11px; border-top: 1px solid #eee; padding-top: 15px; }
            .criteria-grid { display: flex; gap: 8px; flex-wrap: wrap; }
            .criteria-badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN EVALUASI GURU</h1>
            <p>PKBM - Sistem Manajemen Pendidikan</p>
            <p>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          
          <div style="display: flex; gap: 20px; margin-bottom: 25px;">
            <div style="flex: 1; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold;">${Object.keys(grouped).length}</div>
              <div style="font-size: 13px; opacity: 0.9;">Total Guru</div>
            </div>
            <div style="flex: 1; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold;">${evaluations.length}</div>
              <div style="font-size: 13px; opacity: 0.9;">Total Sesi Evaluasi</div>
            </div>
          </div>

          ${Object.values(grouped).map((group, idx) => `
            <div class="section-title">${idx + 1}. ${group.teacher.full_name || group.teacher.email}</div>
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Pedagogi</th>
                  <th>Profesionalisme</th>
                  <th>Kepribadian</th>
                  <th>Kepemimpinan</th>
                  <th>Rata-rata</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                ${group.sessions.map(ev => `
                  <tr>
                    <td>${new Date(ev.date).toLocaleDateString('id-ID')}</td>
                    <td class="${ev.pedagogy_score >= 4 ? 'score-good' : ev.pedagogy_score >= 3 ? 'score-avg' : 'score-low'}">${ev.pedagogy_score}/5</td>
                    <td class="${ev.professionalism_score >= 4 ? 'score-good' : ev.professionalism_score >= 3 ? 'score-avg' : 'score-low'}">${ev.professionalism_score}/5</td>
                    <td class="${ev.personality_score >= 4 ? 'score-good' : ev.personality_score >= 3 ? 'score-avg' : 'score-low'}">${ev.personality_score}/5</td>
                    <td class="${ev.leadership_score >= 4 ? 'score-good' : ev.leadership_score >= 3 ? 'score-avg' : 'score-low'}">${ev.leadership_score}/5</td>
                    <td style="font-weight: bold; font-size: 15px;">${getAvgScore(ev)}</td>
                    <td style="max-width: 200px;">${ev.notes || '-'}</td>
                  </tr>
                `).join('')}
                <tr style="background: #fef3c7; font-weight: bold;">
                  <td colspan="5" style="text-align: right;">Rata-rata Keseluruhan:</td>
                  <td class="${group.totalAvg >= 4 ? 'score-good' : group.totalAvg >= 3 ? 'score-avg' : 'score-low'}">${group.totalAvg}/5 ⭐</td>
                  <td>${group.sessions.length} sesi</td>
                </tr>
              </tbody>
            </table>
          `).join('')}

          <div class="footer">
            <p>Dicetak dari Sistem KSI-ON LMS | Total: ${Object.keys(grouped).length} guru, ${evaluations.length} sesi evaluasi</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const clearFilters = () => {
    setFilter({
      teacher_id: '',
      date_from: '',
      date_to: ''
    });
  };

  const FormSection = ({ title, scoreName, feedbackName, scoreValue, description }) => (
    <div className="bg-primary-container/20 p-4 md:p-5 rounded-xl border-l-4 mb-4" style={{ borderLeftColor: getScoreColor(scoreValue) }}>
      <h4 className="text-title-sm font-semibold text-on-surface flex items-center gap-sm mb-3">
        {title}
      </h4>
      <div className="mb-3">
        <label className="text-label-sm font-medium text-on-surface mb-1.5 block">Nilai (1-5)</label>
        <div className="flex items-center gap-md">
          <input
            type="range"
            name={scoreName}
            min="1" max="5"
            value={scoreValue}
            onChange={handleFormChange}
            className="flex-1 accent-primary"
          />
          <span className="text-title-sm font-bold min-w-[60px] text-center" style={{ color: getScoreColor(scoreValue) }}>
            ⭐ {scoreValue}
          </span>
        </div>
        <p className="text-label-xs text-on-surface-variant mt-1">{description}</p>
      </div>
      <div>
        <label className="text-label-sm font-medium text-on-surface mb-1.5 block">Umpan Balik (Opsional)</label>
        <textarea
          name={feedbackName}
          value={formData[feedbackName]}
          onChange={handleFormChange}
          rows={2}
          placeholder={`Saran untuk peningkatan ${title}...`}
          className="w-full px-3 py-2 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-sm resize-none"
        />
      </div>
    </div>
  );

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
            <Award className="w-7 h-7 text-primary" />
            Evaluasi Pengajar
          </h1>
          <p className="text-body-md text-on-surface-variant mt-xs">Penilaian kinerja guru dengan 4 aspek sekaligus dalam satu sesi</p>
        </div>
        <div className="flex gap-sm">
          <button
            onClick={openNewForm}
            className="inline-flex items-center gap-xs px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all duration-200 shadow-sm text-label-lg font-medium"
          >
            <Star className="w-4 h-4" />
            Evaluasi Baru
          </button>
          <button
            onClick={printEvaluationSummary}
            disabled={evaluations.length === 0}
            className="inline-flex items-center gap-xs px-4 py-2 rounded-full border border-outline text-on-surface-variant hover:bg-surface-dim transition-colors duration-200 text-label-lg disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Cetak Rekap
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-surface-container-low rounded-2xl p-4 md:p-5 mb-xl border border-outline-variant">
        <div className="flex items-center gap-sm mb-md">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="text-title-sm font-semibold text-on-surface m-0">Filter Evaluasi</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-label-lg font-medium text-on-surface mb-1.5">Guru</label>
            <select
              name="teacher_id"
              value={filter.teacher_id}
              onChange={handleFilterChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md"
            >
              <option value="">Semua Guru</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.full_name || t.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-label-lg font-medium text-on-surface mb-1.5">Dari Tanggal</label>
            <input
              type="date"
              name="date_from"
              value={filter.date_from}
              onChange={handleFilterChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md"
            />
          </div>
          <div>
            <label className="block text-label-lg font-medium text-on-surface mb-1.5">Sampai Tanggal</label>
            <input
              type="date"
              name="date_to"
              value={filter.date_to}
              onChange={handleFilterChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md"
            />
          </div>
        </div>
        <button onClick={clearFilters} className="mt-md inline-flex items-center gap-xs px-3 py-1.5 rounded-full border border-outline text-on-surface-variant hover:bg-surface-dim transition-colors text-label-sm">
          Hapus Filter
        </button>
      </div>

      {/* Evaluation Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto" onClick={() => { setShowForm(false); setEditingId(null); }}>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-3xl m-4 animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-title-md font-semibold text-white flex items-center gap-sm">
                <Award className="w-5 h-5" />
                {editingId ? 'Edit Evaluasi Guru' : 'Evaluasi Guru Baru'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-lg font-medium text-on-surface mb-1.5">Pilih Guru <span className="text-error">*</span></label>
                  <select
                    name="teacher_id"
                    value={formData.teacher_id}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md"
                  >
                    <option value="">-- Pilih Guru --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.full_name || t.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-label-lg font-medium text-on-surface mb-1.5">Tanggal Evaluasi <span className="text-error">*</span></label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md"
                  />
                </div>
              </div>

              <FormSection
                title="📚 Pedagogi"
                scoreName="pedagogy_score" feedbackName="pedagogy_feedback"
                scoreValue={formData.pedagogy_score}
                description="Kemampuan mengajar, menyampaikan materi, dan metode pembelajaran"
              />
              <FormSection
                title="👔 Profesionalisme"
                scoreName="professionalism_score" feedbackName="professionalism_feedback"
                scoreValue={formData.professionalism_score}
                description="Disiplin, etika kerja, tanggung jawab, dan pengembangan diri"
              />
              <FormSection
                title="😊 Kepribadian"
                scoreName="personality_score" feedbackName="personality_feedback"
                scoreValue={formData.personality_score}
                description="Sikap, perilaku, keramahan, dan hubungan interpersonal"
              />
              <FormSection
                title="🎯 Kepemimpinan"
                scoreName="leadership_score" feedbackName="leadership_feedback"
                scoreValue={formData.leadership_score}
                description="Kemampuan memimpin, menginspirasi, dan mengambil inisiatif"
              />

              <div className="bg-warning-container/30 p-4 rounded-xl">
                <label className="text-label-lg font-semibold text-on-warning-container block mb-2">📝 Catatan Tambahan (Opsional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows={2}
                  placeholder="Catatan umum untuk sesi evaluasi ini..."
                  className="w-full px-3 py-2 rounded-xl border border-warning/30 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-sm resize-none"
                />
              </div>

              <div className="bg-success-container/30 p-4 rounded-xl text-center">
                <p className="text-label-lg font-semibold text-on-success-container mb-3">📊 Ringkasan Nilai</p>
                <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-body-sm">
                  <span>📚 Pedagogi: <strong style={{ color: getScoreColor(formData.pedagogy_score) }} className="text-title-sm">{formData.pedagogy_score}</strong></span>
                  <span>👔 Profesionalisme: <strong style={{ color: getScoreColor(formData.professionalism_score) }} className="text-title-sm">{formData.professionalism_score}</strong></span>
                  <span>😊 Kepribadian: <strong style={{ color: getScoreColor(formData.personality_score) }} className="text-title-sm">{formData.personality_score}</strong></span>
                  <span>🎯 Kepemimpinan: <strong style={{ color: getScoreColor(formData.leadership_score) }} className="text-title-sm">{formData.leadership_score}</strong></span>
                  <span className="md:border-l md:border-outline-variant md:pl-5">
                    Rata-rata: <strong className="text-title-md text-success">
                      {((parseInt(formData.pedagogy_score) + parseInt(formData.professionalism_score) + parseInt(formData.personality_score) + parseInt(formData.leadership_score)) / 4).toFixed(1)}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex gap-sm pt-2 border-t border-outline-variant">
                <button type="submit" className="flex-1 inline-flex items-center justify-center gap-xs px-4 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all duration-200 shadow-sm text-label-lg font-medium">
                  <Save className="w-4 h-4" />
                  {editingId ? 'Perbarui Evaluasi' : 'Simpan Evaluasi'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2.5 rounded-full border border-outline text-on-surface-variant hover:bg-surface-dim transition-colors text-label-lg">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-xl">
        <div className="bg-gradient-to-br from-primary to-primary-container text-white rounded-xl p-4 text-center shadow-sm">
          <div className="text-headline-sm font-bold">{evaluations.length}</div>
          <div className="text-label-sm opacity-80">Total Sesi Evaluasi</div>
        </div>
        <div className="bg-gradient-to-br from-success to-success-container text-white rounded-xl p-4 text-center shadow-sm">
          <div className="text-headline-sm font-bold">
            {evaluations.length > 0 
              ? (evaluations.reduce((sum, ev) => sum + parseFloat(getAvgScore(ev)), 0) / evaluations.length).toFixed(1)
              : 0}
          </div>
          <div className="text-label-sm opacity-80">Rata-rata Nilai</div>
        </div>
        <div className="bg-gradient-to-br from-warning to-warning-container text-white rounded-xl p-4 text-center shadow-sm">
          <div className="text-headline-sm font-bold">{teachers.length}</div>
          <div className="text-label-sm opacity-80">Total Guru</div>
        </div>
      </div>

      {/* Evaluations Table */}
      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-outline-variant">
          <h2 className="text-title-md font-semibold text-on-surface flex items-center gap-sm">
            <Award className="w-5 h-5 text-primary" />
            Riwayat Evaluasi
          </h2>
        </div>

        {evaluations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-dim/50">
                  <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Tanggal</th>
                  <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Guru</th>
                  <th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Pedagogi</th>
                  <th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Profesional</th>
                  <th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Kepribadian</th>
                  <th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Kepemimpinan</th>
                  <th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Rata-rata</th>
                  <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Evaluator</th>
                  <th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map((ev, idx) => (
                  <tr key={ev.id} className={"border-t border-outline-variant/50 hover:bg-surface-dim/30 transition-colors " + (idx % 2 === 0 ? 'bg-surface' : 'bg-surface-dim/10')}>
                    <td className="px-4 py-3 text-body-sm text-on-surface">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-on-surface-variant" />
                        {new Date(ev.date).toLocaleDateString('id-ID')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white font-bold text-label-sm shrink-0">
                          {(ev.profiles?.full_name || ev.profiles?.email || 'G').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-body-sm font-medium text-on-surface">{ev.profiles?.full_name || ev.profiles?.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-body-sm font-bold" style={{ color: getScoreColor(ev.pedagogy_score) }}>{ev.pedagogy_score}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-body-sm font-bold" style={{ color: getScoreColor(ev.professionalism_score) }}>{ev.professionalism_score}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-body-sm font-bold" style={{ color: getScoreColor(ev.personality_score) }}>{ev.personality_score}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-body-sm font-bold" style={{ color: getScoreColor(ev.leadership_score) }}>{ev.leadership_score}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-label-sm font-bold text-white"
                        style={{ background: getScoreColor(Math.round(parseFloat(getAvgScore(ev)))) }}>
                        {getAvgScore(ev)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-on-surface-variant">{ev.admin?.full_name || 'Admin'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEditForm(ev)} className="p-1.5 rounded-full bg-primary-container/50 text-on-primary-container hover:bg-primary-container/80 transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(ev.id)} className="p-1.5 rounded-full bg-error-container/50 text-on-error-container hover:bg-error-container/80 transition-colors" title="Hapus">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Award className="w-16 h-16 mx-auto text-on-surface-variant/30 mb-4" />
            <p className="text-body-lg text-on-surface-variant mb-2">Belum ada evaluasi guru.</p>
            <p className="text-body-sm text-on-surface-variant/70">
              Klik tombol "Evaluasi Baru" untuk menambahkan evaluasi pertama.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherEvaluation;