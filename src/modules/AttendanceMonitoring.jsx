import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { UserCheck, Calendar, Users, Filter, Printer, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

const AttendanceMonitoring = () => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    teacher_id: '',
    date_from: '',
    date_to: ''
  });
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalHadir: 0,
    totalAbsent: 0,
    totalSick: 0,
    totalPermit: 0,
    totalLate: 0,
    uniqueStudents: 0,
    uniqueJournals: 0
  });

  useEffect(() => {
    fetchAttendance();
    fetchTeachers();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [filters.teacher_id, filters.date_from, filters.date_to]);

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'guru');
      if (!error) setTeachers(data || []);
    } catch (err) {
      console.error('Error fetching teachers:', err.message);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      // Get attendance with journal and student info
      let query = supabase
        .from('student_attendance')
        .select(`
          *,
          student:profiles!student_id (id, full_name, email),
          journal:journal_id (
            id, date, subject, duration_minutes, teaching_method,
            teacher:teacher_id (id, full_name, email)
          )
        `)
        .order('created_at', { ascending: false });

      // Apply date filter via journal
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        // Add end of day for the filter
        const endDate = filters.date_to + 'T23:59:59';
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      const records = data || [];

      // Filter by teacher if selected (since teacher is in journal relation)
      let filtered = records;
      if (filters.teacher_id) {
        filtered = records.filter(r => r.journal?.teacher?.id === filters.teacher_id);
      }

      setAttendanceData(filtered);

      // Calculate stats
      const hadir = filtered.filter(r => r.status === 'hadir').length;
      const absent = filtered.filter(r => r.status === 'absent').length;
      const sick = filtered.filter(r => r.status === 'sick').length;
      const permit = filtered.filter(r => r.status === 'permit').length;
      const late = filtered.filter(r => r.status === 'late').length;
      const uniqueStudents = new Set(filtered.map(r => r.student_id)).size;
      const uniqueJournals = new Set(filtered.map(r => r.journal_id)).size;

      setStats({
        totalRecords: filtered.length,
        totalHadir: hadir,
        totalAbsent: absent,
        totalSick: sick,
        totalPermit: permit,
        totalLate: late,
        uniqueStudents,
        uniqueJournals
      });

    } catch (error) {
      console.error('Error fetching attendance:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ teacher_id: '', date_from: '', date_to: '' });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'hadir': return { icon: <CheckCircle size={14} />, label: 'Hadir', color: '#10b981', bg: '#d1fae5' };
      case 'absent': return { icon: <XCircle size={14} />, label: 'Alpha', color: '#ef4444', bg: '#fee2e2' };
      case 'sick': return { icon: <AlertTriangle size={14} />, label: 'Sakit', color: '#f59e0b', bg: '#fef3c7' };
      case 'permit': return { icon: <Clock size={14} />, label: 'Izin', color: '#3b82f6', bg: '#dbeafe' };
      case 'late': return { icon: <Clock size={14} />, label: 'Terlambat', color: '#8b5cf6', bg: '#f5f3ff' };
      default: return { icon: null, label: status, color: '#6b7280', bg: '#f3f4f6' };
    }
  };

  const printAttendanceReport = () => {
    const printWindow = window.open('', '_blank');
    const selectedTeacher = filters.teacher_id 
      ? teachers.find(t => t.id === filters.teacher_id) 
      : null;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Monitoring Absensi</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #8b5cf6; margin-bottom: 5px; }
            .summary { display: flex; gap: 15px; margin: 20px 0; flex-wrap: wrap; }
            .summary-item { background: #f5f3ff; padding: 15px; border-radius: 8px; text-align: center; flex: 1; min-width: 120px; }
            .summary-value { font-size: 24px; font-weight: bold; color: #8b5cf6; }
            .summary-label { font-size: 11px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f3ff; }
            .footer { margin-top: 40px; text-align: center; color: #999; font-size: 11px; border-top: 1px solid #eee; padding-top: 15px; }
            .hadir { color: #10b981; font-weight: bold; }
            .alpha { color: #ef4444; font-weight: bold; }
            .sakit { color: #f59e0b; font-weight: bold; }
            .izin { color: #3b82f6; font-weight: bold; }
            .terlambat { color: #8b5cf6; font-weight: bold; }
            @media print { body { margin: 15px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN MONITORING ABSENSI</h1>
            <p>PKBM - Sistem Manajemen Pendidikan</p>
            <p>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            ${selectedTeacher ? `<p><strong>Filter Guru:</strong> ${selectedTeacher.full_name || selectedTeacher.email}</p>` : ''}
            <p><strong>Periode:</strong> ${filters.date_from || 'Awal'} s/d ${filters.date_to || 'Sekarang'}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <div class="summary-value">${stats.totalRecords}</div>
              <div class="summary-label">Total Absensi</div>
            </div>
            <div class="summary-item">
              <div class="summary-value" style="color: #10b981;">${stats.totalHadir}</div>
              <div class="summary-label">Hadir</div>
            </div>
            <div class="summary-item">
              <div class="summary-value" style="color: #ef4444;">${stats.totalAbsent}</div>
              <div class="summary-label">Alpha</div>
            </div>
            <div class="summary-item">
              <div class="summary-value" style="color: #f59e0b;">${stats.totalSick}</div>
              <div class="summary-label">Sakit</div>
            </div>
            <div class="summary-item">
              <div class="summary-value" style="color: #3b82f6;">${stats.totalPermit}</div>
              <div class="summary-label">Izin</div>
            </div>
            <div class="summary-item">
              <div class="summary-value" style="color: #8b5cf6;">${stats.totalLate}</div>
              <div class="summary-label">Terlambat</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Siswa</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Guru</th>
                <th>Mata Pelajaran</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${attendanceData.map((item, idx) => {
                const statusLabel = item.status === 'hadir' ? 'Hadir' :
                  item.status === 'absent' ? 'Alpha' :
                  item.status === 'sick' ? 'Sakit' :
                  item.status === 'permit' ? 'Izin' : 'Terlambat';
                const statusClass = item.status === 'hadir' ? 'hadir' :
                  item.status === 'absent' ? 'alpha' :
                  item.status === 'sick' ? 'sakit' :
                  item.status === 'permit' ? 'izin' : 'terlambat';
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><strong>${item.student?.full_name || item.student?.email || 'N/A'}</strong></td>
                    <td class="${statusClass}">${statusLabel}</td>
                    <td>${item.journal?.date ? new Date(item.journal.date).toLocaleDateString('id-ID') : '-'}</td>
                    <td>${item.journal?.teacher?.full_name || 'N/A'}</td>
                    <td>${item.journal?.subject || '-'}</td>
                    <td>${item.note || '-'}</td>
                  </tr>
                `;
              })}
            </tbody>
          </table>

          <div class="footer">
            Total ${stats.totalRecords} data absensi | ${stats.uniqueStudents} siswa | ${stats.uniqueJournals} sesi mengajar
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
            <UserCheck className="w-7 h-7 text-primary" />
            Monitoring Absensi
          </h1>
          <p className="text-body-md text-on-surface-variant mt-xs">Pantau kehadiran siswa yang dicatat oleh guru</p>
        </div>
        <button
          onClick={printAttendanceReport}
          disabled={attendanceData.length === 0}
          className="inline-flex items-center gap-xs px-4 py-2 rounded-full border border-outline text-on-surface-variant hover:bg-surface-dim transition-colors duration-200 text-label-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Printer className="w-4 h-4" />
          Cetak Laporan
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-surface-container-low rounded-2xl p-4 md:p-5 mb-xl border border-outline-variant">
        <div className="flex items-center gap-sm mb-md">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="text-title-sm font-semibold text-on-surface m-0">Filter Absensi</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-label-lg font-medium text-on-surface mb-1.5">Filter Guru</label>
            <select
              name="teacher_id"
              value={filters.teacher_id}
              onChange={handleFilterChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
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
              value={filters.date_from}
              onChange={handleFilterChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
            />
          </div>
          <div>
            <label className="block text-label-lg font-medium text-on-surface mb-1.5">Sampai Tanggal</label>
            <input
              type="date"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-body-md"
            />
          </div>
        </div>
        <button
          onClick={clearFilters}
          className="mt-md inline-flex items-center gap-xs px-3 py-1.5 rounded-full border border-outline text-on-surface-variant hover:bg-surface-dim transition-colors text-label-sm"
        >
          Hapus Filter
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-xl">
        <div className="bg-gradient-to-br from-primary to-primary-container text-white rounded-xl p-3 text-center shadow-sm">
          <Calendar className="w-5 h-5 mx-auto mb-1 opacity-90" />
          <div className="text-title-md font-bold">{stats.uniqueJournals}</div>
          <div className="text-label-xs opacity-80">Sesi Mengajar</div>
        </div>
        <div className="bg-gradient-to-br from-success to-success-container text-white rounded-xl p-3 text-center shadow-sm">
          <Users className="w-5 h-5 mx-auto mb-1 opacity-90" />
          <div className="text-title-md font-bold">{stats.uniqueStudents}</div>
          <div className="text-label-xs opacity-80">Siswa</div>
        </div>
        <div className="bg-gradient-to-br from-success to-success-container text-white rounded-xl p-3 text-center shadow-sm">
          <CheckCircle className="w-5 h-5 mx-auto mb-1 opacity-90" />
          <div className="text-title-md font-bold">{stats.totalHadir}</div>
          <div className="text-label-xs opacity-80">Hadir</div>
        </div>
        <div className="bg-gradient-to-br from-error to-error-container text-white rounded-xl p-3 text-center shadow-sm">
          <XCircle className="w-5 h-5 mx-auto mb-1 opacity-90" />
          <div className="text-title-md font-bold">{stats.totalAbsent}</div>
          <div className="text-label-xs opacity-80">Alpha</div>
        </div>
        <div className="bg-gradient-to-br from-warning to-warning-container text-white rounded-xl p-3 text-center shadow-sm">
          <AlertTriangle className="w-5 h-5 mx-auto mb-1 opacity-90" />
          <div className="text-title-md font-bold">{stats.totalSick}</div>
          <div className="text-label-xs opacity-80">Sakit</div>
        </div>
        <div className="bg-gradient-to-br from-tertiary to-tertiary-container text-white rounded-xl p-3 text-center shadow-sm">
          <Clock className="w-5 h-5 mx-auto mb-1 opacity-90" />
          <div className="text-title-md font-bold">{stats.totalPermit + stats.totalLate}</div>
          <div className="text-label-xs opacity-80">Izin/Terlambat</div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="text-title-md font-semibold text-on-surface flex items-center gap-sm">
            <UserCheck className="w-5 h-5 text-primary" />
            Data Absensi Siswa
          </h2>
          <span className="bg-primary-container text-on-primary-container text-label-sm px-2.5 py-1 rounded-full">
            {stats.totalRecords}
          </span>
        </div>

        {attendanceData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-dim/50">
                  <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Siswa</th>
                  <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Status</th>
                  <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Tanggal</th>
                  <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Guru</th>
                  <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Mata Pelajaran</th>
                  <th className="text-left px-4 py-3 text-label-sm font-semibold text-on-surface-variant">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((item, idx) => {
                  const badge = getStatusBadge(item.status);
                  const initial = (item.student?.full_name || item.student?.email || 'S').charAt(0).toUpperCase();
                  return (
                    <tr key={item.id} className={"border-t border-outline-variant/50 hover:bg-surface-dim/30 transition-colors " + (idx % 2 === 0 ? 'bg-surface' : 'bg-surface-dim/10')}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white font-bold text-label-sm shrink-0">
                            {initial}
                          </div>
                          <span className="text-body-sm font-medium text-on-surface">
                            {item.student?.full_name || item.student?.email || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-xs font-medium"
                          style={{ background: badge.bg, color: badge.color }}>
                          {badge.icon} {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-body-sm text-on-surface-variant">
                        {item.journal?.date ? new Date(item.journal.date).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="px-4 py-3 text-body-sm text-on-surface-variant">
                        {item.journal?.teacher?.full_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-body-sm text-on-surface-variant">
                        {item.journal?.subject || '-'}
                      </td>
                      <td className="px-4 py-3 text-body-sm text-on-surface-variant max-w-[200px]">
                        {item.note || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <UserCheck className="w-16 h-16 mx-auto text-on-surface-variant/30 mb-4" />
            <p className="text-body-lg text-on-surface-variant mb-2">Belum ada data absensi.</p>
            <p className="text-body-sm text-on-surface-variant/70">
              Data absensi akan muncul setelah guru mencatat kehadiran siswa.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceMonitoring;