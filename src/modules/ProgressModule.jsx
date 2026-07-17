import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { 
  BookOpen, TrendingUp, Users, Target, Eye,
  FileText, HelpCircle, Activity, X
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
      return <span className="text-on-surface-variant">Belum Aktif</span>;
    }
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(student.lastActivity)) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceActivity <= 1) {
      return <span className="text-success font-semibold">Aktif</span>;
    } else if (daysSinceActivity <= 7) {
      return <span className="text-warning">Tidak Aktif ({daysSinceActivity} hari)</span>;
    } else {
      return <span className="text-error">Tidak Aktif ({daysSinceActivity} hari)</span>;
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'var(--color-success)';
    if (percentage >= 50) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-md animate-pulse">
          <div className="w-10 h-10 rounded-full bg-surface-container-high"></div>
          <p className="text-body-md text-on-surface-variant">Memuat data progres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-xl">
        <h1 className="text-headline-sm md:text-headline-md font-bold text-on-surface flex items-center gap-sm">
          <TrendingUp className="w-7 h-7 text-primary" />
          Pemantauan Progres Murid
        </h1>
        <p className="text-body-md text-on-surface-variant mt-xs">
          Lacak dan pantau perkembangan belajar murid di kursus Anda
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mb-xl">
        <div className="rounded-xl p-lg text-white bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] shadow-md">
          <div className="flex items-center gap-md">
            <BookOpen className="w-8 h-8" />
            <div>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
              <div className="opacity-90 text-body-sm">Total Kursus</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-lg text-white bg-gradient-to-br from-[#3b82f6] to-[#2563eb] shadow-md">
          <div className="flex items-center gap-md">
            <Users className="w-8 h-8" />
            <div>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <div className="opacity-90 text-body-sm">Total Murid</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-lg text-white bg-gradient-to-br from-[#10b981] to-[#059669] shadow-md">
          <div className="flex items-center gap-md">
            <Activity className="w-8 h-8" />
            <div>
              <div className="text-2xl font-bold">{stats.activeStudents}</div>
              <div className="opacity-90 text-body-sm">Murid Aktif (7 hari)</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-lg text-white bg-gradient-to-br from-[#f59e0b] to-[#d97706] shadow-md">
          <div className="flex items-center gap-md">
            <Target className="w-8 h-8" />
            <div>
              <div className="text-2xl font-bold">{stats.averageProgress}%</div>
              <div className="opacity-90 text-body-sm">Rata-rata Progres</div>
            </div>
          </div>
        </div>
      </div>

      {/* Course List with Students */}
      <section>
        <h2 className="text-title-lg font-bold text-on-surface flex items-center gap-sm mb-lg">
          <FileText className="w-5 h-5 text-primary" />
          Progres Murid per Kursus
        </h2>
        
        {courses.length > 0 ? (
          <div className="flex flex-col gap-xl">
            {courses.map(course => {
              const courseProgress = progressData[course.id];
              if (!courseProgress) return null;
              
              const studentList = Object.values(courseProgress.students);
              
              return (
                <div key={course.id} className="bg-surface rounded-xl p-lg shadow-sm border border-outline-variant/30">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-md pb-md border-b border-outline-variant/40">
                    <div>
                      <h3 className="text-title-lg font-semibold text-on-surface m-0">{course.title}</h3>
                      <p className="text-body-sm text-on-surface-variant mt-1 m-0">
                        {studentList.length} murid terdaftar
                      </p>
                    </div>
                    <div className="flex items-center gap-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {courseProgress.materialProgress}%
                        </div>
                        <div className="text-label-xs text-on-surface-variant">Rata-rata Progres</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-success">
                          {courseProgress.activeStudents}
                        </div>
                        <div className="text-label-xs text-on-surface-variant">Aktif</div>
                      </div>
                    </div>
                  </div>
                  
                  {studentList.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b-2 border-outline-variant/50">
                            <th className="text-left px-3 py-3 text-label-sm font-semibold text-on-surface-variant">Murid</th>
                            <th className="text-center px-3 py-3 text-label-sm font-semibold text-on-surface-variant">Status</th>
                            <th className="text-center px-3 py-3 text-label-sm font-semibold text-on-surface-variant">Materi</th>
                            <th className="text-center px-3 py-3 text-label-sm font-semibold text-on-surface-variant">Quiz</th>
                            <th className="text-center px-3 py-3 text-label-sm font-semibold text-on-surface-variant">Aktivitas Terakhir</th>
                            <th className="text-center px-3 py-3 text-label-sm font-semibold text-on-surface-variant">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentList.map((student, index) => {
                            const materialProgress = student.totalMaterials > 0 
                              ? Math.round((student.completedMaterials / student.totalMaterials) * 100)
                              : 0;
                            
                            return (
                              <tr key={student.student?.id || index} className="border-b border-outline-variant/20 hover:bg-surface-container-low/50 transition-colors">
                                <td className="px-3 py-3">
                                  <div className="font-semibold text-on-surface">
                                    {student.student?.full_name || student.student?.email || 'Tidak Diketahui'}
                                  </div>
                                  <div className="text-label-xs text-on-surface-variant">
                                    Terdaftar: {new Date(student.enrolledAt).toLocaleDateString('id-ID')}
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  {getStatusBadge(student)}
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <div className="flex items-center justify-center gap-sm">
                                    <div className="w-14 h-2 bg-surface-container-high rounded-full overflow-hidden">
                                      <div style={{ 
                                        width: `${materialProgress}%`, 
                                        height: '100%', 
                                        background: getProgressColor(materialProgress),
                                        borderRadius: '999px'
                                      }} />
                                    </div>
                                    <span className="text-body-sm font-semibold">
                                      {materialProgress}%
                                    </span>
                                  </div>
                                  <div className="text-label-xs text-on-surface-variant">
                                    {student.completedMaterials}/{student.totalMaterials} materi
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  {courseProgress.quizExists ? (
                                    student.bestScore !== null ? (
                                      <div>
                                        <span className={`font-bold ${student.quizPassed ? 'text-success' : 'text-error'}`}>
                                          {student.bestScore}%
                                        </span>
                                        <div className={`text-label-xs ${student.quizPassed ? 'text-success' : 'text-on-surface-variant'}`}>
                                          {student.quizPassed ? 'Lulus' : 'Belum Lulus'}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-on-surface-variant">Belum Mengerjakan</span>
                                    )
                                  ) : (
                                    <span className="text-outline">-</span>
                                  )}
                                </td>
                                <td className="px-3 py-3 text-center">
                                  {student.lastActivity ? (
                                    <div className="text-body-sm">
                                      {new Date(student.lastActivity).toLocaleDateString('id-ID')}
                                      <div className="text-label-xs text-on-surface-variant">
                                        {new Date(student.lastActivity).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-outline">-</span>
                                  )}
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <button
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-label-sm font-medium text-primary hover:bg-primary-container/40 transition-colors"
                                    onClick={() => handleViewStudent(course.id, student.student?.id)}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
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
                    <div className="text-center py-xl text-on-surface-variant bg-surface-container-low rounded-lg">
                      <Users className="w-12 h-12 mx-auto mb-md opacity-50" />
                      <p className="text-body-md">Belum ada murid yang terdaftar di kursus ini.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-3xl text-on-surface-variant bg-surface-container-low rounded-xl">
            <BookOpen className="w-12 h-12 mx-auto mb-md opacity-50" />
            <p className="text-body-md">{role === 'guru' ? 'Anda belum memiliki kursus.' : 'Tidak ada kursus.'}</p>
          </div>
        )}
      </section>

      {/* Student Detail Modal */}
      {viewMode === 'detail' && !loadingDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-md" onClick={() => setViewMode('overview')}>
          <div className="bg-surface rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-xl pt-lg pb-md border-b border-outline-variant/30">
              <h3 className="text-title-lg font-semibold text-on-surface m-0">Detail Progres Murid</h3>
              <button 
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant"
                onClick={() => setViewMode('overview')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-xl space-y-xl">
              {studentDetails.accessLogs && studentDetails.accessLogs.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-sm text-title-md font-semibold text-on-surface mb-md">
                    <FileText className="w-5 h-5 text-primary" />
                    Riwayat Akses Materi
                  </h4>
                  <div className="flex flex-col gap-md">
                    {studentDetails.accessLogs.map((log, index) => (
                      <div key={index} className={`flex justify-between items-center p-md rounded-xl border ${log.is_completed ? 'bg-success-container/30 border-success' : 'bg-surface-container-low border-outline-variant/50'}`}>
                        <div>
                          <div className="font-semibold text-on-surface">
                            {log.materials?.title || 'Materi'}
                          </div>
                          <div className="text-body-sm text-on-surface-variant">
                            Tipe: {log.materials?.material_type || 'Unknown'} | Akses: {log.access_count}x | Durasi: {Math.round(log.time_spent_seconds / 60)} menit
                          </div>
                        </div>
                        <div className="text-right">
                          {log.is_completed ? (
                            <span className="text-success font-semibold">Selesai</span>
                          ) : (
                            <span className="text-on-surface-variant">Belum Selesai</span>
                          )}
                          <div className="text-label-xs text-on-surface-variant">
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
                  <h4 className="flex items-center gap-sm text-title-md font-semibold text-on-surface mb-md">
                    <HelpCircle className="w-5 h-5 text-warning" />
                    Riwayat Quiz
                  </h4>
                  <div className="flex flex-col gap-md">
                    {studentDetails.quizAttempts.map((attempt, index) => (
                      <div key={index} className={`flex justify-between items-center p-md rounded-xl border ${attempt.passed ? 'bg-success-container/30 border-success' : 'bg-error-container/30 border-error'}`}>
                        <div>
                          <div className="font-semibold text-on-surface">
                            Percobaan ke-{attempt.attempt_number}
                          </div>
                          <div className="text-body-sm text-on-surface-variant">
                            Durasi: {Math.round(attempt.time_spent_seconds / 60)} menit | 
                            Jawaban Benar: {attempt.correct_answers} | 
                            Jawaban Salah: {attempt.wrong_answers}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${attempt.passed ? 'text-success' : 'text-error'}`}>
                            {attempt.score}%
                          </div>
                          <div className={`font-semibold ${attempt.passed ? 'text-success' : 'text-error'}`}>
                            {attempt.passed ? 'LULUS' : 'TIDAK LULUS'}
                          </div>
                          <div className="text-label-xs text-on-surface-variant">
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
                <div className="text-center py-2xl text-on-surface-variant">
                  <Activity className="w-12 h-12 mx-auto mb-md opacity-50" />
                  <p className="text-body-md">Belum ada aktivitas tercatat untuk murid ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loadingDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
          <div className="bg-surface rounded-xl p-2xl text-center shadow-xl">
            <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-md"></div>
            <p className="text-body-md text-on-surface">Memuat detail murid...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressModule;