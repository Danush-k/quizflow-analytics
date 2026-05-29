import React from 'react';
import PropTypes from 'prop-types';

const QuestionCard = ({
  question = {},
  selectedAnswer = null,
  isMarked = false,
  onSelect = () => {},
  onMark = () => {},
  onClear = () => {},
}) => {
  const {
    question_id = 0,
    question_text = '',
    options = ['Option A', 'Option B', 'Option C', 'Option D'],
    correct_answer = null,
  } = question;

  const optionLetters = ['A', 'B', 'C', 'D'];
  const hasAnswer = selectedAnswer !== null;

  const styles = {
    card: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '28px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #e0e0e0',
      maxWidth: '100%',
      animation: 'slideIn 0.3s ease',
    },
    questionText: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#333',
      marginBottom: '24px',
      lineHeight: '1.6',
      letterSpacing: '-0.3px',
    },
    optionsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginBottom: '20px',
      '@media (max-width: 768px)': {
        gap: '12px',
      },
      '@media (max-width: 480px)': {
        gridTemplateColumns: '1fr',
        gap: '10px',
      },
    },
    optionButton: (index, isSelected) => ({
      padding: '16px',
      height: '60px',
      fontSize: '14px',
      fontWeight: '500',
      border: isSelected ? '2px solid #2196F3' : '2px solid #e0e0e0',
      borderRadius: '12px',
      backgroundColor: isSelected ? '#E3F2FD' : '#fff',
      color: '#333',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      ':hover': {
        borderColor: '#2196F3',
        backgroundColor: isSelected ? '#E3F2FD' : '#F5F5F5',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(33, 150, 243, 0.2)',
      },
    }),
    actionButtons: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-start',
      flexWrap: 'wrap',
      marginTop: '24px',
      paddingTop: '20px',
      borderTop: '1px solid #e0e0e0',
    },
    actionButton: (variant = 'primary') => ({
      padding: '10px 18px',
      fontSize: '13px',
      fontWeight: '600',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      ...(variant === 'primary' && {
        backgroundColor: '#9C27B0',
        color: '#fff',
        ':hover': {
          backgroundColor: '#7B1FA2',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)',
        },
      }),
      ...(variant === 'secondary' && {
        backgroundColor: '#F44336',
        color: '#fff',
        ':hover': {
          backgroundColor: '#D32F2F',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
        },
      }),
    }),
    keyframes: `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  };

  const handleOptionClick = (index) => {
    onSelect(optionLetters[index]);
  };

  const handleMarkClick = () => {
    onMark();
  };

  const handleClearClick = () => {
    onClear();
  };

  return (
    <>
      <style>{styles.keyframes}</style>
      <div style={styles.card} role="main">
        <div style={styles.questionText}>{question_text || 'No question text'}</div>

        <div style={styles.optionsGrid}>
          {options.map((option, index) => (
            <button
              key={index}
              style={styles.optionButton(index, selectedAnswer === optionLetters[index])}
              onClick={() => handleOptionClick(index)}
              onMouseEnter={(e) => {
                const isSelected = selectedAnswer === optionLetters[index];
                e.target.style.borderColor = '#2196F3';
                e.target.style.backgroundColor = isSelected ? '#E3F2FD' : '#F5F5F5';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.2)';
              }}
              onMouseLeave={(e) => {
                const isSelected = selectedAnswer === optionLetters[index];
                e.target.style.borderColor = isSelected ? '#2196F3' : '#e0e0e0';
                e.target.style.backgroundColor = isSelected ? '#E3F2FD' : '#fff';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
              aria-label={`Option ${optionLetters[index]}: ${option}`}
              aria-pressed={selectedAnswer === optionLetters[index]}
            >
              <span style={{ fontWeight: '700', marginRight: '8px' }}>
                {optionLetters[index]})
              </span>
              <span style={{ textAlign: 'left' }}>{option}</span>
            </button>
          ))}
        </div>

        <div style={styles.actionButtons}>
          <button
            style={styles.actionButton('primary')}
            onClick={handleMarkClick}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#7B1FA2';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(156, 39, 176, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#9C27B0';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
            aria-label={isMarked ? 'Unmark for review' : 'Mark for review'}
          >
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
            </span>
            <span>{isMarked ? 'Unmark' : 'Mark for Review'}</span>
          </button>

          {hasAnswer && (
            <button
              style={styles.actionButton('secondary')}
              onClick={handleClearClick}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#D32F2F';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(244, 67, 54, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#F44336';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
              aria-label="Clear answer"
            >
              <span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </span>
              <span>Clear Answer</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

QuestionCard.propTypes = {
  question: PropTypes.shape({
    question_id: PropTypes.number,
    question_text: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.string),
    correct_answer: PropTypes.string,
  }),
  selectedAnswer: PropTypes.string,
  isMarked: PropTypes.bool,
  onSelect: PropTypes.func,
  onMark: PropTypes.func,
  onClear: PropTypes.func,
};

export default QuestionCard;
