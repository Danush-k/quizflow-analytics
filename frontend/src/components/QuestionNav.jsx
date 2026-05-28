import React from 'react';
import PropTypes from 'prop-types';

const QuestionNav = ({
  currentQuestion = 0,
  totalQuestions = 10,
  isAnswered = false,
  onNext = () => {},
  onPrev = () => {},
}) => {
  const isPrevDisabled = currentQuestion === 0;
  const isNextDisabled = currentQuestion === totalQuestions - 1 && !isAnswered;

  const styles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '16px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      flexWrap: 'wrap',
    },
    button: {
      height: '40px',
      paddingLeft: '16px',
      paddingRight: '16px',
      fontSize: '14px',
      fontWeight: '600',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      backgroundColor: '#2196F3',
      color: '#fff',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      ':hover': {
        backgroundColor: '#1976D2',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      },
      ':active': {
        transform: 'translateY(0)',
      },
    },
    buttonDisabled: {
      opacity: '0.5',
      cursor: 'not-allowed',
      backgroundColor: '#BDBDBD',
    },
    questionCount: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#333',
      padding: '8px 12px',
      backgroundColor: '#E3F2FD',
      borderRadius: '8px',
      minWidth: '80px',
      textAlign: 'center',
      border: '1px solid #90CAF9',
    },
    keyframes: `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  };

  const prevButtonStyle = {
    ...styles.button,
    ...(isPrevDisabled ? styles.buttonDisabled : {}),
  };

  const nextButtonStyle = {
    ...styles.button,
    ...(isNextDisabled ? styles.buttonDisabled : {}),
  };

  return (
    <>
      <style>{styles.keyframes}</style>
      <div style={styles.container} role="navigation" aria-label="Question navigation">
        <button
          style={prevButtonStyle}
          onClick={onPrev}
          disabled={isPrevDisabled}
          onMouseEnter={(e) => {
            if (!isPrevDisabled) {
              e.target.style.backgroundColor = '#1976D2';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isPrevDisabled) {
              e.target.style.backgroundColor = '#2196F3';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }
          }}
          aria-label="Previous question"
        >
          <span>←</span>
          <span>Previous</span>
        </button>

        <div style={styles.questionCount}>
          <span>Q{currentQuestion + 1}/{totalQuestions}</span>
        </div>

        <button
          style={nextButtonStyle}
          onClick={onNext}
          disabled={isNextDisabled}
          onMouseEnter={(e) => {
            if (!isNextDisabled) {
              e.target.style.backgroundColor = '#1976D2';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isNextDisabled) {
              e.target.style.backgroundColor = '#2196F3';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }
          }}
          aria-label={isAnswered ? 'Next question' : 'Answer the question first to proceed'}
        >
          <span>Next</span>
          <span>→</span>
        </button>
      </div>
    </>
  );
};

QuestionNav.propTypes = {
  currentQuestion: PropTypes.number,
  totalQuestions: PropTypes.number,
  isAnswered: PropTypes.bool,
  onNext: PropTypes.func,
  onPrev: PropTypes.func,
};

export default QuestionNav;
