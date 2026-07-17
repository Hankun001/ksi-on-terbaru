import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

const VideoPlayer = ({ url, title }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError('');
    setIsLoading(true);
  }, [url]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setShowControls(true);
  };

  const handleError = (e) => {
    console.error('Video error:', e);
    setError('Gagal memuat video. Pastikan URL video valid.');
    setIsLoading(false);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (!isMuted && volume === 0) {
        setVolume(1);
        videoRef.current.volume = 1;
      }
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const skip = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(
        videoRef.current.currentTime + seconds,
        duration
      ));
    }
  };

  if (error) {
    return (
      <div className="bg-surface rounded-xl p-xl text-center border border-outline-variant/30 shadow-sm">
        <div className="flex flex-col items-center gap-md">
          <div className="w-16 h-16 rounded-full bg-error-container/30 flex items-center justify-center">
            <span className="text-3xl">🎬</span>
          </div>
          <h3 className="text-title-md font-semibold text-on-surface">Gagal Memuat Video</h3>
          <p className="text-body-md text-on-surface-variant">{error}</p>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-label-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            Buka Video di Tab Baru
          </a>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative bg-black rounded-xl overflow-hidden group ${isFullscreen ? 'fixed inset-0 z-[9999] rounded-none' : ''}`}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      style={{ aspectRatio: '16/9', maxHeight: isFullscreen ? '100vh' : undefined }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <div className="flex flex-col items-center gap-md text-white">
            <div className="w-10 h-10 rounded-full border-3 border-white border-t-transparent animate-spin"></div>
            <p className="text-body-sm">Memuat video...</p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        src={url}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
      />

      {/* Play button overlay */}
      {!isPlaying && !isLoading && (
        <button 
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity hover:bg-black/40 z-10"
          onClick={togglePlay}
        >
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 pb-3 px-4 transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Progress bar */}
        <div className="relative mb-3">
          <input
            type="range"
            className="w-full h-1.5 appearance-none bg-white/30 rounded-full cursor-pointer accent-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white" onClick={togglePlay}>
              {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5 ml-0.5" fill="currentColor" />}
            </button>

            {/* Skip buttons */}
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white" onClick={() => skip(-10)} title="Mundur 10 detik">
              <SkipBack className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white" onClick={() => skip(10)} title="Maju 10 detik">
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1 group/vol">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white" onClick={toggleMute}>
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-200">
                <input
                  type="range"
                  className="w-full h-1 appearance-none bg-white/30 rounded-full cursor-pointer accent-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  min={0}
                  max={1}
                  step={0.1}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                />
              </div>
            </div>

            {/* Time */}
            <span className="text-label-xs text-white/80 ml-1 select-none">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Title */}
            {title && (
              <span className="text-label-xs text-white/60 max-w-[200px] truncate hidden sm:block select-none">
                {title}
              </span>
            )}

            {/* Fullscreen */}
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
