import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const CourseManagement = () => {
  const { user, role } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      let query;
      
      if (role === 'admin') {
        // Admin can see all courses
        query = supabase.from('courses').select(`
          *,
          profiles (
            email
          )
        `);
      } else if (role === 'guru') {
        // Teachers can see only their courses
        query = supabase.from('courses').select(`
          *,
          profiles (
            email
          )
        `).eq('instructor_id', user.id);
      } else {
        // Students can see courses they're enrolled in
        query = supabase.from('courses').select(`
          courses.*,
          profiles (
            email
          )
        `).eq('enrollments.student_id', user.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error.message);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCourse) {
        // Update existing course
        const { error } = await supabase
          .from('courses')
          .update({
            title: formData.title,
            description: formData.description,
            thumbnail_url: formData.thumbnail_url
          })
          .eq('id', editingCourse.id);
          
        if (error) throw error;
      } else {
        // Create new course
        const { error } = await supabase
          .from('courses')
          .insert([{
            title: formData.title,
            description: formData.description,
            thumbnail_url: formData.thumbnail_url,
            instructor_id: user.id
          }]);
          
        if (error) throw error;
      }
      
      // Reset form and close it
      setFormData({ title: '', description: '', thumbnail_url: '' });
      setEditingCourse(null);
      setShowForm(false);
      
      // Refresh courses
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error.message);
      alert('Error saving course: ' + error.message);
    }
  };

  const handleEdit = (course) => {
    setFormData({
      title: course.title,
      description: course.description,
      thumbnail_url: course.thumbnail_url || ''
    });
    setEditingCourse(course);
    setShowForm(true);
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kursus ini?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
        
      if (error) throw error;
      
      // Refresh courses
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error.message);
      alert('Error deleting course: ' + error.message);
    }
  };

  const handleCancel = () => {
    setFormData({ title: '', description: '', thumbnail_url: '' });
    setEditingCourse(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="dashboard-container">Memuat kursus...</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Manajemen Kursus</h1>
      
      {(role === 'guru' || role === 'admin') && (
        <div className="dashboard-actions">
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setFormData({ title: '', description: '', thumbnail_url: '' });
              setEditingCourse(null);
              setShowForm(true);
            }}
          >
            + Tambah Kursus Baru
          </button>
        </div>
      )}

      {showForm && (
        <div className="form-container">
          <h2>{editingCourse ? 'Edit Kursus' : 'Tambah Kursus Baru'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Judul Kursus:</label>
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
              <label htmlFor="description">Deskripsi:</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                required
              ></textarea>
            </div>
            
            <div className="form-group">
              <label htmlFor="thumbnail_url">URL Gambar Sampul (opsional):</label>
              <input
                type="text"
                id="thumbnail_url"
                name="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingCourse ? 'Simpan Perubahan' : 'Buat Kursus'}
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
          <h2>Daftar Kursus</h2>
          {courses.length > 0 ? (
            <div className="cards-grid">
              {courses.map(course => (
                <div key={course.id} className="card">
                  {course.thumbnail_url && (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title} 
                      style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '0.5rem 0.5rem 0 0' }} 
                    />
                  )}
                  <div className="card-content">
                    <h3>{course.title}</h3>
                    <p>{course.description}</p>
                    <small>
                      Dibuat oleh: {course.profiles?.email || 'Tidak diketahui'}<br/>
                      Tanggal: {new Date(course.created_at).toLocaleDateString()}
                    </small>
                    
                    {(role === 'guru' && course.instructor_id === user.id) || role === 'admin' ? (
                      <div className="card-actions">
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleEdit(course)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleDelete(course.id)}
                        >
                          Hapus
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>{role === 'guru' || role === 'admin' ? 'Belum ada kursus.' : 'Anda belum terdaftar di kursus mana pun.'}</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default CourseManagement;