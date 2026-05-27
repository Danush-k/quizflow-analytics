import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../styles/Home.css';

function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    navigate('/exams');
  };

  return (
    <div className="home">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Quiz App</h1>
          <p>Master your knowledge with our interactive WhatsApp-style quiz platform</p>
          <button className="cta-button" onClick={handleStartQuiz}>
            Start Quiz
          </button>
        </div>
        <div className="hero-emoji">📱</div>
      </div>

      <div className="container">
        {loading ? (
          <div className="loading-skeleton">
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
          </div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : stats ? (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <p className="stat-label">Total Users</p>
                <p className="stat-value">{stats.total_users || 0}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <p className="stat-label">Total Questions</p>
                <p className="stat-value">{stats.total_questions || 0}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <p className="stat-label">Total Sessions</p>
                <p className="stat-value">{stats.total_sessions || 0}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <p className="stat-label">Total Responses</p>
                <p className="stat-value">{stats.total_responses || 0}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="features-section">
          <h2>Why Choose Our Quiz App?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Lightning Fast</h3>
              <p>One question at a time for better focus and engagement</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Track Progress</h3>
              <p>View detailed analytics and track your improvement</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Comprehensive</h3>
              <p>Multiple exams, subjects, and chapters to explore</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Mobile Friendly</h3>
              <p>Optimized for both desktop and mobile devices</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
