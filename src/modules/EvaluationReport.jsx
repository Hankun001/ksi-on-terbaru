import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Award, Calendar, Users, Download, Printer, BookOpen, TrendingUp } from 'lucide-react';

const EvaluationReport = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [selectedAspect, setSelectedAspect] = useState('all');

  useEffect(() => {
    fetchClasses();
  }, [user]);

  useEffect(() => {
    if (selectedClass && selectedMonth) {
      fetchEvaluationReport();
    }
  }, [selectedClass, selectedMonth, selectedAspect]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, education_level, grade_level')
        .eq('teacher_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setClasses(data || []);
      if (data && data.length > 0 && !selectedClass) {
        setSelectedClass(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching classes:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluationReport = async () => {
    if (!selectedClass || !selectedMonth) return;

    try {
      setLoading(true);

      // Get evaluation data for the selected class and month
      const startDate = `${selectedMonth}-01`;
      const endDate = new Date(selectedMonth + '-01');
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      const endDateStr = endDate.toISOString().split('T')[0];

      let query = supabase
        .from('student_evaluations')
        .select(`
          id,
          date,
          aspect,
          score,
          note,
          student_id,
          profiles!student_evaluations_student_id_fkey (full_name, email),
          classes (name, education_level, grade_level)
        `)
        .eq('class_id', selectedClass)
        .gte('date', startDate)
        .lte('date', endDateStr)
        .order('date', { ascending: false });

      if (selectedAspect !== 'all') {
        query = query.eq('aspect', selectedAspect);
      }

      const { data: evaluations, error } = await query;

      if (error) throw error;

      // Process the data to create evaluation summary
      const studentMap = new Map();

      evaluations.forEach(eval_item => {
        const studentId = eval_item.student_id;
        const student = eval_item.profiles;

        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            id: studentId,
            name: student?.full_name || student?.email || 'Unknown',
            email: student?.email || '',
            evaluations: [],
            averageScore: 0,
            totalEvaluations: 0
          });
        }

        const studentData = studentMap.get(studentId);
        studentData.evaluations.push({
          id: eval_item.id,
          date: eval_item.date,
          aspect: eval_item.aspect,
          score: eval_item.score,
          note: eval_item.note
        });
      });

      // Calculate averages and process final data
      const processedReports = Array.from(studentMap.values()).map(student => {
        const totalScore = student.evaluations.reduce((sum, eval_item) => sum + eval_item.score, 0);
        student.averageScore = student.evaluations.length > 0 ? Math.round(totalScore / student.evaluations.length) : 0;
        student.totalEvaluations = student.evaluations.length;

        // Group evaluations by aspect
        const aspectScores = {};
        const aspects = ['attitude', 'knowledge', 'skill', 'character', 'creativity', 'cooperation'];

        aspects.forEach(aspect => {
          const aspectEvals = student.evaluations.filter(e => e.aspect === aspect);
          if (aspectEvals.length > 0) {
            const avgScore = Math.round(aspectEvals.reduce((sum, e) => sum + e.score, 0) / aspectEvals.length);
            aspectScores[aspect] = avgScore;
          } else {
            aspectScores[aspect] = null;
          }
        });

        student.aspectScores = aspectScores;
        return student;
      });

      // Sort by average score descending
      processedReports.sort((a, b) => b.averageScore - a.averageScore);

      setReports(processedReports);
    } catch (error) {
      console.error('Error fetching evaluation report:', error.message);
      alert('Error loading evaluation report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Penilaian Siswa - ${selectedMonth}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            .header { margin-bottom: 30px; }
            .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 20px; }
            .summary-item { background: #f5f5f5; padding: 10px; border-radius: 5px; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .score-high { color: green; font-weight: bold; }
            .score-medium { color: orange; font-weight: bold; }
            .score-low { color: red; font-weight: bold; }
            .aspect-scores { display: flex; gap: 10px; flex-wrap: wrap; }
            .aspect-item { font-size: 0.9em; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Laporan Penilaian Siswa</h1>
            <p><strong>Kelas:</strong> ${classes.find(c => c.id === selectedClass)?.name || 'Unknown'}</p>
            <p><strong>Bulan:</strong> ${new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}</p>
            <p><strong>Guru:</strong> ${user?.email || 'Unknown'}</p>
            <p><strong>Aspek:</strong> ${selectedAspect === 'all' ? 'Semua Aspek' : getAspectLabel(selectedAspect)}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <strong>Total Siswa</strong><br>${reports.length}
            </div>
            <div class="summary-item">
              <strong>Rata-rata Kelas</strong><br>${reports.length > 0 ? Math.round(reports.reduce((sum, r) => sum + r.averageScore, 0) / reports.length) : 0}
            </div>
            <div class="summary-item">
              <strong>Nilai Tertinggi</strong><br>${reports.length > 0 ? Math.max(...reports.map(r => r.averageScore)) : 0}
            </div>
            <div class="summary-item">
              <strong>Nilai Terendah</strong><br>${reports.length > 0 ? Math.min(...reports.map(r => r.averageScore)) : 0}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Siswa</th>
                <th>Rata-rata</th>
                <th>Total Penilaian</th>
                <th>Detail Aspek</th>
              </tr>
            </thead>
            <tbody>
              ${reports.map((student, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${student.name}</td>
                  <td class="${getScoreClass(student.averageScore)}">${student.averageScore}</td>
                  <td>${student.totalEvaluations}</td>
                  <td>
                    <div class="aspect-scores">
                      ${Object.entries(student.aspectScores).map(([aspect, score]) => `
                        <div class="aspect-item">
                          <strong>${getAspectLabel(aspect)}:</strong> ${score !== null ? `<span class="${getScoreClass(score)}">${score}</span>` : '-'}
                        </div>
                      `).join('')}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getAspectLabel = (aspect) => {
    const labels = {
      attitude: 'Sikap',
      knowledge: 'Pengetahuan',
      skill: 'Keterampilan',
      character: 'Karakter',
      creativity: 'Kreativitas',
      cooperation: 'Kerjasama'
    };
    return labels[aspect] || aspect;
  };

  const getScoreClass = (score) => {
    if (score >= 85) return 'score-high';
    if (score >= 70) return 'score-medium';
    return 'score-low';
  };

  const aspects = [
    { value: 'all', label: 'Semua Aspek' },
    { value: 'attitude', label: 'Sikap' },
    { value: 'knowledge', label: 'Pengetahuan' },
    { value: 'skill', label: 'Keterampilan' },
    { value: 'character', label: 'Karakter' },
    { value: 'creativity', label: 'Kreativitas' },
    { value: 'cooperation', label: 'Kerjasama' }
  ];

  if (loading && !reports.length) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <div>Memuat laporan penilaian...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>
            <Award size={28} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
            Laporan Penilaian Siswa
          </h1>
          <p>Rekapitulasi penilaian siswa per bulan</p>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Filters */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#92400e' }}>
            <BookOpen size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Filter Laporan
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="class">Kelas</label>
              <select
                id="class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">Pilih Kelas</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.education_level?.toUpperCase()} - Kelas {cls.grade_level})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="month">Bulan</label>
              <input
                type="month"
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="aspect">Aspek Penilaian</label>
              <select
                id="aspect"
                value={selectedAspect}
                onChange={(e) => setSelectedAspect(e.target.value)}
                style={{ width: '100%' }}
              >
                {aspects.map(aspect => (
                  <option key={aspect.value} value={aspect.value}>
                    {aspect.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {reports.length > 0 && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                onClick={printReport}
              >
                <Printer size={18} style={{ marginRight: '8px' }} />
                Cetak Laporan
              </button>
            </div>
          )}
        </div>

        {/* Reports Summary */}
        {reports.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#1e40af' }}>
              <TrendingUp size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Ringkasan Penilaian
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '1rem', background: 'white', borderRadius: '8px' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
                  {reports.length}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Total Siswa</div>
              </div>

              <div style={{ textAlign: 'center', padding: '1rem', background: 'white', borderRadius: '8px' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
                  {Math.round(reports.reduce((sum, r) => sum + r.averageScore, 0) / reports.length) || 0}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Rata-rata Kelas</div>
              </div>

              <div style={{ textAlign: 'center', padding: '1rem', background: 'white', borderRadius: '8px' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
                  {Math.max(...reports.map(r => r.averageScore)) || 0}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Nilai Tertinggi</div>
              </div>

              <div style={{ textAlign: 'center', padding: '1rem', background: 'white', borderRadius: '8px' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ea580c' }}>
                  {Math.min(...reports.map(r => r.averageScore)) || 0}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Nilai Terendah</div>
              </div>
            </div>
          </div>
        )}

        {/* Reports List */}
        <section className="dashboard-section">
          <h2>
            <Award size={20} style={{ marginRight: '8px' }} />
            Rekap Penilaian Bulan {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
            {selectedClass && ` - ${classes.find(c => c.id === selectedClass)?.name || 'Unknown'}`}
          </h2>

          {reports.length > 0 ? (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Siswa</th>
                    <th>Rata-rata</th>
                    <th>Total Penilaian</th>
                    <th>Sikap</th>
                    <th>Pengetahuan</th>
                    <th>Keterampilan</th>
                    <th>Karakter</th>
                    <th>Kreativitas</th>
                    <th>Kerjasama</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((student, index) => (
                    <tr key={student.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{student.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{student.email}</div>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 'bold',
                          color: student.averageScore >= 85 ? '#059669' : student.averageScore >= 70 ? '#ea580c' : '#dc2626'
                        }}>
                          {student.averageScore}
                        </span>
                      </td>
                      <td>{student.totalEvaluations}</td>
                      <td>{student.aspectScores.attitude !== null ? (
                        <span style={{
                          fontWeight: 'bold',
                          color: student.aspectScores.attitude >= 85 ? '#059669' : student.aspectScores.attitude >= 70 ? '#ea580c' : '#dc2626'
                        }}>
                          {student.aspectScores.attitude}
                        </span>
                      ) : '-'}</td>
                      <td>{student.aspectScores.knowledge !== null ? (
                        <span style={{
                          fontWeight: 'bold',
                          color: student.aspectScores.knowledge >= 85 ? '#059669' : student.aspectScores.knowledge >= 70 ? '#ea580c' : '#dc2626'
                        }}>
                          {student.aspectScores.knowledge}
                        </span>
                      ) : '-'}</td>
                      <td>{student.aspectScores.skill !== null ? (
                        <span style={{
                          fontWeight: 'bold',
                          color: student.aspectScores.skill >= 85 ? '#059669' : student.aspectScores.skill >= 70 ? '#ea580c' : '#dc2626'
                        }}>
                          {student.aspectScores.skill}
                        </span>
                      ) : '-'}</td>
                      <td>{student.aspectScores.character !== null ? (
                        <span style={{
                          fontWeight: 'bold',
                          color: student.aspectScores.character >= 85 ? '#059669' : student.aspectScores.character >= 70 ? '#ea580c' : '#dc2626'
                        }}>
                          {student.aspectScores.character}
                        </span>
                      ) : '-'}</td>
                      <td>{student.aspectScores.creativity !== null ? (
                        <span style={{
                          fontWeight: 'bold',
                          color: student.aspectScores.creativity >= 85 ? '#059669' : student.aspectScores.creativity >= 70 ? '#ea580c' : '#dc2626'
                        }}>
                          {student.aspectScores.creativity}
                        </span>
                      ) : '-'}</td>
                      <td>{student.aspectScores.cooperation !== null ? (
                        <span style={{
                          fontWeight: 'bold',
                          color: student.aspectScores.cooperation >= 85 ? '#059669' : student.aspectScores.cooperation >= 70 ? '#ea580c' : '#dc2626'
                        }}>
                          {student.aspectScores.cooperation}
                        </span>
                      ) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon"><Award size={48} /></span>
              <p>Belum ada data penilaian untuk periode yang dipilih.</p>
              <p>Pastikan Anda telah memilih kelas dan bulan dengan benar.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default EvaluationReport;