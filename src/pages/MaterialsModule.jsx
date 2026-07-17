import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import AddMaterialModal from '../components/AddMaterialModal';

// Enhanced Materials Module for Teachers
export const MaterialsModule = ({ courseId, onBack, courses }) => {
  const { user } = useAuth();
  const [selectedCourseId, setSelectedCourseId] = useState(courseId);
  const [materials, setMaterials] = useState([]);
  const [availableCourses, setAvailableCourses] = useState(courses || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  const fetchMaterials = useCallback(async () => {
    if (!selectedCourseId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('course_id', selectedCourseId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMaterials(data || []);
    } catch (err) {
      setError('Gagal memuat materi: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Get material type icon
  const getMaterialIcon = (material) => {
    const contentType = material.content_type || material.material_type;
    const sourceType = material.source_type || 'internal';
    
    if (contentType === 'video') {
      return sourceType === 'youtube' ? '🎬' : '🎥';
    }
    if (contentType === 'image') return '🖼️';
    if (contentType === 'document') return '📄';
    if (contentType === 'link') return '🔗';
    return '📝';
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
      
      fetchMaterials();
    } catch (err) {
      console.error('Error deleting material:', err.message);
      alert('Error deleting material: ' + err.message);
    }
  };

  return (
    <div className="dashboard-container" style={{ marginTop: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>📚 Manajemen Materi</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>
            Kelola materi pembelajaran untuk kursus Anda
          </p>
        </div>
        {onBack && (
          <button onClick={onBack} className="btn btn-secondary">
            ← Kembali
          </button>
        )}
      </div>

      {/* Course Selection */}
      {availableCourses.length > 0 && (
        <div className="filter-controls" style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="course-select" style={{ fontWeight: 500, marginRight: '0.5rem' }}>
            Pilih Kursus:
          </label>
          <select
            id="course-select"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
          >
            {availableCourses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Add Button */}
      {selectedCourseId && (
        <div style={{ marginBottom: '1.5rem' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleAddMaterial}
          >
            + Tambah Materi Baru
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '0.5rem', color: '#dc2626', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Materials List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Memuat materi...
        </div>
      ) : materials.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', background: '#f9fafb', borderRadius: '0.75rem' }}>
          <span style={{ fontSize: '3rem' }}>📚</span>
          <h3>Belum Ada Materi</h3>
          <p style={{ color: '#6b7280' }}>Mulai tambahkan materi untuk kursus ini.</p>
          {selectedCourseId && (
            <button className="btn btn-primary" onClick={handleAddMaterial} style={{ marginTop: '1rem' }}>
              + Tambah Materi Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="materials-grid">
          {materials.map(material => (
            <div key={material.id} className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>
                    {getMaterialIcon(material)}
                  </span>
                  <h3 style={{ margin: '0.5rem 0', fontSize: '1.1rem' }}>{material.title}</h3>
                </div>
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '0.25rem 0.5rem', 
                  background: '#e5e7eb', 
                  borderRadius: '0.25rem',
                  whiteSpace: 'nowrap'
                }}>
                  {getMaterialTypeLabel(material)}
                </span>
              </div>
              
              {material.description && (
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.5rem 0' }}>
                  {material.description.substring(0, 100)}...
                </p>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                <small style={{ color: '#9ca3af' }}>
                  {new Date(material.created_at).toLocaleDateString('id-ID')}
                </small>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => handleEditMaterial(material)}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => handleDelete(material.id)}
                    style={{ color: '#dc2626' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Material Modal */}
      {selectedCourseId && (
        <AddMaterialModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingMaterial(null);
          }}
          courseId={selectedCourseId}
          material={editingMaterial}
          onSave={() => {
            fetchMaterials();
            setShowModal(false);
            setEditingMaterial(null);
          }}
        />
      )}

      <style>{`
        .materials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }
        
        @media (max-width: 640px) {
          .materials-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default MaterialsModule;
