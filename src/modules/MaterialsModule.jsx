import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import AddMaterialModal from '../components/AddMaterialModal';

const MaterialsModule = () => {
  const { user, role } = useAuth();
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  useEffect(() => {
    fetchCoursesAndMaterials();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadMaterialsForCourse(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchCoursesAndMaterials = async () => {
    try {
      let coursesQuery;
      
      if (role === 'admin') {
        coursesQuery = supabase.from('courses').select('*');
      } else if (role === 'guru') {
        coursesQuery = supabase.from('courses').select('*').eq('instructor_id', user.id);
      } else {
        coursesQuery = supabase.from('courses').select('*').eq('enrollments.student_id', user.id);
      }
      
      const { data: coursesData, error: coursesError } = await coursesQuery;
      
      if (coursesError) throw coursesError;
      
      setCourses(coursesData || []);
      
      if (coursesData && coursesData.length > 0) {
        setSelectedCourse(coursesData[0].id);
        loadMaterialsForCourse(coursesData[0].id);
      }
    } catch (error) {
      console.error('Error fetching courses:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMaterialsForCourse = async (courseId) => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error.message);
    }
  };

  const handleAddMaterial = () => {
    setEditingMaterial(null);
    setShowModal(true);
  };

  const handleEditMaterial = (material) => {
    setEditingMaterial(material);
    setShowModal(true);
  };

  const handleDelete = async (materialId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus materi ini?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', materialId);
        
      if (error) throw error;
      
      loadMaterialsForCourse(selectedCourse);
    } catch (error) {
      console.error('Error deleting material:', error.message);
      alert('Error deleting material: ' + error.message);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingMaterial(null);
  };

  const handleMaterialSaved = () => {
    loadMaterialsForCourse(selectedCourse);
    setShowModal(false);
    setEditingMaterial(null);
  };

  // Get material type label
  const getMaterialTypeLabel = (material) => {
    const contentType = material.content_type || material.material_type;
    const sourceType = material.source_type || 'internal';
    
    const typeLabels = {
      document: 'Dokumen',
      image: 'Gambar',
      video: 'Video',
      link: 'Tautan',
      text: 'Teks',
    };
    
    const sourceLabels = {
      internal: ' (Upload)',
      youtube: ' (YouTube)',
      external: ' (Eksternal)',
    };
    
    return (typeLabels[contentType] || 'Materi') + (sourceLabels[sourceType] || '');
  };

  // Get material icon based on type
  const getMaterialIcon = (material) => {
    const contentType = material.content_type || material.material_type;
    const sourceType = material.source_type || 'internal';
    
    if (contentType === 'video') {
      if (sourceType === 'youtube') return 'smart_display';
      return 'videocam';
    }
    if (contentType === 'image') return 'image';
    if (contentType === 'document') return 'description';
    if (contentType === 'link') return 'link';
    return 'article';
  };

  if (loading) {
    return <div className="dashboard-container">Memuat materi...</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Manajemen Materi Kursus</h1>
      
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
            onClick={handleAddMaterial}
          >
            + Tambah Materi Baru
          </button>
        </div>
      )}

      <div className="dashboard-content">
        <section className="dashboard-section">
          <h2>Daftar Materi untuk "{courses.find(c => c.id === selectedCourse)?.title}"</h2>
          {materials.length > 0 ? (
            <div className="materials-list">
              {materials.map(material => (
                <div key={material.id} className="material-item card">
                  <div className="material-header">
                    <h3>{material.title}</h3>
                    <span className="material-type">
                      <span className="material-icons">{getMaterialIcon(material)}</span>
                      {getMaterialTypeLabel(material)}
                    </span>
                  </div>
                  
                  <div className="material-content">
                    {material.description && (
                      <p>{material.description.substring(0, 150)}{material.description.length > 150 ? '...' : ''}</p>
                    )}
                    {(material.file_url || material.resource_url) && (
                      <div className="material-resource">
                        <strong>Sumber:</strong> 
                        {material.source_type === 'youtube' ? (
                          <span className="source-badge youtube">YouTube</span>
                        ) : material.source_type === 'external' ? (
                          <span className="source-badge external">Eksternal</span>
                        ) : (
                          <span className="source-badge internal">Upload</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {(role === 'guru' || role === 'admin') && (
                    <div className="material-actions">
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => handleEditMaterial(material)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => handleDelete(material.id)}
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>Belum ada materi untuk kursus ini.</p>
          )}
        </section>
      </div>

      {/* Add/Edit Material Modal */}
      {selectedCourse && (
        <AddMaterialModal
          isOpen={showModal}
          onClose={handleModalClose}
          courseId={selectedCourse}
          material={editingMaterial}
          onSave={handleMaterialSaved}
        />
      )}

      <style>{`
        .source-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          margin-left: 8px;
        }

        .source-badge.youtube {
          background: #ff0000;
          color: white;
        }

        .source-badge.external {
          background: #3b82f6;
          color: white;
        }

        .source-badge.internal {
          background: #10b981;
          color: white;
        }

        .material-type {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .material-type .material-icons {
          font-size: 18px;
        }
      `}</style>
    </div>
  );
};

export default MaterialsModule;
