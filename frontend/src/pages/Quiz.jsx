import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../styles/Quiz.css';

function Quiz() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    initializeQuiz();
  }, [chapterId]);

  const initializeQuiz = async () => {
    try {
      setLoading(true);
      const response = await api.startQuiz(chapterId);
      const newSession = response.data;
      setSession(newSession);
      setQuestionStartTime(Date.now());
      await fetchCurrentQuestion(newSession.session_id);
      setProgress({ current: 1, total: newSession.total_questions });
    } catch (err) {
      console.error('Error starting quiz:', err);
      setError('Failed to start quiz');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentQuestion = async (sessionId) => {
    try {
      const response = await api.getCurrentQuestion(sessionId);
      setQuestion(response.data);
      setSelectedAnswer(null);
    } catch (err) {
      console.error('Error fetching question:', err);
      setError('Failed to load question');
    }
  };

  const handleAnswerSelect = (option) => {
    setSelectedAnswer(option);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !question || !session) return;

    try {
      setSubmitting(true);
      const duration = Math.round((Date.now() - questionStartTime) / 1000) * 1000;

      await api.submitAnswer(
        session.session_id,
        question.question_id,
        selectedAnswer,
        duration
      );

      // Check if quiz is complete
      if (progress.current >= progress.total) {
        await api.completeQuiz(session.session_id);
        navigate(`/results/${session.session_id}`);
      } else {
        // Load next question
        setQuestionStartTime(Date.now());
        setProgress({ current: progress.current + 1, total: progress.total });
        await fetchCurrentQuestion(session.session_id);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="quiz">
        <div className="loading-state">
          <p>Initializing quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={() => navigate('/exams')}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz">
      <div className="quiz-container">
        <div className="quiz-header">
          <div className="progress-section">
            <span className="progress-text">
              Question {progress.current} of {progress.total}
            </span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {question && (
          <div className="quiz-content">
            <div className="question-card">
              <h2 className="question-text">{question.question_text}</h2>

              <div className="options-container">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    className={`option-button ${selectedAnswer === option ? 'selected' : ''}`}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={submitting}
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="option-text">{option}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="quiz-actions">
              <button
                className="next-button"
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer || submitting}
              >
                {submitting ? 'Submitting...' : 'Next Question'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Quiz;
