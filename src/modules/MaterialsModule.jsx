import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import AddMaterialModal from '../components/AddMaterialModal';
import { BookOpen, Plus, Edit3, Trash2, FileText, Image, Video, Link, ExternalLink, Youtube, Upload, ChevronDown, FolderOpen } from 'lucide-react';

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
    if (!window.confirm('Apakah Anda yakin ingin menghapus materi ini?')) return;
    try {
      const { error } = await supabase.from('materials').delete().eq('id', materialId);
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

  const getMaterialMeta = (material) => {
    const contentType = material.content_type || material.material_type;
    const sourceType = material.source_type || 'internal';

    const typeMap = {
      document: { icon: FileText, label: 'Dokumen', color: 'text-primary' },
      image: { icon: Image, label: 'Gambar', color: 'text-primary' },
      video: { icon: Video, label: 'Video', color: 'text-primary' },
      link: { icon: Link, label: 'Tautan', color: 'text-primary' },
      text: { icon: FileText, label: 'Teks', color: 'text-primary' },
    };

    const sourceMap = {
      internal: { icon: Upload, label: 'Upload' },
      youtube: { icon: Youtube, label: 'YouTube' },
      external: { icon: ExternalLink, label: 'Eksternal' },
    };

    const typeInfo = typeMap[contentType] || { icon: FileText, label: 'Materi', color: 'text-primary' };
    const sourceInfo = sourceMap[sourceType];
    const Icon = typeInfo.icon;

    return { ...typeInfo, Icon, sourceLabel: sourceInfo?.label || '' };
  };

  if (loading) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-pulse flex flex-col items-center gap-md">
            <div className="w-12 h-12 rounded-full bg-primary/20"></div>
            <div className="h-4 w-48 bg-surface-container-high rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const selectedCourseData = courses.find(c => c.id === selectedCourse);

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto space-y-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div>
          <h1 className="text-headline-md md:text-headline-lg font-display font-bold text-on-surface flex items-center gap-sm">
            <BookOpen size={28} className="text-primary" />
            Manajemen Materi Kursus
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1">Kelola materi pembelajaran untuk setiap kursus</p>
        </div>
      </div>

      {/* Course Selector & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-md">
        <div className="relative w-full sm:w-80">
          <BookOpen size={18} className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full pl-xl pr-lg py-sm bg-surface-container-high border border-outline-variant/30 rounded-xl text-body-md text-on-surface appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          >
            {courses.length === 0 && <option value="">Tidak ada kursus</option>}
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
        </div>

        {(role === 'guru' || role === 'admin') && (
          <button onClick={handleAddMaterial}
            className="inline-flex items-center gap-sm px-lg py-sm bg-primary text-on-primary rounded-xl text-label-md font-medium hover:bg-primary/90 transition-all shadow-sm">
            <Plus size={18} />
            Tambah Materi Baru
          </button>
        )}
      </div>

      {/* Material List */}
      <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="px-xl py-lg border-b border-outline-variant/20 flex items-center gap-sm">
          <FolderOpen size={20} className="text-primary" />
          <h2 className="text-title-md font-bold text-on-surface">
            Daftar Materi
            {selectedCourseData && <span className="text-on-surface-variant font-normal"> — {selectedCourseData.title}</span>}
          </h2>
          <span className="ml-auto bg-primary-container text-primary text-label-sm px-sm py-1 rounded-full">
            {materials.length} materi
          </span>
        </div>

        {materials.length > 0 ? (
          <div className="p-xl grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
            {materials.map(material => {
              const { Icon, label, sourceLabel } = getMaterialMeta(material);
              return (
                <div key={material.id} className="bg-surface-container-low rounded-xl border border-outline-variant/20 p-lg hover:shadow-md hover:border-primary/30 transition-all duration-200 group">
                  {/* Material Icon & Type */}
                  <div className="flex items-start justify-between mb-md">
                    <div className="flex items-center gap-md">
                      <div className="w-12 h-12 rounded-xl bg-primary-container/50 flex items-center justify-center shrink-0">
                        <Icon size={24} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-title-md font-semibold text-on-surface truncate">{material.title}</h3>
                        <span className="inline-flex items-center gap-1 text-label-xs text-on-surface-variant">
                          {label}
                          {sourceLabel && <><span className="mx-1">•</span>{sourceLabel}</>}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {material.description && (
                    <p className="text-body-sm text-on-surface-variant mb-lg line-clamp-2">
                      {material.description.substring(0, 150)}{material.description.length > 150 ? '...' : ''}
                    </p>
                  )}

                  {/* File URL indicator */}
                  {(material.file_url || material.resource_url) && (
                    <div className="flex items-center gap-1 text-label-xs text-on-surface-variant mb-lg bg-surface-container-high rounded-lg px-sm py-1">
                      <Link size={12} />
                      <span className="truncate">Sumber: {sourceLabel || 'Internal'}</span>
                    </div>
                  )}

                  {/* Actions */}
                  {(role === 'guru' || role === 'admin') && (
                    <div className="flex items-center gap-sm pt-sm border-t border-outline-variant/10">
                      <button onClick={() => handleEditMaterial(material)}
                        className="flex-1 inline-flex items-center justify-center gap-sm px-md py-sm bg-primary text-on-primary rounded-lg text-label-md font-medium hover:bg-primary/90 transition-colors">
                        <Edit3 size={16} />
                        Edit
                      </button>
                      <button onClick={() => handleDelete(material.id)}
                        className="inline-flex items-center justify-center px-md py-sm bg-surface-container-high text-on-surface rounded-lg text-label-md font-medium hover:bg-error-container hover:text-error transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-md">
              <BookOpen size={32} className="text-on-surface-variant/50" />
            </div>
            <p className="text-body-lg text-on-surface-variant">Belum ada materi untuk kursus ini.</p>
            <p className="text-body-sm text-on-surface-variant/60 mt-1">
              {(role === 'guru' || role === 'admin') ? 'Klik tombol "Tambah Materi Baru" untuk memulai.' : 'Tidak ada materi yang tersedia saat ini.'}
            </p>
          </div>
        )}
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
    </div>
  );
};

export default MaterialsModule;
