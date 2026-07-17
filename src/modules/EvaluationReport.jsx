import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Award, Printer, BookOpen, TrendingUp } from 'lucide-react';

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
            Laporan Penilaian Siswa
          </h1>
          <p className="text-body-md text-on-surface-variant mt-xs">Rekapitulasi penilaian siswa per bulan</p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        {/* Filters */}
        <div className="bg-warning-container/20 p-4 md:p-6 border-b border-outline-variant">
          <div className="flex items-center gap-sm mb-md">
            <BookOpen className="w-5 h-5 text-primary" />
            <h3 className="text-title-sm font-semibold text-on-surface m-0">Filter Laporan</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-label-lg font-medium text-on-surface mb-1.5">Kelas</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md"
              >
                <option value="">Pilih Kelas</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.education_level?.toUpperCase()} - Kelas {cls.grade_level})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-label-lg font-medium text-on-surface mb-1.5">Bulan</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md"
              />
            </div>
            <div>
              <label className="block text-label-lg font-medium text-on-surface mb-1.5">Aspek Penilaian</label>
              <select
                value={selectedAspect}
                onChange={(e) => setSelectedAspect(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md"
              >
                {aspects.map(aspect => (
                  <option key={aspect.value} value={aspect.value}>{aspect.label}</option>
                ))}
              </select>
            </div>
          </div>
          {reports.length > 0 && (
            <button onClick={printReport} className="mt-md inline-flex items-center gap-xs px-4 py-2 rounded-full border border-outline text-on-surface-variant hover:bg-surface-dim transition-colors text-label-lg">
              <Printer className="w-4 h-4" />
              Cetak Laporan
            </button>
          )}
        </div>

        {/* Summary */}
        {reports.length > 0 && (
          <div className="bg-info-container/20 p-4 md:p-6 border-b border-outline-variant">
            <h3 className="text-title-sm font-semibold text-on-surface flex items-center gap-sm mb-md">
              <TrendingUp className="w-5 h-5 text-primary" />
              Ringkasan Penilaian
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-surface rounded-xl p-4 text-center shadow-sm">
                <div className="text-headline-sm font-bold text-success">{reports.length}</div>
                <div className="text-label-sm text-on-surface-variant">Total Siswa</div>
              </div>
              <div className="bg-surface rounded-xl p-4 text-center shadow-sm">
                <div className="text-headline-sm font-bold text-success">
                  {Math.round(reports.reduce((sum, r) => sum + r.averageScore, 0) / reports.length) || 0}
                </div>
                <div className="text-label-sm text-on-surface-variant">Rata-rata Kelas</div>
              </div>
              <div className="bg-surface rounded-xl p-4 text-center shadow-sm">
                <div className="text-headline-sm font-bold text-error">{Math.max(...reports.map(r => r.averageScore)) || 0}</div>
                <div className="text-label-sm text-on-surface-variant">Nilai Tertinggi</div>
              </div>
              <div className="bg-surface rounded-xl p-4 text-center shadow-sm">
                <div className="text-headline-sm font-bold text-warning">{Math.min(...reports.map(r => r.averageScore)) || 0}</div>
                <div className="text-label-sm text-on-surface-variant">Nilai Terendah</div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Table */}
        <div className="p-4 md:p-6">
          <h2 className="text-title-md font-semibold text-on-surface flex items-center gap-sm mb-md">
            <Award className="w-5 h-5 text-primary" />
            Rekap Penilaian Bulan {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
            {selectedClass && ` - ${classes.find(c => c.id === selectedClass)?.name || ''}`}
          </h2>

          {reports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-dim/50">
                    <th className="text-left px-3 py-3 text-label-xs font-semibold text-on-surface-variant">No</th>
                    <th className="text-left px-3 py-3 text-label-xs font-semibold text-on-surface-variant">Nama Siswa</th>
                    <th className="text-center px-3 py-3 text-label-xs font-semibold text-on-surface-variant">Rata-rata</th>
                    <th className="text-center px-3 py-3 text-label-xs font-semibold text-on-surface-variant">Total</th>
                    <th className="text-center px-3 py-3 text-label-xs font-semibold text-on-surface-variant">Sikap</th>
                    <th className="text-center px-3 py-3 text-label-xs font-semibold text-on-surface-variant">Pengetahuan</th>
                    <th className="text-center px-3 py-3 text-label-xs font-semibold text-on-surface-variant">Ketrampilan</th>
                    <th className="text-center px-3 py-3 text-label-xs font-semibold text-on-surface-variant">Karakter</th>
                    <th className="text-center px-3 py-3 text-label-xs font-semibold text-on-surface-variant">Kreativitas</th>
                    <th className="text-center px-3 py-3 text-label-xs font-semibold text-on-surface-variant">Kerjasama</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((student, index) => {
                    const getScoreStyle = (score) => ({
                      color: score >= 85 ? 'var(--color-success, #10b981)' : score >= 70 ? 'var(--color-warning, #f59e0b)' : 'var(--color-error, #ef4444)',
                      fontWeight: 'bold'
                    });
                    return (
                      <tr key={student.id} className={"border-t border-outline-variant/50 hover:bg-surface-dim/30 transition-colors " + (index % 2 === 0 ? 'bg-surface' : 'bg-surface-dim/10')}>
                        <td className="px-3 py-3 text-body-sm text-on-surface-variant text-center">{index + 1}</td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-body-sm text-on-surface">{student.name}</div>
                          <div className="text-label-xs text-on-surface-variant">{student.email}</div>
                        </td>
                        <td className="px-3 py-3 text-center text-body-sm" style={getScoreStyle(student.averageScore)}>{student.averageScore}</td>
                        <td className="px-3 py-3 text-center text-body-sm text-on-surface-variant">{student.totalEvaluations}</td>
                        <td className="px-3 py-3 text-center text-body-sm">{student.aspectScores.attitude !== null ? <span style={getScoreStyle(student.aspectScores.attitude)}>{student.aspectScores.attitude}</span> : '-'}</td>
                        <td className="px-3 py-3 text-center text-body-sm">{student.aspectScores.knowledge !== null ? <span style={getScoreStyle(student.aspectScores.knowledge)}>{student.aspectScores.knowledge}</span> : '-'}</td>
                        <td className="px-3 py-3 text-center text-body-sm">{student.aspectScores.skill !== null ? <span style={getScoreStyle(student.aspectScores.skill)}>{student.aspectScores.skill}</span> : '-'}</td>
                        <td className="px-3 py-3 text-center text-body-sm">{student.aspectScores.character !== null ? <span style={getScoreStyle(student.aspectScores.character)}>{student.aspectScores.character}</span> : '-'}</td>
                        <td className="px-3 py-3 text-center text-body-sm">{student.aspectScores.creativity !== null ? <span style={getScoreStyle(student.aspectScores.creativity)}>{student.aspectScores.creativity}</span> : '-'}</td>
                        <td className="px-3 py-3 text-center text-body-sm">{student.aspectScores.cooperation !== null ? <span style={getScoreStyle(student.aspectScores.cooperation)}>{student.aspectScores.cooperation}</span> : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="w-16 h-16 mx-auto text-on-surface-variant/30 mb-4" />
              <p className="text-body-lg text-on-surface-variant mb-2">Belum ada data penilaian untuk periode yang dipilih.</p>
              <p className="text-body-sm text-on-surface-variant/70">Pastikan Anda telah memilih kelas dan bulan dengan benar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvaluationReport;