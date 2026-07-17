import { useState, useEffect, useCallback, useRef } from 'react';

export const useExamTimer = (startedAt, durationMinutes, isActive) => {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef(null);

  const calculateRemaining = useCallback(() => {
    if (!startedAt || !durationMinutes) return 0;
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - start) / 1000);
    const totalDuration = durationMinutes * 60;
    const remaining = Math.max(0, totalDuration - elapsed);
    return remaining;
  }, [startedAt, durationMinutes]);

  useEffect(() => {
    if (!isActive || !startedAt) {
      setRemainingSeconds(0);
      return;
    }

    // Initial calculation
    const initial = calculateRemaining();
    setRemainingSeconds(initial);
    if (initial <= 0) {
      setIsExpired(true);
      return;
    }

    // Update every second
    intervalRef.current = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);
      
      if (remaining <= 0) {
        setIsExpired(true);
        clearInterval(intervalRef.current);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, startedAt, durationMinutes, calculateRemaining]);

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '--:--:--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (remainingSeconds <= 300) return '#ef4444'; // Red under 5 min
    if (remainingSeconds <= 600) return '#f59e0b'; // Amber under 10 min
    return '#10b981'; // Green
  };

  return {
    remainingSeconds,
    isExpired,
    formatTime,
    getTimerColor,
    formattedTime: formatTime(remainingSeconds),
    progress: durationMinutes ? ((durationMinutes * 60 - remainingSeconds) / (durationMinutes * 60)) * 100 : 0
  };
};