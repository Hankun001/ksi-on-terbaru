import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

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
    return <div className="dashboard-container">Memuat data...</div>;
  }

  if (role !== 'guru' && role !== 'admin') {
    return <div className="dashboard-container">Hanya guru dan admin yang dapat mengakses modul ini.</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Modul Penilaian</h1>

      <div className="filter-controls">
        <div className="form-group">
          <label htmlFor="course-select">Pilih Kursus:</label>
          <select
            id="course-select"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">Pilih kursus...</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </div>

        {selectedCourse && (
          <div className="form-group">
            <label htmlFor="assignment-select">Pilih Tugas:</label>
            <select
              id="assignment-select"
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
            >
              <option value="">Pilih tugas...</option>
              {assignments.map(assignment => (
                <option key={assignment.id} value={assignment.id}>{assignment.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {gradingView && currentSubmission && (
        <div className="form-container">
          <h2>Nilai Tugas: {currentSubmission.assignments?.title}</h2>
          <p><strong>Siswa:</strong> {currentSubmission.profiles?.email}</p>
          <p><strong>Nilai Maksimal:</strong> {currentSubmission.assignments?.max_points || 100}</p>

          <div className="submission-details">
            <h3>📝 Jawaban Siswa:</h3>
            <div className="submission-content" style={{ 
              background: '#f9fafb', 
              padding: '1rem', 
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              {currentSubmission.content ? (
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{currentSubmission.content}</p>
              ) : (
                <p style={{ margin: 0, color: '#9ca3af', fontStyle: 'italic' }}>Tidak ada jawaban teks</p>
              )}
            </div>

            {currentSubmission.attachment_url && (
              <div className="submission-attachment" style={{ 
                background: '#ecfdf5', 
                padding: '1rem', 
                borderRadius: '0.5rem',
                border: '1px solid #10b981'
              }}>
                <strong>📎 Lampiran:</strong>
                {getFileIcon(currentSubmission.attachment_url) && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '1.5rem' }}>
                    {getFileIcon(currentSubmission.attachment_url)}
                  </span>
                )}
                <a 
                  href={currentSubmission.attachment_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'block',
                    marginTop: '0.5rem',
                    wordBreak: 'break-all'
                  }}
                >
                  📥 {getFileName(currentSubmission.attachment_url)}
                </a>
                {isVideoFile(currentSubmission.attachment_url) && (
                  <video 
                    controls 
                    style={{ 
                      width: '100%', 
                      maxHeight: '300px',
                      marginTop: '0.5rem',
                      borderRadius: '0.5rem'
                    }}
                  >
                    <source src={currentSubmission.attachment_url} />
                    Browser tidak mendukung pemutaran video.
                  </video>
                )}
                {isImageFile(currentSubmission.attachment_url) && (
                  <img 
                    src={currentSubmission.attachment_url} 
                    alt="Lampiran"
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '300px',
                      marginTop: '0.5rem',
                      borderRadius: '0.5rem'
                    }}
                  />
                )}
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSaveGrade(); }}>
            <div className="form-group">
              <label htmlFor="grade">📊 Nilai (0 - {currentSubmission.assignments?.max_points || 100}):</label>
              <input
                type="number"
                id="grade"
                value={gradeValue}
                onChange={(e) => setGradeValue(e.target.value)}
                min="0"
                max={currentSubmission.assignments?.max_points || 100}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="feedback">💬 Umpan Balik:</label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows="4"
                placeholder="Berikan komentar atau saran untuk siswa..."
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '0.5rem',
                  fontSize: '0.9375rem'
                }}
              ></textarea>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                💾 Simpan Nilai
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancelGrade}>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="dashboard-content">
        {selectedAssignment && (
          <section className="dashboard-section">
            <h2>Daftar Pengumpulan untuk "{assignments.find(a => a.id === selectedAssignment)?.title}"</h2>
            {submissions.length > 0 ? (
              <div className="submissions-list">
                {submissions.map(submission => (
                  <div key={submission.id} className="submission-item card">
                    <div className="submission-header">
                      <h3>{submission.profiles?.email}</h3>
                      <div className="submission-grade-info">
                        {submission?.grade !== null ? (
                          <span className="submission-grade">Nilai: {submission.grade}/{submission.assignments?.max_points || 100}</span>
                        ) : (
                          <span className="submission-pending">Belum Dinilai</span>
                        )}
                      </div>
                    </div>

                    <div className="submission-content">
                      <div className="submission-meta">
                        <strong>Dikumpulkan:</strong> {new Date(submission.submitted_at).toLocaleDateString()}
                        {submission.graded_at && (
                          <span><strong>Dinilai:</strong> {new Date(submission.graded_at).toLocaleDateString()}</span>
                        )}
                      </div>

                      <div className="submission-preview">
                        <p>{submission.content.substring(0, 100)}{submission.content.length > 100 ? '...' : ''}</p>
                      </div>

                      {submission.feedback && (
                        <div className="submission-feedback">
                          <strong>Umpan Balik:</strong> {submission.feedback}
                        </div>
                      )}

                      <div className="submission-actions">
                        <button
                          className="btn btn-primary"
                          onClick={() => handleGradeSubmission(submission)}
                        >
                          {submission?.grade !== null ? 'Edit Nilai' : 'Berikan Nilai'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Belum ada pengumpulan tugas untuk tugas ini.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default GradingModule;