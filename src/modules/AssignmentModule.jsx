import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { BookOpen, Plus, Edit3, Trash2, X, Calendar, Clock, FileText, AlertCircle } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
        <div>
          <h1 className="text-headline-sm md:text-headline-md font-display text-on-surface flex items-center gap-sm">
            <FileText className="w-6 h-6 text-primary" />
            Manajemen Tugas Kursus
          </h1>
        </div>
        {(role === 'guru' || role === 'admin') && (
          <button onClick={() => { setFormData({ title: '', description: '', due_date: '', max_points: 100 }); setEditingAssignment(null); setShowForm(true); }}
            className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-xl font-medium hover:bg-primary-container hover:text-on-primary-container transition-all">
            <Plus className="w-4 h-4" /> Tambah Tugas
          </button>
        )}
      </div>

      {/* Course Select */}
      <div className="flex items-center gap-md p-md bg-surface-container-low rounded-xl">
        <BookOpen className="w-5 h-5 text-primary" />
        <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}
          className="flex-1 px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
          {courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-md">
          <div className="bg-surface rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="relative bg-gradient-to-br from-primary to-[#5a4fcf] rounded-t-2xl p-xl text-white">
              <h2 className="text-title-lg font-display">{editingAssignment ? 'Edit Tugas' : 'Tambah Tugas Baru'}</h2>
              <button onClick={handleCancel} type="button" className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-lg space-y-md">
              <div>
                <label className="block text-label-lg font-medium text-on-surface mb-xs">Judul Tugas *</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required
                  className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              </div>
              <div>
                <label className="block text-label-lg font-medium text-on-surface mb-xs">Deskripsi Tugas *</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="4" required
                  className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              </div>
              <div className="grid md:grid-cols-2 gap-md">
                <div>
                  <label className="block text-label-lg font-medium text-on-surface mb-xs">Batas Waktu</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input type="date" name="due_date" value={formData.due_date} onChange={handleInputChange}
                      className="w-full pl-xl pr-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-label-lg font-medium text-on-surface mb-xs">Nilai Maksimum</label>
                  <input type="number" name="max_points" value={formData.max_points} onChange={handleInputChange} min="1" max="1000"
                    className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                </div>
              </div>
              <div className="flex gap-sm pt-sm border-t border-outline-variant/20">
                <button type="submit" className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-xl font-medium hover:bg-primary-container hover:text-on-primary-container transition-all">
                  {editingAssignment ? 'Simpan Perubahan' : 'Tambah Tugas'}
                </button>
                <button type="button" onClick={handleCancel} className="px-lg py-sm rounded-xl bg-surface-dim text-on-surface-variant font-medium hover:bg-outline-variant transition-all">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment List */}
      <div>
        <h2 className="text-title-md font-display text-on-surface mb-md">
          Daftar Tugas untuk "{courses.find(c => c.id === selectedCourse)?.title || ''}"
        </h2>
        {assignments.length > 0 ? (
          <div className="space-y-sm">
            {assignments.map(assignment => (
              <div key={assignment.id} className="bg-surface rounded-xl p-md border border-outline-variant/30 hover:border-primary/30 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-md mb-sm">
                  <h3 className="text-title-sm font-display text-on-surface font-semibold">{assignment.title}</h3>
                  <span className="inline-flex items-center bg-primary-container text-on-primary-container px-sm py-0.5 rounded-full text-label-sm font-medium flex-shrink-0">{assignment.max_points} poin</span>
                </div>
                <p className="text-body-sm text-on-surface-variant mb-sm">{assignment.description}</p>
                <p className="text-label-sm text-on-surface-variant flex items-center gap-xs">
                  <Clock className="w-3.5 h-3.5" />
                  Batas Waktu: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'Tidak ada'}
                </p>
                {(role === 'guru' || role === 'admin') && (
                  <div className="flex gap-xs mt-sm pt-sm border-t border-outline-variant/20">
                    <button onClick={() => handleEdit(assignment)} className="inline-flex items-center gap-xs px-sm py-xs rounded-lg bg-primary-container text-on-primary-container text-label-sm font-medium hover:bg-primary hover:text-on-primary transition-all">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => handleDelete(assignment.id)} className="inline-flex items-center gap-xs px-sm py-xs rounded-lg bg-error-container text-on-error-container text-label-sm font-medium hover:bg-error hover:text-on-error transition-all">
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-xl text-on-surface-variant">
            <FileText className="w-10 h-10 mb-sm opacity-40" />
            <p>Belum ada tugas untuk kursus ini.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentModule;