import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Users, UserCog, Mail, BookOpen, Award, Star, Calendar, Trash2, Eye, Printer, X, School, BarChart3 } from 'lucide-react';

const TeacherManagement = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [teacherEvaluations, setTeacherEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => { fetchTeachers(); fetchEvaluations(); }, [user]);

  const fetchTeachers = async () => {
    try {
      const { data: teachersData, error: teachersError } = await supabase
        .from('profiles').select('*').eq('role', 'guru').order('full_name');
      if (teachersError) throw teachersError;
      const { data: classesData } = await supabase
        .from('classes').select('teacher_id').not('teacher_id', 'is', null);
      const classCounts = {};
      (classesData || []).forEach(cls => { classCounts[cls.teacher_id] = (classCounts[cls.teacher_id]||0)+1; });
      const { data: journalsData } = await supabase
        .from('teaching_journals').select('teacher_id');
      const journalCounts = {};
      (journalsData || []).forEach(j => { journalCounts[j.teacher_id] = (journalCounts[j.teacher_id]||0)+1; });
      setTeachers((teachersData||[]).map(t => ({...t, class_count: classCounts[t.id]||0, journal_count: journalCounts[t.id]||0})));
    } catch (error) { console.error('Error fetching teachers:', error.message); }
    finally { setLoading(false); }
  };

  const fetchEvaluations = async () => {
    try {
      const { data, error } = await supabase
        .from('teacher_evaluation_sessions')
        .select('*, profiles!teacher_id(full_name,email), admin:profiles!admin_id(full_name)')
        .order('date', { ascending: false });
      if (error) throw error;
      setTeacherEvaluations(data||[]);
    } catch (error) { console.error('Error fetching evaluations:', error.message); }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm('Yakin ingin menghapus data guru ini?')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', teacherId);
      if (error) throw error;
      fetchTeachers(); alert('Data guru berhasil dihapus!');
    } catch (error) { alert('Error: ' + error.message); }
  };

  const getAvgScore = (ev) => {
    if (!ev) return '0.0';
    return (((ev.pedagogy_score||0)+(ev.professionalism_score||0)+(ev.personality_score||0)+(ev.leadership_score||0))/4).toFixed(1);
  };

  const printTeacherReport = (t) => {
    const evals = teacherEvaluations.filter(e=>e.teacher_id===t.id);
    const as = evals.reduce((a,e)=>{a.pedagogy+=e.pedagogy_score||0;a.professionalism+=e.professionalism_score||0;a.personality+=e.personality_score||0;a.leadership+=e.leadership_score||0;a.count++;return a;},{pedagogy:0,professionalism:0,personality:0,leadership:0,count:0});
    const oa = as.count>0?((as.pedagogy+as.professionalism+as.personality+as.leadership)/(as.count*4)).toFixed(1):0;
    const pw = window.open('','_blank');
    pw.document.write('<html><head><title>Laporan Guru - '+(t.full_name||t.email)+'</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#333}.header{text-align:center;margin-bottom:30px}.header h1{color:#7c3aed}.info-card{background:#f5f3ff;padding:20px;border-radius:10px;margin-bottom:20px;border-left:4px solid #7c3aed}.stats{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:15px;margin:20px 0}.stat-box{background:#f9fafb;padding:15px;border-radius:8px;text-align:center}.stat-value{font-size:20px;font-weight:bold;color:#7c3aed}.stat-label{font-size:11px;color:#666}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f3ff}.score{font-weight:bold;text-align:center}.footer{margin-top:40px;text-align:center;color:#666;font-size:12px}</style></head><body><div class="header"><h1>LAPORAN DATA GURU</h1><p>PKBM - Sistem Administrasi Pendidikan</p></div><div class="info-card"><h2>'+(t.full_name||t.email)+'</h2><p><strong>Email:</strong> '+t.email+'</p><p><strong>Bergabung:</strong> '+new Date(t.created_at).toLocaleDateString('id-ID')+'</p></div>'+(as.count>0?'<div class="stats"><div class="stat-box"><div class="stat-value">'+(as.pedagogy/as.count).toFixed(1)+'</div><div class="stat-label">Rata Pedagogi</div></div><div class="stat-box"><div class="stat-value">'+(as.professionalism/as.count).toFixed(1)+'</div><div class="stat-label">Rata Profesional</div></div><div class="stat-box"><div class="stat-value">'+(as.personality/as.count).toFixed(1)+'</div><div class="stat-label">Rata Kepribadian</div></div><div class="stat-box"><div class="stat-value">'+(as.leadership/as.count).toFixed(1)+'</div><div class="stat-label">Rata Kepemimpinan</div></div></div><h3>Riwayat Evaluasi ('+as.count+' sesi)</h3><table><thead><tr><th>Tanggal</th><th>Pedagogi</th><th>Profesional</th><th>Kepribadian</th><th>Kepemimpinan</th><th>Rata</th><th>Evaluator</th></tr></thead><tbody>'+evals.map(e=>'<tr><td>'+new Date(e.date).toLocaleDateString('id-ID')+'</td><td class="score">'+e.pedagogy_score+'</td><td class="score">'+e.professionalism_score+'</td><td class="score">'+e.personality_score+'</td><td class="score">'+e.leadership_score+'</td><td class="score">'+getAvgScore(e)+'</td><td>'+(e.admin?.full_name||'Admin')+'</td></tr>').join('')+'<tr style="background:#fef3c7;font-weight:bold"><td colspan="5" style="text-align:right">Rata-rata Keseluruhan:</td><td class="score">'+oa+'/5</td><td></td></tr></tbody></table>':'<p>Belum ada evaluasi.</p>')+'<div class="footer">Dicetak: '+new Date().toLocaleString('id-ID')+' | '+evals.length+' sesi</div></body></html>');
    pw.document.close(); pw.print();
  };

  const openDetail = (t) => { setSelectedTeacher(t); setShowDetailModal(true); };

  if (loading) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-pulse flex flex-col items-center gap-md">
            <div className="w-12 h-12 rounded-full bg-primary/20"></div>
            <div className="h-4 w-48 bg-surface-container-high rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const overallAvgScore = teacherEvaluations.length>0
    ? (teacherEvaluations.reduce((s,e)=>s+parseFloat(getAvgScore(e)||0),0)/teacherEvaluations.length).toFixed(1) : '0';

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto space-y-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div>
          <h1 className="text-headline-md md:text-headline-lg font-display font-bold text-on-surface flex items-center gap-sm">
            <UserCog size={28} className="text-primary" /> Data Pengajar
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1">Kelola dan monitor data guru PKBM</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        <div className="bg-gradient-to-br from-primary to-[#5a4fcf] text-white p-xl rounded-xl shadow-md">
          <div className="flex items-center gap-sm mb-xs"><Users size={20} className="text-white/80" /><span className="text-label-md text-white/80">Total Guru</span></div>
          <p className="text-display-sm font-bold mt-1">{teachers.length}</p>
        </div>
        <div className="bg-gradient-to-br from-primary to-[#5a4fcf] text-white p-xl rounded-xl shadow-md">
          <div className="flex items-center gap-sm mb-xs"><BarChart3 size={20} className="text-white/80" /><span className="text-label-md text-white/80">Sesi Evaluasi</span></div>
          <p className="text-display-sm font-bold mt-1">{teacherEvaluations.length}</p>
        </div>
        <div className="bg-gradient-to-br from-primary to-[#5a4fcf] text-white p-xl rounded-xl shadow-md">
          <div className="flex items-center gap-sm mb-xs"><Award size={20} className="text-white/80" /><span className="text-label-md text-white/80">Rata-rata</span></div>
          <p className="text-display-sm font-bold mt-1">{overallAvgScore}</p>
        </div>
      </div>
      <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="px-xl py-lg border-b border-outline-variant/20 flex items-center gap-sm">
          <Users size={20} className="text-primary" /><h2 className="text-title-md font-bold text-on-surface">Daftar Guru</h2>
          <span className="ml-auto bg-primary-container text-primary text-label-sm px-sm py-1 rounded-full">{teachers.length} guru</span>
        </div>
        {teachers.length>0?(
          <div className="p-xl grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
            {teachers.map(t=>{
              const te = teacherEvaluations.filter(e=>e.teacher_id===t.id);
              const avg = te.length>0?(te.reduce((s,e)=>s+parseFloat(getAvgScore(e)||0),0)/te.length).toFixed(1):null;
              return (
                <div key={t.id} className="bg-surface-container-low rounded-xl border border-outline-variant/20 p-lg hover:shadow-md hover:border-primary/30 transition-all duration-200 group">
                  <div className="flex items-start justify-between mb-md">
                    <div className="flex items-center gap-md">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-[#5a4fcf] flex items-center justify-center text-white font-bold text-lg shrink-0">{(t.full_name||t.email||'G').charAt(0).toUpperCase()}</div>
                      <div className="min-w-0">
                        <h3 className="text-title-md font-semibold text-on-surface truncate">{t.full_name||'Nama belum diisi'}</h3>
                        <p className="text-body-sm text-on-surface-variant truncate flex items-center gap-1"><Mail size={12}/>{t.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-sm mb-lg">
                    <div className="bg-surface-container-high rounded-lg p-sm text-center"><p className="text-title-md font-bold text-primary">{t.class_count||0}</p><p className="text-label-sm text-on-surface-variant">Kelas</p></div>
                    <div className="bg-surface-container-high rounded-lg p-sm text-center"><p className="text-title-md font-bold text-primary">{t.journal_count||0}</p><p className="text-label-sm text-on-surface-variant">Jurnal</p></div>
                  </div>
                  {avg&&<div className="flex items-center gap-1 mb-lg text-label-sm text-on-surface-variant"><Award size={14} className="text-primary"/><span>Rata-rata: <strong className="text-on-surface">{avg}/5</strong></span></div>}
                  <div className="flex items-center gap-sm pt-sm border-t border-outline-variant/10">
                    <button onClick={()=>openDetail(t)} className="flex-1 inline-flex items-center justify-center gap-sm px-md py-sm bg-primary text-on-primary rounded-lg text-label-md font-medium hover:bg-primary/90 transition-colors"><Eye size={16}/> Detail</button>
                    <button onClick={()=>printTeacherReport(t)} className="inline-flex items-center justify-center px-md py-sm bg-surface-container-high text-on-surface rounded-lg text-label-md font-medium hover:bg-surface-container-highest transition-colors"><Printer size={16}/></button>
                    <button onClick={()=>handleDeleteTeacher(t.id)} className="inline-flex items-center justify-center px-md py-sm bg-surface-container-high text-on-surface rounded-lg text-label-md font-medium hover:bg-error-container hover:text-error transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
              );
            })}
          </div>
        ):(
          <div className="flex flex-col items-center justify-center py-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-md"><Users size={32} className="text-on-surface-variant/50"/></div>
            <p className="text-body-lg text-on-surface-variant">Belum ada data guru.</p>
            <p className="text-body-sm text-on-surface-variant/60 mt-1">Pastikan ada pengguna dengan peran "guru" di database.</p>
          </div>
        )}
      </div>
      {teacherEvaluations.length>0&&(
        <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm">
          <div className="px-xl py-lg border-b border-outline-variant/20 flex items-center gap-sm"><Star size={20} className="text-primary"/><h2 className="text-title-md font-bold text-on-surface">Evaluasi Terbaru</h2></div>
          <div className="overflow-x-auto p-lg">
            <table className="w-full text-body-sm">
              <thead><tr className="border-b border-outline-variant/20">
                <th className="text-left py-sm px-md text-label-sm text-on-surface-variant font-medium">Tanggal</th>
                <th className="text-left py-sm px-md text-label-sm text-on-surface-variant font-medium">Guru</th>
                <th className="text-center py-sm px-md text-label-sm text-on-surface-variant font-medium">Pedagogi</th>
                <th className="text-center py-sm px-md text-label-sm text-on-surface-variant font-medium">Profesional</th>
                <th className="text-center py-sm px-md text-label-sm text-on-surface-variant font-medium">Kepribadian</th>
                <th className="text-center py-sm px-md text-label-sm text-on-surface-variant font-medium">Kepemimpinan</th>
                <th className="text-center py-sm px-md text-label-sm text-on-surface-variant font-medium">Rata</th>
                <th className="text-left py-sm px-md text-label-sm text-on-surface-variant font-medium">Evaluator</th>
              </tr></thead>
              <tbody>{teacherEvaluations.slice(0,10).map(e=>(
                <tr key={e.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                  <td className="py-md px-md">{new Date(e.date).toLocaleDateString('id-ID')}</td>
                  <td className="py-md px-md font-medium">{e.profiles?.full_name||e.profiles?.email}</td>
                  <td className="py-md px-md text-center font-bold text-primary">{e.pedagogy_score}</td>
                  <td className="py-md px-md text-center font-bold text-primary">{e.professionalism_score}</td>
                  <td className="py-md px-md text-center font-bold text-primary">{e.personality_score}</td>
                  <td className="py-md px-md text-center font-bold text-primary">{e.leadership_score}</td>
                  <td className="py-md px-md text-center font-bold text-title-md">{getAvgScore(e)}</td>
                  <td className="py-md px-md">{e.admin?.full_name||'Admin'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
      {showDetailModal&&selectedTeacher&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-md" onClick={()=>{setShowDetailModal(false);setSelectedTeacher(null);}}>
          <div className="bg-surface rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-xl py-lg border-b border-outline-variant/20">
              <h2 className="text-title-lg font-bold text-on-surface flex items-center gap-sm"><UserCog size={24} className="text-primary"/> Detail Guru</h2>
              <button onClick={()=>{setShowDetailModal(false);setSelectedTeacher(null);}} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface-variant"><X size={20}/></button>
            </div>
            <div className="p-xl space-y-lg">
              <div className="flex items-center gap-lg">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-[#5a4fcf] flex items-center justify-center text-white font-bold text-2xl shrink-0">{(selectedTeacher.full_name||selectedTeacher.email||'G').charAt(0).toUpperCase()}</div>
                <div><h3 className="text-title-lg font-bold text-on-surface">{selectedTeacher.full_name||'Nama belum diisi'}</h3><p className="text-body-md text-on-surface-variant flex items-center gap-1 mt-1"><Mail size={14}/>{selectedTeacher.email}</p><p className="text-body-sm text-on-surface-variant/60 mt-1 flex items-center gap-1"><Calendar size={14}/>Bergabung: {new Date(selectedTeacher.created_at).toLocaleDateString('id-ID')}</p></div>
              </div>
              <div><h4 className="text-title-md font-semibold text-on-surface flex items-center gap-sm mb-md"><School size={18} className="text-primary"/> Statistik</h4>
                <div className="grid grid-cols-2 gap-md">
                  <div className="bg-primary-container/50 rounded-xl p-lg text-center"><p className="text-display-sm font-bold text-primary">{selectedTeacher.class_count||0}</p><p className="text-label-sm text-on-surface-variant">Kelas Diampu</p></div>
                  <div className="bg-primary-container/50 rounded-xl p-lg text-center"><p className="text-display-sm font-bold text-primary">{selectedTeacher.journal_count||0}</p><p className="text-label-sm text-on-surface-variant">Jurnal Mengajar</p></div>
                </div>
              </div>
              <div><h4 className="text-title-md font-semibold text-on-surface flex items-center gap-sm mb-md"><Award size={18} className="text-primary"/> Riwayat Evaluasi</h4>
                {(()=>{const evals=teacherEvaluations.filter(e=>e.teacher_id===selectedTeacher.id);return evals.length>0?(
                  <div className="space-y-sm">{evals.map((e,i)=>(
                    <div key={i} className="bg-surface-container-low rounded-xl p-lg border border-outline-variant/10">
                      <div className="flex items-center justify-between mb-sm"><span className="text-label-sm font-medium text-primary flex items-center gap-1"><Calendar size={12}/>{new Date(e.date).toLocaleDateString('id-ID')}</span><span className="text-label-sm font-bold bg-primary-container text-primary px-sm py-1 rounded-full">⭐ {getAvgScore(e)}</span></div>
                      <div className="flex flex-wrap gap-sm text-body-sm text-on-surface-variant"><span className="bg-surface-container-high px-sm py-1 rounded-lg">📚 Pedagogi: {e.pedagogy_score}</span><span className="bg-surface-container-high px-sm py-1 rounded-lg">👔 Profesional: {e.professionalism_score}</span><span className="bg-surface-container-high px-sm py-1 rounded-lg">😊 Kepribadian: {e.personality_score}</span><span className="bg-surface-container-high px-sm py-1 rounded-lg">🎯 Kepemimpinan: {e.leadership_score}</span></div>
                      {e.notes&&<p className="text-body-sm text-on-surface mt-sm italic border-l-2 border-primary/30 pl-sm">{e.notes}</p>}
                    </div>
                  ))}</div>
                ):(<div className="bg-surface-container-low rounded-xl p-lg text-center"><p className="text-body-md text-on-surface-variant">Belum ada evaluasi.</p></div>);})()}
              </div>
            </div>
            <div className="flex justify-end px-xl py-lg border-t border-outline-variant/20">
              <button onClick={()=>{setShowDetailModal(false);setSelectedTeacher(null);}} className="px-xl py-sm bg-surface-container-high text-on-surface rounded-xl text-label-md font-medium hover:bg-surface-container-highest transition-colors">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;
