import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Printer, FileText, Calendar, BookOpen, Award, TrendingUp, BarChart2, Eye } from 'lucide-react';

const ReportsModule = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('attendance');
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  const reportTypes = [
    { id: 'attendance', name: 'Rekap Absensi', icon: Eye, desc: 'Laporan kehadiran siswa per sesi mengajar' },
    { id: 'grades', name: 'Rekap Penilaian', icon: Award, desc: 'Laporan nilai dan evaluasi siswa' },
    { id: 'teacher', name: 'Evaluasi Guru', icon: Award, desc: 'Laporan sesi evaluasi guru (4 aspek)' },
    { id: 'classes', name: 'Daftar Kelas', icon: BookOpen, desc: 'Data lengkap semua kelas' },
    { id: 'activity', name: 'Aktivitas Mengajar', icon: TrendingUp, desc: 'Log aktivitas mengajar harian' }
  ];

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let data = [];
      
      switch (reportType) {
        case 'attendance':
          const { data: journals } = await supabase
            .from('teaching_journals')
            .select(`
              *,
              student_attendance (student_id, status),
              classes (name),
              profiles!teacher_id (full_name)
            `)
            .order('date', { ascending: false });
          data = journals || [];
          break;

        case 'grades':
          const { data: evaluations } = await supabase
            .from('student_evaluations')
            .select(`
              *,
              classes (name),
              profiles!student_id (full_name, email)
            `)
            .order('date', { ascending: false });
          data = evaluations || [];
          break;

        case 'teacher':
          const { data: teacherEvals } = await supabase
            .from('teacher_evaluation_sessions')
            .select(`
              *,
              profiles!teacher_id (full_name, email),
              admin:profiles!admin_id (full_name)
            `)
            .order('date', { ascending: false });
          data = teacherEvals || [];
          break;

        case 'classes':
          const { data: classes } = await supabase
            .from('classes')
            .select(`
              *,
              profiles!teacher_id (full_name, email),
              class_students (student_id)
            `)
            .order('name');
          data = classes || [];
          break;

        case 'activity':
          const { data: journalsActivity } = await supabase
            .from('teaching_journals')
            .select(`
              *,
              profiles!teacher_id (full_name),
              classes (name)
            `)
            .order('created_at', { ascending: false })
            .limit(50);
          data = journalsActivity || [];
          break;
      }

      setReportData(data);
    } catch (error) {
      console.error('Error fetching report:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    await fetchReportData();
  };

  const getTeacherAvgScore = (ev) => {
    if (!ev) return '0';
    const total = (ev.pedagogy_score || 0) + (ev.professionalism_score || 0) + 
                  (ev.personality_score || 0) + (ev.leadership_score || 0);
    return (total / 4).toFixed(1);
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    const selectedReport = reportTypes.find(r => r.id === reportType);
    const now = new Date().toLocaleString('id-ID');

    let content = '';

    switch (reportType) {
      case 'attendance':
        content = `
          <h2>Laporan Absensi Siswa</h2>
          <p>Periode: ${dateRange.start || 'Semua'} s/d ${dateRange.end || 'Sekarang'}</p>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Guru</th>
                <th>Kelas</th>
                <th>Mata Pelajaran</th>
                <th>Total Hadir</th>
                <th>Total Alpha</th>
              </tr>
            </thead>
            <tbody>
              ${(reportData || []).map((journal, idx) => {
                const hadir = journal.student_attendance?.filter(a => a.status === 'hadir').length || 0;
                const absent = journal.student_attendance?.filter(a => a.status === 'absent').length || 0;
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${new Date(journal.date).toLocaleDateString('id-ID')}</td>
                    <td>${journal.profiles?.full_name || 'N/A'}</td>
                    <td>${journal.classes?.name || 'N/A'}</td>
                    <td>${journal.subject}</td>
                    <td style="color: #10b981; font-weight: bold;">${hadir}</td>
                    <td style="color: #ef4444; font-weight: bold;">${absent}</td>
                  </tr>
                `;
              })}
            </tbody>
          </table>
        `;
        break;

      case 'grades':
        content = `
          <h2>Laporan Penilaian Siswa</h2>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Siswa</th>
                <th>Kelas</th>
                <th>Aspek</th>
                <th>Nilai</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${(reportData || []).map((ev, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${new Date(ev.date).toLocaleDateString('id-ID')}</td>
                  <td>${ev.profiles?.full_name || ev.profiles?.email || 'N/A'}</td>
                  <td>${ev.classes?.name || 'N/A'}</td>
                  <td>${ev.aspect}</td>
                  <td style="font-weight: bold; color: #8b5cf6">${ev.score}</td>
                  <td>${ev.note ? (ev.note.substring(0, 30) + (ev.note.length > 30 ? '...' : '')) : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;

      case 'teacher':
        content = `
          <h2>Laporan Evaluasi Guru (4 Aspek)</h2>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Nama Guru</th>
                <th>📚 Pedagogi</th>
                <th>👔 Profesional</th>
                <th>😊 Kepribadian</th>
                <th>🎯 Kepemimpinan</th>
                <th>Rata-rata</th>
                <th>Evaluator</th>
              </tr>
            </thead>
            <tbody>
              ${(reportData || []).map((ev, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${new Date(ev.date).toLocaleDateString('id-ID')}</td>
                  <td><strong>${ev.profiles?.full_name || ev.profiles?.email}</strong></td>
                  <td style="text-align: center;">${ev.pedagogy_score}</td>
                  <td style="text-align: center;">${ev.professionalism_score}</td>
                  <td style="text-align: center;">${ev.personality_score}</td>
                  <td style="text-align: center;">${ev.leadership_score}</td>
                  <td style="text-align: center; font-weight: bold; font-size: 16px;">${getTeacherAvgScore(ev)}</td>
                  <td>${ev.admin?.full_name || 'Admin'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;

      case 'classes':
        content = `
          <h2>Daftar Kelas</h2>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Kelas</th>
                <th>Jenjang</th>
                <th>Tingkat</th>
                <th>Wali Kelas</th>
                <th>Jumlah Siswa</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${(reportData || []).map((cls, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${cls.name}</strong></td>
                  <td>${cls.education_level?.toUpperCase() || 'N/A'}</td>
                  <td>Kelas ${cls.grade_level || 'N/A'}</td>
                  <td>${cls.profiles?.full_name || 'Belum ditetapkan'}</td>
                  <td>${cls.class_students?.length || 0}</td>
                  <td>${cls.is_active ? '✅ Aktif' : '❌ Non-aktif'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;

      case 'activity':
        content = `
          <h2>Laporan Aktivitas Mengajar</h2>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Guru</th>
                <th>Kelas</th>
                <th>Mata Pelajaran</th>
                <th>Durasi</th>
                <th>Metode</th>
              </tr>
            </thead>
            <tbody>
              ${(reportData || []).map((j, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${new Date(j.date || j.created_at).toLocaleDateString('id-ID')}</td>
                  <td>${j.profiles?.full_name || 'N/A'}</td>
                  <td>${j.classes?.name || 'N/A'}</td>
                  <td>${j.subject}</td>
                  <td>${j.duration_minutes || 0} menit</td>
                  <td>${j.teaching_method || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedReport?.name || 'Laporan'} - PKBM</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #8b5cf6; padding-bottom: 20px; }
            .header h1 { color: #8b5cf6; margin-bottom: 5px; }
            .meta { display: flex; justify-content: space-between; margin: 20px 0; font-size: 0.875rem; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f3ff; }
            tr:nth-child(even) { background-color: #fafafa; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 15px; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${selectedReport?.name || 'Laporan'}</h1>
            <p>PKBM - Sistem Administrasi Pendidikan</p>
          </div>
          <div class="meta">
            <p><strong>Dicetak:</strong> ${now}</p>
            <p><strong>Total Data:</strong> ${reportData?.length || 0} record</p>
          </div>
          ${content}
          <div class="footer">
            Dicetak oleh sistem KSI-ON pada ${now}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-xl">
        <div>
          <h1 className="text-headline-sm md:text-headline-md font-bold text-on-surface flex items-center gap-sm">
            <FileText className="w-7 h-7 text-primary" />
            Laporan & Cetak
          </h1>
          <p className="text-body-md text-on-surface-variant mt-xs">Generasi laporan printable untuk administrasi PKBM</p>
        </div>
      </div>

      {/* Report Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-xl">
        {reportTypes.map(type => {
          const Icon = type.icon;
          const isSelected = reportType === type.id;
          return (
            <div
              key={type.id}
              onClick={() => setReportType(type.id)}
              className={"rounded-xl p-5 cursor-pointer border-2 transition-all duration-200 hover:shadow-md " + 
                (isSelected 
                  ? 'border-primary bg-primary-container/30 shadow-sm -translate-y-0.5' 
                  : 'border-outline-variant bg-surface hover:border-primary/50 hover:bg-surface-dim/20')}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={"w-10 h-10 rounded-lg flex items-center justify-center transition-colors " +
                  (isSelected ? 'bg-primary text-on-primary' : 'bg-surface-dim text-primary')}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className={"text-title-sm font-semibold m-0 " + (isSelected ? 'text-primary' : 'text-on-surface')}>
                  {type.name}
                </h3>
              </div>
              <p className="text-body-sm text-on-surface-variant m-0">{type.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Date Range Filter */}
      <div className="bg-surface-container-low rounded-2xl p-4 md:p-5 mb-xl border border-outline-variant">
        <h3 className="text-title-sm font-semibold text-on-surface mb-4 flex items-center gap-sm">
          <Calendar className="w-5 h-5 text-primary" />
          Filter Tanggal (Opsional)
        </h3>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-label-lg font-medium text-on-surface mb-1.5">Dari Tanggal</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-label-lg font-medium text-on-surface mb-1.5">Sampai Tanggal</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md"
            />
          </div>
          <button onClick={generateReport} className="inline-flex items-center gap-xs px-4 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all duration-200 shadow-sm text-label-lg font-medium shrink-0">
            <BarChart2 className="w-4 h-4" />
            Generate
          </button>
        </div>
      </div>

      {/* Report Preview */}
      {reportData && (
        <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
          {/* Preview Banner */}
          <div className="bg-gradient-to-r from-primary to-primary-container px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-title-md font-semibold text-white flex items-center gap-sm m-0">
                <Printer className="w-5 h-5" />
                Preview Laporan
              </h2>
              <p className="text-body-sm text-white/80 mt-1">
                {reportTypes.find(r => r.id === reportType)?.desc} • Total: {reportData.length} record
              </p>
            </div>
            <button onClick={printReport} className="inline-flex items-center gap-xs px-4 py-2 rounded-full bg-white text-primary hover:bg-white/90 transition-all text-label-lg font-medium shadow-sm">
              <Printer className="w-4 h-4" />
              Cetak Sekarang
            </button>
          </div>

          {/* Data Preview Table */}
          <div className="p-4 md:p-6">
            <h3 className="text-title-sm font-semibold text-on-surface flex items-center gap-sm mb-md">
              <Eye className="w-5 h-5 text-primary" />
              Preview Data
            </h3>

            {reportData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-dim/50">
                      {reportType === 'attendance' && (
                        <><th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Tanggal</th><th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Guru</th><th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Kelas</th><th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Mata Pelajaran</th><th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Hadir</th><th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Alpha</th></>
                      )}
                      {reportType === 'grades' && (
                        <><th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Tanggal</th><th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Siswa</th><th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Kelas</th><th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Aspek</th><th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Nilai</th></>
                      )}
                      {reportType === 'teacher' && (
                        <><th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Tanggal</th><th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Guru</th><th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">📚</th><th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">👔</th><th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">😊</th><th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">🎯</th><th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Rata</th></>
                      )}
                      {reportType === 'classes' && (
                        <><th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Nama Kelas</th><th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Jenjang</th><th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Tingkat</th><th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Wali Kelas</th><th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Siswa</th><th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Status</th></>
                      )}
                      {reportType === 'activity' && (
                        <><th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Tanggal</th><th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Guru</th><th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Kelas</th><th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Mata Pelajaran</th><th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Durasi</th></>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.slice(0, 20).map((item, idx) => {
                      const rowClass = "border-t border-outline-variant/50 hover:bg-surface-dim/30 transition-colors " + (idx % 2 === 0 ? 'bg-surface' : 'bg-surface-dim/10');
                      switch (reportType) {
                        case 'attendance':
                          return (
                            <tr key={item.id || idx} className={rowClass}>
                              <td className="px-4 py-3 text-body-sm">{new Date(item.date).toLocaleDateString('id-ID')}</td>
                              <td className="px-4 py-3 text-body-sm">{item.profiles?.full_name || 'N/A'}</td>
                              <td className="px-4 py-3 text-body-sm">{item.classes?.name || 'N/A'}</td>
                              <td className="px-4 py-3 text-body-sm">{item.subject}</td>
                              <td className="px-4 py-3 text-center text-body-sm font-semibold text-success">
                                {item.student_attendance?.filter(a => a.status === 'hadir').length || 0}
                              </td>
                              <td className="px-4 py-3 text-center text-body-sm font-semibold text-error">
                                {item.student_attendance?.filter(a => a.status === 'absent').length || 0}
                              </td>
                            </tr>
                          );
                        case 'grades':
                          return (
                            <tr key={item.id || idx} className={rowClass}>
                              <td className="px-4 py-3 text-body-sm">{new Date(item.date).toLocaleDateString('id-ID')}</td>
                              <td className="px-4 py-3 text-body-sm">{item.profiles?.full_name || item.profiles?.email || 'N/A'}</td>
                              <td className="px-4 py-3 text-body-sm">{item.classes?.name || 'N/A'}</td>
                              <td className="px-4 py-3 text-body-sm">{item.aspect}</td>
                              <td className="px-4 py-3 text-center text-body-sm font-bold text-primary">{item.score}</td>
                            </tr>
                          );
                        case 'teacher':
                          return (
                            <tr key={item.id || idx} className={rowClass}>
                              <td className="px-4 py-3 text-body-sm">{new Date(item.date).toLocaleDateString('id-ID')}</td>
                              <td className="px-4 py-3 text-body-sm">{item.profiles?.full_name || item.profiles?.email}</td>
                              <td className="px-4 py-3 text-center text-body-sm">{item.pedagogy_score}</td>
                              <td className="px-4 py-3 text-center text-body-sm">{item.professionalism_score}</td>
                              <td className="px-4 py-3 text-center text-body-sm">{item.personality_score}</td>
                              <td className="px-4 py-3 text-center text-body-sm">{item.leadership_score}</td>
                              <td className="px-4 py-3 text-center text-body-sm font-bold">{getTeacherAvgScore(item)}</td>
                            </tr>
                          );
                        case 'classes':
                          return (
                            <tr key={item.id || idx} className={rowClass}>
                              <td className="px-4 py-3 text-body-sm font-medium">{item.name}</td>
                              <td className="px-4 py-3 text-body-sm">{item.education_level?.toUpperCase() || 'N/A'}</td>
                              <td className="px-4 py-3 text-body-sm">Kelas {item.grade_level || 'N/A'}</td>
                              <td className="px-4 py-3 text-body-sm">{item.profiles?.full_name || 'Belum ditetapkan'}</td>
                              <td className="px-4 py-3 text-center text-body-sm">{item.class_students?.length || 0}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={"inline-flex px-2 py-0.5 rounded-full text-label-xs font-medium " + (item.is_active ? 'bg-success-container text-on-success-container' : 'bg-error-container text-on-error-container')}>
                                  {item.is_active ? 'Aktif' : 'Non-aktif'}
                                </span>
                              </td>
                            </tr>
                          );
                        case 'activity':
                          return (
                            <tr key={item.id || idx} className={rowClass}>
                              <td className="px-4 py-3 text-body-sm">{new Date(item.date || item.created_at).toLocaleDateString('id-ID')}</td>
                              <td className="px-4 py-3 text-body-sm">{item.profiles?.full_name || 'N/A'}</td>
                              <td className="px-4 py-3 text-body-sm">{item.classes?.name || 'N/A'}</td>
                              <td className="px-4 py-3 text-body-sm">{item.subject}</td>
                              <td className="px-4 py-3 text-center text-body-sm">{item.duration_minutes || 0} menit</td>
                            </tr>
                          );
                        default:
                          return null;
                      }
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-on-surface-variant/30 mb-4" />
                <p className="text-body-lg text-on-surface-variant mb-2">Belum ada data untuk laporan ini.</p>
                <p className="text-body-sm text-on-surface-variant/70">Silakan pilih jenis laporan lain atau tunggu data tersedia.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsModule;