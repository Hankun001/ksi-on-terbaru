import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Megaphone, Plus, X, Send, Filter, Edit3, Trash2 } from 'lucide-react';

const AnnouncementModule = () => {
  const { user, role } = useAuth();
  const [courses, setCourses] = useState([]);
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  useEffect(() => {
    fetchCoursesAndAnnouncements();
  }, []);

  useEffect(() => {
    if (selectedCourse === 'all') {
      // Load all announcements
      loadAllAnnouncements();
    } else if (selectedCourse) {
      loadAnnouncementsForCourse(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchCoursesAndAnnouncements = async () => {
    try {
      let coursesQuery;
      
      if (role === 'admin') {
        // Admin can see all courses
        coursesQuery = supabase.from('courses').select('*');
      } else if (role === 'guru') {
        // Teachers can see only their courses
        coursesQuery = supabase.from('courses').select('*').eq('instructor_id', user.id);
      } else {
        // Students can see all courses (for announcements)
        coursesQuery = supabase.from('courses').select('*');
      }
      
      const { data: coursesData, error: coursesError } = await coursesQuery;
      
      if (coursesError) throw coursesError;
      
      setCourses(coursesData || []);
      
      // Load all announcements
      await loadAllAnnouncements();
    } catch (error) {
      console.error('Error fetching courses:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAllAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          profiles (
            email
          ),
          courses (
            title
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setAllAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching all announcements:', error.message);
    }
  };

  const loadAnnouncementsForCourse = async (courseId) => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          profiles (
            email
          ),
          courses (
            title
          )
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setAllAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingAnnouncement) {
        // Update existing announcement
        const { error } = await supabase
          .from('announcements')
          .update({
            title: formData.title,
            content: formData.content
          })
          .eq('id', editingAnnouncement.id);
          
        if (error) throw error;
        alert('Pengumuman berhasil diperbarui!');
      } else {
        // Create new announcement
        const { data: announcementData, error } = await supabase
          .from('announcements')
          .insert([{
            title: formData.title,
            content: formData.content,
            course_id: selectedCourse,
            author_id: user.id
          }])
          .select()
          .single();
          
        if (error) throw error;
        
        // Send notifications to all enrolled students in the course
        await sendAnnouncementNotifications(announcementData, selectedCourse);
        
        alert('Pengumuman berhasil dibuat!\n\nNotifikasi telah dikirim ke semua murid yang terdaftar.');
      }
      
      // Reset form and close it
      setFormData({ title: '', content: '' });
      setEditingAnnouncement(null);
      setShowForm(false);
      
      // Refresh announcements
      if (selectedCourse === 'all') {
        loadAllAnnouncements();
      } else {
        loadAnnouncementsForCourse(selectedCourse);
      }
    } catch (error) {
      console.error('Error saving announcement:', error.message);
      alert('Error menyimpan pengumuman: ' + error.message);
    }
  };

  // Send notifications to all enrolled students
  const sendAnnouncementNotifications = async (announcement, courseId) => {
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
          type: 'announcement',
          title: 'Pengumuman Baru',
          message: `"${courseData?.title}": ${announcement.title}`,
          related_id: announcement.id,
          related_type: 'announcement',
          created_at: new Date().toISOString()
        }));
        
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);
        
        if (notifError) throw notifError;
        
        console.log(`Sent ${notifications.length} notifications for announcement`);
      }
    } catch (error) {
      console.error('Error sending notifications:', error.message);
      // Don't throw - announcement was still created successfully
    }
  };

  const handleEdit = (announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content
    });
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const handleDelete = async (announcementId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId);
        
      if (error) throw error;
      
      // Refresh announcements
      if (selectedCourse === 'all') {
        loadAllAnnouncements();
      } else {
        loadAnnouncementsForCourse(selectedCourse);
      }
    } catch (error) {
      console.error('Error deleting announcement:', error.message);
      alert('Error deleting announcement: ' + error.message);
    }
  };

  const handleCancel = () => {
    setFormData({ title: '', content: '' });
    setEditingAnnouncement(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-sm">
          <div className="w-12 h-12 rounded-full bg-surface-dim"></div>
          <div className="h-4 w-48 bg-surface-dim rounded"></div>
        </div>
      </div>
    );
  }

  // For students, show all announcements by default
  const displayAnnouncements = selectedCourse === 'all' 
    ? allAnnouncements 
    : allAnnouncements;

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-xl">
        <div>
          <h1 className="text-headline-sm md:text-headline-md font-bold text-on-surface flex items-center gap-sm">
            <Megaphone className="w-7 h-7 text-primary" />
            Pengumuman
          </h1>
          <p className="text-body-md text-on-surface-variant mt-xs">Informasi dan pengumuman kursus</p>
        </div>
        {(role === 'guru' || role === 'admin') && (
          <button onClick={() => { setFormData({ title: '', content: '' }); setEditingAnnouncement(null); setShowForm(true); }}
            className="inline-flex items-center gap-xs px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all duration-200 shadow-sm text-label-lg font-medium">
            <Plus className="w-4 h-4" />
            Buat Pengumuman
          </button>
        )}
      </div>

      {/* Course Filter */}
      <div className="bg-surface-container-low rounded-2xl p-4 md:p-5 mb-xl border border-outline-variant">
        <div className="flex items-center gap-sm">
          <Filter className="w-5 h-5 text-primary" />
          <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md">
            <option value="all">Semua Kursus</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={handleCancel}>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-title-md font-semibold text-white flex items-center gap-sm">
                <Megaphone className="w-5 h-5" />
                {editingAnnouncement ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
              </h2>
              <button onClick={handleCancel} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-label-lg font-medium text-on-surface mb-1.5">Judul Pengumuman <span className="text-error">*</span></label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required
                  placeholder="Judul pengumuman..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md" />
              </div>
              <div>
                <label className="block text-label-lg font-medium text-on-surface mb-1.5">Isi Pengumuman <span className="text-error">*</span></label>
                <textarea name="content" value={formData.content} onChange={handleInputChange} rows={6} required
                  placeholder="Tulis isi pengumuman di sini..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-body-md resize-none" />
              </div>
              <div className="flex gap-sm pt-2 border-t border-outline-variant">
                <button type="submit" className="flex-1 inline-flex items-center justify-center gap-xs px-4 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all duration-200 shadow-sm text-label-lg font-medium">
                  <Send className="w-4 h-4" />
                  {editingAnnouncement ? 'Simpan Perubahan' : 'Buat Pengumuman'}
                </button>
                <button type="button" onClick={handleCancel} className="px-4 py-2.5 rounded-full border border-outline text-on-surface-variant hover:bg-surface-dim transition-colors text-label-lg">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="px-4 md:px-6 py-4 border-b border-outline-variant">
          <h2 className="text-title-md font-semibold text-on-surface flex items-center gap-sm">
            <Megaphone className="w-5 h-5 text-primary" />
            {selectedCourse === 'all' ? 'Semua Pengumuman' : `Pengumuman: ${courses.find(c => c.id === selectedCourse)?.title || ''}`}
          </h2>
        </div>

        {displayAnnouncements.length > 0 ? (
          <div className="divide-y divide-outline-variant">
            {displayAnnouncements.map(announcement => (
              <div key={announcement.id} className="p-4 md:p-6 hover:bg-surface-dim/30 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-title-sm font-semibold text-on-surface m-0">{announcement.title}</h3>
                    <p className="text-label-sm text-on-surface-variant mt-1 flex items-center gap-1.5 flex-wrap">
                      <span>📚 {announcement.courses?.title || 'Unknown Course'}</span>
                      <span className="text-outline">•</span>
                      <span>Oleh: {announcement.profiles?.email || 'Unknown'}</span>
                      <span className="text-outline">•</span>
                      <span>{new Date(announcement.created_at).toLocaleDateString('id-ID')}</span>
                    </p>
                  </div>
                  {(role === 'guru' || role === 'admin') && (
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleEdit(announcement)} className="p-2 rounded-full bg-primary-container/50 text-on-primary-container hover:bg-primary-container/80 transition-colors" title="Edit">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(announcement.id)} className="p-2 rounded-full bg-error-container/50 text-on-error-container hover:bg-error-container/80 transition-colors" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-body-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                  {announcement.content}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Megaphone className="w-16 h-16 mx-auto text-on-surface-variant/30 mb-4" />
            <p className="text-body-lg text-on-surface-variant">Belum ada pengumuman.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementModule;
