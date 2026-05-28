import { useState, useEffect, useCallback } from 'react';

/**
 * useExamState - Manages quiz state (current question, answers, marked questions)
 * Persists state to localStorage and recovers on mount
 * 
 * @param {string} sessionId - Unique session identifier
 * @param {number} totalQuestions - Total number of questions in exam
 * @returns {object} Quiz state and control methods
 */
export const useExamState = (sessionId, totalQuestions) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedQuestions, setMarkedQuestions] = useState({});

  const storageKey = `exam_state_${sessionId}`;

  // Initialize state from localStorage or create new state
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const state = JSON.parse(stored);
        
        // Validate session consistency
        if (state.totalQuestions !== totalQuestions) {
          console.warn('Question count mismatch, starting fresh');
          // Start fresh if question count doesn't match
          resetState();
          return;
        }

        // Restore state
        setCurrentQuestion(state.currentQuestion || 0);
        setAnswers(state.answers || {});
        setMarkedQuestions(state.marked || {});
      } catch (error) {
        console.error('Error recovering exam state from localStorage:', error);
        resetState();
      }
    } else {
      // Initialize new state
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          currentQuestion: 0,
          answers: {},
          marked: {},
          totalQuestions,
        })
      );
    }
  }, [sessionId, totalQuestions, storageKey]);

  // Helper function to save state to localStorage
  const saveStateToStorage = useCallback(
    (newCurrentQuestion, newAnswers, newMarked) => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            currentQuestion: newCurrentQuestion,
            answers: newAnswers,
            marked: newMarked,
            totalQuestions,
          })
        );
      } catch (error) {
        console.error('Error saving exam state to localStorage:', error);
      }
    },
    [storageKey, totalQuestions]
  );

  // Set answer for current question
  const setAnswer = useCallback(
    (qid, answer) => {
      setAnswers((prev) => {
        const updated = { ...prev, [qid]: answer };
        saveStateToStorage(currentQuestion, updated, markedQuestions);
        return updated;
      });
    },
    [currentQuestion, markedQuestions, saveStateToStorage]
  );

  // Mark question for review
  const markQuestion = useCallback(
    (qid) => {
      setMarkedQuestions((prev) => {
        const updated = { ...prev, [qid]: true };
        saveStateToStorage(currentQuestion, answers, updated);
        return updated;
      });
    },
    [currentQuestion, answers, saveStateToStorage]
  );

  // Unmark question
  const unmarkQuestion = useCallback(
    (qid) => {
      setMarkedQuestions((prev) => {
        const updated = { ...prev };
        delete updated[qid];
        saveStateToStorage(currentQuestion, answers, updated);
        return updated;
      });
    },
    [currentQuestion, answers, saveStateToStorage]
  );

  // Clear answer for a question
  const clearAnswer = useCallback(
    (qid) => {
      setAnswers((prev) => {
        const updated = { ...prev };
        delete updated[qid];
        saveStateToStorage(currentQuestion, updated, markedQuestions);
        return updated;
      });
    },
    [currentQuestion, markedQuestions, saveStateToStorage]
  );

  // Navigate to specific question
  const goToQuestion = useCallback(
    (qid) => {
      const validQid = Math.max(0, Math.min(qid, totalQuestions - 1));
      setCurrentQuestion(validQid);
      saveStateToStorage(validQid, answers, markedQuestions);
    },
    [totalQuestions, answers, markedQuestions, saveStateToStorage]
  );

  // Move to next question
  const nextQuestion = useCallback(() => {
    const nextQid = Math.min(currentQuestion + 1, totalQuestions - 1);
    setCurrentQuestion(nextQid);
    saveStateToStorage(nextQid, answers, markedQuestions);
  }, [currentQuestion, totalQuestions, answers, markedQuestions, saveStateToStorage]);

  // Move to previous question
  const previousQuestion = useCallback(() => {
    const prevQid = Math.max(currentQuestion - 1, 0);
    setCurrentQuestion(prevQid);
    saveStateToStorage(prevQid, answers, markedQuestions);
  }, [currentQuestion, answers, markedQuestions, saveStateToStorage]);

  // Get all answers
  const getAllAnswers = useCallback(() => {
    return { ...answers };
  }, [answers]);

  // Get state for saving/submission
  const getStateForSave = useCallback(() => {
    return {
      currentQuestion,
      answers: { ...answers },
      marked: { ...markedQuestions },
      totalQuestions,
      savedAt: new Date().toISOString(),
    };
  }, [currentQuestion, answers, markedQuestions, totalQuestions]);

  // Restore state from previous save
  const restoreState = useCallback(
    (savedState) => {
      if (!savedState) {
        console.warn('No saved state to restore');
        return;
      }

      try {
        if (savedState.totalQuestions !== totalQuestions) {
          console.warn('Saved state question count mismatch');
          return;
        }

        setCurrentQuestion(savedState.currentQuestion || 0);
        setAnswers(savedState.answers || {});
        setMarkedQuestions(savedState.marked || {});
        
        saveStateToStorage(
          savedState.currentQuestion || 0,
          savedState.answers || {},
          savedState.marked || {}
        );
      } catch (error) {
        console.error('Error restoring state:', error);
      }
    },
    [totalQuestions, saveStateToStorage]
  );

  // Check if question is answered
  const isQuestionAnswered = useCallback(
    (qid) => {
      return qid in answers;
    },
    [answers]
  );

  // Check if question is marked
  const isQuestionMarked = useCallback(
    (qid) => {
      return qid in markedQuestions;
    },
    [markedQuestions]
  );

  // Helper to reset state
  const resetState = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setMarkedQuestions({});
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        currentQuestion: 0,
        answers: {},
        marked: {},
        totalQuestions,
      })
    );
  };

  return {
    currentQuestion,
    answers,
    markedQuestions,
    currentAnswer: answers[currentQuestion],
    isCurrentMarked: markedQuestions[currentQuestion],
    setAnswer,
    markQuestion,
    unmarkQuestion,
    clearAnswer,
    goToQuestion,
    nextQuestion,
    previousQuestion,
    getAllAnswers,
    getStateForSave,
    restoreState,
    isQuestionAnswered,
    isQuestionMarked,
  };
};

export default useExamState;
