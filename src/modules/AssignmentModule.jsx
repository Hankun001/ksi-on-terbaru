import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const AssignmentModule = () => {
  const { user, role } = useAuth();
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    max_points: 100
  });

  useEffect(() => {
    fetchCoursesAndAssignments();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadAssignmentsForCourse(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchCoursesAndAssignments = async () => {
    try {
      let coursesQuery;
      
      if (role === 'admin') {
        // Admin can see all courses
        coursesQuery = supabase.from('courses').select('*');
      } else if (role === 'guru') {
        // Teachers can see only their courses
        coursesQuery = supabase.from('courses').select('*').eq('instructor_id', user.id);
      } else {
        // Students can see courses they're enrolled in
        coursesQuery = supabase.from('courses').select('*').eq('enrollments.student_id', user.id);
      }
      
      const { data: coursesData, error: coursesError } = await coursesQuery;
      
      if (coursesError) throw coursesError;
      
      setCourses(coursesData || []);
      
      // Load assignments for the first course if available
      if (coursesData && coursesData.length > 0) {
        setSelectedCourse(coursesData[0].id);
        loadAssignmentsForCourse(coursesData[0].id);
      }
    } catch (error) {
      console.error('Error fetching courses:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignmentsForCourse = async (courseId) => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error.message);
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
      if (editingAssignment) {
        // Update existing assignment
        const { error } = await supabase
          .from('assignments')
          .update({
            title: formData.title,
            description: formData.description,
            due_date: formData.due_date,
            max_points: parseInt(formData.max_points)
          })
          .eq('id', editingAssignment.id);
          
        if (error) throw error;
      } else {
        // Create new assignment
        const { error } = await supabase
          .from('assignments')
          .insert([{
            title: formData.title,
            description: formData.description,
            due_date: formData.due_date,
            max_points: parseInt(formData.max_points),
            course_id: selectedCourse,
            status: 'open',
            created_at: new Date().toISOString()
          }]);
          
        if (error) throw error;
      }
      
      // Reset form and close it
      setFormData({ title: '', description: '', due_date: '', max_points: 100 });
      setEditingAssignment(null);
      setShowForm(false);
      
      // Refresh assignments
      loadAssignmentsForCourse(selectedCourse);
    } catch (error) {
      console.error('Error saving assignment:', error.message);
      alert('Error saving assignment: ' + error.message);
    }
  };

  const handleEdit = (assignment) => {
    setFormData({
      title: assignment.title,
      description: assignment.description,
      due_date: assignment.due_date ? new Date(assignment.due_date).toISOString().split('T')[0] : '',
      max_points: assignment.max_points
    });
    setEditingAssignment(assignment);
    setShowForm(true);
  };

  const handleDelete = async (assignmentId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);
        
      if (error) throw error;
      
      // Refresh assignments
      loadAssignmentsForCourse(selectedCourse);
    } catch (error) {
      console.error('Error deleting assignment:', error.message);
      alert('Error deleting assignment: ' + error.message);
    }
  };

  const handleCancel = () => {
    setFormData({ title: '', description: '', due_date: '', max_points: 100 });
    setEditingAssignment(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="dashboard-container">Memuat tugas...</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Manajemen Tugas Kursus</h1>
      
      <div className="filter-controls">
        <label htmlFor="course-select">Pilih Kursus:</label>
        <select
          id="course-select"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
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
              setFormData({ title: '', description: '', due_date: '', max_points: 100 });
              setEditingAssignment(null);
              setShowForm(true);
            }}
          >
            + Tambah Tugas Baru
          </button>
        </div>
      )}

      {showForm && (
        <div className="form-container">
          <h2>{editingAssignment ? 'Edit Tugas' : 'Tambah Tugas Baru'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Judul Tugas:</label>
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
              <label htmlFor="description">Deskripsi Tugas:</label>
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
              <label htmlFor="due_date">Batas Waktu:</label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="max_points">Nilai Maksimum:</label>
              <input
                type="number"
                id="max_points"
                name="max_points"
                value={formData.max_points}
                onChange={handleInputChange}
                min="1"
                max="1000"
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingAssignment ? 'Simpan Perubahan' : 'Tambah Tugas'}
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
          <h2>Daftar Tugas untuk "{courses.find(c => c.id === selectedCourse)?.title}"</h2>
          {assignments.length > 0 ? (
            <div className="assignments-list">
              {assignments.map(assignment => (
                <div key={assignment.id} className="assignment-item card">
                  <div className="assignment-header">
                    <h3>{assignment.title}</h3>
                    <span className="assignment-points">{assignment.max_points} poin</span>
                  </div>
                  
                  <div className="assignment-content">
                    <p>{assignment.description}</p>
                    <div className="assignment-meta">
                      <strong>Batas Waktu:</strong> {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'Tidak ada'}
                    </div>
                  </div>
                  
                  {(role === 'guru' || role === 'admin') && (
                    <div className="assignment-actions">
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => handleEdit(assignment)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => handleDelete(assignment.id)}
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>Belum ada tugas untuk kursus ini.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default AssignmentModule;