import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { 
  Printer, FileText, Download, Calendar, Users, 
  BookOpen, Award, TrendingUp, BarChart2, Eye
} from 'lucide-react';

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
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>
            <FileText size={28} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
            Laporan & Cetak
          </h1>
          <p>Generasi laporan printable untuk administrasi PKBM</p>
        </div>
      </div>

      {/* Report Type Selection */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {reportTypes.map(type => {
          const Icon = type.icon;
          const isSelected = reportType === type.id;
          return (
            <div
              key={type.id}
              onClick={() => setReportType(type.id)}
              style={{
                padding: '1.25rem',
                borderRadius: '12px',
                border: isSelected ? '2px solid #8b5cf6' : '2px solid #e5e7eb',
                background: isSelected ? '#f5f3ff' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                boxShadow: isSelected ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#8b5cf6';
                  e.currentTarget.style.background = '#fafafa';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '8px',
                  background: isSelected ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : '#f3f4f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isSelected ? 'white' : '#8b5cf6'
                }}>
                  <Icon size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: isSelected ? '#7c3aed' : '#374151' }}>
                  {type.name}
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                {type.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Date Range Filter */}
      <div className="form-container" style={{ marginBottom: '2rem' }}>
        <h3>Filter Tanggal (Opsional)</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, flex: 1 }}>
            <label htmlFor="start">Dari Tanggal</label>
            <input
              type="date"
              id="start"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              style={{ width: '100%', padding: '0.75rem' }}
            />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 1 }}>
            <label htmlFor="end">Sampai Tanggal</label>
            <input
              type="date"
              id="end"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              style={{ width: '100%', padding: '0.75rem' }}
            />
          </div>
          <button className="btn btn-primary" onClick={generateReport}>
            <BarChart2 size={18} style={{ marginRight: '8px' }} />
            Generate
          </button>
        </div>
      </div>

      {/* Report Preview & Actions */}
      {reportData && (
        <div className="dashboard-content">
          <div style={{ 
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: 'white', padding: '1.5rem', borderRadius: '12px',
            marginBottom: '1.5rem', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <h2 style={{ margin: '0 0 0.5rem 0' }}>
                <Printer size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Preview Laporan
              </h2>
              <p style={{ margin: 0, opacity: 0.9 }}>
                {reportTypes.find(r => r.id === reportType)?.desc} • Total: {reportData.length} record
              </p>
            </div>
            <button className="btn btn-secondary" onClick={printReport}
              style={{ background: 'white', color: '#8b5cf6' }}>
              <Printer size={18} style={{ marginRight: '8px' }} />
              Cetak Sekarang
            </button>
          </div>

          {/* Data Preview */}
          <section className="dashboard-section">
            <h2>
              <Eye size={20} style={{ marginRight: '8px' }} />
              Preview Data
            </h2>
            
            {reportData.length > 0 ? (
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    {reportType === 'attendance' && (
                      <tr>
                        <th>Tanggal</th>
                        <th>Guru</th>
                        <th>Kelas</th>
                        <th>Mata Pelajaran</th>
                        <th>Hadir</th>
                        <th>Alpha</th>
                      </tr>
                    )}
                    {reportType === 'grades' && (
                      <tr>
                        <th>Tanggal</th>
                        <th>Siswa</th>
                        <th>Kelas</th>
                        <th>Aspek</th>
                        <th>Nilai</th>
                      </tr>
                    )}
                    {reportType === 'teacher' && (
                      <tr>
                        <th>Tanggal</th>
                        <th>Guru</th>
                        <th>📚</th>
                        <th>👔</th>
                        <th>😊</th>
                        <th>🎯</th>
                        <th>Rata</th>
                      </tr>
                    )}
                    {reportType === 'classes' && (
                      <tr>
                        <th>Nama Kelas</th>
                        <th>Jenjang</th>
                        <th>Tingkat</th>
                        <th>Wali Kelas</th>
                        <th>Siswa</th>
                        <th>Status</th>
                      </tr>
                    )}
                    {reportType === 'activity' && (
                      <tr>
                        <th>Tanggal</th>
                        <th>Guru</th>
                        <th>Kelas</th>
                        <th>Mata Pelajaran</th>
                        <th>Durasi</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {reportData.slice(0, 20).map((item, idx) => {
                      switch (reportType) {
                        case 'attendance':
                          return (
                            <tr key={item.id || idx}>
                              <td>{new Date(item.date).toLocaleDateString('id-ID')}</td>
                              <td>{item.profiles?.full_name || 'N/A'}</td>
                              <td>{item.classes?.name || 'N/A'}</td>
                              <td>{item.subject}</td>
                              <td style={{ color: '#10b981' }}>
                                {item.student_attendance?.filter(a => a.status === 'hadir').length || 0}
                              </td>
                              <td style={{ color: '#ef4444' }}>
                                {item.student_attendance?.filter(a => a.status === 'absent').length || 0}
                              </td>
                            </tr>
                          );
                        case 'grades':
                          return (
                            <tr key={item.id || idx}>
                              <td>{new Date(item.date).toLocaleDateString('id-ID')}</td>
                              <td>{item.profiles?.full_name || item.profiles?.email || 'N/A'}</td>
                              <td>{item.classes?.name || 'N/A'}</td>
                              <td>{item.aspect}</td>
                              <td style={{ fontWeight: 'bold', color: '#8b5cf6' }}>{item.score}</td>
                            </tr>
                          );
                        case 'teacher':
                          return (
                            <tr key={item.id || idx}>
                              <td>{new Date(item.date).toLocaleDateString('id-ID')}</td>
                              <td>{item.profiles?.full_name || item.profiles?.email}</td>
                              <td style={{ textAlign: 'center' }}>{item.pedagogy_score}</td>
                              <td style={{ textAlign: 'center' }}>{item.professionalism_score}</td>
                              <td style={{ textAlign: 'center' }}>{item.personality_score}</td>
                              <td style={{ textAlign: 'center' }}>{item.leadership_score}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{getTeacherAvgScore(item)}</td>
                            </tr>
                          );
                        case 'classes':
                          return (
                            <tr key={item.id || idx}>
                              <td><strong>{item.name}</strong></td>
                              <td>{item.education_level?.toUpperCase() || 'N/A'}</td>
                              <td>Kelas {item.grade_level || 'N/A'}</td>
                              <td>{item.profiles?.full_name || 'Belum ditetapkan'}</td>
                              <td>{item.class_students?.length || 0}</td>
                              <td>
                                <span style={{ color: item.is_active ? '#10b981' : '#ef4444' }}>
                                  {item.is_active ? 'Aktif' : 'Non-aktif'}
                                </span>
                              </td>
                            </tr>
                          );
                        case 'activity':
                          return (
                            <tr key={item.id || idx}>
                              <td>{new Date(item.date || item.created_at).toLocaleDateString('id-ID')}</td>
                              <td>{item.profiles?.full_name || 'N/A'}</td>
                              <td>{item.classes?.name || 'N/A'}</td>
                              <td>{item.subject}</td>
                              <td>{item.duration_minutes || 0} menit</td>
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
              <div className="empty-state">
                <span className="empty-icon"><FileText size={48} /></span>
                <p>Belum ada data untuk laporan ini.</p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Silakan pilih jenis laporan lain atau tunggu data tersedia.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default ReportsModule;