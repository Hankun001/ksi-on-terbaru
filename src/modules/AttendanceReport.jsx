import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { FileText, Calendar, Users, Download, Printer, BookOpen } from 'lucide-react';

const AttendanceReport = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, [user]);

  useEffect(() => {
    if (selectedClass && selectedMonth) {
      fetchAttendanceReport();
    }
  }, [selectedClass, selectedMonth]);

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

  const fetchAttendanceReport = async () => {
    if (!selectedClass || !selectedMonth) return;

    try {
      setLoading(true);

      // Get teaching journals for the selected class and month
      const startDate = `${selectedMonth}-01`;
      const endDate = new Date(selectedMonth + '-01');
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      const endDateStr = endDate.toISOString().split('T')[0];

      const { data: journals, error: journalError } = await supabase
        .from('teaching_journals')
        .select(`
          id,
          date,
          subject,
          duration_minutes,
          teaching_method,
          classes (name, education_level, grade_level),
          student_attendance (
            student_id,
            status,
            note,
            profiles (full_name, email)
          )
        `)
        .eq('class_id', selectedClass)
        .gte('date', startDate)
        .lte('date', endDateStr)
        .order('date', { ascending: false });

      if (journalError) throw journalError;

      // Process the data to create attendance summary
      const processedReports = journals.map(journal => {
        const attendance = journal.student_attendance || [];
        const totalStudents = attendance.length;
        const presentCount = attendance.filter(a => a.status === 'hadir').length;
        const absentCount = attendance.filter(a => a.status === 'absent').length;
        const sickCount = attendance.filter(a => a.status === 'sick').length;
        const permitCount = attendance.filter(a => a.status === 'permit').length;
        const lateCount = attendance.filter(a => a.status === 'late').length;

        return {
          id: journal.id,
          date: journal.date,
          subject: journal.subject,
          duration: journal.duration_minutes,
          method: journal.teaching_method,
          className: journal.classes?.name || 'Unknown Class',
          totalStudents,
          presentCount,
          absentCount,
          sickCount,
          permitCount,
          lateCount,
          attendance: attendance
        };
      });

      setReports(processedReports);
    } catch (error) {
      console.error('Error fetching attendance report:', error.message);
      alert('Error loading attendance report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Absensi - ${selectedMonth}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            .header { margin-bottom: 30px; }
            .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 20px; }
            .summary-item { background: #f5f5f5; padding: 10px; border-radius: 5px; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .status-present { color: green; }
            .status-absent { color: red; }
            .status-sick { color: orange; }
            .status-permit { color: blue; }
            .status-late { color: purple; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Laporan Absensi Kelas</h1>
            <p><strong>Kelas:</strong> ${classes.find(c => c.id === selectedClass)?.name || 'Unknown'}</p>
            <p><strong>Bulan:</strong> ${new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}</p>
            <p><strong>Guru:</strong> ${user?.email || 'Unknown'}</p>
          </div>

          ${reports.map(report => `
            <h2>Tanggal: ${new Date(report.date).toLocaleDateString('id-ID')}</h2>
            <p><strong>Mata Pelajaran:</strong> ${report.subject}</p>
            <p><strong>Durasi:</strong> ${report.duration} menit</p>

            <div class="summary">
              <div class="summary-item">
                <strong>Total Siswa</strong><br>${report.totalStudents}
              </div>
              <div class="summary-item">
                <strong>Hadir</strong><br><span class="status-present">${report.presentCount}</span>
              </div>
              <div class="summary-item">
                <strong>Tidak Hadir</strong><br><span class="status-absent">${report.absentCount}</span>
              </div>
              <div class="summary-item">
                <strong>Sakit</strong><br><span class="status-sick">${report.sickCount}</span>
              </div>
              <div class="summary-item">
                <strong>Izin</strong><br><span class="status-permit">${report.permitCount}</span>
              </div>
              <div class="summary-item">
                <strong>Terlambat</strong><br><span class="status-late">${report.lateCount}</span>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Siswa</th>
                  <th>Status</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                ${report.attendance.map((att, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${att.profiles?.full_name || att.profiles?.email || 'Unknown'}</td>
                    <td class="status-${att.status}">${getStatusLabel(att.status)}</td>
                    <td>${att.note || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <br><br>
          `).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusLabel = (status) => {
    const labels = {
      hadir: 'Hadir',
      absent: 'Alpha',
      sick: 'Sakit',
      permit: 'Izin',
      late: 'Terlambat'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      hadir: 'text-green-600',
      absent: 'text-red-600',
      sick: 'text-orange-600',
      permit: 'text-blue-600',
      late: 'text-purple-600'
    };
    return colors[status] || 'text-gray-600';
  };

  if (loading && !reports.length) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <div>Memuat laporan absensi...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>
            <FileText size={28} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
            Laporan Absensi
          </h1>
          <p>Rekapitulasi kehadiran siswa per bulan</p>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Filters */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#0369a1' }}>
            <BookOpen size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Filter Laporan
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
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

        {/* Reports List */}
        <section className="dashboard-section">
          <h2>
            <Calendar size={20} style={{ marginRight: '8px' }} />
            Rekap Absensi Bulan {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
            {selectedClass && ` - ${classes.find(c => c.id === selectedClass)?.name || 'Unknown'}`}
          </h2>

          {reports.length > 0 ? (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Mata Pelajaran</th>
                    <th>Total Siswa</th>
                    <th>Hadir</th>
                    <th>Tidak Hadir</th>
                    <th>Sakit</th>
                    <th>Izin</th>
                    <th>Terlambat</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(report => (
                    <tr key={report.id}>
                      <td>{new Date(report.date).toLocaleDateString('id-ID')}</td>
                      <td>{report.subject}</td>
                      <td>{report.totalStudents}</td>
                      <td className="text-green-600 font-semibold">{report.presentCount}</td>
                      <td className="text-red-600 font-semibold">{report.absentCount}</td>
                      <td className="text-orange-600 font-semibold">{report.sickCount}</td>
                      <td className="text-blue-600 font-semibold">{report.permitCount}</td>
                      <td className="text-purple-600 font-semibold">{report.lateCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon"><FileText size={48} /></span>
              <p>Belum ada data absensi untuk periode yang dipilih.</p>
              <p>Pastikan Anda telah memilih kelas dan bulan dengan benar.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AttendanceReport;