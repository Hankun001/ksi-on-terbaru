import { supabase } from '../../../lib/supabaseClient';

// ==========================================
// EXAM CRUD
// ==========================================

export const fetchTeacherExams = async (teacherId) => {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const fetchAllExams = async () => {
  const { data, error } = await supabase
    .from('exams')
    .select('*, profiles!exams_created_by_fkey(email, display_name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const fetchPublishedExams = async () => {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .in('status', ['published', 'closed'])
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const fetchExamById = async (examId) => {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('id', examId)
    .single();
  if (error) throw error;
  return data;
};

export const createExam = async (examData) => {
  const { data, error } = await supabase
    .from('exams')
    .insert([examData])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateExam = async (examId, updates) => {
  const { data, error } = await supabase
    .from('exams')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', examId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const publishExam = async (examId) => {
  return updateExam(examId, {
    status: 'published',
    published_at: new Date().toISOString()
  });
};

export const closeExam = async (examId) => {
  // First auto-submit all in-progress attempts
  const { error: submitError } = await supabase
    .from('exam_attempts')
    .update({
      status: 'auto_submitted',
      submitted_at: new Date().toISOString()
    })
    .eq('exam_id', examId)
    .eq('status', 'in_progress');

  if (submitError) throw submitError;

  // Then close the exam
  return updateExam(examId, {
    status: 'closed',
    closed_at: new Date().toISOString()
  });
};

export const unpublishExam = async (examId) => {
  // Check if there are any completed attempts
  const { data: attempts, error: attemptError } = await supabase
    .from('exam_attempts')
    .select('status')
    .eq('exam_id', examId)
    .in('status', ['submitted', 'auto_submitted', 'graded']);

  if (attemptError) throw attemptError;

  // If there are completed attempts, don't allow unpublish
  if (attempts && attempts.length > 0) {
    throw new Error('Tidak dapat unpublish ujian yang sudah memiliki submission. Gunakan "Tutup Ujian" saja.');
  }

  // Cancel all in-progress attempts (use a status that exists in the enum)
  const { error: cancelError } = await supabase
    .from('exam_attempts')
    .delete()
    .eq('exam_id', examId)
    .eq('status', 'in_progress');

  if (cancelError) throw cancelError;

  // Unpublish the exam
  return updateExam(examId, {
    status: 'draft',
    published_at: null
  });
};

export const reopenExam = async (examId) => {
  return updateExam(examId, {
    status: 'published',
    closed_at: null
  });
};

export const deleteExam = async (examId) => {
  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', examId);
  if (error) throw error;
};

// ==========================================
// QUESTIONS CRUD
// ==========================================

export const fetchQuestions = async (examId) => {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', examId)
    .order('order_number', { ascending: true });
  if (error) throw error;
  return data;
};

export const fetchQuestionsWithOptions = async (examId) => {
  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('*, sample_answer, enable_auto_grading, grading_keywords')
    .eq('exam_id', examId)
    .order('order_number', { ascending: true });
  if (qError) throw qError;

  if (!questions || questions.length === 0) return [];

  const questionIds = questions.map(q => q.id);
  const { data: options, error: oError } = await supabase
    .from('question_options')
    .select('*')
    .in('question_id', questionIds)
    .order('order_number', { ascending: true });
  if (oError) throw oError;

  const optionsMap = {};
  (options || []).forEach(opt => {
    if (!optionsMap[opt.question_id]) optionsMap[opt.question_id] = [];
    optionsMap[opt.question_id].push(opt);
  });

  return questions.map(q => ({
    ...q,
    options: optionsMap[q.id] || []
  }));
};

export const createQuestion = async (questionData) => {
  const { data, error } = await supabase
    .from('questions')
    .insert([questionData])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateQuestion = async (questionId, updates) => {
  const { data, error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', questionId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteQuestion = async (questionId) => {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId);
  if (error) throw error;
};

export const reorderQuestions = async (questionId, newOrder) => {
  return updateQuestion(questionId, { order_number: newOrder });
};

// ==========================================
// QUESTION OPTIONS CRUD
// ==========================================

export const createOption = async (optionData) => {
  const { data, error } = await supabase
    .from('question_options')
    .insert([optionData])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateOption = async (optionId, updates) => {
  const { data, error } = await supabase
    .from('question_options')
    .update(updates)
    .eq('id', optionId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteOption = async (optionId) => {
  const { error } = await supabase
    .from('question_options')
    .delete()
    .eq('id', optionId);
  if (error) throw error;
};

// ==========================================
// EXAM ATTEMPTS
// ==========================================

export const fetchStudentAttempt = async (examId, studentId) => {
  const { data, error } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('exam_id', examId)
    .eq('student_id', studentId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const fetchAttemptById = async (attemptId) => {
  const { data, error } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('id', attemptId)
    .single();
  if (error) throw error;
  return data;
};

export const createAttempt = async (examId, studentId) => {
  const { data, error } = await supabase
    .from('exam_attempts')
    .insert([{
      exam_id: examId,
      student_id: studentId,
      status: 'in_progress',
      started_at: new Date().toISOString()
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const submitAttempt = async (attemptId) => {
  const { data, error } = await supabase
    .from('exam_attempts')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString()
    })
    .eq('id', attemptId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const fetchAttemptAnswers = async (attemptId) => {
  const { data, error } = await supabase
    .from('attempt_answers')
    .select('*')
    .eq('attempt_id', attemptId);
  if (error) throw error;
  return data;
};

export const saveAnswer = async (attemptId, questionId, answerData) => {
  const { selected_option_ids, answer_text } = answerData;

  // Get question type to ensure data integrity
  const { data: question, error: questionError } = await supabase
    .from('questions')
    .select('type')
    .eq('id', questionId)
    .single();

  if (questionError) throw questionError;

  // For essay questions, ensure selected_option_ids is always empty
  const safeSelectedOptionIds = question.type === 'essay' ? [] : (selected_option_ids || []);

  const { data, error } = await supabase
    .from('attempt_answers')
    .upsert([{
      attempt_id: attemptId,
      question_id: questionId,
      selected_option_ids: safeSelectedOptionIds,
      answer_text: answer_text || null,
      answered_at: new Date().toISOString()
    }], {
      onConflict: 'attempt_id, question_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ==========================================
// FETCH EXAM WITH RESULTS (for teacher)
// ==========================================

export const fetchExamWithResults = async (examId) => {
  const exam = await fetchExamById(examId);
  const questions = await fetchQuestionsWithOptions(examId);

  const { data: attempts, error: aError } = await supabase
    .from('exam_attempts')
    .select('*, profiles!exam_attempts_student_id_fkey(id, email, display_name, full_name)')
    .eq('exam_id', examId)
    .order('started_at', { ascending: true });

  if (aError) throw aError;

  // Fetch answers for each attempt
  const attemptsWithAnswers = await Promise.all(
    (attempts || []).map(async (attempt) => {
      const answers = await fetchAttemptAnswers(attempt.id);
      return { ...attempt, answers };
    })
  );

  return { exam, questions, attempts: attemptsWithAnswers };
};

// ==========================================
// GRADING
// ==========================================

export const gradeEssay = async (attemptId, questionId, points, feedback) => {
  // Update the answer points
  const { error: ansError } = await supabase
    .from('attempt_answers')
    .update({
      points_earned: points,
      is_correct: points > 0
    })
    .eq('attempt_id', attemptId)
    .eq('question_id', questionId);

  if (ansError) throw ansError;

  // Recalculate total score
  const { data: answers } = await supabase
    .from('attempt_answers')
    .select('points_earned')
    .eq('attempt_id', attemptId);

  const totalScore = answers.reduce((sum, a) => sum + (a.points_earned || 0), 0);

  const { error: updateError } = await supabase
    .from('exam_attempts')
    .update({
      score: totalScore,
      status: 'graded',
      updated_at: new Date().toISOString()
    })
    .eq('id', attemptId);

  if (updateError) throw updateError;

  return totalScore;
};

// Auto-grade essay question
export const autoGradeEssay = async (attemptId, questionId) => {
  try {
    // Get question details
    const { data: question, error: qError } = await supabase
      .from('questions')
      .select('sample_answer, grading_keywords, points, enable_auto_grading')
      .eq('id', questionId)
      .single();

    if (qError) throw qError;

    if (!question.enable_auto_grading) {
      throw new Error('Auto-grading not enabled for this question');
    }

    // Get student's answer
    const { data: answer, error: aError } = await supabase
      .from('attempt_answers')
      .select('answer_text')
      .eq('attempt_id', attemptId)
      .eq('question_id', questionId)
      .single();

    if (aError) throw aError;

    // Calculate auto-grade score using database function
    const { data: result, error: calcError } = await supabase
      .rpc('calculate_auto_grade', {
        student_answer: answer.answer_text,
        sample_answer: question.sample_answer,
        grading_keywords: question.grading_keywords || [],
        max_points: question.points
      });

    if (calcError) throw calcError;

    const autoScore = result || 0;

    // Update the answer with auto-calculated score
    const { error: updateError } = await supabase
      .from('attempt_answers')
      .update({
        points_earned: autoScore,
        is_correct: autoScore >= (question.points * 0.6) // 60% threshold
      })
      .eq('attempt_id', attemptId)
      .eq('question_id', questionId);

    if (updateError) throw updateError;

    // Recalculate total attempt score
    await recalculateAttemptScore(attemptId);

    return autoScore;
  } catch (error) {
    console.error('Auto-grading failed:', error);
    throw error;
  }
};

// Helper function to recalculate total attempt score
const recalculateAttemptScore = async (attemptId) => {
  const { data: answers } = await supabase
    .from('attempt_answers')
    .select('points_earned')
    .eq('attempt_id', attemptId);

  const totalScore = answers?.reduce((sum, a) => sum + (a.points_earned || 0), 0) || 0;

  await supabase
    .from('exam_attempts')
    .update({
      score: totalScore,
      status: 'graded',
      updated_at: new Date().toISOString()
    })
    .eq('id', attemptId);
};

// ==========================================
// REALTIME SUBSCRIPTIONS
// ==========================================

export const subscribeToExamChanges = (examId, callback) => {
  return supabase
    .channel(`exam-${examId}-changes`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'exams', filter: `id=eq.${examId}` },
      (payload) => callback(payload.new)
    )
    .subscribe();
};

export const subscribeToAttemptChanges = (examId, callback) => {
  return supabase
    .channel(`exam-${examId}-attempts`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'exam_attempts', filter: `exam_id=eq.${examId}` },
      (payload) => callback(payload.new)
    )
    .subscribe();
};

// ==========================================
// EXPORT FUNCTIONS
// ==========================================

export const exportResultsToCSV = async (examId) => {
  const { exam, attempts } = await fetchExamWithResults(examId);

  const headers = ['Nama Siswa', 'Email', 'Status', 'Nilai', 'Waktu Mulai', 'Waktu Submit', 'Durasi (menit)'];
  const rows = attempts.map(attempt => [
    attempt.profiles?.display_name || attempt.profiles?.full_name || attempt.profiles?.email || 'Unknown',
    attempt.profiles?.email || '',
    attempt.status === 'submitted' ? 'Sudah Submit' : attempt.status === 'auto_submitted' ? 'Auto Submit' : attempt.status === 'in_progress' ? 'Sedang Mengerjakan' : 'Sudah Dinilai',
    attempt.score !== null ? attempt.score : '-',
    new Date(attempt.started_at).toLocaleString('id-ID'),
    attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString('id-ID') : '-',
    attempt.submitted_at ? Math.round((new Date(attempt.submitted_at) - new Date(attempt.started_at)) / 60000) : '-'
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hasil_ujian_${exam.title.replace(/\s+/g, '_')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ==========================================
// GRADING FUNCTIONS
// ==========================================

export const updateAttemptStatusIfFullyGraded = async (attemptId) => {
  try {
    // Check if there are any ungraded questions left
    const { data: ungradedAnswers, error: checkError } = await supabase
      .from('attempt_answers')
      .select('id')
      .eq('attempt_id', attemptId)
      .is('is_correct', null);

    if (checkError) throw checkError;

    // If no ungraded answers remain, mark attempt as graded
    if (!ungradedAnswers || ungradedAnswers.length === 0) {
      const { error: updateError } = await supabase
        .from('exam_attempts')
        .update({
          status: 'graded',
          updated_at: new Date().toISOString()
        })
        .eq('id', attemptId);

      if (updateError) throw updateError;
      return true; // Status was updated
    }

    return false; // Still has ungraded questions
  } catch (error) {
    console.error('Error updating attempt status:', error);
    throw error;
  }
};

// ==========================================
// IMAGE UPLOAD FUNCTIONS
// ==========================================

export const uploadQuestionImage = async (file, userId) => {
  if (!file) throw new Error('No file provided');

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not supported. Please upload JPEG, PNG, GIF, or WebP images.');
  }

  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum size is 5MB.');
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  try {
    const { data, error } = await supabase.storage
      .from('exam-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('exam-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading question image:', error);
    throw new Error('Failed to upload image: ' + error.message);
  }
};

export const deleteQuestionImage = async (imageUrl, userId) => {
  if (!imageUrl) return;

  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from('exam-images')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting question image:', error);
      // Don't throw error for delete failures, just log
    }
  } catch (error) {
    console.error('Error deleting question image:', error);
    // Don't throw error for delete failures
  }
};