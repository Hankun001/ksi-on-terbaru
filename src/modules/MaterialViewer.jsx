import React, { useState } from 'react';
import { Download, ExternalLink, ZoomIn, ZoomOut, Maximize2, FileText, AlertCircle, Image } from 'lucide-react';

const MaterialViewer = ({ material, materialType }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(100);

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

  const ZoomControls = () => (
    <div className="flex items-center gap-1 bg-surface/80 backdrop-blur-sm rounded-lg p-1 border border-outline-variant/30 shadow-sm">
      <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-container-high transition-colors text-on-surface-variant" title="Zoom Out">
        <ZoomOut className="w-4 h-4" />
      </button>
      <span className="text-label-sm font-medium text-on-surface min-w-[3rem] text-center select-none">{zoom}%</span>
      <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-container-high transition-colors text-on-surface-variant" title="Zoom In">
        <ZoomIn className="w-4 h-4" />
      </button>
      <div className="w-px h-5 bg-outline-variant/50 mx-1"></div>
      <button onClick={handleResetZoom} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-container-high transition-colors text-on-surface-variant" title="Reset Zoom">
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  );

  const ActionButtons = () => (
    <div className="flex items-center gap-2">
      <a 
        href={resourceUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-sm font-medium text-primary hover:bg-primary-container/40 transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Buka di Tab Baru
      </a>
      <button 
        onClick={handleDownload} 
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
      >
        <Download className="w-4 h-4" />
        Unduh
      </button>
    </div>
  );

  const ErrorState = ({ icon: Icon, title, message }) => (
    <div className="flex flex-col items-center justify-center py-3xl text-center bg-surface-container-low rounded-xl">
      <div className="w-16 h-16 rounded-full bg-error-container/30 flex items-center justify-center mb-md">
        <Icon className="w-8 h-8 text-error" />
      </div>
      <h3 className="text-title-md font-semibold text-on-surface mb-sm">{title}</h3>
      <p className="text-body-md text-on-surface-variant mb-lg">{message}</p>
      <button 
        onClick={handleDownload}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-label-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
      >
        <Download className="w-4 h-4" />
        Unduh File
      </button>
    </div>
  );

  const renderContent = () => {
    switch (type) {
      case 'pdf':
        return (
          <div className="space-y-md">
            <div className="flex flex-wrap items-center justify-between gap-md sticky top-0 z-10 bg-surface/90 backdrop-blur-sm py-md -mx-md px-md border-b border-outline-variant/20">
              <ZoomControls />
              <ActionButtons />
            </div>

            {error ? (
              <ErrorState icon={AlertCircle} title="Gagal Memuat PDF" message={error} />
            ) : (
              <div className="relative bg-surface-container-low rounded-xl overflow-hidden" style={{ minHeight: '500px' }}>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface/80 z-10">
                    <div className="flex flex-col items-center gap-md">
                      <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                      <p className="text-body-sm text-on-surface-variant">Memuat PDF...</p>
                    </div>
                  </div>
                )}
                <iframe
                  src={resourceUrl}
                  className="w-full border-0"
                  style={{ height: '600px', transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
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
          <div className="space-y-md">
            <div className="flex flex-wrap items-center justify-between gap-md sticky top-0 z-10 bg-surface/90 backdrop-blur-sm py-md -mx-md px-md border-b border-outline-variant/20">
              <ZoomControls />
              <ActionButtons />
            </div>

            {error ? (
              <ErrorState icon={Image} title="Gagal Memuat Gambar" message={error} />
            ) : (
              <div className="flex items-center justify-center bg-surface-container-low rounded-xl p-lg min-h-[300px]">
                {isLoading && (
                  <div className="flex flex-col items-center gap-md">
                    <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    <p className="text-body-sm text-on-surface-variant">Memuat gambar...</p>
                  </div>
                )}
                <img
                  src={resourceUrl}
                  alt={material?.title || 'Materi'}
                  className="max-w-full object-contain transition-transform duration-200"
                  style={{ transform: `scale(${zoom / 100})`, maxHeight: '70vh' }}
                  onError={handleLoadError}
                  onLoad={handleLoadSuccess}
                />
              </div>
            )}
          </div>
        );

      case 'video':
        return null;

      case 'text':
      default:
        return (
          <div className="bg-surface rounded-xl border border-outline-variant/30 shadow-sm">
            <div className="flex items-center gap-sm px-lg py-md border-b border-outline-variant/20">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="text-title-md font-semibold text-on-surface m-0">{material?.title || 'Materi Teks'}</h3>
            </div>
            <div className="p-lg">
              {content ? (
                <div 
                  className="text-body-md text-on-surface leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} 
                />
              ) : (
                <div className="flex flex-col items-center py-2xl text-on-surface-variant">
                  <FileText className="w-12 h-12 opacity-50 mb-md" />
                  <p className="text-body-md">Tidak ada konten teks tersedia.</p>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {renderContent()}
    </div>
  );
};

export default MaterialViewer;
