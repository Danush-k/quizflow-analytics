import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
  const navigate = useNavigate();

  const handleStartQuiz = () => {
    navigate('/exams');
  };

  return (
    <div className="home">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Quiz App</h1>
          <p>Master your knowledge with our interactive WhatsApp-style quiz platform. Experience lightning-fast answering, real-time grading, and clean visual diagnostics.</p>
          <button className="cta-button" onClick={handleStartQuiz}>
            Start Quiz
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
        <div className="hero-preview-col">
          <div className="wa-mock-quiz-card">
            <div className="wa-mock-q-header">
              <span className="wa-mock-q-badge">QUESTION 1</span>
              <span className="wa-mock-q-diff">Difficulty: Medium</span>
            </div>
            <p className="wa-mock-question-text">
              What is the SI unit of force?
            </p>
            <div className="wa-mock-options-list">
              <div className="wa-mock-opt-item opt-correct">
                <span className="wa-mock-opt-bullet">A</span>
                <span>Newton</span>
              </div>
              <div className="wa-mock-opt-item">
                <span className="wa-mock-opt-bullet">B</span>
                <span>Pascal</span>
              </div>
              <div className="wa-mock-opt-item">
                <span className="wa-mock-opt-bullet">C</span>
                <span>Joule</span>
              </div>
              <div className="wa-mock-opt-item">
                <span className="wa-mock-opt-bullet">D</span>
                <span>Watt</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="features-section">
          <h2>Why Choose Our Quiz App?</h2>
          <p className="features-sub">Engineered to optimize your learning workflow through micro-active engagement.</p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3>Lightning Fast</h3>
              <p>One question at a time for better focus, reducing test anxiety and improving cognitive retention.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <h3>Track Progress</h3>
              <p>Explore high-fidelity visual stats grids and detailed performance analytics in real-time.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <h3>Comprehensive</h3>
              <p>Dive deep into custom exams, multiple subjects, and curated chapters crafted by educational experts.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </div>
              <h3>Mobile Friendly</h3>
              <p>Enjoy a responsive design optimized for seamless practice on desktop, tablets, and smartphones.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
