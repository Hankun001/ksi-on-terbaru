import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import {
  TrendingUp, Target, Clock, CheckCircle,
  BookOpen, Plus, Trash2,
  Flame, Trophy, Activity,
  Play, Square, X
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-md animate-pulse">
          <div className="w-10 h-10 rounded-full bg-surface-container-high"></div>
          <p className="text-body-md text-on-surface-variant">Memuat progres Anda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-xl">
        <h1 className="text-headline-sm md:text-headline-md font-bold text-on-surface flex items-center gap-sm">
          <TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-primary" />
          Progres Belajar Saya
        </h1>
        <p className="text-body-md text-on-surface-variant mt-xs">
          Pantau perkembangan dan pencapaian belajar Anda
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mb-xl">
        <div className="rounded-xl p-lg text-white bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] shadow-md">
          <div className="flex items-center gap-md">
            <Clock className="w-8 h-8" />
            <div>
              <div className="text-2xl font-bold">{formatDuration(stats.totalStudyTime)}</div>
              <div className="opacity-90 text-body-sm">Total Waktu Belajar</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-lg text-white bg-gradient-to-br from-[#10b981] to-[#059669] shadow-md">
          <div className="flex items-center gap-md">
            <CheckCircle className="w-8 h-8" />
            <div>
              <div className="text-2xl font-bold">{stats.coursesCompleted}</div>
              <div className="opacity-90 text-body-sm">Kursus Selesai</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-lg text-white bg-gradient-to-br from-[#f59e0b] to-[#d97706] shadow-md">
          <div className="flex items-center gap-md">
            <Target className="w-8 h-8" />
            <div>
              <div className="text-2xl font-bold">{stats.goalsAchieved}</div>
              <div className="opacity-90 text-body-sm">Goal Tercapai</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-lg text-white bg-gradient-to-br from-[#ec4899] to-[#db2777] shadow-md">
          <div className="flex items-center gap-md">
            <Flame className="w-8 h-8" />
            <div>
              <div className="text-2xl font-bold">{stats.currentStreak}</div>
              <div className="opacity-90 text-body-sm">Hari Berturut-turut</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
        {/* Main Content - 2/3 */}
        <div className="lg:col-span-2 space-y-xl">
          {/* Course Progress */}
          <div className="bg-surface rounded-xl p-lg shadow-sm border border-outline-variant/30">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-lg">
              <h2 className="flex items-center gap-sm text-title-lg font-bold text-on-surface m-0">
                <BookOpen className="w-5 h-5 text-primary" />
                Progres Kursus
              </h2>
              {activeSession && (
                <div className="flex items-center gap-sm">
                  <div className="flex items-center gap-1.5 text-success font-semibold text-body-sm">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                    Sedang Belajar
                  </div>
                  <button
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error-container text-on-error-container text-label-sm font-medium hover:bg-error-container/80 transition-colors"
                    onClick={() => endLearningSession()}
                  >
                    <Square className="w-3.5 h-3.5" />
                    Akhiri Sesi
                  </button>
                </div>
              )}
            </div>

            {courses.length > 0 ? (
              <div className="flex flex-col gap-md">
                {courses.map(course => (
                  <div key={course.id} className="p-md border border-outline-variant/40 rounded-xl bg-surface-container-low/50 hover:bg-surface-container-low transition-colors">
                    <div className="flex justify-between items-center mb-sm">
                      <h3 className="text-title-md font-semibold text-on-surface m-0">{course.title}</h3>
                      <span className="font-bold text-primary">{course.progress.progressPercent}%</span>
                    </div>

                    <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden mb-sm">
                      <div style={{
                        width: `${course.progress.progressPercent}%`,
                        height: '100%',
                        background: course.progress.progressPercent === 100 ? 'var(--color-success)' : 'var(--color-primary)',
                        borderRadius: '999px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-body-sm text-on-surface-variant">
                        {course.progress.completedMaterials}/{course.progress.totalMaterials} materi selesai
                      </span>
                      <button
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-label-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => startLearningSession(course.id, null)}
                        disabled={!!activeSession}
                      >
                        <Play className="w-3.5 h-3.5" />
                        Mulai Belajar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2xl text-on-surface-variant bg-surface-container-low rounded-lg">
                <BookOpen className="w-12 h-12 mx-auto mb-md opacity-50" />
                <p className="text-body-md">Anda belum terdaftar di kursus mana pun.</p>
              </div>
            )}
          </div>

          {/* Learning Goals */}
          <div className="bg-surface rounded-xl p-lg shadow-sm border border-outline-variant/30">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-lg">
              <h2 className="flex items-center gap-sm text-title-lg font-bold text-on-surface m-0">
                <Target className="w-5 h-5 text-warning" />
                Target Belajar
              </h2>
              <button
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-label-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
                onClick={() => setShowGoalModal(true)}
              >
                <Plus className="w-4 h-4" />
                Tambah Goal
              </button>
            </div>

            {goals.length > 0 ? (
              <div className="flex flex-col gap-md">
                {goals.map(goal => (
                  <div key={goal.id} className={`p-md border rounded-xl transition-colors ${goal.is_completed ? 'bg-success-container/30 border-success' : 'bg-surface-container-low/50 border-outline-variant/40'}`}>
                    <div className="flex justify-between items-start mb-sm">
                      <div>
                        <h4 className="text-title-md font-semibold text-on-surface m-0 mb-1">{goal.title}</h4>
                        <span className="text-body-sm text-on-surface-variant">
                          {getGoalTypeLabel(goal.goal_type)}
                          {goal.deadline && ` • Deadline: ${new Date(goal.deadline).toLocaleDateString('id-ID')}`}
                        </span>
                      </div>
                      <div className="flex gap-sm shrink-0">
                        {goal.is_completed ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                          <>
                            <button
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-container/50 text-on-primary-container text-label-sm font-bold hover:bg-primary-container/80 transition-colors"
                              onClick={() => updateGoalProgress(goal.id, goal.current_value + 1)}
                            >
                              +
                            </button>
                            <button
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error-container/50 text-on-surface-variant hover:text-error transition-colors"
                              onClick={() => deleteGoal(goal.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {goal.description && (
                      <p className="text-body-sm text-on-surface-variant mb-sm">
                        {goal.description}
                      </p>
                    )}

                    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div style={{
                        width: `${Math.min((goal.current_value / goal.target_value) * 100, 100)}%`,
                        height: '100%',
                        background: goal.is_completed ? 'var(--color-success)' : 'var(--color-warning)',
                        borderRadius: '999px'
                      }} />
                    </div>

                    <div className="flex justify-between mt-1">
                      <span className="text-label-xs text-on-surface-variant">
                        {goal.current_value}/{goal.target_value}
                      </span>
                      {goal.is_completed && (
                        <span className="text-label-xs font-semibold text-success">
                          Selesai {new Date(goal.completed_at).toLocaleDateString('id-ID')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2xl text-on-surface-variant bg-surface-container-low rounded-lg">
                <Target className="w-12 h-12 mx-auto mb-md opacity-50" />
                <p className="text-body-md">Belum ada target belajar. Buat target pertama Anda!</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - 1/3 */}
        <div className="space-y-xl">
          {/* Achievements */}
          <div className="bg-surface rounded-xl p-lg shadow-sm border border-outline-variant/30">
            <h2 className="flex items-center gap-sm text-title-lg font-bold text-on-surface mb-lg">
              <Trophy className="w-5 h-5 text-[#ec4899]" />
              Pencapaian ({achievements.length})
            </h2>

            {achievements.length > 0 ? (
              <div className="flex flex-col gap-md">
                {achievements.slice(0, 5).map(achievement => (
                  <div key={achievement.id} className="flex items-center gap-md p-md bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-warning/40">
                    <div className="text-2xl shrink-0">{achievement.icon}</div>
                    <div>
                      <h4 className="text-title-sm font-semibold text-on-surface m-0">{achievement.title}</h4>
                      <p className="text-body-xs text-on-surface-variant m-0">
                        {achievement.description}
                      </p>
                      <span className="text-label-xs text-on-surface-variant">
                        {new Date(achievement.earned_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-lg text-on-surface-variant">
                <Trophy className="w-8 h-8 mx-auto mb-sm opacity-50" />
                <p className="text-body-sm">Belum ada pencapaian.</p>
              </div>
            )}
          </div>

          {/* Recent Learning Sessions */}
          <div className="bg-surface rounded-xl p-lg shadow-sm border border-outline-variant/30">
            <h2 className="flex items-center gap-sm text-title-lg font-bold text-on-surface mb-lg">
              <Activity className="w-5 h-5 text-success" />
              Sesi Belajar Terbaru
            </h2>

            {learningSessions.length > 0 ? (
              <div className="flex flex-col gap-md">
                {learningSessions.slice(0, 5).map(session => (
                  <div key={session.id} className="p-md border border-outline-variant/40 rounded-lg bg-surface-container-low/50">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-body-xs text-on-surface-variant">
                          {session.courses?.title || 'Kursus'}
                        </span>
                        <div className="text-body-sm font-semibold text-on-surface">
                          {session.materials?.title || 'Materi'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-body-xs font-semibold text-on-surface">
                          {session.duration_minutes ? formatDuration(session.duration_minutes) : '-'}
                        </div>
                        <span className="text-label-xs text-on-surface-variant">
                          {new Date(session.started_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-lg text-on-surface-variant">
                <Activity className="w-8 h-8 mx-auto mb-sm opacity-50" />
                <p className="text-body-sm">Belum ada sesi belajar.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-md" onClick={() => setShowGoalModal(false)}>
          <div className="bg-surface rounded-2xl shadow-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-xl pt-lg pb-md border-b border-outline-variant/30">
              <h3 className="text-title-lg font-semibold text-on-surface m-0">Tambah Target Belajar</h3>
              <button 
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant"
                onClick={() => setShowGoalModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-xl space-y-md">
              <div className="space-y-1.5">
                <label className="block text-label-sm font-medium text-on-surface">Kursus</label>
                <select
                  value={goalForm.course_id}
                  onChange={(e) => setGoalForm({...goalForm, course_id: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl border border-outline bg-surface text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  <option value="">Pilih Kursus</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-label-sm font-medium text-on-surface">Jenis Goal</label>
                <select
                  value={goalForm.goal_type}
                  onChange={(e) => setGoalForm({...goalForm, goal_type: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl border border-outline bg-surface text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  <option value="weekly_materials">Materi Mingguan</option>
                  <option value="assignment_completion">Tugas Selesai</option>
                  <option value="quiz_score">Nilai Quiz</option>
                  <option value="study_hours">Jam Belajar</option>
                  <option value="custom">Kustom</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-label-sm font-medium text-on-surface">Judul Goal</label>
                <input
                  type="text"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({...goalForm, title: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl border border-outline bg-surface text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="Contoh: Selesai 5 materi minggu ini"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-label-sm font-medium text-on-surface">Deskripsi (Opsional)</label>
                <textarea
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl border border-outline bg-surface text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  rows={3}
                  placeholder="Deskripsi detail goal Anda"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-label-sm font-medium text-on-surface">Target</label>
                <input
                  type="number"
                  value={goalForm.target_value}
                  onChange={(e) => setGoalForm({...goalForm, target_value: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2.5 rounded-xl border border-outline bg-surface text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  min={1}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-label-sm font-medium text-on-surface">Deadline (Opsional)</label>
                <input
                  type="date"
                  value={goalForm.deadline}
                  onChange={(e) => setGoalForm({...goalForm, deadline: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl border border-outline bg-surface text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              <div className="flex gap-md justify-end pt-sm">
                <button
                  className="px-4 py-2 rounded-xl text-label-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
                  onClick={() => setShowGoalModal(false)}
                >
                  Batal
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-label-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={addGoal}
                  disabled={!goalForm.title || !goalForm.course_id}
                >
                  Simpan Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProgressModule;