import { useCallback, useRef, useEffect } from 'react';
import { saveAnswer } from '../services/examService';

export const useAutoSave = (attemptId, questionId, debounceMs = 1500) => {
  const timeoutRef = useRef(null);
  const savingRef = useRef(false);
  const lastSavedRef = useRef(null);
  const pendingRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Save pending if any
      if (pendingRef.current) {
        saveAnswer(
          pendingRef.current.attemptId,
          pendingRef.current.questionId,
          pendingRef.current.data
        ).catch(console.warn);
      }
    };
  }, []);

  const save = useCallback(async (answerData) => {
    if (!attemptId || !questionId) return;
    
    savingRef.current = true;
    try {
      await saveAnswer(attemptId, questionId, answerData);
      lastSavedRef.current = Date.now();
    } catch (err) {
      console.warn('Autosave failed, will retry:', err.message);
      // Queue for retry
      pendingRef.current = { attemptId, questionId, data: answerData };
    } finally {
      savingRef.current = false;
    }
  }, [attemptId, questionId]);

  const triggerSave = useCallback((answerData) => {
    if (!attemptId || !questionId) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Store pending
    pendingRef.current = { attemptId, questionId, data: answerData };

    // Debounce save
    timeoutRef.current = setTimeout(async () => {
      await save(answerData);
      pendingRef.current = null;
    }, debounceMs);
  }, [attemptId, questionId, debounceMs, save]);

  const saveImmediately = useCallback(async (answerData) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!attemptId || !questionId) return;
    await save(answerData);
    pendingRef.current = null;
  }, [attemptId, questionId, save]);

  return {
    triggerSave,
    saveImmediately,
    isSaving: savingRef.current,
    lastSaved: lastSavedRef.current
  };
};