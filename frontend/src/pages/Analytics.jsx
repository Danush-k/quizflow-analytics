import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import '../styles/Analytics.css';

function Analytics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await api.getAllMetrics();
      setMetrics(response);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics">
        <div className="container">
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics">
        <div className="container">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics">
      <div className="container">
        <h1>Analytics Dashboard</h1>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">👥</div>
            <h3>Daily Active Users</h3>
            <p className="metric-value">{metrics?.dau?.data || 0}</p>
          </div>

          <div className="metric-card">
            <div className="metric-icon">📈</div>
            <h3>Weekly Active Users</h3>
            <p className="metric-value">{metrics?.wau?.data || 0}</p>
          </div>

          <div className="metric-card">
            <div className="metric-icon">📚</div>
            <h3>Questions Served</h3>
            <p className="metric-value">{metrics?.questionsServed?.data || 0}</p>
          </div>

          <div className="metric-card">
            <div className="metric-icon">✅</div>
            <h3>Questions Answered</h3>
            <p className="metric-value">{metrics?.questionsAnswered?.data || 0}</p>
          </div>

          <div className="metric-card">
            <div className="metric-icon">⏱️</div>
            <h3>Avg Response Time</h3>
            <p className="metric-value">
              {metrics?.avgResponseTime?.data ? 
                (metrics.avgResponseTime.data / 1000).toFixed(1) : 0}s
            </p>
          </div>

          <div className="metric-card">
            <div className="metric-icon">🎯</div>
            <h3>Completion Rate</h3>
            <p className="metric-value">
              {metrics?.completionRate?.data ? 
                metrics.completionRate.data.toFixed(1) : 0}%
            </p>
          </div>

          <div className="metric-card">
            <div className="metric-icon">📊</div>
            <h3>Avg Questions/Session</h3>
            <p className="metric-value">
              {metrics?.avgQuestionsPerSession?.data ? 
                metrics.avgQuestionsPerSession.data.toFixed(1) : 0}
            </p>
          </div>

          <div className="metric-card">
            <div className="metric-icon">⏰</div>
            <h3>Peak Activity Hour</h3>
            <p className="metric-value">
              {metrics?.peakHours?.data ? metrics.peakHours.data : 'N/A'}
            </p>
          </div>
        </div>

        <div className="metrics-section">
          <h2>Drop-off Analysis</h2>
          <div className="dropoff-info">
            <p>{metrics?.dropOff?.data || 'Data not available'}</p>
          </div>
        </div>

        <div className="refresh-button">
          <button onClick={fetchMetrics}>Refresh Analytics</button>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
