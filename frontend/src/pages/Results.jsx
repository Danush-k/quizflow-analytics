import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../styles/Results.css';

function Results() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [sessionId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await api.getResults(sessionId);
      setResults(response.data);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="results">
        <div className="container">
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="results">
        <div className="container">
          <div className="error">{error || 'Failed to load results'}</div>
          <button onClick={() => navigate('/exams')}>Go Back</button>
        </div>
      </div>
    );
  }

  const percentage = (results.correct_answers / results.total_questions) * 100;
  const isPass = percentage >= 60;

  return (
    <div className="results">
      <div className="container">
        <div className="results-card">
          <div className={`result-status ${isPass ? 'pass' : 'fail'}`}>
            <div className="status-icon">{isPass ? '✓' : '✗'}</div>
            <h1>{isPass ? 'Great Job!' : 'Keep Trying!'}</h1>
            <p>{isPass ? 'You passed the quiz' : 'You did not pass this time'}</p>
          </div>

          <div className="score-section">
            <div className="score-circle">
              <span className="score-percentage">{Math.round(percentage)}%</span>
            </div>
            <p className="score-detail">
              {results.correct_answers} out of {results.total_questions} correct
            </p>
          </div>

          <div className="stats-grid">
            <div className="stat">
              <span className="stat-label">Score</span>
              <span className="stat-value">{results.score}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Total Questions</span>
              <span className="stat-value">{results.total_questions}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Correct</span>
              <span className="stat-value correct">{results.correct_answers}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Incorrect</span>
              <span className="stat-value incorrect">
                {results.total_questions - results.correct_answers}
              </span>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-retake" onClick={() => navigate('/exams')}>
              Take Another Quiz
            </button>
            <button className="btn-analytics" onClick={() => navigate('/analytics')}>
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Results;
