import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  FileText, Image, Video, Link, Upload, X, ChevronLeft,
  Youtube, Cloud, AlertCircle, CheckCircle, File
} from 'lucide-react';
import {
  normalizeYouTubeUrl, 
  isYouTubeUrl, 
  isValidUrl, 
  detectExternalProvider,
  formatFileSize,
  shouldSuggestExternal,
  getContentType,
  FILE_SIZE_LIMITS,
  FILE_TYPES
} from '../utils/contentUtils';

const AddMaterialModal = ({ 
  isOpen, 
  onClose, 
  courseId, 
  material = null,
  onSave 
}) => {
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    contentType: '',
    title: '',
    description: '',
    sourceType: '',
    file: null,
    externalUrl: '',
    resourceUrl: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSizeWarning, setShowSizeWarning] = useState(false);
  
  const fileInputRef = useRef(null);
  const fileUrlInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (material) {
        const contentType = getContentTypeFromMaterialType(material.material_type);
        setFormData({
          contentType: contentType,
          title: material.title || '',
          description: material.description || material.content || '',
          sourceType: material.source_type || 'internal',
          file: null,
          externalUrl: material.file_url || material.resource_url || '',
          resourceUrl: material.file_url || material.resource_url || '',
        });
        setStep(2);
      } else {
        setFormData({
          contentType: '',
          title: '',
          description: '',
          sourceType: '',
          file: null,
          externalUrl: '',
          resourceUrl: '',
        });
        setStep(1);
      }
      setError('');
      setUploadProgress(0);
      setShowSizeWarning(false);
    }
  }, [isOpen, material]);

  const getContentTypeFromMaterialType = (materialType) => {
    switch (materialType) {
      case 'pdf': return 'document';
      case 'video': return 'video';
      case 'image': return 'image';
      default: return 'document';
    }
  };

  const handleContentTypeSelect = (type) => {
    setFormData(prev => ({
      ...prev,
      contentType: type,
      sourceType: '',
      file: null,
      externalUrl: '',
      resourceUrl: '',
    }));
    setStep(2);
    setError('');
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setError('');
  };

  const handleSourceTypeSelect = (type) => {
    setFormData(prev => ({
      ...prev,
      sourceType: type,
      file: null,
      externalUrl: '',
      resourceUrl: '',
    }));
    setError('');
    
    if (type === 'internal') {
      setTimeout(() => fileInputRef.current?.click(), 100);
    } else if (type === 'external') {
      setTimeout(() => fileUrlInputRef.current?.focus(), 100);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const contentType = getContentType(file);
    if (!contentType) {
      setError('Tipe file tidak didukung. Silakan pilih PDF, DOC, gambar, atau video.');
      return;
    }

    if (contentType !== formData.contentType) {
      setError(`Tipe file tidak cocok. Anda memilih "${getContentTypeLabel(formData.contentType)}" tetapi memilih file "${getFileLabel(file.type)}".`);
      return;
    }

    const maxSize = formData.contentType === FILE_TYPES.VIDEO 
      ? FILE_SIZE_LIMITS.MAX_VIDEO_UPLOAD 
      : FILE_SIZE_LIMITS.MAX_UPLOAD;
    
    if (file.size > maxSize) {
      setError(`File terlalu besar. Maksimal ukuran upload adalah ${formatFileSize(maxSize)}.`);
      return;
    }

    if (shouldSuggestExternal(file.size, formData.contentType)) {
      setShowSizeWarning(true);
    }

    setFormData(prev => ({
      ...prev,
      file,
      externalUrl: '',
      resourceUrl: file.name,
    }));
    setError('');
  };

  const handleExternalUrlChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({
      ...prev,
      externalUrl: url,
      resourceUrl: url,
    }));
    setError('');

    if (formData.contentType === FILE_TYPES.VIDEO && isYouTubeUrl(url)) {
      setFormData(prev => ({
        ...prev,
        sourceType: 'youtube',
        externalUrl: url,
        resourceUrl: normalizeYouTubeUrl(url),
      }));
    }
  };

  const handleUrlBlur = () => {
    const url = formData.externalUrl;
    if (!url) return;

    if (!isValidUrl(url)) {
      setError('URL tidak valid. Silakan masukkan URL yang benar.');
      return;
    }

    const provider = detectExternalProvider(url);
    if (provider && !formData.sourceType) {
      setFormData(prev => ({
        ...prev,
        sourceType: 'external',
        resourceUrl: url,
      }));
    }
  };

  const getContentTypeLabel = (type) => {
    switch (type) {
      case 'document': return 'Dokumen';
      case 'image': return 'Gambar';
      case 'video': return 'Video';
      case 'link': return 'Tautan Eksternal';
      default: return type;
    }
  };

  const getFileLabel = (mimeType) => {
    const labels = {
      'application/pdf': 'PDF',
      'application/msword': 'Word',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
      'image/jpeg': 'Gambar JPEG',
      'image/png': 'Gambar PNG',
      'image/gif': 'Gambar GIF',
      'video/mp4': 'Video MP4',
      'video/webm': 'Video WebM',
    };
    return labels[mimeType] || 'File';
  };

  const uploadFile = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${courseId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('materials')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('materials')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Judul materi wajib diisi.');
      return;
    }

    if (!formData.sourceType) {
      setError('Silakan pilih sumber konten.');
      return;
    }

    if (formData.sourceType === 'internal' && !formData.file) {
      setError('Silakan pilih file untuk diupload.');
      return;
    }

    if ((formData.sourceType === 'external' || formData.sourceType === 'youtube') && !formData.resourceUrl) {
      setError('Silakan masukkan URL sumber konten.');
      return;
    }

    if (formData.sourceType === 'external' && !isValidUrl(formData.resourceUrl)) {
      setError('URL tidak valid.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      let fileUrl = formData.resourceUrl;
      let fileSize = formData.file?.size || 0;

      if (formData.sourceType === 'internal' && formData.file) {
        setUploadProgress(30);
        fileUrl = await uploadFile(formData.file);
        setUploadProgress(100);
      }

      const materialData = {
        title: formData.title,
        content: formData.description,
        material_type: getLegacyMaterialType(formData.contentType),
        source_type: formData.sourceType,
        file_url: fileUrl,
        resource_url: fileUrl,
        file_size: fileSize,
        course_id: courseId,
        is_published: true,
        order_index: 0,
      };

      let result;
      
      if (material) {
        const { data, error } = await supabase
          .from('materials')
          .update(materialData)
          .eq('id', material.id)
          .select();
        
        if (error) throw error;
        result = data[0];
      } else {
        const { data, error } = await supabase
          .from('materials')
          .insert([materialData])
          .select();
        
        if (error) throw error;
        result = data[0];
      }

      if (onSave) {
        onSave(result);
      }

      onClose();
      
    } catch (err) {
      console.error('Error saving material:', err);
      setError('Gagal menyimpan materi: ' + err.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const getLegacyMaterialType = (contentType) => {
    switch (contentType) {
      case 'document': return 'pdf';
      case 'image': return 'image';
      case 'video': return 'video';
      case 'link': return 'text';
      default: return 'text';
    }
  };

  if (!isOpen) return null;

  const ContentTypeIcon = ({ type }) => {
    switch (type) {
      case 'document': return <FileText className="w-10 h-10 text-primary" />;
      case 'image': return <Image className="w-10 h-10 text-primary" />;
      case 'video': return <Video className="w-10 h-10 text-primary" />;
      case 'link': return <Link className="w-10 h-10 text-primary" />;
      default: return <FileText className="w-10 h-10 text-primary" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-md" onClick={onClose}>
      <div className="bg-surface rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-xl pt-lg pb-md border-b border-outline-variant/30">
          <h2 className="text-title-lg font-semibold text-on-surface m-0">
            {material ? 'Edit Materi' : 'Tambah Materi Baru'}
          </h2>
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-center gap-md px-xl py-md border-b border-outline-variant/20">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-label-sm font-bold transition-colors ${
              step >= 1 ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
            }`}>1</div>
            <span className={`text-label-sm font-medium transition-colors ${step >= 1 ? 'text-on-surface' : 'text-on-surface-variant'}`}>
              Pilih Jenis Konten
            </span>
          </div>
          <div className={`w-8 h-0.5 rounded-full transition-colors ${step > 1 ? 'bg-primary' : 'bg-outline-variant'}`}></div>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-label-sm font-bold transition-colors ${
              step >= 2 ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
            }`}>2</div>
            <span className={`text-label-sm font-medium transition-colors ${step >= 2 ? 'text-on-surface' : 'text-on-surface-variant'}`}>
              Tambah Konten
            </span>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-2 mx-xl mt-md px-md py-3 bg-error-container/50 rounded-xl text-body-sm text-on-error-container">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Content Type Selection */}
          {step === 1 && (
            <div className="p-xl">
              <h3 className="text-title-md font-semibold text-on-surface mb-sm">Pilih Jenis Konten</h3>
              <p className="text-body-sm text-on-surface-variant mb-lg">
                Pilih jenis konten yang ingin Anda tambahkan. Sistem akan menangani penyimpanan secara otomatis.
              </p>
              
              <div className="grid grid-cols-2 gap-md">
                <button 
                  type="button"
                  className="flex flex-col items-center gap-md p-xl border-2 border-outline-variant/60 rounded-xl hover:border-primary hover:bg-primary-container/20 transition-all cursor-pointer group"
                  onClick={() => handleContentTypeSelect('document')}
                >
                  <FileText className="w-10 h-10 text-on-surface-variant group-hover:text-primary transition-colors" />
                  <div className="text-center">
                    <div className="text-title-sm font-semibold text-on-surface">Dokumen</div>
                    <div className="text-label-xs text-on-surface-variant">PDF, Word, dll</div>
                  </div>
                </button>

                <button 
                  type="button"
                  className="flex flex-col items-center gap-md p-xl border-2 border-outline-variant/60 rounded-xl hover:border-primary hover:bg-primary-container/20 transition-all cursor-pointer group"
                  onClick={() => handleContentTypeSelect('image')}
                >
                  <Image className="w-10 h-10 text-on-surface-variant group-hover:text-primary transition-colors" />
                  <div className="text-center">
                    <div className="text-title-sm font-semibold text-on-surface">Gambar</div>
                    <div className="text-label-xs text-on-surface-variant">JPG, PNG, GIF</div>
                  </div>
                </button>

                <button 
                  type="button"
                  className="flex flex-col items-center gap-md p-xl border-2 border-outline-variant/60 rounded-xl hover:border-primary hover:bg-primary-container/20 transition-all cursor-pointer group"
                  onClick={() => handleContentTypeSelect('video')}
                >
                  <Video className="w-10 h-10 text-on-surface-variant group-hover:text-primary transition-colors" />
                  <div className="text-center">
                    <div className="text-title-sm font-semibold text-on-surface">Video</div>
                    <div className="text-label-xs text-on-surface-variant">YouTube atau File</div>
                  </div>
                </button>

                <button 
                  type="button"
                  className="flex flex-col items-center gap-md p-xl border-2 border-outline-variant/60 rounded-xl hover:border-primary hover:bg-primary-container/20 transition-all cursor-pointer group"
                  onClick={() => handleContentTypeSelect('link')}
                >
                  <Link className="w-10 h-10 text-on-surface-variant group-hover:text-primary transition-colors" />
                  <div className="text-center">
                    <div className="text-title-sm font-semibold text-on-surface">Tautan Eksternal</div>
                    <div className="text-label-xs text-on-surface-variant">Google Drive, Website</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Content Details */}
          {step === 2 && (
            <div className="p-xl space-y-lg">
              <button 
                type="button"
                className="inline-flex items-center gap-1 text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                onClick={handleBackToStep1}
              >
                <ChevronLeft className="w-4 h-4" />
                Kembali
              </button>

              <h3 className="text-title-md font-semibold text-on-surface">
                {formData.contentType === 'document' && 'Tambah Dokumen'}
                {formData.contentType === 'image' && 'Tambah Gambar'}
                {formData.contentType === 'video' && 'Tambah Video'}
                {formData.contentType === 'link' && 'Tambah Tautan'}
              </h3>

              {/* Source Selection */}
              {formData.contentType !== 'link' && (
                <div className="space-y-2">
                  <label className="block text-label-sm font-medium text-on-surface">Pilih Sumber:</label>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      type="button"
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-label-sm font-medium ${
                        formData.sourceType === 'internal' 
                          ? 'border-primary bg-primary-container/20 text-primary' 
                          : 'border-outline-variant/60 text-on-surface-variant hover:border-primary/50'
                      }`}
                      onClick={() => handleSourceTypeSelect('internal')}
                    >
                      <Upload className="w-4 h-4" />
                      Upload File
                    </button>
                    
                    {formData.contentType === 'video' && (
                      <button 
                        type="button"
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-label-sm font-medium ${
                          formData.sourceType === 'youtube' 
                            ? 'border-primary bg-primary-container/20 text-primary' 
                            : 'border-outline-variant/60 text-on-surface-variant hover:border-primary/50'
                        }`}
                        onClick={() => handleSourceTypeSelect('youtube')}
                      >
                        <Youtube className="w-4 h-4" />
                        YouTube
                      </button>
                    )}

                    <button 
                      type="button"
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-label-sm font-medium ${
                        formData.sourceType === 'external' 
                          ? 'border-primary bg-primary-container/20 text-primary' 
                          : 'border-outline-variant/60 text-on-surface-variant hover:border-primary/50'
                      }`}
                      onClick={() => handleSourceTypeSelect('external')}
                    >
                      <Link className="w-4 h-4" />
                      Tautan Eksternal
                    </button>
                  </div>
                </div>
              )}

              {/* File Upload Zone */}
              {formData.sourceType === 'internal' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="material-file"
                    accept={
                      formData.contentType === 'document' 
                        ? '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt' 
                        : formData.contentType === 'image'
                        ? 'image/*'
                        : 'video/*'
                    }
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  
                  {!formData.file ? (
                    <div 
                      className="flex flex-col items-center justify-center py-3xl border-2 border-dashed border-outline-variant/60 rounded-xl cursor-pointer hover:border-primary hover:bg-primary-container/10 transition-all text-center"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Cloud className="w-12 h-12 text-outline mb-md" />
                      <p className="text-title-sm font-medium text-on-surface mb-sm">Klik untuk memilih file</p>
                      <span className="text-label-xs text-on-surface-variant">
                        {formData.contentType === 'document' && 'PDF, Word, Excel, PowerPoint (max 50MB)'}
                        {formData.contentType === 'image' && 'JPG, PNG, GIF (max 50MB)'}
                        {formData.contentType === 'video' && 'MP4, WebM (max 100MB)'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-md p-md bg-surface-container-low rounded-xl border border-outline-variant/30">
                      <File className="w-8 h-8 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-body-sm font-medium text-on-surface truncate">{formData.file.name}</div>
                        <div className="text-label-xs text-on-surface-variant">{formatFileSize(formData.file.size)}</div>
                      </div>
                      <button 
                        type="button"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-error shrink-0"
                        onClick={() => setFormData(prev => ({ ...prev, file: null, resourceUrl: '' }))}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {showSizeWarning && (
                    <div className="flex items-start gap-2 mt-md px-md py-3 bg-warning-container/40 rounded-xl text-body-xs text-on-warning-container">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>File cukup besar. Untuk performa lebih baik, pertimbangkan untuk menggunakan tautan eksternal (Google Drive, Dropbox, dll).</span>
                    </div>
                  )}
                </div>
              )}

              {/* YouTube URL */}
              {formData.sourceType === 'youtube' && (
                <div className="space-y-1.5">
                  <label htmlFor="youtube-url" className="block text-label-sm font-medium text-on-surface">Link YouTube</label>
                  <input
                    ref={fileUrlInputRef}
                    type="url"
                    id="youtube-url"
                    placeholder="Contoh: https://www.youtube.com/watch?v=..."
                    value={formData.externalUrl}
                    onChange={handleExternalUrlChange}
                    onBlur={handleUrlBlur}
                    className="w-full px-3 py-2.5 rounded-xl border border-outline bg-surface text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <span className="text-label-xs text-on-surface-variant">
                    Tempel link video YouTube (watch, short, atau embed)
                  </span>
                </div>
              )}

              {/* External URL */}
              {(formData.sourceType === 'external' || formData.contentType === 'link') && (
                <div className="space-y-1.5">
                  <label htmlFor="external-url" className="block text-label-sm font-medium text-on-surface">
                    {formData.contentType === 'link' ? 'URL Tautan' : 'Link External'}
                  </label>
                  <input
                    ref={fileUrlInputRef}
                    type="url"
                    id="external-url"
                    placeholder="Contoh: https://drive.google.com/..., https://dropbox.com/..."
                    value={formData.externalUrl}
                    onChange={handleExternalUrlChange}
                    onBlur={handleUrlBlur}
                    className="w-full px-3 py-2.5 rounded-xl border border-outline bg-surface text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <span className="text-label-xs text-on-surface-variant">
                    Google Drive, Dropbox, OneDrive, atau situs lain
                  </span>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <label htmlFor="title" className="block text-label-sm font-medium text-on-surface">Judul Materi *</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Masukkan judul materi"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-outline bg-surface text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label htmlFor="description" className="block text-label-sm font-medium text-on-surface">Deskripsi</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Masukkan deskripsi materi (opsional)"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-outline bg-surface text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                />
              </div>

              {/* Upload Progress */}
              {loading && uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-1.5">
                  <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-label-xs text-on-surface-variant">Mengupload... {uploadProgress}%</span>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-md px-xl py-md border-t border-outline-variant/20">
            <button 
              type="button" 
              className="px-4 py-2 rounded-xl text-label-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-label-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || step !== 2}
            >
              {loading ? 'Menyimpan...' : material ? 'Simpan Perubahan' : 'Tambah Materi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMaterialModal;
