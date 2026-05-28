import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../styles/Quiz.css';

function Quiz() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const initialized = useRef(false);

  // States
  const [questions, setQuestions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { question_id: 'A'|'B'|'C'|'D' }
  const [markedQuestions, setMarkedQuestions] = useState({}); // { question_id: true }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600s) default or total duration

  // New WhatsApp-style Quiz Start Confirmation State
  const [chapterInfo, setChapterInfo] = useState(null);
  const [showStartModal, setShowStartModal] = useState(true);

  // High-fidelity tracking states
  const [tracking, setTracking] = useState({});
  // Structure:
  // {
  //   [questionId]: {
  //     questionId: string,
  //     correctAnswer: string,
  //     selectedAnswer: string,
  //     markedForReview: boolean,
  //     questionShownTimestamp: number, // Epoch ms when last shown
  //     answerSubmittedTimestamp: number, // Epoch ms when answered
  //     responseDuration: number, // Total duration spent in ms
  //     questionVisitCount: number,
  //     answerChangedCount: number
  //   }
  // }

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const currentQId = currentQuestion?.question_id;
  const currentAnswer = answers[currentQId];
  const isCurrentMarked = !!markedQuestions[currentQId];
  const isLastQuestion = currentIndex === totalQuestions - 1;

  // Timer: only runs after sessionId is set (meaning quiz started)
  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          handleSubmitQuiz();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // Load question list and chapter info first without starting session
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    preLoadQuizDetails();
  }, [chapterId]);

  const preLoadQuizDetails = async () => {
    try {
      setLoading(true);
      // Fetch chapter details & questions
      const qRes = await api.getChapterQuestions(chapterId);
      setQuestions(qRes.data || []);
      
      // Attempt to retrieve chapter metadata
      const subjectId = chapterId.split('_')[0]; // Subject prefix helper
      if (subjectId) {
        try {
          const chaptersRes = await api.getChapters(subjectId);
          const currentCh = (chaptersRes.data || []).find(c => c.chapter_id === chapterId);
          if (currentCh) setChapterInfo(currentCh);
        } catch (_) {
          // Fallback if subject metadata call fails
        }
      }

      // Initialize default tracking dictionary
      const initialTracking = {};
      (qRes.data || []).forEach(q => {
        initialTracking[q.question_id] = {
          questionId: q.question_id,
          correctAnswer: q.correct_answer || '',
          selectedAnswer: '',
          markedForReview: false,
          questionShownTimestamp: 0,
          answerSubmittedTimestamp: 0,
          responseDuration: 0,
          questionVisitCount: 0,
          answerChangedCount: 0
        };
      });
      setTracking(initialTracking);

    } catch (err) {
      console.error('Error pre-loading quiz:', err);
      setError('Failed to load quiz details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // User confirmed: start the test session!
  const handleStartTest = async () => {
    try {
      setLoading(true);
      const sessRes = await api.startQuiz(chapterId);
      setSessionId(sessRes.data?.session_id);
      setShowStartModal(false);
      
      // Set duration: 10 minutes default
      setTimeLeft(600);

      // Start tracking the first question
      const firstQId = questions[0]?.question_id;
      if (firstQId) {
        setTracking(prev => ({
          ...prev,
          [firstQId]: {
            ...prev[firstQId],
            questionShownTimestamp: Date.now(),
            questionVisitCount: 1
          }
        }));
      }
    } catch (err) {
      console.error('Error starting quiz session:', err);
      setError('Could not start quiz session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper: track leave event for current question and update total duration spent
  const trackLeaveQuestion = useCallback((qId) => {
    if (!qId || !tracking[qId]) return;
    const now = Date.now();
    const entered = tracking[qId].questionShownTimestamp;
    const timeSpent = entered > 0 ? (now - entered) : 0;

    setTracking(prev => {
      const qTrack = prev[qId];
      if (!qTrack) return prev;
      return {
        ...prev,
        [qId]: {
          ...qTrack,
          responseDuration: qTrack.responseDuration + timeSpent,
          questionShownTimestamp: 0 // Reset
        }
      };
    });
  }, [tracking]);

  // Helper: track enter event for next/jumped question
  const trackEnterQuestion = useCallback((qId) => {
    if (!qId) return;
    setTracking(prev => {
      const qTrack = prev[qId];
      if (!qTrack) return prev;
      return {
        ...prev,
        [qId]: {
          ...qTrack,
          questionShownTimestamp: Date.now(),
          questionVisitCount: qTrack.questionVisitCount + 1
        }
      };
    });
  }, []);

  // Answer selection tracking
  const handleSelectOption = useCallback((letter) => {
    if (!currentQId) return;
    const isNewAnswer = answers[currentQId] !== letter;
    
    setAnswers(prev => ({ ...prev, [currentQId]: letter }));

    setTracking(prev => {
      const qTrack = prev[currentQId];
      if (!qTrack) return prev;
      return {
        ...prev,
        [currentQId]: {
          ...qTrack,
          selectedAnswer: letter,
          answerSubmittedTimestamp: Date.now(),
          answerChangedCount: qTrack.answerChangedCount + (isNewAnswer && qTrack.selectedAnswer !== '' ? 1 : 0)
        }
      };
    });
  }, [currentQId, answers]);

  // Mark for review tracking
  const handleMark = useCallback(() => {
    if (!currentQId) return;
    const nextMarkedState = !markedQuestions[currentQId];
    
    setMarkedQuestions(prev => {
      const next = { ...prev };
      if (next[currentQId]) delete next[currentQId];
      else next[currentQId] = true;
      return next;
    });

    setTracking(prev => {
      const qTrack = prev[currentQId];
      if (!qTrack) return prev;
      return {
        ...prev,
        [currentQId]: {
          ...qTrack,
          markedForReview: nextMarkedState
        }
      };
    });
  }, [currentQId, markedQuestions]);

  // Clear answer tracking
  const handleClear = useCallback(() => {
    if (!currentQId) return;
    setAnswers(prev => {
      const next = { ...prev };
      delete next[currentQId];
      return next;
    });

    setTracking(prev => {
      const qTrack = prev[currentQId];
      if (!qTrack) return prev;
      return {
        ...prev,
        [currentQId]: {
          ...qTrack,
          selectedAnswer: '',
          answerChangedCount: qTrack.answerChangedCount + 1
        }
      };
    });
  }, [currentQId]);

  // Navigation handlers wrapping tracking triggers
  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      trackLeaveQuestion(currentQId);
      const nextQId = questions[currentIndex + 1]?.question_id;
      setCurrentIndex(i => i + 1);
      trackEnterQuestion(nextQId);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      trackLeaveQuestion(currentQId);
      const prevQId = questions[currentIndex - 1]?.question_id;
      setCurrentIndex(i => i - 1);
      trackEnterQuestion(prevQId);
    }
  };

  const handleJump = (idx) => {
    if (idx === currentIndex) return;
    trackLeaveQuestion(currentQId);
    const targetQId = questions[idx]?.question_id;
    setCurrentIndex(idx);
    trackEnterQuestion(targetQId);
  };

  // Submit Quiz Action
  const handleSubmitQuiz = async () => {
    // Record final duration for current question
    if (currentQId) {
      const now = Date.now();
      const entered = tracking[currentQId]?.questionShownTimestamp;
      const finalTimeSpent = entered > 0 ? (now - entered) : 0;
      
      const finalTracking = {
        ...tracking,
        [currentQId]: {
          ...tracking[currentQId],
          responseDuration: (tracking[currentQId]?.responseDuration || 0) + finalTimeSpent,
          questionShownTimestamp: 0
        }
      };

      // Push all answers to backend API
      try {
        setLoading(true);
        for (const [qid, ansLetter] of Object.entries(answers)) {
          const duration = finalTracking[qid]?.responseDuration || 3000;
          await api.submitAnswer(sessionId, qid, ansLetter, duration);
        }

        // Complete the quiz
        await api.completeQuiz(sessionId);

        // Store entire tracking session data in localStorage for results screen to use
        localStorage.setItem(`quiz_session_${sessionId}_tracking`, JSON.stringify({
          tracking: finalTracking,
          timeLeft,
          totalDuration: 600,
          chapterName: chapterInfo?.name || chapterId
        }));

        navigate(`/results/${sessionId}`);
      } catch (err) {
        console.error('Quiz submission error:', err);
        alert('Could not submit quiz results correctly. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const getQuestionStatus = (idx) => {
    const q = questions[idx];
    if (!q) return 'unanswered';
    const qid = q.question_id;
    if (markedQuestions[qid]) return 'marked';
    if (answers[qid]) return 'answered';
    return 'unanswered';
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const markedCount = Object.keys(markedQuestions).length;

  // Keyboard shortcuts
  useEffect(() => {
    if (showStartModal || !sessionId) return;
    const handler = (e) => {
      if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
      switch(e.key) {
        case '1': handleSelectOption('A'); break;
        case '2': handleSelectOption('B'); break;
        case '3': handleSelectOption('C'); break;
        case '4': handleSelectOption('D'); break;
        case 'ArrowRight': case 'n': case 'N': handleNext(); break;
        case 'ArrowLeft': case 'p': case 'P': handlePrev(); break;
        case 'm': case 'M': handleMark(); break;
        case 'c': case 'C': handleClear(); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSelectOption, handleMark, handleClear, currentIndex, showStartModal, sessionId]);

  // Render Loader
  if (loading) return (
    <div className="quiz-loading">
      <div className="quiz-spinner"></div>
      <p>Loading quiz details…</p>
    </div>
  );

  // Render Error
  if (error) return (
    <div className="quiz-error-page">
      <div className="quiz-error-box">
        <span className="quiz-error-icon">⚠️</span>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="btn-back-quiz">Go Back</button>
      </div>
    </div>
  );

  // ─── STAGE 1: WHATSAPP-STYLE START QUIZ CONFIRMATION POPUP ───────────────────
  if (showStartModal) {
    return (
      <div className="wa-modal-overlay">
        <div className="wa-confirm-card">
          <div className="wa-confirm-header">
            <span className="wa-confirm-logo">📋</span>
            <div>
              <h3>Test Start Confirmation</h3>
              <p>WhatsApp-Style Quiz flow</p>
            </div>
          </div>

          <div className="wa-confirm-body">
            <div className="wa-confirm-meta-row">
              <span className="wa-meta-lbl">Exam Name:</span>
              <span className="wa-meta-val">SkillBytes Standard Board</span>
            </div>
            <div className="wa-confirm-meta-row">
              <span className="wa-meta-lbl">Subject/Chapter:</span>
              <span className="wa-meta-val">{chapterInfo?.name || chapterId}</span>
            </div>
            <div className="wa-confirm-meta-row">
              <span className="wa-meta-lbl">Total Questions:</span>
              <span className="wa-meta-val">{totalQuestions} MCQs</span>
            </div>
            <div className="wa-confirm-meta-row">
              <span className="wa-meta-lbl">Total Duration:</span>
              <span className="wa-meta-val">10 Minutes (600s)</span>
            </div>

            <div className="wa-confirm-instructions">
              <h4>📝 Instructions:</h4>
              <ul>
                <li>Every question has 4 options with exactly 1 correct answer.</li>
                <li>You can mark questions for review using the review button.</li>
                <li>Navigate freely between questions using the sidebar palette.</li>
                <li>Submit before time runs out. The timer starts only when you hit Start.</li>
              </ul>
            </div>

            <p className="wa-confirm-prompt">
              Are you sure you want to attend the test now?
            </p>
          </div>

          <div className="wa-confirm-actions">
            <button className="wa-btn-cancel" onClick={() => navigate(-1)}>Cancel</button>
            <button className="wa-btn-start" onClick={handleStartTest}>Start Test 🚀</button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="quiz-wrapper">
      {/* Top bar */}
      <div className="quiz-topbar">
        <div className="quiz-topbar-left">
          <span className="quiz-title">Quiz: {chapterInfo?.name || 'In Progress'}</span>
          <span className="quiz-counter">Q{currentIndex + 1} / {totalQuestions}</span>
        </div>
        <div className="quiz-topbar-center">
          <div className={`quiz-timer ${timeLeft <= 120 ? 'timer-warning' : ''} ${timeLeft <= 30 ? 'timer-danger' : ''}`}>
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>
        <div className="quiz-topbar-right">
          <span className="quiz-stat answered">✓ {answeredCount}</span>
          <span className="quiz-stat marked">🚩 {markedCount}</span>
        </div>
      </div>

      <div className="quiz-body">
        {/* Left sidebar — Question Palette */}
        <aside className="quiz-palette-sidebar">
          <p className="palette-title">Questions</p>
          <div className="palette-grid">
            {questions.map((q, idx) => {
              const status = getQuestionStatus(idx);
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.question_id}
                  onClick={() => handleJump(idx)}
                  className={`palette-btn palette-${status} ${isCurrent ? 'palette-current' : ''}`}
                  title={`Q${idx + 1} - ${status}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="palette-legend">
            <div className="legend-item"><span className="legend-dot dot-answered"></span> Answered</div>
            <div className="legend-item"><span className="legend-dot dot-unanswered"></span> Not answered</div>
            <div className="legend-item"><span className="legend-dot dot-marked"></span> Marked</div>
            <div className="legend-item"><span className="legend-dot dot-current"></span> Current</div>
          </div>
          <button
            className="btn-submit-quiz"
            onClick={() => setSubmitConfirm(true)}
          >
            Submit Quiz
          </button>
        </aside>

        {/* Main area */}
        <main className="quiz-main-area">
          {/* Question card */}
          <div className="question-card">
            <div className="question-header">
              <span className="question-number">Question {currentIndex + 1}</span>
              {isCurrentMarked && <span className="marked-badge">🚩 Marked</span>}
            </div>
            <p className="question-text">{currentQuestion.question_text}</p>

            <div className="options-grid">
              {(currentQuestion.options || []).map((option, idx) => {
                const letter = optionLetters[idx];
                const isSelected = currentAnswer === letter;
                return (
                  <button
                    key={idx}
                    className={`option-btn ${isSelected ? 'option-selected' : ''}`}
                    onClick={() => handleSelectOption(letter)}
                  >
                    <span className="option-letter">{letter}</span>
                    <span className="option-text">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="question-actions">
              <button className="btn-mark" onClick={handleMark}>
                {isCurrentMarked ? '🚩 Unmark' : '🚩 Mark for Review'}
              </button>
              {currentAnswer && (
                <button className="btn-clear" onClick={handleClear}>✕ Clear Answer</button>
              )}
              <div className="keyboard-hint">Shortcuts: 1-4 = select, N/P = next/prev, M = mark, C = clear</div>
            </div>
          </div>

          {/* Navigation */}
          <div className="quiz-nav-bar">
            <button
              className="btn-nav btn-prev"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              ← Previous
            </button>

            <div className="nav-progress">
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                />
              </div>
              <span>{answeredCount}/{totalQuestions} answered</span>
            </div>

            {isLastQuestion ? (
              <button
                className="btn-nav btn-submit-main"
                onClick={() => setSubmitConfirm(true)}
              >
                Submit Quiz ✓
              </button>
            ) : (
              <button
                className="btn-nav btn-next"
                onClick={handleNext}
              >
                Next →
              </button>
            )}
          </div>
        </main>
      </div>

      {/* Submit confirmation modal */}
      {submitConfirm && (
        <div className="modal-overlay" onClick={() => setSubmitConfirm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>Submit Quiz?</h3>
            <div className="modal-stats">
              <div className="modal-stat">
                <span className="modal-stat-val">{answeredCount}</span>
                <span className="modal-stat-lbl">Answered</span>
              </div>
              <div className="modal-stat">
                <span className="modal-stat-val">{totalQuestions - answeredCount}</span>
                <span className="modal-stat-lbl">Unanswered</span>
              </div>
              <div className="modal-stat">
                <span className="modal-stat-val">{markedCount}</span>
                <span className="modal-stat-lbl">Marked</span>
              </div>
            </div>
            <p className="modal-warning">
              {totalQuestions - answeredCount > 0
                ? `⚠️ You have ${totalQuestions - answeredCount} unanswered question(s). Are you sure?`
                : '✓ All questions answered. Ready to submit!'}
            </p>
            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={() => setSubmitConfirm(false)}>
                Continue Quiz
              </button>
              <button className="btn-modal-confirm" onClick={handleSubmitQuiz}>
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Quiz;
