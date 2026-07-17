import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { BookOpen, Plus, Edit3, Trash2, X, FileText } from 'lucide-react';

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

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try {
      let query;
      if (role === 'admin') {
        query = supabase.from('courses').select('*, profiles (email)');
      } else if (role === 'guru') {
        query = supabase.from('courses').select('*, profiles (email)').eq('instructor_id', user.id);
      } else {
        query = supabase.from('courses').select('courses.*, profiles (email)').eq('enrollments.student_id', user.id);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error.message);
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        const { error } = await supabase.from('courses').update({ title: formData.title, description: formData.description, thumbnail_url: formData.thumbnail_url }).eq('id', editingCourse.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('courses').insert([{ title: formData.title, description: formData.description, thumbnail_url: formData.thumbnail_url, instructor_id: user.id }]);
        if (error) throw error;
      }
      setFormData({ title: '', description: '', thumbnail_url: '' });
      setEditingCourse(null);
      setShowForm(false);
      fetchCourses();
    } catch (error) {
      alert('Error saving course: ' + error.message);
    }
  };

  const handleEdit = (course) => {
    setFormData({ title: course.title, description: course.description, thumbnail_url: course.thumbnail_url || '' });
    setEditingCourse(course);
    setShowForm(true);
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kursus ini?')) return;
    try {
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) throw error;
      fetchCourses();
    } catch (error) {
      alert('Error deleting course: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[30vh] p-xl">
        <div className="w-8 h-8 rounded-full border-[3px] border-outline-variant border-t-primary animate-spin mb-md" />
        <p className="text-body-sm text-on-surface-variant animate-pulse">Memuat kursus...</p>
      </div>
    );
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop space-y-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-sm md:text-headline-md font-display text-on-surface flex items-center gap-sm">
            <BookOpen className="w-6 h-6 text-primary" />
            Manajemen Kursus
          </h1>
          <p className="text-body-sm text-on-surface-variant">{courses.length} kursus</p>
        </div>
        {(role === 'guru' || role === 'admin') && (
          <button onClick={() => { setFormData({ title: '', description: '', thumbnail_url: '' }); setEditingCourse(null); setShowForm(true); }}
            className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-xl font-medium hover:bg-primary-container hover:text-on-primary-container transition-all">
            <Plus className="w-4 h-4" />
            Tambah Kursus
          </button>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-md">
          <div className="bg-surface rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="relative bg-gradient-to-br from-primary to-[#5a4fcf] rounded-t-2xl p-xl text-white">
              <h2 className="text-title-lg font-display flex items-center gap-xs">
                <Plus className="w-5 h-5" />
                {editingCourse ? 'Edit Kursus' : 'Tambah Kursus Baru'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingCourse(null); }} type="button" className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-lg space-y-md">
              <div>
                <label className="block text-label-lg font-medium text-on-surface mb-xs">Judul Kursus *</label>
                <input type="text" name="title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required
                  className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              </div>
              <div>
                <label className="block text-label-lg font-medium text-on-surface mb-xs">Deskripsi *</label>
                <textarea name="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows="4" required
                  className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              </div>
              <div>
                <label className="block text-label-lg font-medium text-on-surface mb-xs">URL Gambar Sampul (opsional)</label>
                <input type="text" name="thumbnail_url" value={formData.thumbnail_url} onChange={e => setFormData({ ...formData, thumbnail_url: e.target.value })} placeholder="https://..."
                  className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              </div>
              <div className="flex gap-sm pt-sm border-t border-outline-variant/20">
                <button type="submit" className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-xl font-medium hover:bg-primary-container hover:text-on-primary-container transition-all">
                  <FileText className="w-4 h-4" />
                  {editingCourse ? 'Simpan Perubahan' : 'Buat Kursus'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingCourse(null); }} className="px-lg py-sm rounded-xl bg-surface-dim text-on-surface-variant font-medium hover:bg-outline-variant transition-all">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course List */}
      {courses.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-md">
          {courses.map(course => (
            <div key={course.id} className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden hover:border-primary/30 hover:shadow-md transition-all duration-200 group">
              {course.thumbnail_url ? (
                <img src={course.thumbnail_url} alt={course.title} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-primary-container to-tertiary-container flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-on-primary-container/40" />
                </div>
              )}
              <div className="p-md">
                <h3 className="text-title-sm font-display text-on-surface font-semibold mb-xs group-hover:text-primary transition-colors">{course.title}</h3>
                <p className="text-body-sm text-on-surface-variant line-clamp-2 mb-sm">{course.description}</p>
                <div className="text-label-sm text-on-surface-variant space-y-xs mb-md">
                  <p>Dibuat oleh: {course.profiles?.email || 'Tidak diketahui'}</p>
                  <p>Tanggal: {new Date(course.created_at).toLocaleDateString()}</p>
                </div>
                {((role === 'guru' && course.instructor_id === user.id) || role === 'admin') && (
                  <div className="flex gap-xs pt-sm border-t border-outline-variant/20">
                    <button onClick={() => handleEdit(course)}
                      className="flex-1 inline-flex items-center justify-center gap-xs px-sm py-sm rounded-xl bg-primary-container text-on-primary-container text-label-sm font-medium hover:bg-primary hover:text-on-primary transition-all">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => handleDelete(course.id)}
                      className="flex-1 inline-flex items-center justify-center gap-xs px-sm py-sm rounded-xl bg-error-container text-on-error-container text-label-sm font-medium hover:bg-error hover:text-on-error transition-all">
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-2xl text-on-surface-variant">
          <BookOpen className="w-12 h-12 mb-sm opacity-40" />
          <p>{role === 'guru' || role === 'admin' ? 'Belum ada kursus.' : 'Anda belum terdaftar di kursus mana pun.'}</p>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;