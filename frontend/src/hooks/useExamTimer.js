import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useExamTimer - Manages countdown timer with localStorage persistence
 * Stores start_time and current_time in localStorage to recover from page refreshes
 * 
 * @param {number} initialTime - Total exam time in seconds
 * @param {string} sessionId - Unique session identifier
 * @param {function} onTimeUp - Callback when timer reaches 0
 * @returns {object} Timer state and control methods
 */
export const useExamTimer = (initialTime, sessionId, onTimeUp) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(true);
  const [showWarning5min, setShowWarning5min] = useState(false);
  const [showWarning1min, setShowWarning1min] = useState(false);
  const [showWarning30sec, setShowWarning30sec] = useState(false);
  
  const intervalRef = useRef(null);
  const warningsRef = useRef({ warned5min: false, warned1min: false, warned30sec: false });
  
  const storageKey = `exam_timer_${sessionId}`;

  // Initialize timer from localStorage or set new start time
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const { startTime, pausedTime, isPaused } = JSON.parse(stored);
        
        if (isPaused && pausedTime !== null) {
          // Restore paused state
          setTimeRemaining(pausedTime);
          setIsRunning(false);
        } else {
          // Recover from page refresh - calculate elapsed time
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const remaining = Math.max(0, initialTime - elapsed);
          setTimeRemaining(remaining);
          setIsRunning(true);
          
          // Update localStorage with current time
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              startTime,
              pausedTime: null,
              isPaused: false,
            })
          );
        }
      } catch (error) {
        console.error('Error recovering timer from localStorage:', error);
        // Fallback: start fresh
        const newStartTime = Date.now();
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            startTime: newStartTime,
            pausedTime: null,
            isPaused: false,
          })
        );
      }
    } else {
      // First time - set start time
      const startTime = Date.now();
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          startTime,
          pausedTime: null,
          isPaused: false,
        })
      );
    }
  }, [sessionId, initialTime, storageKey]);

  // Main timer tick effect (every 100ms for smooth display)
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;

      try {
        const { startTime } = JSON.parse(stored);
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, initialTime - elapsed);

        setTimeRemaining(remaining);

        // Update localStorage with current timestamp
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            startTime,
            pausedTime: null,
            isPaused: false,
          })
        );

        // Check for warnings
        if (remaining === 300 && !warningsRef.current.warned5min) {
          // 5 minutes
          setShowWarning5min(true);
          warningsRef.current.warned5min = true;
        }
        if (remaining === 60 && !warningsRef.current.warned1min) {
          // 1 minute
          setShowWarning1min(true);
          warningsRef.current.warned1min = true;
        }
        if (remaining === 30 && !warningsRef.current.warned30sec) {
          // 30 seconds
          setShowWarning30sec(true);
          warningsRef.current.warned30sec = true;
        }

        // Time's up
        if (remaining <= 0) {
          setIsRunning(false);
          if (onTimeUp) {
            onTimeUp();
          }
        }
      } catch (error) {
        console.error('Error updating timer:', error);
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, initialTime, storageKey, onTimeUp]);

  // Pause timer and save paused time
  const pause = useCallback(() => {
    setIsRunning(false);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            startTime: data.startTime,
            pausedTime: timeRemaining,
            isPaused: true,
          })
        );
      } catch (error) {
        console.error('Error pausing timer:', error);
      }
    }
  }, [timeRemaining, storageKey]);

  // Resume timer
  const resume = useCallback(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Adjust start time so remaining time equals paused time
        const newStartTime = Date.now() - (initialTime - timeRemaining) * 1000;
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            startTime: newStartTime,
            pausedTime: null,
            isPaused: false,
          })
        );
        setIsRunning(true);
      } catch (error) {
        console.error('Error resuming timer:', error);
      }
    }
  }, [initialTime, timeRemaining, storageKey]);

  // Reset timer to initial time
  const reset = useCallback(() => {
    const startTime = Date.now();
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        startTime,
        pausedTime: null,
        isPaused: false,
      })
    );
    setTimeRemaining(initialTime);
    setShowWarning5min(false);
    setShowWarning1min(false);
    setShowWarning30sec(false);
    warningsRef.current = { warned5min: false, warned1min: false, warned30sec: false };
    setIsRunning(true);
  }, [initialTime, storageKey]);

  // Clear localStorage on unmount (optional - comment out to persist across sessions)
  useEffect(() => {
    return () => {
      // Cleanup is optional - decide based on your use case
    };
  }, []);

  return {
    timeRemaining,
    isRunning,
    showWarning5min,
    showWarning1min,
    showWarning30sec,
    pause,
    resume,
    reset,
  };
};

export default useExamTimer;
