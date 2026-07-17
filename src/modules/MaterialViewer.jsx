import React, { useState } from 'react';

const MaterialViewer = ({ material, materialType }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(100);

  // Determine the actual material type from props or material data
  const type = materialType || material?.material_type || 'text';
  const content = material?.content || '';
  const resourceUrl = material?.resource_url || '';

  const handleDownload = () => {
    if (resourceUrl) {
      const link = document.createElement('a');
      link.href = resourceUrl;
      link.download = material?.title || 'download';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleLoadError = () => {
    setError('Gagal memuat konten. Silakan coba lagi atau unduh file.');
    setIsLoading(false);
  };

  const handleLoadSuccess = () => {
    setIsLoading(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const renderContent = () => {
    switch (type) {
      case 'pdf':
        return (
          <div className="materialviewer-pdf">
            {/* PDF Toolbar */}
            <div className="pdf-toolbar">
              <div className="zoom-controls">
                <button onClick={handleZoomOut} className="zoom-btn" title="Zoom Out">
                  <span className="material-icons">zoom_out</span>
                </button>
                <span className="zoom-level">{zoom}%</span>
                <button onClick={handleZoomIn} className="zoom-btn" title="Zoom In">
                  <span className="material-icons">zoom_in</span>
                </button>
                <button onClick={handleResetZoom} className="zoom-btn" title="Reset">
                  <span className="material-icons">fit_screen</span>
                </button>
              </div>
              <div className="pdf-actions-toolbar">
                <a 
                  href={resourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="toolbar-btn"
                >
                  <span className="material-icons">open_in_new</span>
                  <span>Buka di Tab Baru</span>
                </a>
                <button onClick={handleDownload} className="toolbar-btn">
                  <span className="material-icons">download</span>
                  <span>Unduh PDF</span>
                </button>
              </div>
            </div>

            {error ? (
              <div className="materialviewer-error">
                <span className="material-icons error-icon">error_outline</span>
                <h3>Gagal Memuat PDF</h3>
                <p>{error}</p>
                <button className="btn btn-primary" onClick={handleDownload}>
                  <span className="material-icons">download</span>
                  Unduh PDF
                </button>
              </div>
            ) : (
              <div className="pdf-container" style={{ transform: `scale(${zoom / 100})` }}>
                {isLoading && (
                  <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Memuat PDF...</p>
                  </div>
                )}
                <iframe
                  src={resourceUrl}
                  className="pdf-frame"
                  title={material?.title || 'PDF Document'}
                  onError={handleLoadError}
                  onLoad={handleLoadSuccess}
                />
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="materialviewer-image">
            {/* Image Toolbar */}
            <div className="image-toolbar">
              <div className="zoom-controls">
                <button onClick={handleZoomOut} className="zoom-btn" title="Zoom Out">
                  <span className="material-icons">zoom_out</span>
                </button>
                <span className="zoom-level">{zoom}%</span>
                <button onClick={handleZoomIn} className="zoom-btn" title="Zoom In">
                  <span className="material-icons">zoom_in</span>
                </button>
                <button onClick={handleResetZoom} className="zoom-btn" title="Reset">
                  <span className="material-icons">fit_screen</span>
                </button>
              </div>
              <div className="image-actions-toolbar">
                <a 
                  href={resourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="toolbar-btn"
                >
                  <span className="material-icons">open_in_new</span>
                  <span>Buka Gambar</span>
                </a>
                <button onClick={handleDownload} className="toolbar-btn">
                  <span className="material-icons">download</span>
                  <span>Unduh Gambar</span>
                </button>
              </div>
            </div>

            {error ? (
              <div className="materialviewer-error">
                <span className="material-icons error-icon">broken_image</span>
                <h3>Gagal Memuat Gambar</h3>
                <p>{error}</p>
                <button className="btn btn-primary" onClick={handleDownload}>
                  <span className="material-icons">download</span>
                  Unduh Gambar
                </button>
              </div>
            ) : (
              <div className="image-container">
                {isLoading && (
                  <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Memuat gambar...</p>
                  </div>
                )}
                <img
                  src={resourceUrl}
                  alt={material?.title || 'Materi'}
                  className="material-image"
                  style={{ transform: `scale(${zoom / 100})` }}
                  onError={handleLoadError}
                  onLoad={handleLoadSuccess}
                />
              </div>
            )}
          </div>
        );

      case 'video':
        // Video is handled by VideoPlayer component
        return null;

      case 'text':
      default:
        return (
          <div className="materialviewer-text">
            <div className="text-toolbar">
              <h3>{material?.title || 'Materi Teks'}</h3>
            </div>
            <div className="text-content">
              {content ? (
                <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} />
              ) : (
                <div className="no-content">
                  <span className="material-icons">description</span>
                  <p>Tidak ada konten teks tersedia.</p>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="materialviewer-wrapper">
      {renderContent()}
    </div>
  );
};

export default MaterialViewer;
