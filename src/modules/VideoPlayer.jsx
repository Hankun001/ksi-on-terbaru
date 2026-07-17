import React, { useState, useRef, useEffect } from 'react';

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
    // Reset state when URL changes
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
      <div className="videoplayer-error">
        <div className="error-content">
          <span className="error-icon">🎬</span>
          <h3>Gagal Memuat Video</h3>
          <p>{error}</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            🔗 Buka Video di Tab Baru
          </a>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`videoplayer-container ${isFullscreen ? 'fullscreen' : ''}`}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {isLoading && (
        <div className="videoplayer-loading">
          <div className="loading-spinner"></div>
          <p>Memuat video...</p>
        </div>
      )}

      <video
        ref={videoRef}
        src={url}
        className="videoplayer-video"
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
        <button className="play-overlay" onClick={togglePlay}>
          <span className="play-icon">▶</span>
        </button>
      )}

      {/* Controls */}
      <div className={`videoplayer-controls ${showControls ? 'visible' : ''}`}>
        {/* Progress bar */}
        <div className="progress-container">
          <input
            type="range"
            className="progress-slider"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
          />
          <div 
            className="progress-buffered"
            style={{ width: '0%' }}
          />
          <div 
            className="progress-played"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        <div className="controls-row">
          <div className="controls-left">
            {/* Play/Pause */}
            <button className="control-btn" onClick={togglePlay}>
              {isPlaying ? '⏸' : '▶'}
            </button>

            {/* Skip buttons */}
            <button className="control-btn" onClick={() => skip(-10)}>
              ⏪ 10s
            </button>
            <button className="control-btn" onClick={() => skip(10)}>
              10s ⏩
            </button>

            {/* Volume */}
            <div className="volume-control">
              <button className="control-btn" onClick={toggleMute}>
                {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
              </button>
              <input
                type="range"
                className="volume-slider"
                min={0}
                max={1}
                step={0.1}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
              />
            </div>

            {/* Time */}
            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="controls-right">
            {/* Title */}
            {title && <span className="video-title">{title}</span>}

            {/* Fullscreen */}
            <button className="control-btn" onClick={toggleFullscreen}>
              {isFullscreen ? '⛶' : '⛶'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
