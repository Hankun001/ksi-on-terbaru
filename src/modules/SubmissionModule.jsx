import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const SubmissionModule = () => {
  const { user, role } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [formData, setFormData] = useState({
    content: '',
    attachment_url: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Helper function to get file icon
  const getFileIcon = (urlOrName) => {
    if (!urlOrName) return '📎';
    // Check if it's a full URL or just a file name
    const isUrl = urlOrName.includes('http') || urlOrName.includes('://');
    const ext = isUrl 
      ? urlOrName.split('.').pop().split('?')[0].toLowerCase()
      : urlOrName.split('.').pop().toLowerCase();
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
    fetchAssignmentsAndSubmissions();
  }, []);

  const fetchAssignmentsAndSubmissions = async () => {
    try {
      // Get assignments for courses the student is enrolled in
      const { data: enrolledCourses, error: enrolledError } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', user.id);

      if (enrolledError) throw enrolledError;

      const courseIds = enrolledCourses.map(item => item.course_id);

      let assignmentsQuery = supabase.from('assignments').select(`
        *,
        courses (
          title
        )
      `);

      if (courseIds.length > 0) {
        assignmentsQuery = assignmentsQuery.in('course_id', courseIds);
      } else {
        assignmentsQuery = assignmentsQuery.eq('id', 'nonexistent'); // No results if no courses
      }

      const { data: assignmentsData, error: assignmentsError } = await assignmentsQuery;

      if (assignmentsError) throw assignmentsError;

      // Get existing submissions for this student
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          id,
          submitted_at,
          grade,
          feedback,
          content,
          attachment_url,
          assignment_id,
          student_id,
          graded_at
        `)
        .eq('student_id', user.id);

      if (submissionsError) throw submissionsError;

      // Get assignment info for submissions separately to avoid embedding conflicts
      const submissionsWithAssignmentInfo = [];
      for (const submission of submissionsData) {
        try {
          const { data: assignmentData, error: assignmentError } = await supabase
            .from('assignments')
            .select('title, due_date, max_points')
            .eq('id', submission.assignment_id)
            .single();

          submissionsWithAssignmentInfo.push({
            ...submission,
            assignments: assignmentError ? null : assignmentData
          });
        } catch (error) {
          console.error('Error fetching assignment info:', error);
          submissionsWithAssignmentInfo.push({
            ...submission,
            assignments: null
          });
        }
      }

      setAssignments(assignmentsData || []);
      setSubmissions(submissionsWithAssignmentInfo || []);
    } catch (error) {
      console.error('Error fetching assignments and submissions:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSizeInBytes) {
        setUploadError(`File terlalu besar! Maksimal ukuran file adalah 10MB. File yang dipilih: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        setSelectedFile(null);
        return;
      }
      
      setSelectedFile(file);
      setUploadError(null);
      setUploadProgress(0);
    }
  };

  // Upload file to Supabase Storage
  const uploadFile = async () => {
    if (!selectedFile) return null;

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Create a unique file name to avoid conflicts
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${selectedAssignment.id}/${Date.now()}.${fileExt}`;
      
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('submissions')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        // If storage bucket doesn't exist, try to create it or use a fallback
        if (error.message.includes('bucket')) {
          throw new Error('Storage bucket "submissions" tidak tersedia. Silakan hubungi administrator untuk membuat bucket penyimpanan.');
        }
        throw error;
      }

      setUploadProgress(50);

      // Get public URL
      const { data: urlData, error: urlError } = await supabase.storage
        .from('submissions')
        .getPublicUrl(fileName);

      if (urlError) throw urlError;

      setUploadProgress(100);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error.message);
      setUploadError(error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Handle file removal
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFormData(prev => ({ ...prev, attachment_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let attachmentUrl = formData.attachment_url;

      // Upload file if selected
      if (selectedFile) {
        const uploadedUrl = await uploadFile();
        if (uploadedUrl) {
          attachmentUrl = uploadedUrl;
        } else if (uploadError) {
          // If upload failed and there's no manual URL, show error
          if (!formData.attachment_url) {
            alert('Gagal mengupload file: ' + uploadError);
            return;
          }
          // Use manual URL if available
          attachmentUrl = formData.attachment_url;
        }
      }

      const { error } = await supabase
        .from('submissions')
        .insert([{
          assignment_id: selectedAssignment.id,
          student_id: user.id,
          content: formData.content,
          attachment_url: attachmentUrl
        }]);

      if (error) throw error;

      // Reset form and close it
      setFormData({ content: '', attachment_url: '' });
      setSelectedFile(null);
      setSelectedAssignment(null);
      setShowForm(false);
      setUploadProgress(0);
      setUploadError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh data
      fetchAssignmentsAndSubmissions();
      alert('Tugas berhasil dikumpulkan!');
    } catch (error) {
      console.error('Error submitting assignment:', error.message);
      alert('Error mengumpulkan tugas: ' + error.message);
    }
  };

  const handleStartSubmission = (assignment) => {
    // Check if already submitted
    const existingSubmission = submissions.find(sub => sub.assignment_id === assignment.id);

    if (existingSubmission) {
      alert('Anda sudah mengumpulkan tugas ini.');
      return;
    }

    setSelectedAssignment(assignment);
    setFormData({ content: '', attachment_url: '' });
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadError(null);
    setShowForm(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    setFormData({ content: '', attachment_url: '' });
    setSelectedFile(null);
    setSelectedAssignment(null);
    setShowForm(false);
    setUploadProgress(0);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return <div className="dashboard-container">Memuat tugas...</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Pengumpulan Tugas</h1>

      {showForm && selectedAssignment && (
        <div className="form-container">
          <h2>Kumpulkan Tugas: {selectedAssignment.title}</h2>
          <p><strong>Kursus:</strong> {selectedAssignment.courses?.title}</p>
          <p><strong>Batas Waktu:</strong> {selectedAssignment.due_date ? new Date(selectedAssignment.due_date).toLocaleDateString() : 'Tidak ada'}</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="content">Jawaban Tugas:</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows="8"
                required
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="attachment_url">Lampiran (opsional):</label>
              
              {/* File Upload Section */}
              <div className="file-upload-container" style={{ 
                border: '2px dashed #ccc', 
                padding: '20px', 
                borderRadius: '8px',
                marginBottom: '15px',
                textAlign: 'center',
                backgroundColor: '#f9fafb'
              }}>
                <input
                  type="file"
                  id="file-upload"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov"
                />
                
                {!selectedFile ? (
                  <label htmlFor="file-upload" style={{ 
                    cursor: 'pointer',
                    display: 'block',
                    color: '#0066cc'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📤</div>
                    <strong>Klik untuk upload file</strong>
                    <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9rem' }}>
                      atau drag & drop file di sini
                    </p>
                    <p style={{ margin: '5px 0', color: '#888', fontSize: '0.8rem' }}>
                      Mendukung: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, PNG, GIF, MP4, MOV
                    </p>
                  </label>
                ) : (
                  <div className="selected-file" style={{ 
                    background: '#e3f2fd',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #2196f3'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.5rem' }}>{getFileIcon(selectedFile.name)}</span>
                        <div>
                          <strong>{selectedFile.name}</strong>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={handleRemoveFile}
                        style={{ 
                          background: '#f44336',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Hapus
                      </button>
                    </div>
                    
                    {uploading && (
                      <div style={{ marginTop: '15px' }}>
                        <div style={{ 
                          background: '#e0e0e0',
                          borderRadius: '4px',
                          height: '8px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${uploadProgress}%`,
                            background: '#2196f3',
                            height: '100%',
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                          Mengupload... {uploadProgress}%
                        </p>
                      </div>
                    )}
                    
                    {uploadError && (
                      <div style={{ 
                        marginTop: '10px',
                        padding: '10px',
                        background: '#ffebee',
                        borderRadius: '4px',
                        color: '#c62828',
                        fontSize: '0.85rem'
                      }}>
                        ❌ Error: {uploadError}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Manual URL Input */}
              <p style={{ fontSize: '0.85rem', color: '#666', margin: '10px 0 5px 0' }}>
                <strong>ATAU</strong> masukkan URL manual:
              </p>
              <input
                type="url"
                id="attachment_url"
                name="attachment_url"
                value={formData.attachment_url}
                onChange={handleInputChange}
                placeholder="https://drive.google.com/..."
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Kumpulkan Tugas
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="dashboard-content">
        <section className="dashboard-section">
          <h2>Tugas yang Tersedia</h2>
          {assignments.length > 0 ? (
            <div className="assignments-list">
              {assignments.map(assignment => {
                const existingSubmission = submissions.find(sub => sub.assignment_id === assignment.id);

                return (
                  <div key={assignment.id} className="assignment-item card">
                    <div className="assignment-header">
                      <h3>{assignment.title}</h3>
                      <span className="assignment-points">{assignment.max_points} poin</span>
                    </div>

                    <div className="assignment-content">
                      <p>{assignment.description}</p>
                      <div className="assignment-meta">
                        <strong>Kursus:</strong> {assignment.courses?.title}<br/>
                        <strong>Batas Waktu:</strong> {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'Tidak ada'}
                      </div>

                      {existingSubmission ? (
                        <div className="submission-status submitted">
                          <strong>Status:</strong> Sudah Dikumpulkan
                          {existingSubmission.grade !== null && (
                            <div><strong>Nilai:</strong> {existingSubmission.grade}/{assignment.max_points}</div>
                          )}
                        </div>
                      ) : (
                        <div className="assignment-actions">
                          <button
                            className="btn btn-primary"
                            onClick={() => handleStartSubmission(assignment)}
                          >
                            Kumpulkan Tugas
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>Belum ada tugas yang tersedia.</p>
          )}
        </section>

        <section className="dashboard-section">
          <h2>Tugas yang Telah Dikumpulkan</h2>
          {submissions.length > 0 ? (
            <div className="submissions-list">
              {submissions.map(submission => {
                const assignment = assignments.find(a => a.id === submission.assignment_id);

                return (
                  <div key={submission.id} className="submission-item card">
                    <div className="submission-header">
                      <h3>{assignment?.title || 'Tugas Tidak Dikenal'}</h3>
                      {submission?.grade !== null && (
                        <span className="submission-grade">
                          Nilai: {submission.grade}/{assignment?.max_points || 100}
                        </span>
                      )}
                    </div>

                    <div className="submission-content">
                      <div className="submission-meta" style={{ 
                        display: 'flex', 
                        gap: '1rem', 
                        marginBottom: '0.75rem',
                        flexWrap: 'wrap'
                      }}>
                        <span>📅 <strong>Dikumpulkan:</strong> {new Date(submission.submitted_at).toLocaleDateString()}</span>
                        {submission.graded_at && (
                          <span>✅ <strong>Dinilai:</strong> {new Date(submission.graded_at).toLocaleDateString()}</span>
                        )}
                      </div>

                      {submission.content && (
                        <div className="submission-preview" style={{ 
                          background: '#f9fafb', 
                          padding: '0.75rem', 
                          borderRadius: '0.5rem',
                          marginBottom: '0.75rem'
                        }}>
                          <strong>📝 Jawaban:</strong>
                          <p style={{ margin: '0.5rem 0 0 0', whiteSpace: 'pre-wrap' }}>
                            {submission.content.length > 200 
                              ? submission.content.substring(0, 200) + '...'
                              : submission.content}
                          </p>
                        </div>
                      )}

                      {submission.attachment_url && (
                        <div className="submission-attachment" style={{ 
                          background: '#ecfdf5', 
                          padding: '0.75rem', 
                          borderRadius: '0.5rem',
                          border: '1px solid #10b981'
                        }}>
                          <strong>📎 Lampiran: {getFileIcon(submission.attachment_url)}</strong>
                          <a 
                            href={submission.attachment_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              display: 'block',
                              marginTop: '0.25rem',
                              wordBreak: 'break-all'
                            }}
                          >
                            📥 {getFileName(submission.attachment_url)}
                          </a>
                          {isVideoFile(submission.attachment_url) && (
                            <video 
                              controls 
                              style={{ 
                                width: '100%', 
                                maxHeight: '200px',
                                marginTop: '0.5rem',
                                borderRadius: '0.25rem'
                              }}
                            >
                              <source src={submission.attachment_url} />
                            </video>
                          )}
                          {isImageFile(submission.attachment_url) && (
                            <img 
                              src={submission.attachment_url} 
                              alt="Lampiran"
                              style={{ 
                                maxWidth: '100%', 
                                maxHeight: '200px',
                                marginTop: '0.5rem',
                                borderRadius: '0.25rem'
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>Belum ada tugas yang dikumpulkan.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default SubmissionModule;
