import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { 
  BookOpen, TrendingUp, Award, Clock, CheckCircle, 
  Users, Target, Trophy, Zap, ChevronRight, Eye,
  FileText, HelpCircle, Calendar, Activity
} from 'lucide-react';

const ProgressModule = () => {
  const { user, role } = useAuth();
  const [courses, setCourses] = useState([]);
  const [progressData, setProgressData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [studentDetails, setStudentDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'detail'
  
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    activeStudents: 0,
    averageProgress: 0,
    completedQuizzes: 0
  });

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      let coursesData = [];
      
      if (role === 'admin') {
        const { data, error } = await supabase.from('courses').select('*');
        if (error) throw error;
        coursesData = data || [];
      } else if (role === 'guru') {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('instructor_id', user.id);
        if (error) throw error;
        coursesData = data || [];
      }
      
      setCourses(coursesData || []);
      
      // Get enrollment and progress data for each course
      const progressMap = {};
      let totalStudents = 0;
      let activeStudents = 0;
      let totalProgress = 0;
      
      for (const course of coursesData) {
        // Get enrollments
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('*, profiles(*)')
          .eq('course_id', course.id);
        
        // Get materials
        const { data: materials } = await supabase
          .from('materials')
          .select('id')
          .eq('course_id', course.id)
          .eq('is_published', true);
        
        // Get quiz
        const { data: quiz } = await supabase
          .from('quizzes')
          .select('id')
          .eq('course_id', course.id)
          .eq('is_published', true)
          .single();
        
        // Get material access logs
        const { data: accessLogs } = await supabase
          .from('material_access_log')
          .select('*, materials(*)')
          .eq('course_id', course.id);
        
        // Get quiz attempts
        const { data: quizAttempts } = await supabase
          .from('quiz_attempt_details')
          .select('*')
          .eq('course_id', course.id);
        
        // Group student progress
        const studentsMap = {};
        enrollments?.forEach(enroll => {
          const studentId = enroll.student_id;
          if (!studentsMap[studentId]) {
            studentsMap[studentId] = {
              student: enroll.profiles,
              enrolledAt: enroll.enrolled_at,
              materialsAccessed: [],
              completedMaterials: 0,
              totalMaterials: materials?.length || 0,
              quizAttempts: [],
              bestScore: null,
              quizPassed: null,
              lastActivity: null,
              accessCount: 0
            };
          }
        });
        
        // Process access logs - only count completed materials for progress
        accessLogs?.forEach(log => {
          if (studentsMap[log.student_id]) {
            studentsMap[log.student_id].materialsAccessed.push(log);
            if (log.is_completed) {
              studentsMap[log.student_id].completedMaterials++;
            }
            if (!studentsMap[log.student_id].lastActivity ||
                new Date(log.last_accessed_at) > new Date(studentsMap[log.student_id].lastActivity)) {
              studentsMap[log.student_id].lastActivity = log.last_accessed_at;
            }
            studentsMap[log.student_id].accessCount += log.access_count;
            studentsMap[log.student_id].totalTimeSpent += log.time_spent_seconds || 0;
          }
        });
        
        // Process quiz attempts
        quizAttempts?.forEach(attempt => {
          if (studentsMap[attempt.student_id]) {
            studentsMap[attempt.student_id].quizAttempts.push(attempt);
            if (!studentsMap[attempt.student_id].bestScore || 
                attempt.score > studentsMap[attempt.student_id].bestScore) {
              studentsMap[attempt.student_id].bestScore = attempt.score;
            }
            if (attempt.passed && !studentsMap[attempt.student_id].quizPassed) {
              studentsMap[attempt.student_id].quizPassed = true;
            }
          }
        });
        
        // Calculate course progress
        const studentCount = Object.keys(studentsMap).length;
        let courseTotalProgress = 0;
        Object.values(studentsMap).forEach(s => {
          const progress = s.totalMaterials > 0 
            ? Math.round((s.completedMaterials / s.totalMaterials) * 100)
            : 0;
          courseTotalProgress += progress;
        });
        
        const avgProgress = studentCount > 0 
          ? Math.round(courseTotalProgress / studentCount) 
          : 0;
        
        progressMap[course.id] = {
          course: course,
          students: studentsMap,
          totalStudents: studentCount,
          totalMaterials: materials?.length || 0,
          quizExists: !!quiz,
          materialProgress: avgProgress,
          activeStudents: Object.values(studentsMap).filter(s => 
            s.lastActivity && 
            new Date(s.lastActivity) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length
        };
        
        totalStudents += studentCount;
        activeStudents += progressMap[course.id].activeStudents;
        totalProgress += avgProgress;
      }
      
      setProgressData(progressMap);
      
      const avgProgress = coursesData.length > 0 
        ? Math.round(totalProgress / coursesData.length) 
        : 0;
      
      setStats({
        totalCourses: coursesData.length,
        totalStudents,
        activeStudents,
        averageProgress: avgProgress,
        completedQuizzes: 0 // calculated from quiz attempts
      });
      
    } catch (error) {
      console.error('Error fetching progress data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetails = async (courseId, studentId) => {
    setLoadingDetails(true);
    try {
      // Get material access details
      const { data: accessLogs } = await supabase
        .from('material_access_log')
        .select('*, materials(title, material_type)')
        .eq('course_id', courseId)
        .eq('student_id', studentId)
        .order('last_accessed_at', { ascending: false });
      
      // Get quiz attempts
      const { data: quizAttempts } = await supabase
        .from('quiz_attempt_details')
        .select('*')
        .eq('course_id', courseId)
        .eq('student_id', studentId)
        .order('started_at', { ascending: false });
      
      // Get enrollment info
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('student_id', studentId)
        .single();
      
      setStudentDetails({
        accessLogs: accessLogs || [],
        quizAttempts: quizAttempts || [],
        enrollment: enrollment
      });
    } catch (error) {
      console.error('Error fetching student details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewStudent = (courseId, studentId) => {
    fetchStudentDetails(courseId, studentId);
    setViewMode('detail');
  };

  const getStatusBadge = (student) => {
    if (!student.lastActivity) {
      return <span style={{ color: '#6b7280' }}>Belum Aktif</span>;
    }
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(student.lastActivity)) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceActivity <= 1) {
      return <span style={{ color: '#10b981', fontWeight: '600' }}>Aktif</span>;
    } else if (daysSinceActivity <= 7) {
      return <span style={{ color: '#f59e0b' }}>Tidak Aktif ({daysSinceActivity} hari)</span>;
    } else {
      return <span style={{ color: '#ef4444' }}>Tidak Aktif ({daysSinceActivity} hari)</span>;
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 50) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return <div className="dashboard-container"><div className="loading-spinner">Memuat data progres...</div></div>;
  }

  return (
    <div className="dashboard-container" style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <TrendingUp size={28} style={{ color: '#8b5cf6' }} />
          Pemantauan Progres Murid
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Lacak dan pantau perkembangan belajar murid di kursus Anda
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', 
          color: 'white',
          border: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <BookOpen size={32} />
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>{stats.totalCourses}</div>
              <div style={{ opacity: 0.9 }}>Total Kursus</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
          color: 'white',
          border: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Users size={32} />
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>{stats.totalStudents}</div>
              <div style={{ opacity: 0.9 }}>Total Murid</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
          color: 'white',
          border: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Activity size={32} />
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>{stats.activeStudents}</div>
              <div style={{ opacity: 0.9 }}>Murid Aktif (7 hari)</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
          color: 'white',
          border: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Target size={32} />
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>{stats.averageProgress}%</div>
              <div style={{ opacity: 0.9 }}>Rata-rata Progres</div>
            </div>
          </div>
        </div>
      </div>

      {/* Course List with Students */}
      <div className="dashboard-content">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <FileText size={22} style={{ color: '#8b5cf6' }} />
          Progres Murid per Kursus
        </h2>
        
        {courses.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {courses.map(course => {
              const courseProgress = progressData[course.id];
              if (!courseProgress) return null;
              
              const studentList = Object.values(courseProgress.students);
              
              return (
                <div key={course.id} className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{course.title}</h3>
                      <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                        {studentList.length} murid terdaftar
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8b5cf6' }}>
                          {courseProgress.materialProgress}%
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Rata-rata Progres</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                          {courseProgress.activeStudents}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Aktif</div>
                      </div>
                    </div>
                  </div>
                  
                  {studentList.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                            <th style={{ textAlign: 'left', padding: '0.75rem', color: '#6b7280', fontWeight: '600' }}>Murid</th>
                            <th style={{ textAlign: 'center', padding: '0.75rem', color: '#6b7280', fontWeight: '600' }}>Status</th>
                            <th style={{ textAlign: 'center', padding: '0.75rem', color: '#6b7280', fontWeight: '600' }}>Materi</th>
                            <th style={{ textAlign: 'center', padding: '0.75rem', color: '#6b7280', fontWeight: '600' }}>Quiz</th>
                            <th style={{ textAlign: 'center', padding: '0.75rem', color: '#6b7280', fontWeight: '600' }}>Aktivitas Terakhir</th>
                            <th style={{ textAlign: 'center', padding: '0.75rem', color: '#6b7280', fontWeight: '600' }}>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentList.map((student, index) => {
                            const materialProgress = student.totalMaterials > 0 
                              ? Math.round((student.completedMaterials / student.totalMaterials) * 100)
                              : 0;
                            
                            return (
                              <tr key={student.student?.id || index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '0.75rem' }}>
                                  <div style={{ fontWeight: '600' }}>
                                    {student.student?.full_name || student.student?.email || 'Tidak Diketahui'}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    Terdaftar: {new Date(student.enrolledAt).toLocaleDateString('id-ID')}
                                  </div>
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                  {getStatusBadge(student)}
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <div style={{ 
                                      width: '60px', 
                                      height: '8px', 
                                      background: '#e5e7eb', 
                                      borderRadius: '4px',
                                      overflow: 'hidden'
                                    }}>
                                      <div style={{ 
                                        width: `${materialProgress}%`, 
                                        height: '100%', 
                                        background: getProgressColor(materialProgress),
                                        borderRadius: '4px'
                                      }} />
                                    </div>
                                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                                      {materialProgress}%
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    {student.completedMaterials}/{student.totalMaterials} materi
                                  </div>
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                  {courseProgress.quizExists ? (
                                    student.bestScore !== null ? (
                                      <div>
                                        <span style={{ 
                                          fontWeight: '700',
                                          color: student.quizPassed ? '#10b981' : '#ef4444'
                                        }}>
                                          {student.bestScore}%
                                        </span>
                                        <div style={{ fontSize: '0.75rem', color: student.quizPassed ? '#10b981' : '#6b7280' }}>
                                          {student.quizPassed ? '✅ Lulus' : '❌ Belum Lulus'}
                                        </div>
                                      </div>
                                    ) : (
                                      <span style={{ color: '#6b7280' }}>Belum Mengerjakan</span>
                                    )
                                  ) : (
                                    <span style={{ color: '#9ca3af' }}>-</span>
                                  )}
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                  {student.lastActivity ? (
                                    <div style={{ fontSize: '0.875rem' }}>
                                      {new Date(student.lastActivity).toLocaleDateString('id-ID')}
                                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                        {new Date(student.lastActivity).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    </div>
                                  ) : (
                                    <span style={{ color: '#9ca3af' }}>-</span>
                                  )}
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleViewStudent(course.id, student.student?.id)}
                                  >
                                    <Eye size={14} />
                                    Detail
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '2rem', 
                      color: '#6b7280',
                      background: '#f9fafb',
                      borderRadius: '8px'
                    }}>
                      <Users size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                      <p>Belum ada murid yang terdaftar di kursus ini.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            color: '#6b7280',
            background: '#f9fafb',
            borderRadius: '12px'
          }}>
            <BookOpen size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <p>{role === 'guru' ? 'Anda belum memiliki kursus.' : 'Tidak ada kursus.'}</p>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {viewMode === 'detail' && !loadingDetails && (
        <div className="modal-overlay" onClick={() => setViewMode('overview')}>
          <div className="modal-content large" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h3>Detail Progres Murid</h3>
              <button className="close-btn" onClick={() => setViewMode('overview')}>×</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {studentDetails.accessLogs && studentDetails.accessLogs.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <FileText size={20} style={{ color: '#8b5cf6' }} />
                    Riwayat Akses Materi
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {studentDetails.accessLogs.map((log, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        background: log.is_completed ? '#d1fae5' : '#f3f4f6',
                        borderRadius: '8px',
                        border: `1px solid ${log.is_completed ? '#10b981' : '#e5e7eb'}`
                      }}>
                        <div>
                          <div style={{ fontWeight: '600' }}>
                            {log.materials?.title || 'Materi'}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            Tipe: {log.materials?.material_type || 'Unknown'} | Akses: {log.access_count}x | Durasi: {Math.round(log.time_spent_seconds / 60)} menit
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {log.is_completed ? (
                            <span style={{ color: '#10b981', fontWeight: '600' }}>✅ Selesai</span>
                          ) : (
                            <span style={{ color: '#6b7280' }}>Belum Selesai</span>
                          )}
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {new Date(log.last_accessed_at).toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {studentDetails.quizAttempts && studentDetails.quizAttempts.length > 0 && (
                <div>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <HelpCircle size={20} style={{ color: '#f59e0b' }} />
                    Riwayat Quiz
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {studentDetails.quizAttempts.map((attempt, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        background: attempt.passed ? '#d1fae5' : '#fee2e2',
                        borderRadius: '8px',
                        border: `1px solid ${attempt.passed ? '#10b981' : '#ef4444'}`
                      }}>
                        <div>
                          <div style={{ fontWeight: '600' }}>
                            Percobaan ke-{attempt.attempt_number}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            Durasi: {Math.round(attempt.time_spent_seconds / 60)} menit | 
                            Jawaban Benar: {attempt.correct_answers} | 
                            Jawaban Salah: {attempt.wrong_answers}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ 
                            fontSize: '1.5rem', 
                            fontWeight: '700',
                            color: attempt.passed ? '#10b981' : '#ef4444'
                          }}>
                            {attempt.score}%
                          </div>
                          <div style={{ fontWeight: '600', color: attempt.passed ? '#059669' : '#b91c1c' }}>
                            {attempt.passed ? '✅ LULUS' : '❌ TIDAK LULUS'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {new Date(attempt.started_at).toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!studentDetails.accessLogs || studentDetails.accessLogs.length === 0) && 
               (!studentDetails.quizAttempts || studentDetails.quizAttempts.length === 0) && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <Activity size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                  <p>Belum ada aktivitas tercatat untuk murid ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loadingDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{ 
            background: 'white', 
            padding: '2rem', 
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p>Memuat detail murid...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressModule;