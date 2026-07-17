import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Users, UserCog, Mail, BookOpen, Award, Star, Calendar, Trash2, Eye, Printer } from 'lucide-react';

const TeacherManagement = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [teacherEvaluations, setTeacherEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchTeachers();
    fetchEvaluations();
  }, [user]);

  const fetchTeachers = async () => {
    try {
      const { data: teachersData, error: teachersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'guru')
        .order('full_name');

      if (teachersError) throw teachersError;

      // Get class counts per teacher
      const { data: classesData } = await supabase
        .from('classes')
        .select('teacher_id')
        .not('teacher_id', 'is', null);

      const classCounts = {};
      (classesData || []).forEach(cls => {
        classCounts[cls.teacher_id] = (classCounts[cls.teacher_id] || 0) + 1;
      });

      // Get journal counts per teacher
      const { data: journalsData } = await supabase
        .from('teaching_journals')
        .select('teacher_id');

      const journalCounts = {};
      (journalsData || []).forEach(journal => {
        journalCounts[journal.teacher_id] = (journalCounts[journal.teacher_id] || 0) + 1;
      });

      // Combine data
      const teachersWithStats = (teachersData || []).map(teacher => ({
        ...teacher,
        class_count: classCounts[teacher.id] || 0,
        journal_count: journalCounts[teacher.id] || 0
      }));

      setTeachers(teachersWithStats);
    } catch (error) {
      console.error('Error fetching teachers:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluations = async () => {
    try {
      const { data, error } = await supabase
        .from('teacher_evaluation_sessions')
        .select(`
          *,
          profiles!teacher_id (full_name, email),
          admin:profiles!admin_id (full_name)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setTeacherEvaluations(data || []);
    } catch (error) {
      console.error('Error fetching evaluations:', error.message);
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data guru ini? Tindakan ini akan menghapus semua data terkait.')) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', teacherId);

      if (error) throw error;
      fetchTeachers();
      alert('Data guru berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting teacher:', error.message);
      alert('Error: ' + error.message);
    }
  };

  const getAvgScore = (ev) => {
    if (!ev) return 0;
    const total = (ev.pedagogy_score || 0) + (ev.professionalism_score || 0) + 
                  (ev.personality_score || 0) + (ev.leadership_score || 0);
    return (total / 4).toFixed(1);
  };

  const printTeacherReport = (teacher) => {
    const teacherEvals = teacherEvaluations.filter(ev => ev.teacher_id === teacher.id);
    const avgScores = teacherEvals.reduce((acc, ev) => {
      acc.pedagogy += ev.pedagogy_score || 0;
      acc.professionalism += ev.professionalism_score || 0;
      acc.personality += ev.personality_score || 0;
      acc.leadership += ev.leadership_score || 0;
      acc.count += 1;
      return acc;
    }, { pedagogy: 0, professionalism: 0, personality: 0, leadership: 0, count: 0 });

    const overallAvg = avgScores.count > 0
      ? ((avgScores.pedagogy + avgScores.professionalism + avgScores.personality + avgScores.leadership) / (avgScores.count * 4)).toFixed(1)
      : 0;

    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Guru - ${teacher.full_name || teacher.email}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #8b5cf6; margin-bottom: 5px; }
            .info-card { 
              background: #f5f3ff; 
              padding: 20px; 
              border-radius: 10px; 
              margin-bottom: 20px;
              border-left: 4px solid #8b5cf6;
            }
            .stats { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; margin: 20px 0; }
            .stat-box { background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-value { font-size: 20px; font-weight: bold; color: #8b5cf6; }
            .stat-label { font-size: 11px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f3ff; }
            .score { font-weight: bold; text-align: center; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN DATA GURU</h1>
            <p>PKBM - Sistem Administrasi Pendidikan</p>
          </div>

          <div class="info-card">
            <h2>${teacher.full_name || teacher.email}</h2>
            <p><strong>Email:</strong> ${teacher.email}</p>
            <p><strong>Bergabung:</strong> ${new Date(teacher.created_at).toLocaleDateString('id-ID')}</p>
          </div>

          ${avgScores.count > 0 ? `
            <div class="stats">
              <div class="stat-box">
                <div class="stat-value">${(avgScores.pedagogy / avgScores.count).toFixed(1)}</div>
                <div class="stat-label">Rata Pedagogi</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${(avgScores.professionalism / avgScores.count).toFixed(1)}</div>
                <div class="stat-label">Rata Profesional</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${(avgScores.personality / avgScores.count).toFixed(1)}</div>
                <div class="stat-label">Rata Kepribadian</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${(avgScores.leadership / avgScores.count).toFixed(1)}</div>
                <div class="stat-label">Rata Kepemimpinan</div>
              </div>
            </div>

            <h3>Riwayat Evaluasi (${avgScores.count} sesi)</h3>
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Pedagogi</th>
                  <th>Profesional</th>
                  <th>Kepribadian</th>
                  <th>Kepemimpinan</th>
                  <th>Rata-rata</th>
                  <th>Evaluator</th>
                </tr>
              </thead>
              <tbody>
                ${teacherEvals.map(ev => `
                  <tr>
                    <td>${new Date(ev.date).toLocaleDateString('id-ID')}</td>
                    <td class="score">${ev.pedagogy_score}</td>
                    <td class="score">${ev.professionalism_score}</td>
                    <td class="score">${ev.personality_score}</td>
                    <td class="score">${ev.leadership_score}</td>
                    <td class="score" style="font-size: 16px;">${getAvgScore(ev)}</td>
                    <td>${ev.admin?.full_name || 'Admin'}</td>
                  </tr>
                `).join('')}
                <tr style="background: #fef3c7; font-weight: bold;">
                  <td colspan="5" style="text-align: right;">Rata-rata Keseluruhan:</td>
                  <td class="score" style="font-size: 16px;">${overallAvg}/5</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          ` : '<p>Belum ada evaluasi.</p>'}

          <div class="footer">
            Dicetak pada: ${new Date().toLocaleString('id-ID')} | Total ${teacherEvals.length} sesi evaluasi
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const openDetail = (teacher) => {
    setSelectedTeacher(teacher);
    setShowDetailModal(true);
  };

  if (loading) {
    return <div className="dashboard-container">Memuat data guru...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>
            <UserCog size={28} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
            Data Pengajar
          </h1>
          <p>Kelola dan monitor data guru PKBM</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white',
          padding: '1.25rem',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>{teachers.length}</h3>
          <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>Total Guru</p>
        </div>
        <div style={{ 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '1.25rem',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>
            {teacherEvaluations.length}
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>Sesi Evaluasi</p>
        </div>
        <div style={{ 
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          padding: '1.25rem',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>
            {teacherEvaluations.length > 0 
              ? (teacherEvaluations.reduce((sum, ev) => sum + parseFloat(getAvgScore(ev)), 0) / teacherEvaluations.length).toFixed(1)
              : 0}
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>Rata-rata Evaluasi</p>
        </div>
      </div>

      <div className="dashboard-content">
        <section className="dashboard-section">
          <h2><Users size={20} style={{ marginRight: '8px' }} />Daftar Guru</h2>
          
          {teachers.length > 0 ? (
            <div className="cards-grid">
              {teachers.map(teacher => {
                const teacherEvals = teacherEvaluations.filter(ev => ev.teacher_id === teacher.id);
                const avgScore = teacherEvals.length > 0
                  ? (teacherEvals.reduce((sum, ev) => sum + parseFloat(getAvgScore(ev)), 0) / teacherEvals.length).toFixed(1)
                  : null;

                return (
                  <div key={teacher.id} className="card">
                    <div className="card-header">
                      <span className="course-code">
                        <BookOpen size={16} style={{ marginRight: '4px' }} />
                        {teacher.journal_count || 0} Jurnal
                      </span>
                      <span className="course-icon">
                        <Award size={16} style={{ color: '#f59e0b' }} />
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.25rem',
                        marginRight: '12px'
                      }}>
                        {(teacher.full_name || teacher.email || 'G').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>{teacher.full_name || 'Nama belum diisi'}</h3>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                          {teacher.email}
                        </p>
                      </div>
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: '0.5rem',
                      marginTop: '0.5rem'
                    }}>
                      <div>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                          <BookOpen size={12} style={{ marginRight: '4px' }} />
                          {teacher.class_count || 0} Kelas
                        </p>
                      </div>
                      <div>
                        {avgScore && (
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, textAlign: 'right' }}>
                            ⭐ Avg: {avgScore}/5
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => openDetail(teacher)}
                      >
                        <Eye size={16} style={{ marginRight: '4px' }} />
                        Detail
                      </button>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => printTeacherReport(teacher)}
                        style={{ marginLeft: '0.5rem' }}
                      >
                        <Printer size={16} style={{ marginRight: '4px' }} />
                        Cetak
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteTeacher(teacher.id)}
                        style={{ marginLeft: '0.5rem' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon"><Users size={48} /></span>
              <p>Belum ada data guru.</p>
            </div>
          )}
        </section>

        {/* Teacher Detail Modal */}
        {showDetailModal && selectedTeacher && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{
              background: 'white', borderRadius: '12px', padding: '2rem',
              maxWidth: '700px', width: '90%', maxHeight: '80vh', overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>
                  <UserCog size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Detail Guru
                </h2>
                <button onClick={() => { setShowDetailModal(false); setSelectedTeacher(null); }}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>
                  ×
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 'bold', fontSize: '1.75rem'
                  }}>
                    {(selectedTeacher.full_name || selectedTeacher.email || 'G').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem' }}>{selectedTeacher.full_name || 'Nama belum diisi'}</h3>
                    <p style={{ margin: 0, color: '#6b7280' }}>{selectedTeacher.email}</p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                      Bergabung: {new Date(selectedTeacher.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4><BookOpen size={18} style={{ marginRight: '8px' }} />Statistik</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: '#f5f3ff', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>{selectedTeacher.class_count || 0}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Kelas Diampu</div>
                  </div>
                  <div style={{ background: '#d1fae5', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>{selectedTeacher.journal_count || 0}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Jurnal Mengajar</div>
                  </div>
                </div>
              </div>

              <div>
                <h4><Award size={18} style={{ marginRight: '8px' }} />Riwayat Evaluasi</h4>
                {(() => {
                  const evals = teacherEvaluations.filter(ev => ev.teacher_id === selectedTeacher.id);
                  return evals.length > 0 ? (
                    <div style={{ marginTop: '0.5rem' }}>
                      {evals.map((ev, idx) => (
                        <div key={idx} style={{
                          background: '#f9fafb', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.5rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <strong style={{ color: '#8b5cf6' }}>{new Date(ev.date).toLocaleDateString('id-ID')}</strong>
                            <span style={{ fontWeight: 'bold' }}>⭐ {getAvgScore(ev)}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: '#6b7280', flexWrap: 'wrap' }}>
                            <span>📚 {ev.pedagogy_score}</span>
                            <span>👔 {ev.professionalism_score}</span>
                            <span>😊 {ev.personality_score}</span>
                            <span>🎯 {ev.leadership_score}</span>
                          </div>
                          {ev.notes && (
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#374151' }}>{ev.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#6b7280' }}>Belum ada evaluasi.</p>
                  );
                })()}
              </div>

              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <button className="btn btn-secondary" onClick={() => { setShowDetailModal(false); setSelectedTeacher(null); }}>
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Evaluations */}
        {teacherEvaluations.length > 0 && (
          <section className="dashboard-section" style={{ marginTop: '2rem' }}>
            <h2>
              <Star size={20} style={{ marginRight: '8px' }} />
              Evaluasi Terbaru
            </h2>
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Guru</th>
                    <th style={{ textAlign: 'center' }}>📚 Pedagogi</th>
                    <th style={{ textAlign: 'center' }}>👔 Profesional</th>
                    <th style={{ textAlign: 'center' }}>😊 Kepribadian</th>
                    <th style={{ textAlign: 'center' }}>🎯 Kepemimpinan</th>
                    <th style={{ textAlign: 'center' }}>Rata-rata</th>
                    <th>Evaluator</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherEvaluations.slice(0, 10).map((ev) => (
                    <tr key={ev.id}>
                      <td>{new Date(ev.date).toLocaleDateString('id-ID')}</td>
                      <td><strong>{ev.profiles?.full_name || ev.profiles?.email}</strong></td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: ev.pedagogy_score >= 4 ? '#10b981' : '#f59e0b' }}>{ev.pedagogy_score}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: ev.professionalism_score >= 4 ? '#10b981' : '#f59e0b' }}>{ev.professionalism_score}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: ev.personality_score >= 4 ? '#10b981' : '#f59e0b' }}>{ev.personality_score}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: ev.leadership_score >= 4 ? '#10b981' : '#f59e0b' }}>{ev.leadership_score}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1rem' }}>{getAvgScore(ev)}</td>
                      <td>{ev.admin?.full_name || 'Admin'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default TeacherManagement;