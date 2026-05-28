import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../styles/Results.css';

// ─── WhatsApp-themed Color Palette ──────────────────────────────────────────
const WA_DARK        = '#075E54';
const WA_MID         = '#128C7E';
const WA_GREEN       = '#25D366';
const WA_LIGHT_GREEN = '#d9fdd3';

function Results() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // API states
  const [results, setResults] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab State: 'summary' | 'analytics' | 'review'
  const [activeTab, setActiveTab] = useState('summary');

  // Selected question in Review Answers tab
  const [reviewActiveIndex, setReviewActiveIndex] = useState(0);

  // Granular behavioral tracking states from Quiz Page
  const [trackingData, setTrackingData] = useState(null);

  const reviewWorkspaceRef = useRef(null);

  useEffect(() => {
    fetchResultsAndTracking();
  }, [sessionId]);

  // Snap review workspace to top on question change
  useEffect(() => {
    if (reviewWorkspaceRef.current) {
      reviewWorkspaceRef.current.scrollTop = 0;
    }
  }, [reviewActiveIndex]);

  const fetchResultsAndTracking = async () => {
    try {
      setLoading(true);
      setError(null);

      const [resObj, respList] = await Promise.all([
        api.getResults(sessionId),
        api.getResponses(sessionId)
      ]);

      const mainResults = resObj?.data ?? resObj;
      const mainResponses = respList?.data ?? respList;

      setResults(mainResults);
      setResponses(mainResponses || []);

      // Pull high-fidelity granular tracking from LocalStorage
      const localPackageStr = localStorage.getItem(`quiz_session_${sessionId}_tracking`);
      if (localPackageStr) {
        try {
          const parsed = JSON.parse(localPackageStr);
          setTrackingData(parsed);
        } catch (e) {
          console.warn('Could not parse local behavioral package:', e);
        }
      }
    } catch (err) {
      console.error('Results load error:', err);
      setError('Could not fetch test results.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="wa-res-loader-screen">
        <div className="wa-res-spinner" />
        <p>Analyzing quiz telemetry…</p>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="wa-res-error-screen">
        <div className="wa-res-error-card">
          <span>⚠️</span>
          <h3>Couldn't Load Results Workspace</h3>
          <p>{error || 'An unexpected error occurred.'}</p>
          <button onClick={() => navigate('/exams')}>Return to Exams</button>
        </div>
      </div>
    );
  }

  const scorePct = results.total_questions > 0 
    ? (results.correct_answers / results.total_questions) * 100 
    : 0;

  // ─── PERFORMANCE LEVEL ──────────────────────────────────────────────────────
  let perfLevel = 'Beginner 🟢';
  let perfClass = 'lvl-beginner';
  if (scorePct >= 80) { perfLevel = 'Expert 🏆'; perfClass = 'lvl-expert'; }
  else if (scorePct >= 60) { perfLevel = 'Advanced 🔵'; perfClass = 'lvl-advanced'; }
  else if (scorePct >= 40) { perfLevel = 'Intermediate 🟡'; perfClass = 'lvl-intermediate'; }

  // ─── BEHAVIORAL & TIME STATISTICS COMPILATION ────────────────────────────────
  const trackingObj = trackingData?.tracking || {};
  const trackingValues = Object.values(trackingObj);

  // Time Analysis
  const timeTaken = results.time_taken_ms || 0;
  const avgResponseMs = trackingValues.length > 0
    ? trackingValues.reduce((sum, item) => sum + (item.responseDuration || 0), 0) / trackingValues.length
    : 0;

  let fastestQ = { qNum: '-', duration: Infinity };
  let slowestQ = { qNum: '-', duration: -1 };
  let skippedCount = 0;
  let answerChanges = 0;
  let markedCount = 0;

  responses.forEach((resp, idx) => {
    const qid = trackingValues.find(t => t.correctAnswer === resp.correct_answer || t.selectedAnswer === resp.user_answer)?.questionId;
    const track = trackingObj[qid];
    const duration = track?.responseDuration || resp.response_duration_ms || 0;

    if (!resp.user_answer) skippedCount++;
    if (track?.answerChangedCount) answerChanges += track.answerChangedCount;
    if (track?.markedForReview) markedCount++;

    if (duration > 0 && duration < fastestQ.duration) {
      fastestQ = { qNum: idx + 1, duration };
    }
    if (duration > slowestQ.duration) {
      slowestQ = { qNum: idx + 1, duration };
    }
  });

  if (fastestQ.duration === Infinity) fastestQ.duration = 0;
  if (slowestQ.duration === -1) slowestQ.duration = 0;

  const formatMs = (ms) => {
    if (!ms || ms === 0) return '0s';
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // ─── DYNAMIC IMPROVEMENT SUGGESTIONS ────────────────────────────────────────
  const suggestions = [];
  if (scorePct < 50) {
    suggestions.push(`💡 Need improvement in core concepts. Focus heavily on basic definitions before taking more advanced tests.`);
  } else {
    suggestions.push(`🏆 Outstanding score! You have a highly complete grip on this specific chapter topic.`);
  }

  if (avgResponseMs > 25000) {
    suggestions.push(`⏱️ High response times (${formatMs(avgResponseMs)} avg). Try speed runs to complete tests faster under high pressure.`);
  } else if (scorePct >= 70 && avgResponseMs < 10000) {
    suggestions.push(`⚡ Lightning-fast speed and highly accurate results! Excellent execution.`);
  } else if (scorePct < 60 && avgResponseMs < 10000) {
    suggestions.push(`⚠️ Speed is high but accuracy is low. Try reviewing your choices for a few extra seconds before finalizing.`);
  }

  if (answerChanges > 3) {
    suggestions.push(`🤔 Multiple choice swaps (${answerChanges} changes). Research shows your initial intuition is correct in 70% of cases!`);
  }

  return (
    <div className="wa-results-workspace">
      <div className="container">

        {/* ═══ 1. STICKY TOP RESULT HEADER ═══════════════════════════════════ */}
        <header className="wa-sticky-result-header">
          <div className="wa-header-summary-grid">
            <div className="wa-summary-column main-score">
              <span className="wa-summary-title">FINAL SCORE</span>
              <h3>{results.score}<span className="wa-summary-slash">/100</span></h3>
            </div>
            
            <div className="wa-summary-divider" />
            
            <div className="wa-summary-column accuracy">
              <span className="wa-summary-title">ACCURACY</span>
              <h3>{scorePct.toFixed(0)}%</h3>
            </div>

            <div className="wa-summary-divider" />

            <div className="wa-summary-column correct-wrong">
              <span className="wa-summary-title">RESOLVED</span>
              <p>🟢 <strong>{results.correct_answers}</strong> Correct</p>
              <p>🔴 <strong>{results.total_questions - results.correct_answers}</strong> Wrong</p>
            </div>

            <div className="wa-summary-divider" />

            <div className="wa-summary-column duration">
              <span className="wa-summary-title">TIME SPENT</span>
              <h3>{formatMs(timeTaken)}</h3>
            </div>

            <div className="wa-summary-divider" />

            <div className="wa-summary-column speed">
              <span className="wa-summary-title">AVG SPEED</span>
              <h3>{formatMs(avgResponseMs)}<span className="wa-summary-sub-lbl">/Q</span></h3>
            </div>

            <div className="wa-summary-divider" />

            <div className="wa-summary-column badge">
              <span className="wa-summary-title">PERFORMANCE</span>
              <span className={`wa-perf-badge-sticky ${perfClass}`}>{perfLevel}</span>
            </div>
          </div>
        </header>

        {/* ═══ 2. TABS NAVIGATION WORKSPACE ══════════════════════════════════ */}
        <div className="wa-workspace-nav-bar">
          <div className="wa-tabs-list">
            <button 
              className={`wa-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              📋 Score Summary
            </button>
            <button 
              className={`wa-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              📊 Performance Analytics
            </button>
            <button 
              className={`wa-tab-btn ${activeTab === 'review' ? 'active' : ''}`}
              onClick={() => setActiveTab('review')}
            >
              🔍 Review Answers
            </button>
          </div>
        </div>

        {/* ═══ 3. ACTIVE TAB PANEL WORKSPACE ════════════════════════════════ */}
        <div className="wa-tab-content-panel">

          {/* ─── TAB 1: SUMMARY ─── */}
          {activeTab === 'summary' && (
            <div className="wa-panel-anim fade-in">
              <div className="wa-summary-dashboard-grid">
                
                {/* Circular Score Visual & Retake CTA */}
                <div className="wa-summary-gauge-card">
                  <div className="wa-summary-circle-container">
                    <svg className="wa-svg-gauge" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" className="wa-svg-bg" />
                      <circle cx="50" cy="50" r="42" className="wa-svg-fill"
                        style={{ strokeDasharray: `${2 * Math.PI * 42}`, strokeDashoffset: `${2 * Math.PI * 42 * (1 - scorePct / 100)}` }} />
                    </svg>
                    <div className="wa-gauge-content">
                      <h2>{Math.round(scorePct)}%</h2>
                      <span>Score Rank</span>
                    </div>
                  </div>
                  
                  <div className="wa-summary-ctas">
                    <button className="wa-cta-btn cta-primary" onClick={() => setActiveTab('review')}>
                      🔍 Detailed Answer Review
                    </button>
                    <button className="wa-cta-btn cta-secondary" onClick={() => navigate('/exams')}>
                      🔄 Take New Test Chapter
                    </button>
                  </div>
                </div>

                {/* Performance Projection Meter & Cards */}
                <div className="wa-summary-projection-card">
                  <h3>📊 Performance Level Meter</h3>
                  <p className="wa-proj-subtitle">Your exact scoring location mapped across EdTech brackets.</p>
                  
                  <div className="wa-spectrum-meter-wrap">
                    <div className="wa-spectrum-track">
                      <span className="wa-track-bracket bracket-beg">Beginner</span>
                      <span className="wa-track-bracket bracket-int">Intermediate</span>
                      <span className="wa-track-bracket bracket-adv">Advanced</span>
                      <span className="wa-track-bracket bracket-exp">Expert</span>
                      
                      <div className="wa-spectrum-pointer" style={{ left: `${scorePct}%` }}>
                        <div className="wa-pointer-balloon">{Math.round(scorePct)}%</div>
                        <div className="wa-pointer-pin" />
                      </div>
                    </div>
                  </div>

                  <div className="wa-summary-meta-grid">
                    <div className="wa-meta-card mc-correct">
                      <span className="wa-mc-icon">🟢</span>
                      <div>
                        <h4>{results.correct_answers}</h4>
                        <p>Correct Answers</p>
                      </div>
                    </div>
                    <div className="wa-meta-card mc-wrong">
                      <span className="wa-mc-icon">🔴</span>
                      <div>
                        <h4>{results.total_questions - results.correct_answers}</h4>
                        <p>Incorrect Answers</p>
                      </div>
                    </div>
                    <div className="wa-meta-card mc-skipped">
                      <span className="wa-mc-icon">⚪</span>
                      <div>
                        <h4>{skippedCount}</h4>
                        <p>Skipped Questions</p>
                      </div>
                    </div>
                    <div className="wa-meta-card mc-flagged">
                      <span className="wa-mc-icon">🚩</span>
                      <div>
                        <h4>{markedCount}</h4>
                        <p>Marked for Review</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ─── TAB 2: ANALYTICS ─── */}
          {activeTab === 'analytics' && (
            <div className="wa-panel-anim fade-in">
              <div className="wa-analytics-dashboard-grid">
                
                {/* 4-Quadrant Behavioral Analytics */}
                <div className="wa-analytics-cards-grid">
                  
                  <div className="wa-analysis-card border-correct">
                    <h4>🎯 Accuracy Analysis</h4>
                    <div className="wa-stat-item">
                      <span>Total Correct Answers:</span>
                      <strong style={{ color: WA_MID }}>{results.correct_answers}</strong>
                    </div>
                    <div className="wa-stat-item">
                      <span>Total Incorrect / Wrong:</span>
                      <strong style={{ color: '#E53935' }}>{results.total_questions - results.correct_answers}</strong>
                    </div>
                    <div className="wa-stat-item">
                      <span>Net Accuracy Rate:</span>
                      <strong>{scorePct.toFixed(1)}%</strong>
                    </div>
                  </div>

                  <div className="wa-analysis-card border-time">
                    <h4>⏱️ Time Analysis</h4>
                    <div className="wa-stat-item">
                      <span>Fastest Solved Question:</span>
                      <strong style={{ color: WA_MID }}>Q{fastestQ.qNum} ({formatMs(fastestQ.duration)})</strong>
                    </div>
                    <div className="wa-stat-item">
                      <span>Slowest Solved Question:</span>
                      <strong style={{ color: '#F4A261' }}>Q{slowestQ.qNum} ({formatMs(slowestQ.duration)})</strong>
                    </div>
                    <div className="wa-stat-item">
                      <span>Average Response Speed:</span>
                      <strong>{formatMs(avgResponseMs)} per question</strong>
                    </div>
                  </div>

                  <div className="wa-analysis-card border-subject">
                    <h4>🧠 Topic & Subject Grip</h4>
                    <div className="wa-stat-item">
                      <span>Strong Chapters:</span>
                      <strong style={{ color: WA_MID }}>{scorePct >= 70 ? (results.chapter_name || 'This Topic') : 'None'}</strong>
                    </div>
                    <div className="wa-stat-item">
                      <span>Weak Chapters:</span>
                      <strong style={{ color: '#FF6B6B' }}>{scorePct < 60 ? (results.chapter_name || 'This Topic') : 'None'}</strong>
                    </div>
                    <div className="wa-stat-item">
                      <span>Topic Skip Rate:</span>
                      <strong>{((skippedCount / results.total_questions) * 100).toFixed(0)}% skipped</strong>
                    </div>
                  </div>

                  <div className="wa-analysis-card border-behavior">
                    <h4>👣 Answering Behavior</h4>
                    <div className="wa-stat-item">
                      <span>Confidence Flags (Review):</span>
                      <strong>{markedCount} flag(s)</strong>
                    </div>
                    <div className="wa-stat-item">
                      <span>Indecisiveness (Choice Swaps):</span>
                      <strong>{answerChanges} swaps recorded</strong>
                    </div>
                    <div className="wa-stat-item">
                      <span>Time Pressure strain:</span>
                      <strong style={{ color: avgResponseMs > 25000 ? '#E53935' : WA_MID }}>
                        {avgResponseMs > 25000 ? 'Anxious Strain' : 'Calm Answering'}
                      </strong>
                    </div>
                  </div>

                </div>

                {/* AI Suggestions / Sidebar panel */}
                <div className="wa-analytics-sidebar">
                  <h3>⚡ Smart Performance Suggestions</h3>
                  <div className="wa-sug-item-list">
                    {suggestions.map((sug, idx) => (
                      <div key={idx} className="wa-suggestion-bubble-card">
                        {sug}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ─── TAB 3: REVIEW ANSWERS ─── */}
          {activeTab === 'review' && (
            <div className="wa-panel-anim fade-in">
              <div className="wa-review-three-panel-workspace">
                
                {/* 1. LEFT PANEL: QUESTION NAVIGATOR */}
                <aside className="wa-review-left-nav">
                  <div className="wa-left-nav-header">
                    <h4>Questions Index</h4>
                    <span>Select to inspect</span>
                  </div>
                  
                  <div className="wa-left-nav-cards">
                    {responses.map((resp, idx) => {
                      const isCorrect = resp.is_correct === true;
                      const isSkipped = !resp.user_answer;
                      
                      const qid = trackingValues.find(t => t.correctAnswer === resp.correct_answer || t.selectedAnswer === resp.user_answer)?.questionId;
                      const track = trackingObj[qid];
                      const isMarked = track?.markedForReview;

                      let statusClass = 'skipped';
                      if (isMarked) statusClass = 'marked';
                      else if (isSkipped) statusClass = 'skipped';
                      else if (isCorrect) statusClass = 'correct';
                      else statusClass = 'incorrect';

                      return (
                        <div
                          key={idx}
                          className={`wa-review-nav-card ${statusClass} ${idx === reviewActiveIndex ? 'active' : ''}`}
                          onClick={() => setReviewActiveIndex(idx)}
                        >
                          <div className="wa-nav-card-badge">{idx + 1}</div>
                          <div className="wa-nav-card-info">
                            <h5>Question {idx + 1}</h5>
                            <p>{resp.question_text.slice(0, 36)}…</p>
                          </div>
                          <span className="wa-nav-card-time">
                            {formatMs(track?.responseDuration || resp.response_duration_ms)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </aside>

                {/* 2. CENTER PANEL: REVIEW WORKSPACE */}
                <main ref={reviewWorkspaceRef} className="wa-review-center-workspace">
                  <div className="wa-center-card">
                    <div className="wa-center-q-header">
                      <span className="wa-center-q-badge">QUESTION {reviewActiveIndex + 1}</span>
                      <span className="wa-center-q-diff">Difficulty: {trackingObj[trackingValues.find(t => t.correctAnswer === responses[reviewActiveIndex]?.correct_answer || t.selectedAnswer === responses[reviewActiveIndex]?.user_answer)?.questionId]?.difficulty || 'Medium'}</span>
                    </div>

                    <p className="wa-center-question-text">
                      {responses[reviewActiveIndex]?.question_text}
                    </p>

                    <div className="wa-center-options-list">
                      {(responses[reviewActiveIndex]?.options || []).map((optStr, oIdx) => {
                        const letter = ['A', 'B', 'C', 'D'][oIdx];
                        const isUserChoice = responses[reviewActiveIndex]?.user_answer === letter || responses[reviewActiveIndex]?.user_answer === optStr;
                        const isCorrectChoice = optStr === responses[reviewActiveIndex]?.correct_answer;
                        
                        let optClass = '';
                        if (isUserChoice) {
                          optClass = responses[reviewActiveIndex]?.is_correct ? 'opt-correct' : 'opt-wrong';
                        } else if (isCorrectChoice) {
                          optClass = 'opt-key';
                        }

                        return (
                          <div key={letter} className={`wa-center-opt-item ${optClass}`}>
                            <span className="wa-opt-letter-bullet">{letter}</span>
                            <span className="wa-opt-string-text">{optStr}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanations Inside Discussion Thread */}
                    <div className="wa-center-discussion-block">
                      <div className="wa-disc-header">
                        <span>💡 System Solution & Explanation</span>
                      </div>
                      <p className="wa-disc-expl-text">
                        The correct answer is Option {(() => {
                          const idx = responses[reviewActiveIndex]?.options?.indexOf(responses[reviewActiveIndex]?.correct_answer);
                          return idx !== undefined && idx !== -1 ? ['A', 'B', 'C', 'D'][idx] : '';
                        })()} (<strong>{responses[reviewActiveIndex]?.correct_answer}</strong>). 
                        This solution was successfully validated and graded by the test framework. Focus on this subject index if accuracy is below 70%.
                      </p>
                    </div>
                  </div>
                </main>

                {/* 3. RIGHT PANEL: INSIGHTS & TELEMETRY */}
                <aside className="wa-review-right-telemetry">
                  <div className="wa-telemetry-header">
                    <h4>📋 Telemetry Details</h4>
                  </div>
                  
                  {(() => {
                    const currentResp = responses[reviewActiveIndex];
                    const qid = trackingValues.find(t => t.correctAnswer === currentResp?.correct_answer || t.selectedAnswer === currentResp?.user_answer)?.questionId;
                    const track = trackingObj[qid];
                    
                    return (
                      <div className="wa-telemetry-box-content">
                        
                        <div className="wa-telemetry-item-row">
                          <span className="wa-t-lbl">Active Focus Time</span>
                          <span className="wa-t-val">{formatMs(track?.responseDuration || currentResp?.response_duration_ms)}</span>
                        </div>

                        <div className="wa-telemetry-item-row">
                          <span className="wa-t-lbl">Visit Count</span>
                          <span className="wa-t-val">{track?.questionVisitCount || 1} view(s)</span>
                        </div>

                        <div className="wa-telemetry-item-row">
                          <span className="wa-t-lbl">Choice Swaps</span>
                          <span className="wa-t-val">{track?.answerChangedCount || 0} swaps</span>
                        </div>

                        <div className="wa-telemetry-item-row">
                          <span className="wa-t-lbl">Marked for Review</span>
                          <span className="wa-t-val" style={{ color: track?.markedForReview ? '#FF9800' : '#888' }}>
                            {track?.markedForReview ? 'Yes 🚩' : 'No'}
                          </span>
                        </div>

                        <div className="wa-telemetry-item-row">
                          <span className="wa-t-lbl">Solved Status</span>
                          <span className="wa-t-val" style={{ color: currentResp?.is_correct ? '#25D366' : '#E53935', fontWeight: 800 }}>
                            {currentResp?.is_correct ? 'CORRECT ✓' : 'WRONG ✗'}
                          </span>
                        </div>

                        <div className="wa-telemetry-item-row">
                          <span className="wa-t-lbl">Question Index ID</span>
                          <span className="wa-t-val" style={{ fontSize: '0.72rem', color: '#888' }}>{qid || 'Unknown'}</span>
                        </div>

                      </div>
                    );
                  })()}
                </aside>

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default Results;
