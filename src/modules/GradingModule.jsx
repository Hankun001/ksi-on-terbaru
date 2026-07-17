import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { BookOpen, FileText, CheckCircle, AlertCircle, Send, X, Save, Eye, Edit3 } from 'lucide-react';

const GradingModule = () => {
  const { user, role } = useAuth();
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [loading, setLoading] = useState(true);
  const [gradingView, setGradingView] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [gradeValue, setGradeValue] = useState('');
  const [feedback, setFeedback] = useState('');

  // Helper function to get file icon
  const getFileIcon = (url) => {
    if (!url) return null;
    const ext = url.split('.').pop().toLowerCase();
    const videoExts = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'wmv'];
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    
    if (videoExts.includes(ext)) return '🎬';
    if (imageExts.includes(ext)) return '🖼️';
    if (docExts.includes(ext)) return '📄';
    return '📎';
  };

  // Helper function to get file name from URL
  const getFileName = (url) => {
    if (!url) return 'File';
    return url.split('/').pop().split('?')[0] || 'Lampiran';
  };

  // Check if file is video
  const isVideoFile = (url) => {
    if (!url) return false;
    const ext = url.split('.').pop().toLowerCase();
    return ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext);
  };

  // Check if file is image
  const isImageFile = (url) => {
    if (!url) return false;
    const ext = url.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  useEffect(() => {
    if (role === 'guru' || role === 'admin') {
      fetchCourses();
    }
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchAssignmentsForCourse(selectedCourse);
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedAssignment) {
      fetchSubmissionsForAssignment(selectedAssignment);
    }
  }, [selectedAssignment]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', user.id);

      if (error) throw error;

      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentsForCourse = async (courseId) => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId);

      if (error) throw error;

      setAssignments(data || []);
      setSelectedAssignment(''); // Reset selected assignment when course changes
      setSubmissions([]); // Clear previous submissions
    } catch (error) {
      console.error('Error fetching assignments:', error.message);
    }
  };

  const fetchSubmissionsForAssignment = async (assignmentId) => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id,
          submitted_at,
          grade,
          feedback,
          content,
          attachment_url,
          student_id,
          assignment_id,
          graded_at,
          grader_id
        `)
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      // Get student and assignment info separately to avoid embedding conflicts
      const submissionsWithInfo = [];
      for (const submission of data) {
        try {
          // Get student info
          const { data: studentData, error: studentError } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', submission.student_id)
            .single();
          
          // Get assignment info
          const { data: assignmentData, error: assignmentError } = await supabase
            .from('assignments')
            .select('title, max_points')
            .eq('id', submission.assignment_id)
            .single();
          
          submissionsWithInfo.push({
            ...submission,
            profiles: studentError ? null : studentData,
            assignments: assignmentError ? null : assignmentData
          });
        } catch (innerError) {
          console.error('Error fetching submission info:', innerError);
          // Add submission with null values for missing info
          submissionsWithInfo.push({
            ...submission,
            profiles: null,
            assignments: null
          });
        }
      }

      setSubmissions(submissionsWithInfo || []);
    } catch (error) {
      console.error('Error fetching submissions:', error.message);
    }
  };

  const handleGradeSubmission = (submission) => {
    setCurrentSubmission(submission);
    setGradeValue(submission.grade || '');
    setFeedback(submission.feedback || '');
    setGradingView(true);
  };

  const handleSaveGrade = async () => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          grade: parseFloat(gradeValue),
          feedback: feedback,
          graded_at: new Date().toISOString(),
          grader_id: user.id
        })
        .eq('id', currentSubmission.id);

      if (error) throw error;

      // Close grading view and refresh submissions
      setGradingView(false);
      fetchSubmissionsForAssignment(selectedAssignment);
      alert('Nilai berhasil disimpan!');
    } catch (error) {
      console.error('Error saving grade:', error.message);
      alert('Error menyimpan nilai: ' + error.message);
    }
  };

  const handleCancelGrade = () => {
    setGradingView(false);
    setCurrentSubmission(null);
    setGradeValue('');
    setFeedback('');
  };

  if (loading) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 rounded-full border-[3px] border-outline-variant border-t-primary animate-spin mb-md" />
          <p className="text-body-sm text-on-surface-variant animate-pulse">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (role !== 'guru' && role !== 'admin') {
    return (
      <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-md">
          <AlertCircle className="w-12 h-12 text-on-surface-variant opacity-40" />
          <p className="text-body-md text-on-surface-variant">Hanya guru dan admin yang dapat mengakses modul ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto space-y-lg">
      {/* Header */}
      <h1 className="text-headline-sm md:text-headline-md font-display text-on-surface flex items-center gap-sm">
        <CheckCircle className="w-6 h-6 text-primary" />
        Modul Penilaian
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-md p-md bg-surface-container-low rounded-xl">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-label-sm font-medium text-on-surface mb-xs">Pilih Kursus</label>
          <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
            <option value="">Pilih kursus...</option>
            {courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}
          </select>
        </div>
        {selectedCourse && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-label-sm font-medium text-on-surface mb-xs">Pilih Tugas</label>
            <select value={selectedAssignment} onChange={(e) => setSelectedAssignment(e.target.value)}
              className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
              <option value="">Pilih tugas...</option>
              {assignments.map(assignment => <option key={assignment.id} value={assignment.id}>{assignment.title}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Grading View */}
      {gradingView && currentSubmission && (
        <div className="bg-surface rounded-xl p-lg border border-outline-variant/30 space-y-md">
          <h2 className="text-title-md font-display text-on-surface">Nilai Tugas: {currentSubmission.assignments?.title}</h2>
          <div className="flex gap-md text-label-sm text-on-surface-variant">
            <span>Siswa: <strong className="text-on-surface">{currentSubmission.profiles?.email}</strong></span>
            <span>Nilai Maks: <strong className="text-on-surface">{currentSubmission.assignments?.max_points || 100}</strong></span>
          </div>

          <div className="bg-surface-container-low rounded-xl p-md">
            <h3 className="text-title-sm font-display text-on-surface mb-sm">📝 Jawaban Siswa</h3>
            {currentSubmission.content ? (
              <p className="text-body-sm text-on-surface whitespace-pre-wrap">{currentSubmission.content}</p>
            ) : (
              <p className="text-body-sm text-on-surface-variant italic">Tidak ada jawaban teks</p>
            )}
          </div>

          {currentSubmission.attachment_url && (
            <div className="bg-success-container rounded-xl p-md border border-success">
              <p className="text-label-sm font-medium text-on-success-container mb-sm">📎 Lampiran: {getFileIcon(currentSubmission.attachment_url)}</p>
              <a href={currentSubmission.attachment_url} target="_blank" rel="noopener noreferrer" className="text-label-sm text-primary hover:underline break-all">
                📥 {getFileName(currentSubmission.attachment_url)}
              </a>
              {isVideoFile(currentSubmission.attachment_url) && (
                <video controls className="w-full max-h-72 mt-sm rounded-lg"><source src={currentSubmission.attachment_url} /></video>
              )}
              {isImageFile(currentSubmission.attachment_url) && (
                <img src={currentSubmission.attachment_url} alt="Lampiran" className="max-w-full max-h-72 mt-sm rounded-lg" />
              )}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleSaveGrade(); }} className="space-y-md">
            <div>
              <label className="block text-label-lg font-medium text-on-surface mb-xs">📊 Nilai (0 - {currentSubmission.assignments?.max_points || 100})</label>
              <input type="number" value={gradeValue} onChange={(e) => setGradeValue(e.target.value)}
                min="0" max={currentSubmission.assignments?.max_points || 100} required
                className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            </div>
            <div>
              <label className="block text-label-lg font-medium text-on-surface mb-xs">💬 Umpan Balik</label>
              <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows="4"
                placeholder="Berikan komentar atau saran untuk siswa..."
                className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            </div>
            <div className="flex gap-sm">
              <button type="submit" className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-xl font-medium hover:bg-primary-container hover:text-on-primary-container transition-all">
                <Save className="w-4 h-4" /> Simpan Nilai
              </button>
              <button type="button" onClick={handleCancelGrade} className="px-lg py-sm rounded-xl bg-surface-dim text-on-surface-variant font-medium hover:bg-outline-variant transition-all">
                <X className="w-4 h-4" /> Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Submissions List */}
      {selectedAssignment && (
        <div>
          <h2 className="text-title-md font-display text-on-surface mb-md">
            Pengumpulan untuk "{assignments.find(a => a.id === selectedAssignment)?.title}"
          </h2>
          {submissions.length > 0 ? (
            <div className="space-y-sm">
              {submissions.map(submission => (
                <div key={submission.id} className="bg-surface rounded-xl p-md border border-outline-variant/30 hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between gap-md mb-sm">
                    <h3 className="text-title-sm font-display text-on-surface font-semibold">{submission.profiles?.email}</h3>
                    {submission.grade !== null ? (
                      <span className="inline-flex items-center bg-success-container text-on-success-container px-sm py-0.5 rounded-full text-label-sm font-medium">{submission.grade}/{submission.assignments?.max_points || 100}</span>
                    ) : (
                      <span className="inline-flex items-center bg-warning-container text-on-warning-container px-sm py-0.5 rounded-full text-label-sm font-medium">Belum Dinilai</span>
                    )}
                  </div>
                  <div className="flex gap-md text-label-sm text-on-surface-variant mb-sm">
                    <span>📅 Dikumpulkan: {new Date(submission.submitted_at).toLocaleDateString()}</span>
                    {submission.graded_at && <span>✅ Dinilai: {new Date(submission.graded_at).toLocaleDateString()}</span>}
                  </div>
                  {submission.content && (
                    <div className="bg-surface-container-low rounded-lg p-sm mb-sm">
                      <p className="text-body-sm text-on-surface">{submission.content.substring(0, 100)}{submission.content.length > 100 ? '...' : ''}</p>
                    </div>
                  )}
                  {submission.feedback && (
                    <p className="text-label-sm text-on-surface-variant mb-sm">💬 Umpan Balik: {submission.feedback}</p>
                  )}
                  <div className="pt-sm border-t border-outline-variant/20">
                    <button onClick={() => handleGradeSubmission(submission)}
                      className="inline-flex items-center gap-xs bg-primary text-on-primary px-md py-sm rounded-xl text-label-sm font-medium hover:bg-primary-container hover:text-on-primary-container transition-all">
                      {submission.grade !== null ? <><Edit3 className="w-3.5 h-3.5" /> Edit Nilai</> : <><Eye className="w-3.5 h-3.5" /> Berikan Nilai</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-xl text-on-surface-variant">
              <FileText className="w-10 h-10 mb-sm opacity-40" />
              <p>Belum ada pengumpulan tugas untuk tugas ini.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GradingModule;