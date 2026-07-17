import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { GraduationCap, Users, BookOpen, Award, Search, Eye, Printer } from 'lucide-react';

const StudentManagement = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [studentEvaluations, setStudentEvaluations] = useState([]);
  const [studentClasses, setStudentClasses] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchEvaluations();
    fetchStudentClasses();
  }, [user]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'murid')
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluations = async () => {
    try {
      const { data, error } = await supabase
        .from('student_evaluations')
        .select('*');
      if (error) throw error;
      setStudentEvaluations(data || []);
    } catch (error) {
      console.error('Error fetching evaluations:', error.message);
    }
  };

  const fetchStudentClasses = async () => {
    try {
      // Get all class_students records
      const { data: csData, error: csError } = await supabase
        .from('class_students')
        .select('*');
      
      if (csError) throw csError;

      if (csData && csData.length > 0) {
        // Get all class IDs
        const classIds = [...new Set(csData.map(cs => cs.class_id).filter(Boolean))];
        
        // Fetch classes
        const { data: classesData } = await supabase
          .from('classes')
          .select('id, name, education_level, grade_level')
          .in('id', classIds);

        // Build class lookup
        const classLookup = {};
        (classesData || []).forEach(c => {
          classLookup[c.id] = c;
        });

        // Group by student_id
        const grouped = {};
        csData.forEach(cs => {
          if (!grouped[cs.student_id]) {
            grouped[cs.student_id] = [];
          }
          const cls = classLookup[cs.class_id];
          if (cls) {
            grouped[cs.student_id].push(cls);
          } else {
            grouped[cs.student_id].push({ id: cs.class_id, name: 'Kelas tidak diketahui' });
          }
        });

        setStudentClasses(grouped);
      }
    } catch (error) {
      console.error('Error fetching student classes:', error.message);
    }
  };

  const getStudentStats = (studentId) => {
    const evals = studentEvaluations.filter(ev => ev.student_id === studentId);
    const totalEvals = evals.length;
    const avgScore = totalEvals > 0
      ? Math.round(evals.reduce((sum, ev) => sum + ev.score, 0) / totalEvals)
      : 0;
    const classList = studentClasses[studentId] || [];
    return { totalEvals, avgScore, classCount: classList.length, classList };
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#3b82f6';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const printStudentReport = (student) => {
    const stats = getStudentStats(student.id);
    const evaluations = studentEvaluations.filter(ev => ev.student_id === student.id);
    
    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Siswa - ${student.full_name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #8b5cf6; }
            .info-card { 
              background: #f5f3ff; 
              padding: 20px; 
              border-radius: 10px; 
              margin-bottom: 20px;
              border-left: 4px solid #8b5cf6;
            }
            .stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0; }
            .stat-box { background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #8b5cf6; }
            .stat-label { font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f5f3ff; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN DATA SISWA</h1>
            <p>PKBM - Sistem Administrasi Pendidikan</p>
          </div>
          <div class="info-card">
            <h2>${student.full_name || 'Nama belum diisi'}</h2>
            <p><strong>Email:</strong> ${student.email}</p>
            <p><strong>Bergabung:</strong> ${new Date(student.created_at).toLocaleDateString('id-ID')}</p>
          </div>
          <div class="stats">
            <div class="stat-box">
              <div class="stat-value">${stats.classCount}</div>
              <div class="stat-label">Kelas</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${stats.totalEvals}</div>
              <div class="stat-label">Penilaian</div>
            </div>
            <div class="stat-box">
              <div class="stat-value" style="color: ${getScoreColor(stats.avgScore)}">${stats.avgScore}</div>
              <div class="stat-label">Rata-rata Nilai</div>
            </div>
          </div>
          <h3>Kelas yang Diikuti</h3>
          ${stats.classList.length > 0 
            ? `<ul>${stats.classList.map(c => `<li>${c.name}</li>`).join('')}</ul>`
            : '<p>Tidak terdaftar di kelas manapun.</p>'}
          <h3>Riwayat Penilaian</h3>
          ${evaluations.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Aspek</th>
                  <th>Nilai</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                ${evaluations.map(ev => `
                  <tr>
                    <td>${new Date(ev.date).toLocaleDateString('id-ID')}</td>
                    <td>${ev.aspect}</td>
                    <td><strong style="color: ${getScoreColor(ev.score)}">${ev.score}</strong></td>
                    <td>${ev.note ? (ev.note.substring(0, 50) + (ev.note.length > 50 ? '...' : '')) : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p>Belum ada penilaian.</p>'}
          <div class="footer">
            Dicetak pada: ${new Date().toLocaleString('id-ID')} | Total ${evaluations.length} penilaian
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredStudents = students.filter(student => 
    student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="dashboard-container">
      <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
        <div style={{ fontSize: '1.2rem' }}>Memuat data siswa...</div>
      </div>
    </div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>
            <GraduationCap size={28} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
            Data Siswa
          </h1>
          <p>Kelola dan monitor data siswa PKBM</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '0.5rem 1rem 0.5rem 2.25rem', borderRadius: '8px', border: '1px solid #ddd', minWidth: '250px' }}
            />
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <section className="dashboard-section">
          <h2>
            <Users size={20} style={{ marginRight: '8px' }} />
            Daftar Siswa
            <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '2px 8px', borderRadius: '12px', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
              {filteredStudents.length}
            </span>
          </h2>

          {filteredStudents.length > 0 ? (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Kelas</th>
                    <th>Penilaian</th>
                    <th>Rata-rata</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => {
                    const stats = getStudentStats(student.id);
                    return (
                      <tr key={student.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>
                              {(student.full_name || student.email || 'S').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong>{student.full_name || 'Nama belum diisi'}</strong>
                              {!student.full_name && (
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>{student.email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{student.email}</td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {stats.classList.length > 0 
                              ? stats.classList.map((cls, idx) => (
                                  <span key={idx} style={{ background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                                    {cls.name}
                                  </span>
                                ))
                              : '-'}
                          </div>
                        </td>
                        <td>
                          <span style={{ background: '#d1fae5', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontSize: '0.875rem' }}>
                            {stats.totalEvals} penilaian
                          </span>
                        </td>
                        <td>
                          {stats.avgScore > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: getScoreColor(stats.avgScore), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>
                                {stats.avgScore}
                              </div>
                            </div>
                          ) : '-'}
                        </td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedStudent(student); setShowDetailModal(true); }}>
                            <Eye size={16} />
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => printStudentReport(student)} style={{ marginLeft: '0.5rem' }}>
                            <Printer size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon"><GraduationCap size={48} /></span>
              <p>Tidak ada siswa ditemukan.</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Pastikan ada pengguna dengan peran "murid" di database.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Student Detail Modal */}
      {showDetailModal && selectedStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>
                <GraduationCap size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Detail Siswa
              </h2>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.75rem' }}>
                  {(selectedStudent.full_name || selectedStudent.email || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem' }}>{selectedStudent.full_name || 'Nama belum diisi'}</h3>
                  <p style={{ margin: 0, color: '#6b7280' }}>{selectedStudent.email}</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    Bergabung: {new Date(selectedStudent.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4><BookOpen size={18} style={{ marginRight: '8px' }} />Kelas Terdaftar</h4>
              {(() => {
                const cls = studentClasses[selectedStudent.id] || [];
                return cls.length > 0 ? (
                  <ul style={{ paddingLeft: '1.25rem' }}>
                    {cls.map((c, idx) => (
                      <li key={idx}>
                        {c.name}
                        {c.education_level && ` (${c.education_level.toUpperCase()})`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#6b7280' }}>Belum terdaftar di kelas manapun.</p>
                );
              })()}
            </div>

            <div>
              <h4><Award size={18} style={{ marginRight: '8px' }} />Penilaian</h4>
              {(() => {
                const evals = studentEvaluations.filter(ev => ev.student_id === selectedStudent.id);
                return evals.length > 0 ? (
                  <div style={{ marginTop: '0.5rem' }}>
                    {evals.map((ev, idx) => (
                      <div key={idx} style={{ background: '#f9fafb', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <strong>{ev.aspect}</strong>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>{new Date(ev.date).toLocaleDateString('id-ID')}</p>
                          </div>
                          <div style={{ background: getScoreColor(ev.score), color: 'white', padding: '0.25rem 0.75rem', borderRadius: '12px', fontWeight: 'bold' }}>{ev.score}</div>
                        </div>
                        {ev.note && <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}>{ev.note}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#6b7280' }}>Belum ada penilaian.</p>
                );
              })()}
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;