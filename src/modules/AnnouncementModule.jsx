import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

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
    return <div className="dashboard-container">Memuat pengumuman...</div>;
  }

  // For students, show all announcements by default
  const displayAnnouncements = selectedCourse === 'all' 
    ? allAnnouncements 
    : allAnnouncements;

  return (
    <div className="dashboard-container">
      <h1>📢 Pengumuman</h1>
      
      {/* Course Filter */}
      <div className="filter-controls">
        <label htmlFor="course-select">Filter by Course:</label>
        <select
          id="course-select"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="all">All Courses</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
      </div>

      {(role === 'guru' || role === 'admin') && (
        <div className="dashboard-actions">
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setFormData({ title: '', content: '' });
              setEditingAnnouncement(null);
              setShowForm(true);
            }}
          >
            + Buat Pengumuman Baru
          </button>
        </div>
      )}

      {showForm && (
        <div className="form-container">
          <h2>{editingAnnouncement ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Judul Pengumuman:</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="content">Isi Pengumuman:</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows="6"
                required
              ></textarea>
            </div>
            
            {(role === 'guru' || role === 'admin') && (
              <div className="form-group">
                <label htmlFor="announcement-course">Kursus:</label>
                <select
                  id="announcement-course"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  required
                >
                  <option value="">Pilih Kursus</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingAnnouncement ? 'Simpan Perubahan' : 'Buat Pengumuman'}
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
          <h2>
            {selectedCourse === 'all' 
              ? 'Semua Pengumuman' 
              : `Pengumuman: "${courses.find(c => c.id === selectedCourse)?.title}"`}
          </h2>
          
          {displayAnnouncements.length > 0 ? (
            <div className="announcements-list">
              {displayAnnouncements.map(announcement => (
                <div key={announcement.id} className="announcement-item card">
                  <div className="announcement-header">
                    <h3>{announcement.title}</h3>
                    <div className="announcement-meta">
                      <span>
                        📚 {announcement.courses?.title || 'Unknown Course'} • 
                        Oleh: {announcement.profiles?.email || 'Unknown'}
                      </span>
                      <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="announcement-content">
                    <p>{announcement.content}</p>
                  </div>
                  
                  {(role === 'guru' || role === 'admin') && (
                    <div className="announcement-actions">
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => handleEdit(announcement)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => handleDelete(announcement.id)}
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">📢</span>
              <p>Belum ada pengumuman.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AnnouncementModule;
