import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Award, Star, Plus, Save, FileText, Printer, X, AlertCircle, Trash2 } from 'lucide-react';

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
            Penilaian Siswa
          </h1>
          <p className="text-body-md text-on-surface-variant mt-xs">Evaluasi akademik dan non-akademik siswa</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-xs px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all duration-200 shadow-sm text-label-lg font-medium"
        >
          <Plus className="w-4 h-4" />
          Tambah Penilaian
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={resetForm}>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-title-md font-semibold text-white flex items-center gap-sm">
                <Star className="w-5 h-5" />
                Penilaian Siswa Baru
              </h2>
              <button onClick={resetForm} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-label-lg font-medium text-on-surface mb-1.5">Pilih Kelas <span className="text-error">*</span></label>
                <select
                  name="class_id"
                  value={formData.class_id}
                  onChange={handleClassChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.education_level?.toUpperCase()} - Kelas {cls.grade_level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-label-lg font-medium text-on-surface mb-1.5">Pilih Siswa <span className="text-error">*</span></label>
                <select
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleInputChange}
                  required
                  disabled={!selectedClass}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md disabled:opacity-60"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students.map(student => (
                    <option key={student.student_id} value={student.student_id}>
                      {student.profiles?.full_name || student.profiles?.email || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-lg font-medium text-on-surface mb-1.5">Tanggal <span className="text-error">*</span></label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md"
                  />
                </div>
                <div>
                  <label className="block text-label-lg font-medium text-on-surface mb-1.5">Aspek Penilaian <span className="text-error">*</span></label>
                  <select
                    name="aspect"
                    value={formData.aspect}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md"
                  >
                    {evaluationAspects.map(aspect => (
                      <option key={aspect.value} value={aspect.value}>{aspect.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-label-lg font-medium text-on-surface mb-1.5">Nilai (0-100) <span className="text-error">*</span></label>
                <input
                  type="range"
                  name="score"
                  min="0" max="100"
                  value={formData.score}
                  onChange={handleInputChange}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-label-xs text-on-surface-variant">0</span>
                  <span className="text-title-sm font-bold" style={{ color: getScoreColor(formData.score) }}>
                    {formData.score}
                  </span>
                  <span className="text-label-xs text-on-surface-variant">100</span>
                </div>
              </div>

              <div>
                <label className="block text-label-lg font-medium text-on-surface mb-1.5">Catatan</label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Feedback detail untuk siswa..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md resize-none"
                />
              </div>

              <div className="flex gap-sm pt-2 border-t border-outline-variant">
                <button type="submit" className="flex-1 inline-flex items-center justify-center gap-xs px-4 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all duration-200 shadow-sm text-label-lg font-medium">
                  <Save className="w-4 h-4" />
                  Simpan
                </button>
                <button type="button" onClick={resetForm} className="px-4 py-2.5 rounded-full border border-outline text-on-surface-variant hover:bg-surface-dim transition-colors text-label-lg">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evaluations List */}
      {evaluations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {evaluations.map(evaluation => (
            <div key={evaluation.id} className="bg-surface rounded-xl border border-outline-variant hover:border-primary/30 hover:shadow-md transition-all duration-300 p-4 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-title-sm font-semibold text-on-surface truncate">
                    {evaluation.profiles?.full_name || evaluation.profiles?.email || 'N/A'}
                  </h3>
                  <p className="text-label-sm text-on-surface-variant">
                    {evaluation.classes?.name || 'Kelas'} • {new Date(evaluation.date).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-title-sm shrink-0 ml-2"
                  style={{ background: getScoreColor(evaluation.score) }}>
                  {evaluation.score}
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-label-xs text-primary bg-primary-container/50 px-2.5 py-1 rounded-full">
                <Award className="w-3 h-3" />
                {getAspectLabel(evaluation.aspect)}
              </span>

              {evaluation.note && (
                <div className="mt-3 bg-warning-container/30 p-3 rounded-lg">
                  <p className="text-body-sm text-on-warning-container flex items-start gap-1.5">
                    <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                    {evaluation.note.substring(0, 100)}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-outline-variant opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
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
                  className="p-2 rounded-full bg-primary-container text-on-primary-container hover:bg-primary-container/80 transition-colors"
                  title="Edit"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={() => printEvaluationReport(evaluation)}
                  className="p-2 rounded-full bg-surface-dim hover:bg-surface-dim/80 transition-colors text-on-surface-variant"
                  title="Cetak"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(evaluation.id)}
                  className="p-2 rounded-full bg-error-container text-on-error-container hover:bg-error-container/80 transition-colors"
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-surface rounded-2xl border border-outline-variant">
          <Award className="w-16 h-16 mx-auto text-on-surface-variant/30 mb-4" />
          <p className="text-body-lg text-on-surface-variant mb-2">Belum ada penilaian siswa.</p>
          <p className="text-body-sm text-on-surface-variant/70">
            Klik tombol "Tambah Penilaian" untuk mulai mengevaluasi siswa.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentEvaluation;