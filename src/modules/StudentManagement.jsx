import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { GraduationCap, Users, BookOpen, Award, Search, Eye, Printer, X, School, BarChart3, Calendar } from 'lucide-react';

const StudentManagement = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [studentEvaluations, setStudentEvaluations] = useState([]);
  const [studentClasses, setStudentClasses] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => { fetchStudents(); fetchEvaluations(); fetchStudentClasses(); }, [user]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('role', 'murid').order('full_name');
      if (error) throw error;
      setStudents(data||[]);
    } catch (error) { console.error('Error fetching students:', error.message); }
    finally { setLoading(false); }
  };

  const fetchEvaluations = async () => {
    try {
      const { data, error } = await supabase.from('student_evaluations').select('*');
      if (error) throw error;
      setStudentEvaluations(data||[]);
    } catch (error) { console.error('Error fetching evaluations:', error.message); }
  };

  const fetchStudentClasses = async () => {
    try {
      const { data: csData, error: csError } = await supabase.from('class_students').select('*');
      if (csError) throw csError;
      if (csData&&csData.length>0) {
        const ids = [...new Set(csData.map(c=>c.class_id).filter(Boolean))];
        const { data: cd } = await supabase.from('classes').select('id,name,education_level,grade_level').in('id', ids);
        const cl = {}; (cd||[]).forEach(c=>{cl[c.id]=c;});
        const g = {};
        csData.forEach(c=>{if(!g[c.student_id])g[c.student_id]=[];g[c.student_id].push(cl[c.class_id]||{id:c.class_id,name:'Kelas tidak diketahui'});});
        setStudentClasses(g);
      }
    } catch (error) { console.error('Error fetching student classes:', error.message); }
  };

  const getStudentStats = (id) => {
    const evals = studentEvaluations.filter(e=>e.student_id===id);
    const totalEvals = evals.length;
    const avgScore = totalEvals>0?Math.round(evals.reduce((s,e)=>s+e.score,0)/totalEvals):0;
    const classList = studentClasses[id]||[];
    return { totalEvals, avgScore, classCount: classList.length, classList };
  };

  const getScoreColor = (s) => { if(s>=90)return '#10b981';if(s>=80)return '#3b82f6';if(s>=70)return '#f59e0b';return '#ef4444'; };
  const getScoreBgClass = (s) => { if(s>=70)return 'bg-primary-container text-primary';return 'bg-error-container text-error'; };

  const printStudentReport = (s) => {
    const st = getStudentStats(s.id);
    const evals = studentEvaluations.filter(e=>e.student_id===s.id);
    const pw = window.open('','_blank');
    pw.document.write('<html><head><title>Laporan Siswa - '+(s.full_name||'')+'</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#333}.header{text-align:center;margin-bottom:30px}.header h1{color:#7c3aed}.info-card{background:#f5f3ff;padding:20px;border-radius:10px;margin-bottom:20px;border-left:4px solid #7c3aed}.stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:15px;margin:20px 0}.stat-box{background:#f9fafb;padding:15px;border-radius:8px;text-align:center}.stat-value{font-size:24px;font-weight:bold;color:#7c3aed}.stat-label{font-size:12px;color:#666}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f5f3ff}.footer{margin-top:40px;text-align:center;color:#666;font-size:12px}</style></head><body><div class="header"><h1>LAPORAN DATA SISWA</h1><p>PKBM - Sistem Administrasi Pendidikan</p></div><div class="info-card"><h2>'+(s.full_name||'Nama belum diisi')+'</h2><p><strong>Email:</strong> '+s.email+'</p><p><strong>Bergabung:</strong> '+new Date(s.created_at).toLocaleDateString('id-ID')+'</p></div><div class="stats"><div class="stat-box"><div class="stat-value">'+st.classCount+'</div><div class="stat-label">Kelas</div></div><div class="stat-box"><div class="stat-value">'+st.totalEvals+'</div><div class="stat-label">Penilaian</div></div><div class="stat-box"><div class="stat-value" style="color:'+getScoreColor(st.avgScore)+'">'+st.avgScore+'</div><div class="stat-label">Rata-rata</div></div></div><h3>Kelas yang Diikuti</h3>'+(st.classList.length>0?'<ul>'+st.classList.map(c=>'<li>'+c.name+(c.education_level?' ('+c.education_level.toUpperCase()+')':'')+'</li>').join('')+'</ul>':'<p>Tidak terdaftar di kelas manapun.</p>')+'<h3>Riwayat Penilaian</h3>'+(evals.length>0?'<table><thead><tr><th>Tanggal</th><th>Aspek</th><th>Nilai</th><th>Keterangan</th></tr></thead><tbody>'+evals.map(e=>'<tr><td>'+new Date(e.date).toLocaleDateString('id-ID')+'</td><td>'+e.aspect+'</td><td><strong style="color:'+getScoreColor(e.score)+'">'+e.score+'</strong></td><td>'+(e.note?(e.note.substring(0,50)+(e.note.length>50?'...':'')):'-')+'</td></tr>').join('')+'</tbody></table>':'<p>Belum ada penilaian.</p>')+'<div class="footer">Dicetak: '+new Date().toLocaleString('id-ID')+' | '+evals.length+' penilaian</div></body></html>');
    pw.document.close(); pw.print();
  };

  const filteredStudents = students.filter(s=>(s.full_name||'').toLowerCase().includes(searchQuery.toLowerCase())||(s.email||'').toLowerCase().includes(searchQuery.toLowerCase()));

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

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto space-y-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div>
          <h1 className="text-headline-md md:text-headline-lg font-display font-bold text-on-surface flex items-center gap-sm">
            <GraduationCap size={28} className="text-primary" /> Data Siswa
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1">Kelola dan monitor data siswa PKBM</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search size={18} className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input type="text" placeholder="Cari nama atau email..." value={searchQuery}
            onChange={e=>setSearchQuery(e.target.value)}
            className="w-full sm:w-72 pl-xl pr-md py-sm bg-surface-container-high border border-outline-variant/30 rounded-xl text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        <div className="bg-gradient-to-br from-primary to-[#5a4fcf] text-white p-xl rounded-xl shadow-md">
          <div className="flex items-center gap-sm mb-xs"><Users size={20} className="text-white/80" /><span className="text-label-md text-white/80">Total Siswa</span></div>
          <p className="text-display-sm font-bold mt-1">{students.length}</p>
        </div>
        <div className="bg-gradient-to-br from-primary to-[#5a4fcf] text-white p-xl rounded-xl shadow-md">
          <div className="flex items-center gap-sm mb-xs"><BarChart3 size={20} className="text-white/80" /><span className="text-label-md text-white/80">Total Penilaian</span></div>
          <p className="text-display-sm font-bold mt-1">{studentEvaluations.length}</p>
        </div>
        <div className="bg-gradient-to-br from-primary to-[#5a4fcf] text-white p-xl rounded-xl shadow-md">
          <div className="flex items-center gap-sm mb-xs"><School size={20} className="text-white/80" /><span className="text-label-md text-white/80">Kelas Terdaftar</span></div>
          <p className="text-display-sm font-bold mt-1">{Object.keys(studentClasses).length}</p>
        </div>
      </div>
      <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="px-xl py-lg border-b border-outline-variant/20 flex items-center gap-sm">
          <Users size={20} className="text-primary" /><h2 className="text-title-md font-bold text-on-surface">Daftar Siswa</h2>
          <span className="ml-auto bg-primary-container text-primary text-label-sm px-sm py-1 rounded-full">{filteredStudents.length} siswa</span>
        </div>
        {filteredStudents.length>0?(
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead><tr className="bg-surface-container-low">
                <th className="text-left py-md px-lg text-label-sm text-on-surface-variant font-medium">Nama</th>
                <th className="text-left py-md px-lg text-label-sm text-on-surface-variant font-medium">Email</th>
                <th className="text-left py-md px-lg text-label-sm text-on-surface-variant font-medium">Kelas</th>
                <th className="text-center py-md px-lg text-label-sm text-on-surface-variant font-medium">Penilaian</th>
                <th className="text-center py-md px-lg text-label-sm text-on-surface-variant font-medium">Rata</th>
                <th className="text-center py-md px-lg text-label-sm text-on-surface-variant font-medium">Aksi</th>
              </tr></thead>
              <tbody>{filteredStudents.map(s=>{
                const st = getStudentStats(s.id);
                return (
                  <tr key={s.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                    <td className="py-md px-lg"><div className="flex items-center gap-md"><div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-[#5a4fcf] flex items-center justify-center text-white font-bold text-sm shrink-0">{(s.full_name||s.email||'S').charAt(0).toUpperCase()}</div><p className="font-semibold text-on-surface">{s.full_name||'Nama belum diisi'}</p></div></td>
                    <td className="py-md px-lg text-on-surface-variant">{s.email}</td>
                    <td className="py-md px-lg"><div className="flex flex-wrap gap-1">{st.classList.length>0?st.classList.map((c,i)=><span key={i} className="bg-surface-container-high text-on-surface-variant text-label-xs px-sm py-0.5 rounded-md">{c.name}</span>):<span className="text-on-surface-variant/50">-</span>}</div></td>
                    <td className="py-md px-lg text-center"><span className="inline-flex items-center gap-1 bg-primary-container/50 text-primary text-label-sm px-sm py-0.5 rounded-full font-medium"><Award size={12}/>{st.totalEvals}</span></td>
                    <td className="py-md px-lg text-center">{st.avgScore>0?<div className={'inline-flex items-center justify-center w-8 h-8 rounded-full text-label-sm font-bold '+getScoreBgClass(st.avgScore)}>{st.avgScore}</div>:<span className="text-on-surface-variant/50">-</span>}</td>
                    <td className="py-md px-lg"><div className="flex items-center justify-center gap-sm">
                      <button onClick={()=>{setSelectedStudent(s);setShowDetailModal(true);}} className="inline-flex items-center justify-center p-sm bg-primary-container text-primary rounded-lg hover:bg-primary hover:text-on-primary transition-all" title="Detail"><Eye size={16}/></button>
                      <button onClick={()=>printStudentReport(s)} className="inline-flex items-center justify-center p-sm bg-surface-container-high text-on-surface-variant rounded-lg hover:bg-surface-container-highest transition-all" title="Cetak"><Printer size={16}/></button>
                    </div></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ):(
          <div className="flex flex-col items-center justify-center py-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-md"><GraduationCap size={32} className="text-on-surface-variant/50"/></div>
            <p className="text-body-lg text-on-surface-variant">Tidak ada siswa ditemukan.</p>
            <p className="text-body-sm text-on-surface-variant/60 mt-1">{searchQuery?'Coba ubah kata kunci pencarian.':'Pastikan ada pengguna dengan peran "murid" di database.'}</p>
          </div>
        )}
      </div>
      {showDetailModal&&selectedStudent&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-md" onClick={()=>setShowDetailModal(false)}>
          <div className="bg-surface rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-xl py-lg border-b border-outline-variant/20">
              <h2 className="text-title-lg font-bold text-on-surface flex items-center gap-sm"><GraduationCap size={24} className="text-primary"/> Detail Siswa</h2>
              <button onClick={()=>setShowDetailModal(false)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface-variant"><X size={20}/></button>
            </div>
            <div className="p-xl space-y-lg">
              <div className="flex items-center gap-lg">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-[#5a4fcf] flex items-center justify-center text-white font-bold text-2xl shrink-0">{(selectedStudent.full_name||selectedStudent.email||'S').charAt(0).toUpperCase()}</div>
                <div><h3 className="text-title-lg font-bold text-on-surface">{selectedStudent.full_name||'Nama belum diisi'}</h3><p className="text-body-md text-on-surface-variant mt-1">{selectedStudent.email}</p><p className="text-body-sm text-on-surface-variant/60 mt-1 flex items-center gap-1"><Calendar size={14}/> Bergabung: {new Date(selectedStudent.created_at).toLocaleDateString('id-ID')}</p></div>
              </div>
              <div><h4 className="text-title-md font-semibold text-on-surface flex items-center gap-sm mb-md"><BookOpen size={18} className="text-primary"/> Kelas Terdaftar</h4>
                {(()=>{const cls=studentClasses[selectedStudent.id]||[];return cls.length>0?(
                  <div className="flex flex-wrap gap-sm">{cls.map((c,i)=>(
                    <span key={i} className="bg-primary-container/50 text-primary text-label-sm font-medium px-md py-sm rounded-lg">{c.name}{c.education_level?' ('+c.education_level.toUpperCase()+')':''}</span>
                  ))}</div>
                ):(<div className="bg-surface-container-low rounded-xl p-lg text-center"><p className="text-body-md text-on-surface-variant">Belum terdaftar di kelas manapun.</p></div>);})()}
              </div>
              <div><h4 className="text-title-md font-semibold text-on-surface flex items-center gap-sm mb-md"><Award size={18} className="text-primary"/> Penilaian</h4>
                {(()=>{const evals=studentEvaluations.filter(e=>e.student_id===selectedStudent.id);return evals.length>0?(
                  <div className="space-y-sm">{evals.map((e,i)=>(
                    <div key={i} className="bg-surface-container-low rounded-xl p-lg border border-outline-variant/10">
                      <div className="flex items-start justify-between">
                        <div><p className="font-semibold text-on-surface">{e.aspect}</p><p className="text-label-sm text-on-surface-variant mt-1 flex items-center gap-1"><Calendar size={12}/> {new Date(e.date).toLocaleDateString('id-ID')}</p></div>
                        <div className={'text-label-sm font-bold px-md py-1 rounded-full '+getScoreBgClass(e.score)}>{e.score}</div>
                      </div>
                      {e.note&&<p className="text-body-sm text-on-surface-variant mt-sm border-l-2 border-primary/30 pl-sm">{e.note}</p>}
                    </div>
                  ))}</div>
                ):(<div className="bg-surface-container-low rounded-xl p-lg text-center"><p className="text-body-md text-on-surface-variant">Belum ada penilaian.</p></div>);})()}
              </div>
            </div>
            <div className="flex justify-end px-xl py-lg border-t border-outline-variant/20">
              <button onClick={()=>setShowDetailModal(false)} className="px-xl py-sm bg-surface-container-high text-on-surface rounded-xl text-label-md font-medium hover:bg-surface-container-highest transition-colors">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
