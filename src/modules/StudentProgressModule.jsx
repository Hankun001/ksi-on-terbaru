import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import {
  TrendingUp, Target, Award, Clock, CheckCircle,
  BookOpen, BarChart3, Calendar, Plus, Edit, Trash2,
  Flame, Trophy, Star, Zap, ChevronRight, Activity,
  FileText, HelpCircle, Play, Pause, Square
} from 'lucide-react';

const StudentProgressModule = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [goals, setGoals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [learningSessions, setLearningSessions] = useState([]);
  const [stats, setStats] = useState({
    totalStudyTime: 0,
    coursesCompleted: 0,
    goalsAchieved: 0,
    achievementsEarned: 0,
    currentStreak: 0
  });
  const [activeSession, setActiveSession] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    course_id: '',
    goal_type: 'weekly_materials',
    title: '',
    description: '',
    target_value: 1,
    deadline: ''
  });

  useEffect(() => {
    fetchStudentProgress();

    // Real-time subscriptions for progress updates
    const materialAccessChannel = supabase
      .channel('student-progress-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'material_access_log',
          filter: `student_id=eq.${user.id}`
        },
        () => {
          fetchStudentProgress();
        }
      )
      .subscribe();

    const goalsChannel = supabase
      .channel('student-goals-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_goals',
          filter: `student_id=eq.${user.id}`
        },
        () => {
          fetchStudentProgress();
        }
      )
      .subscribe();

    const achievementsChannel = supabase
      .channel('student-achievements-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'student_achievements',
          filter: `student_id=eq.${user.id}`
        },
        () => {
          fetchStudentProgress();
        }
      )
      .subscribe();

    const sessionsChannel = supabase
      .channel('learning-sessions-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'learning_sessions',
          filter: `student_id=eq.${user.id}`
        },
        () => {
          fetchStudentProgress();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(materialAccessChannel);
      supabase.removeChannel(goalsChannel);
      supabase.removeChannel(achievementsChannel);
      supabase.removeChannel(sessionsChannel);
    };
  }, [user]);

  const fetchStudentProgress = async () => {
    try {
      setLoading(true);

      // Get enrolled courses with progress
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*, courses(*)')
        .eq('student_id', user.id);

      // Get progress data for each course
      const courseIds = enrollments?.map(e => e.course_id) || [];
      let materialProgress = {};

      if (courseIds.length > 0) {
        for (const courseId of courseIds) {
          // Get published materials for this course
          const { data: materials } = await supabase
            .from('materials')
            .select('id')
            .eq('course_id', courseId)
            .eq('is_published', true);

          // Get completed materials from material_access_log
          const { data: accessLogs } = await supabase
            .from('material_access_log')
            .select('material_id, is_completed, access_count, time_spent_seconds, last_accessed_at')
            .eq('course_id', courseId)
            .eq('student_id', user.id)
            .eq('is_completed', true);

          const totalMaterials = materials?.length || 0;
          const completedMaterials = accessLogs?.length || 0;
          const progressPercent = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;

          // Calculate total time spent
          const totalTimeSpent = accessLogs?.reduce((acc, log) => acc + (log.time_spent_seconds || 0), 0) || 0;
          const totalAccessCount = accessLogs?.reduce((acc, log) => acc + (log.access_count || 0), 0) || 0;

          materialProgress[courseId] = {
            totalMaterials,
            completedMaterials,
            progressPercent,
            totalTimeSpent,
            totalAccessCount,
            lastActivity: accessLogs?.sort((a, b) => new Date(b.last_accessed_at) - new Date(a.last_accessed_at))[0]?.last_accessed_at
          };
        }
      }

      const coursesWithProgress = enrollments?.map(enrollment => ({
        ...enrollment.courses,
        progress: materialProgress[enrollment.course_id] || {
          totalMaterials: 0,
          completedMaterials: 0,
          progressPercent: 0,
          totalTimeSpent: 0,
          totalAccessCount: 0,
          lastActivity: null
        }
      })) || [];

      setCourses(coursesWithProgress);

      // Get student goals
      const { data: goalsData } = await supabase
        .from('student_goals')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      setGoals(goalsData || []);

      // Get achievements
      const { data: achievementsData } = await supabase
        .from('student_achievements')
        .select('*')
        .eq('student_id', user.id)
        .order('earned_at', { ascending: false });

      setAchievements(achievementsData || []);

      // Get learning sessions
      const { data: sessionsData } = await supabase
        .from('learning_sessions')
        .select('*, courses(title), materials(title)')
        .eq('student_id', user.id)
        .order('started_at', { ascending: false })
        .limit(20);

      setLearningSessions(sessionsData || []);

      // Calculate stats
      const totalStudyTime = sessionsData?.reduce((acc, session) => acc + (session.duration_minutes || 0), 0) || 0;
      // Alternative: use time_spent from material_access_log
      const totalTimeFromMaterials = coursesWithProgress.reduce((acc, course) => acc + (course.progress.totalTimeSpent || 0), 0);
      const finalStudyTime = Math.max(totalStudyTime, Math.round(totalTimeFromMaterials / 60)); // Convert seconds to minutes

      const coursesCompleted = coursesWithProgress.filter(c => c.progress.progressPercent === 100).length;
      const goalsAchieved = goalsData?.filter(g => g.is_completed).length || 0;
      const achievementsEarned = achievementsData?.length || 0;

      // Calculate current streak (consecutive days with study sessions or material access)
      const streak = calculateStreak(sessionsData || []);

      setStats({
        totalStudyTime: finalStudyTime,
        coursesCompleted,
        goalsAchieved,
        achievementsEarned,
        currentStreak: streak
      });

    } catch (error) {
      console.error('Error fetching student progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (sessions) => {
    if (!sessions.length) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const hasSessionOnDate = sessions.some(session => {
        const sessionDate = new Date(session.started_at);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === currentDate.getTime();
      });

      if (hasSessionOnDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const startLearningSession = async (courseId, materialId) => {
    try {
      const { data, error } = await supabase
        .from('learning_sessions')
        .insert({
          student_id: user.id,
          course_id: courseId,
          material_id: materialId,
          session_type: 'study',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      setActiveSession(data);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const endLearningSession = async (progressAfter = null) => {
    if (!activeSession) return;

    try {
      const endedAt = new Date().toISOString();
      const duration = Math.round((new Date(endedAt) - new Date(activeSession.started_at)) / (1000 * 60));

      await supabase
        .from('learning_sessions')
        .update({
          ended_at: endedAt,
          duration_minutes: duration,
          progress_after: progressAfter || activeSession.progress_after
        })
        .eq('id', activeSession.id);

      setActiveSession(null);
      fetchStudentProgress(); // Refresh data
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const addGoal = async () => {
    try {
      const { error } = await supabase
        .from('student_goals')
        .insert({
          student_id: user.id,
          ...goalForm,
          deadline: goalForm.deadline || null
        });

      if (error) throw error;

      setShowGoalModal(false);
      setGoalForm({
        course_id: '',
        goal_type: 'weekly_materials',
        title: '',
        description: '',
        target_value: 1,
        deadline: ''
      });
      fetchStudentProgress();
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const updateGoalProgress = async (goalId, newValue) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      const isCompleted = newValue >= goal.target_value;

      await supabase
        .from('student_goals')
        .update({
          current_value: newValue,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('id', goalId);

      fetchStudentProgress();
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const deleteGoal = async (goalId) => {
    if (!confirm('Yakin ingin menghapus goal ini?')) return;

    try {
      await supabase
        .from('student_goals')
        .delete()
        .eq('id', goalId);

      fetchStudentProgress();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}j ${mins}m`;
  };

  const getGoalTypeLabel = (type) => {
    const types = {
      weekly_materials: 'Materi Mingguan',
      assignment_completion: 'Tugas Selesai',
      quiz_score: 'Nilai Quiz',
      study_hours: 'Jam Belajar',
      custom: 'Kustom'
    };
    return types[type] || type;
  };

  if (loading) {
    return <div className="dashboard-container"><div className="loading-spinner">Memuat progres Anda...</div></div>;
  }

  return (
    <div className="dashboard-container" style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem',
          fontSize: 'clamp(1.25rem, 5vw, 1.75rem)',
          lineHeight: 1.3
        }}>
          <TrendingUp size={24} style={{ color: '#8b5cf6' }} />
          Progres Belajar Saya
        </h1>
        <p style={{
          color: '#6b7280',
          margin: 0,
          fontSize: '0.9rem',
          lineHeight: 1.4
        }}>
          Pantau perkembangan dan pencapaian belajar Anda
        </p>
      </div>

      {/* Stats Cards */}
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
            <Clock size={32} />
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>{formatDuration(stats.totalStudyTime)}</div>
              <div style={{ opacity: 0.9 }}>Total Waktu Belajar</div>
            </div>
          </div>
        </div>

        <div className="card" style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <CheckCircle size={32} />
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>{stats.coursesCompleted}</div>
              <div style={{ opacity: 0.9 }}>Kursus Selesai</div>
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
              <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>{stats.goalsAchieved}</div>
              <div style={{ opacity: 0.9 }}>Goal Tercapai</div>
            </div>
          </div>
        </div>

        <div className="card" style={{
          background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
          color: 'white',
          border: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Flame size={32} />
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>{stats.currentStreak}</div>
              <div style={{ opacity: 0.9 }}>Hari Berturut-turut</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Main Content */}
        <div>
          {/* Course Progress */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <BookOpen size={22} style={{ color: '#8b5cf6' }} />
                Progres Kursus
              </h2>
              {activeSession && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ color: '#10b981', fontWeight: '600' }}>● Sedang Belajar</div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => endLearningSession()}
                  >
                    <Square size={14} />
                    Akhiri Sesi
                  </button>
                </div>
              )}
            </div>

            {courses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {courses.map(course => (
                  <div key={course.id} style={{
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: '#fafafa'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{course.title}</h3>
                      <span style={{ fontWeight: '700', color: '#8b5cf6' }}>{course.progress.progressPercent}%</span>
                    </div>

                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        width: `${course.progress.progressPercent}%`,
                        height: '100%',
                        background: course.progress.progressPercent === 100 ? '#10b981' : '#8b5cf6',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <small style={{ color: '#6b7280' }}>
                        {course.progress.completedMaterials}/{course.progress.totalMaterials} materi selesai
                      </small>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => startLearningSession(course.id, null)}
                        disabled={!!activeSession}
                      >
                        <Play size={14} />
                        Mulai Belajar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#6b7280',
                background: '#f9fafb',
                borderRadius: '8px'
              }}>
                <BookOpen size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                <p>Anda belum terdaftar di kursus mana pun.</p>
              </div>
            )}
          </div>

          {/* Learning Goals */}
          <div className="card">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Target size={22} style={{ color: '#f59e0b' }} />
                Target Belajar
              </h2>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowGoalModal(true)}
              >
                <Plus size={14} />
                Tambah Goal
              </button>
            </div>

            {goals.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {goals.map(goal => (
                  <div key={goal.id} style={{
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: goal.is_completed ? '#d1fae5' : '#fafafa'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>{goal.title}</h4>
                        <small style={{ color: '#6b7280' }}>
                          {getGoalTypeLabel(goal.goal_type)}
                          {goal.deadline && ` • Deadline: ${new Date(goal.deadline).toLocaleDateString('id-ID')}`}
                        </small>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {goal.is_completed ? (
                          <CheckCircle size={20} style={{ color: '#10b981' }} />
                        ) : (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => updateGoalProgress(goal.id, goal.current_value + 1)}
                            >
                              +
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => deleteGoal(goal.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {goal.description && (
                      <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#6b7280' }}>
                        {goal.description}
                      </p>
                    )}

                    <div style={{
                      width: '100%',
                      height: '6px',
                      background: '#e5e7eb',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min((goal.current_value / goal.target_value) * 100, 100)}%`,
                        height: '100%',
                        background: goal.is_completed ? '#10b981' : '#f59e0b',
                        borderRadius: '3px'
                      }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                      <small style={{ color: '#6b7280' }}>
                        {goal.current_value}/{goal.target_value}
                      </small>
                      {goal.is_completed && (
                        <small style={{ color: '#10b981', fontWeight: '600' }}>
                          ✅ Selesai {new Date(goal.completed_at).toLocaleDateString('id-ID')}
                        </small>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#6b7280',
                background: '#f9fafb',
                borderRadius: '8px'
              }}>
                <Target size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                <p>Belum ada target belajar. Buat target pertama Anda!</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Achievements */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Trophy size={22} style={{ color: '#ec4899' }} />
              Pencapaian ({achievements.length})
            </h2>

            {achievements.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {achievements.slice(0, 5).map(achievement => (
                  <div key={achievement.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    borderRadius: '8px',
                    border: '1px solid #f59e0b'
                  }}>
                    <div style={{ fontSize: '2rem' }}>{achievement.icon}</div>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>{achievement.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
                        {achievement.description}
                      </p>
                      <small style={{ color: '#6b7280' }}>
                        {new Date(achievement.earned_at).toLocaleDateString('id-ID')}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '1rem',
                color: '#6b7280'
              }}>
                <Trophy size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                <p>Belum ada pencapaian.</p>
              </div>
            )}
          </div>

          {/* Recent Learning Sessions */}
          <div className="card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Activity size={22} style={{ color: '#10b981' }} />
              Sesi Belajar Terbaru
            </h2>

            {learningSessions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {learningSessions.slice(0, 5).map(session => (
                  <div key={session.id} style={{
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    background: '#fafafa'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <small style={{ color: '#6b7280' }}>
                          {session.courses?.title || 'Kursus'}
                        </small>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                          {session.materials?.title || 'Materi'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                          {session.duration_minutes ? formatDuration(session.duration_minutes) : '-'}
                        </div>
                        <small style={{ color: '#6b7280' }}>
                          {new Date(session.started_at).toLocaleDateString('id-ID')}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '1rem',
                color: '#6b7280'
              }}>
                <Activity size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                <p>Belum ada sesi belajar.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Goal Modal */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Target Belajar</h3>
              <button className="close-btn" onClick={() => setShowGoalModal(false)}>×</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label>Kursus</label>
                  <select
                    value={goalForm.course_id}
                    onChange={(e) => setGoalForm({...goalForm, course_id: e.target.value})}
                    className="form-control"
                  >
                    <option value="">Pilih Kursus</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Jenis Goal</label>
                  <select
                    value={goalForm.goal_type}
                    onChange={(e) => setGoalForm({...goalForm, goal_type: e.target.value})}
                    className="form-control"
                  >
                    <option value="weekly_materials">Materi Mingguan</option>
                    <option value="assignment_completion">Tugas Selesai</option>
                    <option value="quiz_score">Nilai Quiz</option>
                    <option value="study_hours">Jam Belajar</option>
                    <option value="custom">Kustom</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Judul Goal</label>
                  <input
                    type="text"
                    value={goalForm.title}
                    onChange={(e) => setGoalForm({...goalForm, title: e.target.value})}
                    className="form-control"
                    placeholder="Contoh: Selesai 5 materi minggu ini"
                  />
                </div>

                <div className="form-group">
                  <label>Deskripsi (Opsional)</label>
                  <textarea
                    value={goalForm.description}
                    onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
                    className="form-control"
                    rows={3}
                    placeholder="Deskripsi detail goal Anda"
                  />
                </div>

                <div className="form-group">
                  <label>Target</label>
                  <input
                    type="number"
                    value={goalForm.target_value}
                    onChange={(e) => setGoalForm({...goalForm, target_value: parseInt(e.target.value) || 1})}
                    className="form-control"
                    min={1}
                  />
                </div>

                <div className="form-group">
                  <label>Deadline (Opsional)</label>
                  <input
                    type="date"
                    value={goalForm.deadline}
                    onChange={(e) => setGoalForm({...goalForm, deadline: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowGoalModal(false)}
                  >
                    Batal
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={addGoal}
                    disabled={!goalForm.title || !goalForm.course_id}
                  >
                    Simpan Goal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProgressModule;