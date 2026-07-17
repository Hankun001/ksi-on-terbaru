import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { UserCheck, Calendar, Users, Filter, Printer, Search, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

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
    return <div className="dashboard-container">
      <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
        <div>Memuat data absensi...</div>
      </div>
    </div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>
            <UserCheck size={28} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
            Monitoring Absensi
          </h1>
          <p>Pantau kehadiran siswa yang dicatat oleh guru</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-secondary"
            onClick={printAttendanceReport}
            disabled={attendanceData.length === 0}
          >
            <Printer size={18} style={{ marginRight: '8px' }} />
            Cetak Laporan
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
          <h3 style={{ margin: 0, color: '#7c3aed', fontSize: '1rem' }}>Filter Absensi</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="teacher_id">Filter Guru</label>
            <select
              id="teacher_id"
              name="teacher_id"
              value={filters.teacher_id}
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
              value={filters.date_from}
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
              value={filters.date_to}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>
        </div>

        <button className="btn btn-secondary" onClick={clearFilters} style={{ marginTop: '1rem' }}>
          Hapus Filter
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
        gap: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
          <Calendar size={20} style={{ marginBottom: '0.25rem' }} />
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>{stats.uniqueJournals}</h3>
          <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>Sesi Mengajar</p>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
          <Users size={20} style={{ marginBottom: '0.25rem' }} />
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>{stats.uniqueStudents}</h3>
          <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>Siswa</p>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
          <CheckCircle size={20} style={{ marginBottom: '0.25rem' }} />
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>{stats.totalHadir}</h3>
          <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>Hadir</p>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
          <XCircle size={20} style={{ marginBottom: '0.25rem' }} />
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>{stats.totalAbsent}</h3>
          <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>Alpha</p>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
          <AlertTriangle size={20} style={{ marginBottom: '0.25rem' }} />
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>{stats.totalSick}</h3>
          <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>Sakit</p>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
          <Clock size={20} style={{ marginBottom: '0.25rem' }} />
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>{stats.totalPermit + stats.totalLate}</h3>
          <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>Izin/Terlambat</p>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="dashboard-content">
        <section className="dashboard-section">
          <h2>
            <UserCheck size={20} style={{ marginRight: '8px' }} />
            Data Absensi Siswa
            <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '2px 8px', borderRadius: '12px', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
              {stats.totalRecords}
            </span>
          </h2>

          {attendanceData.length > 0 ? (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Siswa</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th>Guru</th>
                    <th>Mata Pelajaran</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map(item => {
                    const badge = getStatusBadge(item.status);
                    return (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }}>
                              {(item.student?.full_name || item.student?.email || 'S').charAt(0).toUpperCase()}
                            </div>
                            <strong>{item.student?.full_name || item.student?.email || 'N/A'}</strong>
                          </div>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 500, background: badge.bg, color: badge.color }}>
                            {badge.icon} {badge.label}
                          </span>
                        </td>
                        <td>
                          {item.journal?.date ? new Date(item.journal.date).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td>{item.journal?.teacher?.full_name || 'N/A'}</td>
                        <td>{item.journal?.subject || '-'}</td>
                        <td style={{ maxWidth: '200px', fontSize: '0.85rem', color: '#6b7280' }}>
                          {item.note || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon"><UserCheck size={48} /></span>
              <p>Belum ada data absensi.</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Data absensi akan muncul setelah guru mencatat kehadiran siswa.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AttendanceMonitoring;