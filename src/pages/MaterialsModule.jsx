import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { BookOpen, FileText, Plus, Edit3, Trash2, Calendar, AlertCircle } from 'lucide-react';

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
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto space-y-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div>
          <h1 className="text-headline-md md:text-headline-lg font-display font-bold text-on-surface flex items-center gap-sm">📚 Manajemen Materi</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Kelola materi pembelajaran untuk kursus Anda</p>
        </div>
        {onBack && (
          <button onClick={onBack} className="inline-flex items-center gap-xs px-md py-sm bg-surface-container-high text-on-surface rounded-xl text-label-md font-medium hover:bg-surface-container-highest transition-colors">← Kembali</button>
        )}
      </div>

      {availableCourses.length > 0 && (
        <div className="flex items-center gap-md">
          <label htmlFor="course-select" className="text-label-md text-on-surface-variant font-medium">Pilih Kursus:</label>
          <select id="course-select" value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-md py-sm bg-surface-container-high border border-outline-variant/30 rounded-xl text-body-md text-on-surface appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
            {availableCourses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Add Button */}
      {selectedCourseId && (
        <div style={{ marginBottom: '1.5rem' }}>
          <button onClick={handleAddMaterial} className="inline-flex items-center gap-sm px-lg py-sm bg-primary text-on-primary rounded-xl text-label-md font-medium hover:bg-primary/90 transition-all shadow-sm">+ Tambah Materi Baru</button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-sm p-md rounded-xl bg-error-container border border-error/20">
          <AlertCircle size={18} className="text-error shrink-0" />
          <p className="text-body-sm text-on-surface-variant">{error}</p>
        </div>
      )}

      {/* Materials List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="animate-pulse flex flex-col items-center gap-md">
            <div className="w-12 h-12 rounded-full bg-primary/20"></div>
            <div className="h-4 w-48 bg-surface-container-high rounded-lg"></div>
          </div>
        </div>
      ) : materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-md">
            <BookOpen size={32} className="text-on-surface-variant/50" />
          </div>
          <p className="text-body-lg text-on-surface-variant">Belum Ada Materi</p>
          <p className="text-body-sm text-on-surface-variant/60 mt-1">Mulai tambahkan materi untuk kursus ini.</p>
          {selectedCourseId && (
            <button onClick={handleAddMaterial} className="mt-lg inline-flex items-center gap-sm px-lg py-sm bg-primary text-on-primary rounded-xl text-label-md font-medium hover:bg-primary/90 transition-all shadow-sm">+ Tambah Materi Pertama</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
          {materials.map(material => (
            <div key={material.id} className="bg-surface-container-low rounded-xl border border-outline-variant/20 p-lg hover:shadow-md hover:border-primary/30 transition-all duration-200">
              <div className="flex items-start justify-between mb-md">
                <div className="flex items-center gap-md">
                  <span className="text-2xl shrink-0">{getMaterialIcon(material)}</span>
                  <div>
                    <h3 className="text-title-md font-semibold text-on-surface">{material.title}</h3>
                    <span className="text-label-xs text-on-surface-variant bg-surface-container-high px-sm py-0.5 rounded-md">{getMaterialTypeLabel(material)}</span>
                  </div>
                </div>
              </div>
              {material.description && (
                <p className="text-body-sm text-on-surface-variant mb-lg line-clamp-2">{material.description.substring(0, 100)}...</p>
              )}
              <div className="flex items-center justify-between pt-sm border-t border-outline-variant/10">
                <span className="text-label-xs text-on-surface-variant/60"><Calendar size={12} className="inline mr-1"/>{new Date(material.created_at).toLocaleDateString('id-ID')}</span>
                <div className="flex items-center gap-sm">
                  <button onClick={() => handleEditMaterial(material)} className="inline-flex items-center justify-center px-md py-sm bg-surface-container-high text-on-surface rounded-lg text-label-md font-medium hover:bg-primary hover:text-on-primary transition-all">
                    <Edit3 size={16}/>
                  </button>
                  <button onClick={() => handleDelete(material.id)} className="inline-flex items-center justify-center px-md py-sm bg-surface-container-high text-on-surface rounded-lg text-label-md font-medium hover:bg-error-container hover:text-error transition-all">
                    <Trash2 size={16}/>
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


    </div>
  );
};

export default MaterialsModule;
