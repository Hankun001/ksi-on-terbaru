import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Award, Star, Users, Calendar, Filter, Printer, Save, Trash2, Edit2, X } from 'lucide-react';

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

  const FormSection = ({ title, icon, color, name, scoreValue, feedbackValue, description }) => (
    <div style={{ 
      background: '#f5f3ff', 
      padding: '1.25rem', 
      borderRadius: '12px', 
      marginBottom: '1.25rem',
      border: `2px solid ${color}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ margin: 0, color: color, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
          {icon} {title}
        </h4>
      </div>
      
      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <label style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '0.4rem', display: 'block' }}>
          Nilai (1-5)
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <input
            type="range"
            name={name}
            min="1"
            max="5"
            value={scoreValue}
            onChange={handleFormChange}
            style={{ flex: 1 }}
          />
          <span style={{ 
            fontSize: '1.25rem', 
            fontWeight: 'bold',
            color: getScoreColor(scoreValue),
            minWidth: '60px',
            textAlign: 'center'
          }}>
            ⭐ {scoreValue}
          </span>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.4rem', marginBottom: 0 }}>
          {description}
        </p>
      </div>

      <div className="form-group" style={{ margin: 0 }}>
        <label style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '0.4rem', display: 'block' }}>
          Umpan Balik (Opsional)
        </label>
        <textarea
          name={feedbackValue}
          value={formData[feedbackValue]}
          onChange={handleFormChange}
          rows="2"
          placeholder={`Saran untuk peningkatan ${title.toLowerCase()}...`}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem' }}
        />
      </div>
    </div>
  );

  if (loading) {
    return <div className="dashboard-container">
      <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
        <div style={{ fontSize: '1.2rem' }}>Memuat evaluasi...</div>
      </div>
    </div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>
            <Award size={28} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
            Evaluasi Pengajar
          </h1>
          <p>Penilaian kinerja guru dengan 4 aspek sekaligus dalam satu sesi</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-primary"
            onClick={openNewForm}
          >
            <Star size={18} style={{ marginRight: '8px' }} />
            Evaluasi Baru
          </button>
          <button 
            className="btn btn-secondary"
            onClick={printEvaluationSummary}
            disabled={evaluations.length === 0}
          >
            <Printer size={18} style={{ marginRight: '8px' }} />
            Cetak Rekap
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <Filter size={20} style={{ marginRight: '8px', color: '#8b5cf6' }} />
          <h3 style={{ margin: 0, color: '#7c3aed', fontSize: '1rem' }}>Filter Evaluasi</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="teacher_id">Guru</label>
            <select
              id="teacher_id"
              name="teacher_id"
              value={filter.teacher_id}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
            >
              <option value="">Semua Guru</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.full_name || t.email}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="date_from">Dari Tanggal</label>
            <input
              type="date"
              id="date_from"
              name="date_from"
              value={filter.date_from}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="date_to">Sampai Tanggal</label>
            <input
              type="date"
              id="date_to"
              name="date_to"
              value={filter.date_to}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>
        </div>

        <button className="btn btn-secondary" onClick={clearFilters} style={{ marginTop: '1rem' }}>
          Hapus Filter
        </button>
      </div>

      {/* Evaluation Form Modal */}
      {showForm && (
        <div className="form-container" style={{ maxWidth: '850px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={22} />
              {editingId ? 'Edit Evaluasi Guru' : 'Evaluasi Guru Baru'}
            </h2>
            <button 
              onClick={() => { setShowForm(false); setEditingId(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
            >
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label htmlFor="teacher_id">Pilih Guru <span style={{ color: 'red' }}>*</span></label>
                <select
                  id="teacher_id"
                  name="teacher_id"
                  value={formData.teacher_id}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">-- Pilih Guru --</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name || teacher.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="date">Tanggal Evaluasi <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>

            {/* All 4 criteria */}
            <FormSection 
              title="Pedagogi" icon="📚" color="#8b5cf6"
              name="pedagogy_score" feedbackValue="pedagogy_feedback"
              scoreValue={formData.pedagogy_score}
              description="Kemampuan mengajar, menyampaikan materi, dan metode pembelajaran"
            />

            <FormSection 
              title="Profesionalisme" icon="👔" color="#3b82f6"
              name="professionalism_score" feedbackValue="professionalism_feedback"
              scoreValue={formData.professionalism_score}
              description="Disiplin, etika kerja, tanggung jawab, dan pengembangan diri"
            />

            <FormSection 
              title="Kepribadian" icon="😊" color="#10b981"
              name="personality_score" feedbackValue="personality_feedback"
              scoreValue={formData.personality_score}
              description="Sikap, perilaku, keramahan, dan hubungan interpersonal"
            />

            <FormSection 
              title="Kepemimpinan" icon="🎯" color="#f59e0b"
              name="leadership_score" feedbackValue="leadership_feedback"
              scoreValue={formData.leadership_score}
              description="Kemampuan memimpin, menginspirasi, dan mengambil inisiatif"
            />

            {/* Notes */}
            <div style={{ 
              background: '#fef3c7', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1rem'
            }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 600, color: '#92400e' }}>
                  📝 Catatan Tambahan (Opsional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows="2"
                  placeholder="Catatan umum untuk sesi evaluasi ini..."
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd', marginTop: '0.5rem' }}
                />
              </div>
            </div>

            {/* Score preview */}
            <div style={{ 
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#059669' }}>
                📊 Ringkasan Nilai
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <span>📚 Pedagogi: <strong style={{ color: getScoreColor(formData.pedagogy_score) }}>{formData.pedagogy_score}</strong></span>
                <span>👔 Profesionalisme: <strong style={{ color: getScoreColor(formData.professionalism_score) }}>{formData.professionalism_score}</strong></span>
                <span>😊 Kepribadian: <strong style={{ color: getScoreColor(formData.personality_score) }}>{formData.personality_score}</strong></span>
                <span>🎯 Kepemimpinan: <strong style={{ color: getScoreColor(formData.leadership_score) }}>{formData.leadership_score}</strong></span>
                <span style={{ borderLeft: '2px solid #059669', paddingLeft: '1rem' }}>
                  Rata-rata: <strong style={{ fontSize: '1.2rem', color: '#059669' }}>
                    {((parseInt(formData.pedagogy_score) + parseInt(formData.professionalism_score) + parseInt(formData.personality_score) + parseInt(formData.leadership_score)) / 4).toFixed(1)}
                  </strong>
                </span>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                <Save size={18} style={{ marginRight: '8px' }} />
                {editingId ? 'Perbarui Evaluasi' : 'Simpan Evaluasi'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white',
          padding: '1.25rem',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem' }}>{evaluations.length}</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>Total Sesi Evaluasi</p>
        </div>
        <div style={{ 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '1.25rem',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem' }}>
            {evaluations.length > 0 
              ? (evaluations.reduce((sum, ev) => sum + parseFloat(getAvgScore(ev)), 0) / evaluations.length).toFixed(1)
              : 0}
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>Rata-rata Nilai</p>
        </div>
        <div style={{ 
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          padding: '1.25rem',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem' }}>
            {teachers.length}
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>Total Guru</p>
        </div>
      </div>

      {/* Evaluations Table */}
      <div className="dashboard-content">
        <section className="dashboard-section">
          <h2>
            <Award size={20} style={{ marginRight: '8px' }} />
            Riwayat Evaluasi
          </h2>

          {evaluations.length > 0 ? (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Guru</th>
                    <th style={{ textAlign: 'center' }}>📚 Pedagogi</th>
                    <th style={{ textAlign: 'center' }}>👔 Profesional</th>
                    <th style={{ textAlign: 'center' }}>😊 Kepribadian</th>
                    <th style={{ textAlign: 'center' }}>🎯 Kepemimpinan</th>
                    <th style={{ textAlign: 'center' }}>Rata-rata</th>
                    <th>Evaluator</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map(ev => (
                    <tr key={ev.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Calendar size={14} />
                          {new Date(ev.date).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Users size={16} />
                          <strong>{ev.profiles?.full_name || ev.profiles?.email}</strong>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ color: getScoreColor(ev.pedagogy_score), fontWeight: 'bold' }}>
                          {ev.pedagogy_score}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ color: getScoreColor(ev.professionalism_score), fontWeight: 'bold' }}>
                          {ev.professionalism_score}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ color: getScoreColor(ev.personality_score), fontWeight: 'bold' }}>
                          {ev.personality_score}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ color: getScoreColor(ev.leadership_score), fontWeight: 'bold' }}>
                          {ev.leadership_score}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          fontSize: '1.1rem', 
                          fontWeight: 'bold',
                          color: getScoreColor(Math.round(parseFloat(getAvgScore(ev))))
                        }}>
                          {getAvgScore(ev)}
                        </span>
                      </td>
                      <td>{ev.admin?.full_name || 'Admin'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => openEditForm(ev)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '4px' }}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(ev.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon"><Award size={48} /></span>
              <p>Belum ada evaluasi guru.</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Klik tombol "Evaluasi Baru" untuk menambahkan evaluasi pertama.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TeacherEvaluation;