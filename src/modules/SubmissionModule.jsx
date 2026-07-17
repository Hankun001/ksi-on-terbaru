import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { FileText, Upload, X, CheckCircle, AlertCircle, Send } from 'lucide-react';

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
    return (
      <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 rounded-full border-[3px] border-outline-variant border-t-primary animate-spin mb-md" />
          <p className="text-body-sm text-on-surface-variant animate-pulse">Memuat tugas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto space-y-lg">
      {/* Header */}
      <h1 className="text-headline-sm md:text-headline-md font-display text-on-surface flex items-center gap-sm">
        <FileText className="w-6 h-6 text-primary" />
        Pengumpulan Tugas
      </h1>

      {/* Submission Form Modal */}
      {showForm && selectedAssignment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-md">
          <div className="bg-surface rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl animate-scaleIn">
            <div className="relative bg-gradient-to-br from-primary to-[#5a4fcf] rounded-t-2xl p-xl text-white">
              <h2 className="text-title-lg font-display">Kumpulkan Tugas: {selectedAssignment.title}</h2>
              <p className="text-body-sm opacity-90 mt-xs">{selectedAssignment.courses?.title} • Batas: {selectedAssignment.due_date ? new Date(selectedAssignment.due_date).toLocaleDateString() : 'Tidak ada'}</p>
              <button onClick={handleCancel} type="button" className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-lg space-y-md">
              <div>
                <label className="block text-label-lg font-medium text-on-surface mb-xs">Jawaban Tugas *</label>
                <textarea name="content" value={formData.content} onChange={handleInputChange} rows="6" required
                  className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              </div>
              <div>
                <label className="block text-label-lg font-medium text-on-surface mb-xs">Lampiran (opsional)</label>
                <div className="border-2 border-dashed border-outline-variant rounded-xl p-lg text-center bg-surface-container-low">
                  <input type="file" id="file-upload" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov" />
                  {!selectedFile ? (
                    <label htmlFor="file-upload" className="cursor-pointer block">
                      <Upload className="w-8 h-8 mx-auto mb-sm text-primary" />
                      <p className="text-label-lg font-medium text-primary">Klik untuk upload file</p>
                      <p className="text-label-sm text-on-surface-variant mt-xs">atau drag & drop file di sini</p>
                      <p className="text-label-xs text-on-surface-variant mt-xs">PDF, DOC, DOCX, JPG, PNG, MP4, MOV (max 10MB)</p>
                    </label>
                  ) : (
                    <div className="bg-primary-container/30 rounded-xl p-md border border-primary">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-sm">
                          <FileText className="w-6 h-6 text-primary" />
                          <div className="text-left">
                            <p className="text-label-sm font-medium text-on-surface">{selectedFile.name}</p>
                            <p className="text-label-xs text-on-surface-variant">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button type="button" onClick={handleRemoveFile} className="p-xs rounded-lg bg-error-container text-on-error-container hover:bg-error hover:text-on-error transition-all"><X className="w-4 h-4" /></button>
                      </div>
                      {uploading && (
                        <div className="mt-sm">
                          <div className="h-2 bg-surface-dim rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} /></div>
                          <p className="text-label-xs text-on-surface-variant mt-xs">Mengupload... {uploadProgress}%</p>
                        </div>
                      )}
                      {uploadError && <div className="mt-sm flex items-center gap-xs bg-error-container text-on-error-container px-sm py-xs rounded-lg text-label-xs"><AlertCircle className="w-3 h-3" /> {uploadError}</div>}
                    </div>
                  )}
                </div>
                <p className="text-label-sm text-on-surface-variant mt-sm mb-xs"><strong>ATAU</strong> masukkan URL manual:</p>
                <input type="url" name="attachment_url" value={formData.attachment_url} onChange={handleInputChange} placeholder="https://drive.google.com/..."
                  className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              </div>
              <div className="flex gap-sm pt-sm border-t border-outline-variant/20">
                <button type="submit" className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-xl font-medium hover:bg-primary-container hover:text-on-primary-container transition-all">
                  <Send className="w-4 h-4" /> Kumpulkan Tugas
                </button>
                <button type="button" onClick={handleCancel} className="px-lg py-sm rounded-xl bg-surface-dim text-on-surface-variant font-medium hover:bg-outline-variant transition-all">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tersedia */}
      <div>
        <h2 className="text-title-md font-display text-on-surface mb-md">Tugas yang Tersedia</h2>
        {assignments.length > 0 ? (
          <div className="space-y-sm">
            {assignments.map(assignment => {
              const existingSubmission = submissions.find(sub => sub.assignment_id === assignment.id);
              return (
                <div key={assignment.id} className="bg-surface rounded-xl p-md border border-outline-variant/30 hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between gap-md mb-sm">
                    <h3 className="text-title-sm font-display text-on-surface font-semibold">{assignment.title}</h3>
                    <span className="inline-flex bg-primary-container text-on-primary-container px-sm py-0.5 rounded-full text-label-sm font-medium">{assignment.max_points} poin</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant mb-sm">{assignment.description}</p>
                  <div className="text-label-sm text-on-surface-variant space-y-xs mb-sm">
                    <p>📚 Kursus: {assignment.courses?.title}</p>
                    <p>📅 Batas: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'Tidak ada'}</p>
                  </div>
                  {existingSubmission ? (
                    <div className="bg-success-container text-on-success-container px-md py-sm rounded-lg flex items-center gap-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-label-sm font-medium">
                        Sudah Dikumpulkan
                        {existingSubmission.grade !== null && ` • Nilai: ${existingSubmission.grade}/${assignment.max_points}`}
                      </span>
                    </div>
                  ) : (
                    <button onClick={() => handleStartSubmission(assignment)}
                      className="inline-flex items-center gap-xs bg-primary text-on-primary px-md py-sm rounded-xl text-label-sm font-medium hover:bg-primary-container hover:text-on-primary-container transition-all">
                      Kumpulkan Tugas
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center py-xl text-on-surface-variant">
            <FileText className="w-10 h-10 mb-sm opacity-40" />
            <p>Belum ada tugas yang tersedia.</p>
          </div>
        )}
      </div>

      {/* Dikumpulkan */}
      <div>
        <h2 className="text-title-md font-display text-on-surface mb-md">Tugas yang Telah Dikumpulkan</h2>
        {submissions.length > 0 ? (
          <div className="space-y-sm">
            {submissions.map(submission => {
              const assignment = assignments.find(a => a.id === submission.assignment_id);
              return (
                <div key={submission.id} className="bg-surface rounded-xl p-md border border-outline-variant/30 hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between gap-md mb-sm">
                    <h3 className="text-title-sm font-display text-on-surface font-semibold">{assignment?.title || 'Tugas'}</h3>
                    {submission.grade !== null && (
                      <span className="inline-flex bg-success-container text-on-success-container px-sm py-0.5 rounded-full text-label-sm font-medium">{submission.grade}/{assignment?.max_points || 100}</span>
                    )}
                  </div>
                  <div className="flex gap-md text-label-sm text-on-surface-variant mb-sm">
                    <span>📅 Dikumpulkan: {new Date(submission.submitted_at).toLocaleDateString()}</span>
                    {submission.graded_at && <span>✅ Dinilai: {new Date(submission.graded_at).toLocaleDateString()}</span>}
                  </div>
                  {submission.content && (
                    <div className="bg-surface-container-low rounded-lg p-sm mb-sm">
                      <p className="text-label-sm font-medium text-on-surface mb-xs">📝 Jawaban:</p>
                      <p className="text-body-sm text-on-surface whitespace-pre-wrap">{submission.content.substring(0, 200)}{submission.content.length > 200 ? '...' : ''}</p>
                    </div>
                  )}
                  {submission.attachment_url && (
                    <div className="bg-success-container rounded-lg p-sm border border-success">
                      <p className="text-label-sm font-medium text-on-success-container mb-xs">📎 Lampiran {getFileIcon(submission.attachment_url)}</p>
                      <a href={submission.attachment_url} target="_blank" rel="noopener noreferrer" className="text-label-sm text-primary hover:underline break-all">📥 {getFileName(submission.attachment_url)}</a>
                      {isVideoFile(submission.attachment_url) && <video controls className="w-full max-h-48 mt-sm rounded-lg"><source src={submission.attachment_url} /></video>}
                      {isImageFile(submission.attachment_url) && <img src={submission.attachment_url} alt="Lampiran" className="max-w-full max-h-48 mt-sm rounded-lg" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center py-xl text-on-surface-variant">
            <FileText className="w-10 h-10 mb-sm opacity-40" />
            <p>Belum ada tugas yang dikumpulkan.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionModule;
