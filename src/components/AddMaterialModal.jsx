import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  normalizeYouTubeUrl, 
  isYouTubeUrl, 
  isValidUrl, 
  detectExternalProvider,
  formatFileSize,
  shouldSuggestExternal,
  isWithinUploadLimit,
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container add-material-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{material ? 'Edit Materi' : 'Tambah Materi Baru'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="modal-steps">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Pilih Jenis Konten</span>
          </div>
          <div className="step-connector"></div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Tambah Konten</span>
          </div>
        </div>

        {error && (
          <div className="modal-error">
            <span className="material-icons">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="modal-body step-1">
              <h3>Pilih Jenis Konten</h3>
              <p className="step-description">
                Pilih jenis konten yang ingin Anda tambahkan. Sistem akan menangani penyimpanan secara otomatis.
              </p>
              
              <div className="content-type-grid">
                <button 
                  type="button"
                  className="content-type-card"
                  onClick={() => handleContentTypeSelect('document')}
                >
                  <span className="material-icons">description</span>
                  <span className="type-label">Dokumen</span>
                  <span className="type-hint">PDF, Word, dll</span>
                </button>

                <button 
                  type="button"
                  className="content-type-card"
                  onClick={() => handleContentTypeSelect('image')}
                >
                  <span className="material-icons">image</span>
                  <span className="type-label">Gambar</span>
                  <span className="type-hint">JPG, PNG, GIF</span>
                </button>

                <button 
                  type="button"
                  className="content-type-card"
                  onClick={() => handleContentTypeSelect('video')}
                >
                  <span className="material-icons">videocam</span>
                  <span className="type-label">Video</span>
                  <span className="type-hint">YouTube atau File</span>
                </button>

                <button 
                  type="button"
                  className="content-type-card"
                  onClick={() => handleContentTypeSelect('link')}
                >
                  <span className="material-icons">link</span>
                  <span className="type-label">Tautan Eksternal</span>
                  <span className="type-hint">Google Drive, Website</span>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="modal-body step-2">
              <button 
                type="button"
                className="back-step-btn"
                onClick={handleBackToStep1}
              >
                <span className="material-icons">arrow_back</span>
                Kembali
              </button>

              <h3>
                {formData.contentType === 'document' && 'Tambah Dokumen'}
                {formData.contentType === 'image' && 'Tambah Gambar'}
                {formData.contentType === 'video' && 'Tambah Video'}
                {formData.contentType === 'link' && 'Tambah Tautan'}
              </h3>

              {formData.contentType !== 'link' && (
                <div className="source-selection">
                  <label className="source-label">Pilih Sumber:</label>
                  <div className="source-options">
                    <button 
                      type="button"
                      className={`source-option ${formData.sourceType === 'internal' ? 'active' : ''}`}
                      onClick={() => handleSourceTypeSelect('internal')}
                    >
                      <span className="material-icons">cloud_upload</span>
                      <span>Upload File</span>
                    </button>
                    
                    {formData.contentType === 'video' && (
                      <button 
                        type="button"
                        className={`source-option ${formData.sourceType === 'youtube' ? 'active' : ''}`}
                        onClick={() => handleSourceTypeSelect('youtube')}
                      >
                        <span className="material-icons">play_circle</span>
                        <span>YouTube</span>
                      </button>
                    )}

                    <button 
                      type="button"
                      className={`source-option ${formData.sourceType === 'external' ? 'active' : ''}`}
                      onClick={() => handleSourceTypeSelect('external')}
                    >
                      <span className="material-icons">link</span>
                      <span>Tautan Eksternal</span>
                    </button>
                  </div>
                </div>
              )}

              {formData.sourceType === 'internal' && (
                <div className="file-upload-section">
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
                      className="file-drop-zone"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span className="material-icons">cloud_upload</span>
                      <p>Klik untuk memilih file</p>
                      <span className="file-hint">
                        {formData.contentType === 'document' && 'PDF, Word, Excel, PowerPoint (max 50MB)'}
                        {formData.contentType === 'image' && 'JPG, PNG, GIF (max 50MB)'}
                        {formData.contentType === 'video' && 'MP4, WebM (max 100MB)'}
                      </span>
                    </div>
                  ) : (
                    <div className="file-selected">
                      <span className="material-icons">insert_drive_file</span>
                      <div className="file-info">
                        <span className="file-name">{formData.file.name}</span>
                        <span className="file-size">{formatFileSize(formData.file.size)}</span>
                      </div>
                      <button 
                        type="button"
                        className="remove-file-btn"
                        onClick={() => setFormData(prev => ({ ...prev, file: null, resourceUrl: '' }))}
                      >
                        <span className="material-icons">close</span>
                      </button>
                    </div>
                  )}

                  {showSizeWarning && (
                    <div className="size-warning">
                      <span className="material-icons">info</span>
                      <span>File cukup besar. Untuk performa lebih baik, pertimbangkan untuk menggunakan tautan eksternal (Google Drive, Dropbox, dll).</span>
                    </div>
                  )}
                </div>
              )}

              {formData.sourceType === 'youtube' && (
                <div className="external-url-section">
                  <label htmlFor="youtube-url">Link YouTube</label>
                  <input
                    ref={fileUrlInputRef}
                    type="url"
                    id="youtube-url"
                    placeholder="Contoh: https://www.youtube.com/watch?v=..."
                    value={formData.externalUrl}
                    onChange={handleExternalUrlChange}
                    onBlur={handleUrlBlur}
                  />
                  <span className="input-hint">
                    Tempel link video YouTube (watch, short, atau embed)
                  </span>
                </div>
              )}

              {(formData.sourceType === 'external' || formData.contentType === 'link') && (
                <div className="external-url-section">
                  <label htmlFor="external-url">
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
                  />
                  <span className="input-hint">
                    Google Drive, Dropbox, OneDrive, atau situs lain
                  </span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="title">Judul Materi *</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Masukkan judul materi"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Deskripsi</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Masukkan deskripsi materi (opsional)"
                  rows={3}
                />
              </div>

              {loading && uploadProgress > 0 && uploadProgress < 100 && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <span>Mengupload... {uploadProgress}%</span>
                </div>
              )}
            </div>
          )}

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || step !== 2}
            >
              {loading ? 'Menyimpan...' : material ? 'Simpan Perubahan' : 'Tambah Materi'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .add-material-modal {
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .modal-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #6b7280;
          border-radius: 4px;
        }

        .modal-close-btn:hover {
          background: #f3f4f6;
          color: #1f2937;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
        }

        .modal-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px 24px;
          border-bottom: 1px solid #eee;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #999;
        }

        .step.active {
          color: #4f46e5;
        }

        .step.completed {
          color: #10b981;
        }

        .step-number {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .step.active .step-number {
          background: #4f46e5;
          color: white;
        }

        .step.completed .step-number {
          background: #10b981;
          color: white;
        }

        .step-label {
          font-size: 14px;
          font-weight: 500;
        }

        .step-connector {
          width: 40px;
          height: 2px;
          background: #e5e7eb;
          margin: 0 12px;
        }

        .modal-body {
          padding: 24px;
        }

        .step-description {
          color: #6b7280;
          margin-bottom: 20px;
          text-align: center;
        }

        .content-type-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .content-type-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .content-type-card:hover {
          border-color: #4f46e5;
          background: #f5f3ff;
        }

        .content-type-card .material-icons {
          font-size: 40px;
          color: #4f46e5;
          margin-bottom: 12px;
        }

        .type-label {
          font-weight: 600;
          font-size: 16px;
          color: #1f2937;
        }

        .type-hint {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }

        .back-step-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 0;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .back-step-btn:hover {
          color: #4f46e5;
        }

        .source-selection {
          margin-bottom: 20px;
        }

        .source-label {
          display: block;
          font-weight: 500;
          margin-bottom: 8px;
          color: #374151;
        }

        .source-options {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .source-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .source-option:hover {
          border-color: #4f46e5;
        }

        .source-option.active {
          border-color: #4f46e5;
          background: #f5f3ff;
          color: #4f46e5;
        }

        .source-option .material-icons {
          font-size: 20px;
        }

        .file-drop-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px;
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .file-drop-zone:hover {
          border-color: #4f46e5;
          background: #f9fafb;
        }

        .file-drop-zone .material-icons {
          font-size: 48px;
          color: #9ca3af;
          margin-bottom: 12px;
        }

        .file-drop-zone p {
          color: #374151;
          font-weight: 500;
          margin: 0;
        }

        .file-hint {
          font-size: 12px;
          color: #6b7280;
          margin-top: 8px;
        }

        .file-selected {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f3f4f6;
          border-radius: 8px;
        }

        .file-selected .material-icons {
          font-size: 32px;
          color: #4f46e5;
        }

        .file-info {
          flex: 1;
        }

        .file-name {
          display: block;
          font-weight: 500;
          color: #1f2937;
        }

        .file-size {
          font-size: 12px;
          color: #6b7280;
        }

        .remove-file-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #6b7280;
        }

        .remove-file-btn:hover {
          color: #ef4444;
        }

        .size-warning {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #fef3c7;
          border-radius: 8px;
          margin-top: 12px;
          font-size: 13px;
          color: #92400e;
        }

        .size-warning .material-icons {
          font-size: 20px;
        }

        .external-url-section {
          margin-bottom: 20px;
        }

        .external-url-section label {
          display: block;
          font-weight: 500;
          margin-bottom: 8px;
          color: #374151;
        }

        .external-url-section input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
        }

        .external-url-section input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .input-hint {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-top: 6px;
        }

        .upload-progress {
          margin-top: 16px;
        }

        .progress-bar {
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #4f46e5;
          transition: width 0.3s;
        }

        .upload-progress span {
          font-size: 12px;
          color: #6b7280;
        }

        .modal-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #fee2e2;
          color: #dc2626;
          margin: 16px 24px;
          border-radius: 8px;
          font-size: 14px;
        }

        .modal-error .material-icons {
          font-size: 20px;
        }

        @media (max-width: 640px) {
          .content-type-grid {
            grid-template-columns: 1fr;
          }

          .source-options {
            flex-direction: column;
          }

          .step-label {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default AddMaterialModal;
