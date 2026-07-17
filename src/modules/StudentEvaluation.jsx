import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Award, BookOpen, Star, Plus, Save, BarChart3, FileText, Printer } from 'lucide-react';

const StudentEvaluation = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [formData, setFormData] = useState({
    student_id: '',
    class_id: '',
    date: new Date().toISOString().split('T')[0],
    aspect: 'knowledge',
    score: 75,
    note: ''
  });

  // Evaluation aspects with Indonesian names
  const evaluationAspects = [
    { value: 'attitude', label: 'Sikap dan Perilaku' },
    { value: 'knowledge', label: 'Pengetahuan' },
    { value: 'skill', label: 'Keterampilan' },
    { value: 'character', label: 'Karakter' },
    { value: 'creativity', label: 'Kreativitas' },
    { value: 'cooperation', label: 'Kerjasama' }
  ];

  useEffect(() => {
    fetchClasses();
    fetchEvaluations();
  }, [user]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluations = async () => {
    try {
      const { data, error } = await supabase
        .from('student_evaluations')
        .select(`
          *,
          classes (name, education_level, grade_level),
          profiles!student_id (full_name, email)
        `)
        .eq('teacher_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setEvaluations(data || []);
    } catch (error) {
      console.error('Error fetching evaluations:', error.message);
    }
  };

  const fetchClassStudents = async (classId) => {
    try {
      const { data, error } = await supabase
        .from('class_students')
        .select(`
          student_id,
          profiles (id, full_name, email)
        `)
        .eq('class_id', classId);

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error.message);
      setStudents([]);
    }
  };

  const handleClassChange = (e) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    setFormData(prev => ({ ...prev, class_id: classId, student_id: '' }));
    if (classId) {
      fetchClassStudents(classId);
    } else {
      setStudents([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('student_evaluations')
        .insert([{
          teacher_id: user.id,
          student_id: formData.student_id,
          class_id: formData.class_id,
          date: formData.date,
          aspect: formData.aspect,
          score: parseInt(formData.score),
          note: formData.note
        }]);

      if (error) throw error;
      alert('Penilaian berhasil disimpan!');
      setShowForm(false);
      resetForm();
      fetchEvaluations();
    } catch (error) {
      console.error('Error saving evaluation:', error.message);
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus penilaian ini?')) return;
    
    try {
      const { error } = await supabase
        .from('student_evaluations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchEvaluations();
      alert('Penilaian berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting evaluation:', error.message);
      alert('Error: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      class_id: '',
      date: new Date().toISOString().split('T')[0],
      aspect: 'knowledge',
      score: 75,
      note: ''
    });
    setSelectedClass('');
    setStudents([]);
    setShowForm(false);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981'; // green
    if (score >= 80) return '#3b82f6'; // blue
    if (score >= 70) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const getAspectLabel = (aspectValue) => {
    const aspect = evaluationAspects.find(a => a.value === aspectValue);
    return aspect ? aspect.label : aspectValue;
  };

  const printEvaluationReport = (evaluation) => {
    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Penilaian Siswa - ${evaluation.date}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #8b5cf6; margin-bottom: 5px; }
            .info { margin-bottom: 20px; }
            .info p { margin: 5px 0; }
            .score-display { 
              text-align: center; 
              margin: 30px 0; 
              padding: 20px;
              border: 3px solid #8b5cf6;
              border-radius: 10px;
            }
            .score-display .score { 
              font-size: 48px; 
              font-weight: bold; 
              color: #8b5cf6;
            }
            .score-display .aspect { 
              font-size: 18px; 
              color: #666; 
              margin-top: 10px;
            }
            .section { margin-top: 20px; }
            .section-title { font-weight: bold; border-bottom: 2px solid #8b5cf6; padding-bottom: 5px; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SHEET PENILAIAN SISWA</h1>
            <p>PKBM - Sistem Administrasi Pendidikan</p>
          </div>
          <div class="info">
            <p><strong>Nama Siswa:</strong> ${evaluation.profiles?.full_name || evaluation.profiles?.email || 'N/A'}</p>
            <p><strong>Kelas:</strong> ${evaluation.classes?.name || 'N/A'}</p>
            <p><strong>Tanggal:</strong> ${new Date(evaluation.date).toLocaleDateString('id-ID')}</p>
            <p><strong>Guru:</strong> ${profile?.display_name || 'Guru'}</p>
          </div>
          <div class="score-display">
            <div class="score" style="color: ${getScoreColor(evaluation.score)}">${evaluation.score}</div>
            <div class="aspect">${getAspectLabel(evaluation.aspect)}</div>
          </div>
          ${evaluation.note ? `
            <div class="section">
              <div class="section-title">Catatan</div>
              <p>${evaluation.note}</p>
            </div>
          ` : ''}
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
    return <div className="dashboard-container">Memuat penilaian...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>
            <Award size={28} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
            Penilaian Siswa
          </h1>
          <p>Evaluasi akademik dan non-akademik siswa</p>
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
            Tambah Penilaian
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="form-container">
          <h2>Penilaian Siswa Baru</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="class_id">Pilih Kelas <span style={{ color: 'red' }}>*</span></label>
              <select
                id="class_id"
                name="class_id"
                value={formData.class_id}
                onChange={handleClassChange}
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
              <label htmlFor="student_id">Pilih Siswa <span style={{ color: 'red' }}>*</span></label>
              <select
                id="student_id"
                name="student_id"
                value={formData.student_id}
                onChange={handleInputChange}
                required
                disabled={!selectedClass}
              >
                <option value="">-- Pilih Siswa --</option>
                {students.map(student => (
                  <option key={student.student_id} value={student.student_id}>
                    {student.profiles?.full_name || student.profiles?.email || 'N/A'}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                <label htmlFor="aspect">Aspek Penilaian <span style={{ color: 'red' }}>*</span></label>
                <select
                  id="aspect"
                  name="aspect"
                  value={formData.aspect}
                  onChange={handleInputChange}
                  required
                >
                  {evaluationAspects.map(aspect => (
                    <option key={aspect.value} value={aspect.value}>
                      {aspect.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="score">Nilai (0-100) <span style={{ color: 'red' }}>*</span></label>
              <input
                type="range"
                id="score"
                name="score"
                min="0"
                max="100"
                value={formData.score}
                onChange={handleInputChange}
                style={{ width: '100%', marginTop: '0.5rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#6b7280' }}>
                <span>0</span>
                <span style={{ color: getScoreColor(formData.score), fontWeight: 'bold', fontSize: '1.125rem' }}>
                  {formData.score}
                </span>
                <span>100</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="note">Catatan</label>
              <textarea
                id="note"
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                rows="3"
                placeholder="Feedback detail untuk siswa..."
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                <Save size={18} style={{ marginRight: '8px' }} />
                Simpan
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Evaluations List */}
      <div className="dashboard-content">
        {evaluations.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {evaluations.map(evaluation => (
              <div key={evaluation.id} className="card">
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '1rem' 
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem' }}>
                      {evaluation.profiles?.full_name || evaluation.profiles?.email || 'N/A'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                      {evaluation.classes?.name || 'Kelas'} • {new Date(evaluation.date).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: getScoreColor(evaluation.score),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.25rem'
                  }}>
                    {evaluation.score}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <span style={{
                    background: '#f5f3ff',
                    color: '#7c3aed',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    <Award size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    {getAspectLabel(evaluation.aspect)}
                  </span>
                </div>

                {evaluation.note && (
                  <div style={{ 
                    background: '#fef3c7',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>
                      <FileText size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                      {evaluation.note.substring(0, 100)}...
                    </p>
                  </div>
                )}

                <div className="card-actions">
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setFormData({
                        student_id: evaluation.student_id,
                        class_id: evaluation.class_id,
                        date: evaluation.date,
                        aspect: evaluation.aspect,
                        score: evaluation.score,
                        note: evaluation.note || ''
                      });
                      setSelectedClass(evaluation.class_id);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => printEvaluationReport(evaluation)}
                  >
                    <Printer size={16} />
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(evaluation.id)}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon"><Award size={48} /></span>
            <p>Belum ada penilaian siswa.</p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Klik tombol "Tambah Penilaian" untuk mulai mengevaluasi siswa.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentEvaluation;