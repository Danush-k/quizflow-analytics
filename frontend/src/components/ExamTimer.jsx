import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

const ExamTimer = ({
  timeRemaining = 0,
  isRunning = true,
  showWarning5min = false,
  showWarning1min = false,
  showWarning30sec = false,
}) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const getTimerColor = () => {
    if (showWarning30sec) return '#F44336';
    if (showWarning1min) return '#FF9800';
    if (showWarning5min) return '#FFC107';
    return '#4CAF50';
  };

  const getWarningMessage = () => {
    if (showWarning30sec) return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        30 seconds left!
      </span>
    );
    if (showWarning1min) return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        1 minute left!
      </span>
    );
    if (showWarning5min) return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        5 minutes left!
      </span>
    );
    return '';
  };

  const shouldPulse = timeRemaining < 60;

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      width: '100%',
    },
    timerBox: {
      height: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '48px',
      fontWeight: 'bold',
      fontFamily: 'Courier New, monospace',
      color: getTimerColor(),
      backgroundColor: '#f5f5f5',
      borderRadius: '12px',
      border: `3px solid ${getTimerColor()}`,
      minWidth: '180px',
      transition: 'all 0.3s ease',
      animation: shouldPulse ? 'pulse 1s infinite' : 'none',
      ...(shouldPulse && {
        boxShadow: `0 0 20px ${getTimerColor()}`,
      }),
    },
    warningMessage: {
      fontSize: '14px',
      fontWeight: '600',
      color: getTimerColor(),
      height: '20px',
      minHeight: '20px',
      textAlign: 'center',
      transition: 'color 0.3s ease',
    },
    keyframes: `
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
      }
    `,
  };

  return (
    <div style={styles.container}>
      <style>{styles.keyframes}</style>
      <div style={styles.timerBox}>{formattedTime}</div>
      <div style={styles.warningMessage} role="status" aria-live="polite">
        {getWarningMessage()}
      </div>
    </div>
  );
};

ExamTimer.propTypes = {
  timeRemaining: PropTypes.number.isRequired,
  isRunning: PropTypes.bool,
  showWarning5min: PropTypes.bool,
  showWarning1min: PropTypes.bool,
  showWarning30sec: PropTypes.bool,
};

export default ExamTimer;
