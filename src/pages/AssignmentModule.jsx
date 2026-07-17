import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

// Assignment Management Module for Teachers
export const AssignmentModule = ({ courseId, onBack }) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    max_points: 100,
    external_link: '',
    external_link_type: ''
  });

  const fetchData = useCallback(async () => {
    if (!user || !courseId) return;

    try {
      setLoading(true);

      // Get assignments
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('due_date', { ascending: true });

      if (assignmentError) throw assignmentError;
      setAssignments(assignmentData || []);

      // Get submissions for these assignments
      const assignmentIds = assignmentData?.map(a => a.id) || [];
      if (assignmentIds.length > 0) {
        const { data: submissionData, error: submissionError } = await supabase
          .from('submissions')
          .select('*, profiles(email)')
          .in('assignment_id', assignmentIds)
          .order('submitted_at', { ascending: false });

        if (submissionError) throw submissionError;
        setSubmissions(submissionData || []);
      }
    } catch (err) {
      setError('Gagal memuat data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [user, courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (editingAssignment) {
        const { error } = await supabase
          .from('assignments')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAssignment.id);

        if (error) throw error;
        alert('Tugas berhasil diperbarui!\n\nMurid akan melihat tugas yang diperbarui.');
      } else {
        const { data: assignmentData, error } = await supabase
          .from('assignments')
          .insert([{
            ...formData,
            course_id: courseId,
            status: 'open',
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;
        
        // Get enrolled students and send notifications
        await sendAssignmentNotifications(assignmentData, courseId);
        
        alert('Tugas berhasil dibuat!\n\nNotifikasi telah dikirim ke semua murid yang terdaftar.');
      }

      setShowModal(false);
      setEditingAssignment(null);
      setFormData({ title: '', description: '', due_date: '', max_points: 100 });
      fetchData();
    } catch (err) {
      alert('Gagal menyimpan tugas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      due_date: assignment.due_date ? assignment.due_date.split('T')[0] : '',
      max_points: assignment.max_points,
      external_link: assignment.external_link || '',
      external_link_type: assignment.external_link_type || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (assignmentId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus tugas ini?\n\nSemua submission terkait akan dihapus.')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      alert('Tugas berhasil dihapus!');
      fetchData();
    } catch (err) {
      alert('Gagal menghapus tugas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Send notifications to enrolled students when a new assignment is created
  const sendAssignmentNotifications = async (assignment, courseId) => {
    try {
      // Get all enrolled students in the course
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('course_id', courseId);
      
      if (enrollError) throw enrollError;
      
      // Get course info
      const { data: courseData } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single();
      
      // Create notification for each student
      if (enrollments && enrollments.length > 0) {
        const notifications = enrollments.map(enrollment => ({
          user_id: enrollment.student_id,
          type: 'assignment',
          title: 'Tugas Baru',
          message: `📝 Tugas baru "${assignment.title}" telah ditambahkan di kursus "${courseData?.title}".\nBatas waktu: ${assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'Tidak ada'}`,
          related_id: assignment.id,
          related_type: 'assignment',
          created_at: new Date().toISOString()
        }));
        
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);
        
        if (notifError) throw notifError;
        
        console.log(`Sent ${notifications.length} notifications for new assignment`);
      }
    } catch (error) {
      console.error('Error sending assignment notifications:', error.message);
      // Don't throw - assignment was still created successfully
    }
  };

  const handleGrade = async (submissionId, grade, feedback) => {
    try {
      // Get submission to notify student
      const submission = submissions.find(s => s.id === submissionId);
      
      const { error } = await supabase
        .from('submissions')
        .update({
          grade,
          feedback,
          graded_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;

      // Notify student
      if (submission?.student_id) {
        const assignment = assignments.find(a => a.id === submission.assignment_id);
        await supabase.from('notifications').insert({
          user_id: submission.student_id,
          type: 'grade',
          message: `Tugas "${assignment?.title}" telah dinilai: ${grade}/${assignment?.max_points || 100}`
        });
      }

      alert('Nilai berhasil disimpan!');
      fetchData();
    } catch (err) {
      alert('Gagal memberikan nilai: ' + err.message);
    }
  };

  const openCreateModal = () => {
    setEditingAssignment(null);
    setFormData({ title: '', description: '', due_date: '', max_points: 100 });
    setShowModal(true);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <button onClick={onBack} className="btn btn-secondary btn-sm" style={{ marginBottom: '0.5rem' }}>
            ← Kembali
          </button>
          <h1>Manajemen Tugas</h1>
          <p>{assignments.length} tugas dibuat • {submissions.length} submission</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          + Buat Tugas Baru
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner spinner-medium"></div>
          <p>Memuat...</p>
        </div>
      ) : (
        <>
          <section className="dashboard-section">
            <h2>📝 Daftar Tugas</h2>
            {assignments.length > 0 ? (
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Judul</th>
                      <th>Deskripsi</th>
                      <th>Batas Waktu</th>
                      <th>Nilai Maks</th>
                      <th>Submission</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map(assignment => {
                      const assignmentSubmissions = submissions.filter(
                        s => s.assignment_id === assignment.id
                      );
                      const gradedCount = assignmentSubmissions.filter(s => s.grade !== null).length;
                      const isOpen = assignment.status === 'open';
                      const isPastDue = assignment.due_date && new Date(assignment.due_date) < new Date();

                      return (
                        <tr key={assignment.id}>
                          <td><strong>{assignment.title}</strong></td>
                          <td>{assignment.description?.substring(0, 50)}...</td>
                          <td>
                            {assignment.due_date 
                              ? new Date(assignment.due_date).toLocaleDateString()
                              : '-'}
                          </td>
                          <td>{assignment.max_points}</td>
                          <td>
                            <span style={{ fontWeight: 'bold' }}>{assignmentSubmissions.length}</span>
                            {gradedCount > 0 && (
                              <small style={{ display: 'block', color: '#10b981' }}>
                                ✓ {gradedCount} sudah dinilai
                              </small>
                            )}
                          </td>
                          <td>
                            {isOpen && !isPastDue ? (
                              <span className="status-open">Dibuka</span>
                            ) : isPastDue ? (
                              <span className="status-closed">Tutup</span>
                            ) : (
                              <span className="status-closed">Tutup</span>
                            )}
                          </td>
                          <td>
                            <div className="table-actions">
                              <button 
                                onClick={() => handleEdit(assignment)}
                                className="btn btn-edit btn-sm"
                              >
                                ✏️ Edit
                              </button>
                              <button 
                                onClick={() => handleDelete(assignment.id)}
                                className="btn btn-danger btn-sm"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📝</span>
                <p>Belum ada tugas.</p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  Buat tugas pertama untuk murid Anda.
                </p>
                <button onClick={openCreateModal} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  Buat Tugas Pertama
                </button>
              </div>
            )}
          </section>

          {submissions.length > 0 && (
            <section className="dashboard-section">
              <h2>📋 Submission Terbaru</h2>
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Siswa</th>
                      <th>Tugas</th>
                      <th>Waktu Submit</th>
                      <th>Jawaban</th>
                      <th>File</th>
                      <th>Nilai</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.slice(0, 10).map(submission => {
                      const assignment = assignments.find(a => a.id === submission.assignment_id);
                      return (
                        <tr key={submission.id}>
                          <td>
                            <strong>{submission.profiles?.email || 'Tidak diketahui'}</strong>
                          </td>
                          <td>{assignment?.title || '-'}</td>
                          <td>{new Date(submission.submitted_at).toLocaleString()}</td>
                          <td>
                            {submission.content ? (
                              <span title={submission.content}>
                                {submission.content.substring(0, 30)}...
                              </span>
                            ) : (
                              <span style={{ color: '#9ca3af' }}>-</span>
                            )}
                          </td>
                          <td>
                            {submission.attachment_url ? (
                              <a 
                                href={submission.attachment_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn btn-secondary btn-sm"
                              >
                                📎 Lihat
                              </a>
                            ) : (
                              <span style={{ color: '#9ca3af' }}>Tidak ada</span>
                            )}
                          </td>
                          <td>
                            {submission?.grade !== null 
                              ? (
                                <span className="status-completed">
                                  {submission.grade}/{assignment?.max_points || 100}
                                </span>
                              )
                              : <span className="status-pending">Belum dinilai</span>
                            }
                            {submission.feedback && (
                              <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280' }}>
                                💬 {submission.feedback.substring(0, 20)}...
                              </small>
                            )}
                          </td>
                          <td>
                            <GradingForm 
                              submission={submission}
                              assignment={assignment}
                              onGrade={handleGrade}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {showModal && (
        <AssignmentModal
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowModal(false);
            setEditingAssignment(null);
          }}
          isEditing={!!editingAssignment}
          loading={loading}
        />
      )}
    </div>
  );
};

// Grading Form Component
const GradingForm = ({ submission, assignment, onGrade }) => {
  const [grading, setGrading] = useState(false);
  const [grade, setGrade] = useState(submission.grade || '');
  const [feedback, setFeedback] = useState(submission.feedback || '');

  if (grading) {
    return (
      <div className="grading-form-inline" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="number"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder={`/ ${assignment?.max_points || 100}`}
            className="grade-input-small"
            min="0"
            max={assignment?.max_points || 100}
            style={{ width: '80px' }}
          />
          <input
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Feedback untuk siswa..."
            className="feedback-input-small"
            style={{ flex: 1 }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => {
              onGrade(submission.id, parseInt(grade) || null, feedback);
              setGrading(false);
            }}
            className="btn btn-primary btn-sm"
          >
            💾 Simpan
          </button>
          <button 
            onClick={() => setGrading(false)}
            className="btn btn-secondary btn-sm"
          >
            Batal
          </button>
        </div>
      </div>
    );
  }

  return (
    <button 
      onClick={() => setGrading(true)}
      className="btn btn-primary btn-sm"
    >
      {submission?.grade !== null ? '✏️ Nilai Ulang' : '📝 Nilai'}
    </button>
  );
};

// Assignment Modal Component
const AssignmentModal = ({ formData, setFormData, onSubmit, onClose, isEditing, loading }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2>{isEditing ? 'Edit Tugas' : 'Buat Tugas Baru'}</h2>
        <button onClick={onClose} className="modal-close">&times;</button>
      </div>
      
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="title">Judul Tugas *</label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Contoh: Tugas Pertemuan 1 - Pengenalan"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Deskripsi Tugas *</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Jelaskan tugas dengan detail...\n- Apa yang harus dikerjakan\n- Cara pengerjaan\n- Kriteria penilaian"
            rows="4"
            required
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="due_date">Batas Waktu *</label>
            <input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="max_points">Nilai Maksimum *</label>
            <input
              id="max_points"
              type="number"
              value={formData.max_points}
              onChange={(e) => setFormData({ ...formData, max_points: parseInt(e.target.value) })}
              min="1"
              max="1000"
              required
            />
          </div>
        </div>
        
        {/* External Link for Submission (Optional) */}
        <div className="form-group" style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔗 Link Eksternal untuk Pengumpulan (Opsional)
          </h4>
          <p style={{ fontSize: '0.8rem', color: '#0c4a6e', marginBottom: '0.75rem' }}>
            Berikan link Google Drive, Dropbox, atau platform lain sebagai alternatif pengumpulan tugas.
            Ini mengurangi beban penyimpanan backend.
          </p>
          
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="external_link_type">Tipe Link</label>
              <select
                id="external_link_type"
                value={formData.external_link_type || ''}
                onChange={(e) => setFormData({ ...formData, external_link_type: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="">Pilih tipe link...</option>
                <option value="google-drive">📁 Google Drive</option>
                <option value="dropbox">📦 Dropbox</option>
                <option value="onedrive">☁️ OneDrive</option>
                <option value="youtube">🎬 YouTube</option>
                <option value="video">🎥 Video Platform Lain</option>
                <option value="other">🔗 Link Lainnya</option>
              </select>
            </div>
            
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="external_link">URL Link</label>
              <input
                id="external_link"
                type="url"
                value={formData.external_link || ''}
                onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                placeholder="https://drive.google.com/..."
              />
            </div>
          </div>
          
          {(formData.external_link_type && formData.external_link) && (
            <p style={{ fontSize: '0.8rem', color: '#059669', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ✅ Link akan ditampilkan kepada murid sebagai alternatif pengumpulan tugas
            </p>
          )}
        </div>
        
        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Batal
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Memproses...' : (isEditing ? '💾 Simpan Perubahan' : '✅ Buat Tugas')}
          </button>
        </div>
      </form>
    </div>
  </div>
);

// Student Submission Module
export const StudentSubmission = ({ assignments, studentSubmissions, onSubmitAssignment }) => {
  const { user } = useAuth();
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionLink, setSubmissionLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, submitted, graded
  const [uploadProgress, setUploadProgress] = useState(0);

  // Get file icon based on type
  const getFileIcon = (fileName) => {
    if (!fileName) return '📎';
    const ext = fileName.split('.').pop().toLowerCase();
    const videoExts = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'wmv'];
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    
    if (videoExts.includes(ext)) return '🎬';
    if (imageExts.includes(ext)) return '🖼️';
    if (docExts.includes(ext)) return '📄';
    return '📎';
  };

  // Get file type label
  const getFileTypeLabel = (fileName) => {
    if (!fileName) return 'File';
    const ext = fileName.split('.').pop().toLowerCase();
    const videoExts = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'wmv'];
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    
    if (videoExts.includes(ext)) return 'Video';
    if (imageExts.includes(ext)) return 'Foto';
    return 'Dokumen';
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      const videoExts = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'wmv'];
      const isVideo = videoExts.includes(ext);
      
      // Max size: 10MB for regular files, 100MB for videos
      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      
      if (file.size > maxSize) {
        alert(`File terlalu besar! Maksimal ${isVideo ? '100MB' : '10MB'}.`);
        return;
      }
      setSubmissionFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignment) return;
    
    try {
      setSubmitting(true);
      setUploadProgress(0);
      
      let attachmentUrl = null;
      
      // Upload file if exists
      if (submissionFile) {
        const fileExt = submissionFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `user/${user.id}/${selectedAssignment.id}/${fileName}`;
        
        // Simulate progress for better UX
        setUploadProgress(10);
        
        const { error: uploadError } = await supabase.storage
          .from('assignment-attachments')
          .upload(filePath, submissionFile, {
            onUploadProgress: (progress) => {
              const percent = Math.round((progress.loaded / progress.total) * 80);
              setUploadProgress(10 + percent);
            }
          });
        
        setUploadProgress(90);
        
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage
          .from('assignment-attachments')
          .getPublicUrl(filePath);
        
        attachmentUrl = data.publicUrl;
        setUploadProgress(100);
      }

      // Combine content with external link if provided
      const fullContent = submissionLink 
        ? `${submissionContent}\n\n🔗 Link Pengumpulan: ${submissionLink}`.trim()
        : submissionContent;

      await onSubmitAssignment(selectedAssignment.id, fullContent, attachmentUrl);
      
      // Reset form
      setSubmissionContent('');
      setSubmissionFile(null);
      setSubmissionLink('');
      setSelectedAssignment(null);
      setUploadProgress(0);
      
      alert('✅ Tugas berhasil dikumpulkan!\n\nGuru akan segera memeriksa submission Anda.');
    } catch (err) {
      alert('❌ Gagal mengumpulkan tugas: ' + err.message);
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const submission = studentSubmissions.find(s => s.assignment_id === assignment.id);
    
    if (filter === 'pending') return !submission;
    if (filter === 'submitted') return submission && submission?.grade === null;
    if (filter === 'graded') return submission && submission?.grade !== null;
    return true;
  });

  return (
    <div className="dashboard-content">
      <section className="dashboard-section">
        <div className="section-header">
          <h2>📝 Tugas Saya</h2>
          <div className="filter-buttons">
            <button 
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('all')}
            >
              Semua
            </button>
            <button 
              className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('pending')}
            >
              Menunggu
            </button>
            <button 
              className={`btn btn-sm ${filter === 'submitted' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('submitted')}
            >
              Dikumpulkan
            </button>
            <button 
              className={`btn btn-sm ${filter === 'graded' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('graded')}
            >
              Dinilai
            </button>
          </div>
        </div>

        {filteredAssignments.length > 0 ? (
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Tugas</th>
                  <th>Batas Waktu</th>
                  <th>Nilai Maks</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map(assignment => {
                  const submission = studentSubmissions.find(s => s.assignment_id === assignment.id);
                  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date();
                  const isSubmitted = !!submission;
                  const isGraded = submission?.grade !== null;

                  return (
                    <tr key={assignment.id}>
                      <td>
                        <strong>{assignment.title}</strong>
                        <br />
                        <small style={{ color: '#6b7280' }}>{assignment.description?.substring(0, 50)}...</small>
                      </td>
                      <td className={isOverdue && !isSubmitted ? 'overdue' : ''}>
                        {assignment.due_date 
                          ? new Date(assignment.due_date).toLocaleDateString()
                          : 'Tidak ada'}
                        {isOverdue && !isSubmitted && (
                          <span className="overdue-badge">Terlambat</span>
                        )}
                      </td>
                      <td>{assignment.max_points}</td>
                      <td>
                        {isGraded ? (
                          <span className="status-completed">
                            ✅ Dinilai: {submission?.grade}/{assignment.max_points}
                          </span>
                        ) : isSubmitted ? (
                          <span className="status-pending">📤 Dikumpulkan</span>
                        ) : isOverdue ? (
                          <span className="status-closed">❌ Terlambat</span>
                        ) : (
                          <span className="status-open">⏳ Menunggu</span>
                        )}
                      </td>
                      <td>
                        {!isSubmitted && !isOverdue && (
                          <button 
                            onClick={() => setSelectedAssignment(assignment)}
                            className="btn btn-primary btn-sm"
                          >
                            📤 Kumpulkan
                          </button>
                        )}
                        {isSubmitted && (
                          <button 
                            onClick={() => setSelectedAssignment(assignment)}
                            className="btn btn-secondary btn-sm"
                          >
                            {isGraded ? '📋 Lihat' : '📤 Update'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">📝</span>
            <p>Tidak ada tugas dengan filter ini.</p>
          </div>
        )}
      </section>

      {/* Submission Modal */}
      {selectedAssignment && (
        <div className="modal-overlay" onClick={() => setSelectedAssignment(null)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📝 Kumpulkan: {selectedAssignment.title}</h2>
              <button onClick={() => setSelectedAssignment(null)} className="modal-close">&times;</button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              {/* Assignment Info */}
              <div style={{ 
                background: '#f3f4f6', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginBottom: '1.5rem'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>📋 Detail Tugas</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                  {selectedAssignment.description}
                </p>
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  marginTop: '0.75rem', 
                  fontSize: '0.875rem' 
                }}>
                  <span>📅 Batas: <strong>{selectedAssignment.due_date ? new Date(selectedAssignment.due_date).toLocaleDateString() : 'Tidak ada'}</strong></span>
                  <span>📊 Max: <strong>{selectedAssignment.max_points} poin</strong></span>
                </div>
              </div>
              
              {/* Teacher's External Link (if provided) */}
              {selectedAssignment.external_link && (
                <div style={{ 
                  background: '#dbeafe', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  marginBottom: '1.5rem',
                  border: '1px solid #93c5fd'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🔗 Materi dari Guru
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                    Guru telah menyediakan link berikut sebagai referensi untuk tugas ini:
                  </p>
                  <a 
                    href={selectedAssignment.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#3b82f6',
                      color: 'white',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontSize: '0.875rem'
                    }}
                  >
                    {selectedAssignment.external_link_type === 'google-drive' && '📁 '}
                    {selectedAssignment.external_link_type === 'dropbox' && '📦 '}
                    {selectedAssignment.external_link_type === 'onedrive' && '☁️ '}
                    {selectedAssignment.external_link_type === 'youtube' && '🎬 '}
                    {selectedAssignment.external_link_type === 'video' && '🎥 '}
                    {selectedAssignment.external_link_type === 'other' && '🔗 '}
                    Buka Link
                    <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>↗</span>
                  </a>
                </div>
              )}
              
              {/* Submission Form */}
              <div className="form-group">
                <label htmlFor="submission_content">
                  💬 Jawaban / Catatan:
                </label>
                <textarea
                  id="submission_content"
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  placeholder="Tulis jawaban atau catatan untuk tugas ini..."
                  rows="5"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '0.5rem',
                    fontSize: '0.9375rem'
                  }}
                />
              </div>
              
              {/* File Upload */}
              <div className="form-group">
                <label>
                  📎 Upload File ({getFileTypeLabel(submissionFile?.name)}):
                </label>
                <div style={{ 
                  border: '2px dashed #d1d5db', 
                  borderRadius: '0.5rem', 
                  padding: '1.5rem', 
                  textAlign: 'center',
                  background: '#fafafa',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <input
                    id="submission_file"
                    type="file"
                    accept=".mp4,.mov,.avi,.webm,.mkv,.jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="submission_file" style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                      {submissionFile ? getFileIcon(submissionFile.name) : '📤'}
                    </div>
                    {submissionFile ? (
                      <div>
                        <strong>{submissionFile.name}</strong>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0' }}>
                          {(submissionFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <button 
                          type="button"
                          onClick={(e) => { 
                            e.preventDefault(); 
                            setSubmissionFile(null); 
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ marginTop: '0.5rem' }}
                        >
                          ❌ Hapus
                        </button>
                      </div>
                    ) : (
                      <div>
                        <strong>Klik untuk memilih file</strong>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0' }}>
                          Video (max 100MB), Foto (max 10MB), atau Dokumen (max 10MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
                {submissionFile && (
                  <p style={{ marginTop: '0.5rem', color: '#10b981', fontSize: '0.875rem' }}>
                    ✅ {getFileIcon(submissionFile.name)} {getFileTypeLabel(submissionFile.name)} siap diupload
                  </p>
                )}
              </div>
              
              {/* Link Submission (Alternative) */}
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="submission_link">
                  🔗 Link Pengumpulan Alternatif (Opsional):
                </label>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Jika tugas Anda berupa link Google Drive, Dropbox, atau platform lain, masukkan link di sini.
                </p>
                <input
                  id="submission_link"
                  type="url"
                  value={submissionLink}
                  onChange={(e) => setSubmissionLink(e.target.value)}
                  placeholder="https://drive.google.com/... atau https://youtube.com/..."
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                />
                {submissionLink && (
                  <p style={{ marginTop: '0.5rem', color: '#10b981', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ✅ Link akan disertakan dalam submission Anda
                  </p>
                )}
              </div>
              
              {/* Submit Button */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button 
                  onClick={handleSubmit}
                  disabled={submitting || (!submissionContent && !submissionFile && !submissionLink)}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.875rem' }}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-small"></span>
                      {uploadProgress > 0 ? `Mengupload ${uploadProgress}%...` : 'Memproses...'}
                    </>
                  ) : (
                    '✅ Kumpulkan Tugas'
                  )}
                </button>
                <button 
                  onClick={() => {
                    setSelectedAssignment(null);
                    setSubmissionContent('');
                    setSubmissionFile(null);
                    setSubmissionLink('');
                  }}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Batal
                </button>
              </div>
              
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '1rem', textAlign: 'center' }}>
                💡 Tips: Anda dapat mengumpulkan tugas berupa teks, video, foto, dokumen, atau link (Google Drive, Dropbox, YouTube, dll)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentModule;
