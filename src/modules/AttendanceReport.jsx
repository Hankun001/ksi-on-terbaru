import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { FileText, Calendar, Printer, BookOpen } from 'lucide-react';

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
            <FileText className="w-7 h-7 text-primary" />
            Laporan Absensi
          </h1>
          <p className="text-body-md text-on-surface-variant mt-xs">Rekapitulasi kehadiran siswa per bulan</p>
        </div>
      </div>

      {/* Filter + Reports */}
      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        {/* Filters */}
        <div className="bg-surface-dim/30 p-4 md:p-6 border-b border-outline-variant">
          <div className="flex items-center gap-sm mb-md">
            <BookOpen className="w-5 h-5 text-primary" />
            <h3 className="text-title-sm font-semibold text-on-surface m-0">Filter Laporan</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-lg font-medium text-on-surface mb-1.5">Kelas</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
              />
            </div>
          </div>
          {reports.length > 0 && (
            <button
              onClick={printReport}
              className="mt-md inline-flex items-center gap-xs px-4 py-2 rounded-full border border-outline text-on-surface-variant hover:bg-surface-dim transition-colors text-label-lg"
            >
              <Printer className="w-4 h-4" />
              Cetak Laporan
            </button>
          )}
        </div>

        {/* Reports Table */}
        <div className="p-4 md:p-6">
          <h2 className="text-title-md font-semibold text-on-surface flex items-center gap-sm mb-md">
            <Calendar className="w-5 h-5 text-primary" />
            Rekap Absensi Bulan {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
            {selectedClass && ` - ${classes.find(c => c.id === selectedClass)?.name || ''}`}
          </h2>

          {reports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-dim/50">
                    <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Tanggal</th>
                    <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Mata Pelajaran</th>
                    <th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Total</th>
                    <th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">
                      <span className="text-success">Hadir</span>
                    </th>
                    <th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">
                      <span className="text-error">Alpha</span>
                    </th>
                    <th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">
                      <span className="text-warning">Sakit</span>
                    </th>
                    <th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">
                      <span className="text-tertiary">Izin</span>
                    </th>
                    <th className="text-center px-4 py-3 text-label-sm font-semibold text-on-surface-variant">
                      <span className="text-on-surface-variant">Terlambat</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report, idx) => (
                    <tr key={report.id} className={"border-t border-outline-variant/50 hover:bg-surface-dim/30 transition-colors " + (idx % 2 === 0 ? 'bg-surface' : 'bg-surface-dim/10')}>
                      <td className="px-4 py-3 text-body-sm text-on-surface">{new Date(report.date).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3 text-body-sm text-on-surface">{report.subject}</td>
                      <td className="px-4 py-3 text-body-sm text-center font-medium">{report.totalStudents}</td>
                      <td className="px-4 py-3 text-body-sm text-center font-semibold text-success">{report.presentCount}</td>
                      <td className="px-4 py-3 text-body-sm text-center font-semibold text-error">{report.absentCount}</td>
                      <td className="px-4 py-3 text-body-sm text-center font-semibold text-warning">{report.sickCount}</td>
                      <td className="px-4 py-3 text-body-sm text-center font-semibold text-tertiary">{report.permitCount}</td>
                      <td className="px-4 py-3 text-body-sm text-center font-semibold text-on-surface-variant">{report.lateCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-on-surface-variant/30 mb-4" />
              <p className="text-body-lg text-on-surface-variant mb-2">Belum ada data absensi untuk periode yang dipilih.</p>
              <p className="text-body-sm text-on-surface-variant/70">Pastikan Anda telah memilih kelas dan bulan dengan benar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceReport;