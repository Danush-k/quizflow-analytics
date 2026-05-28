import React, { useState } from 'react';
import PropTypes from 'prop-types';

const AnswerReview = ({
  responses = [],
  onExpandToggle = () => {},
  expandedIndex = null,
}) => {
  const [localExpanded, setLocalExpanded] = useState(expandedIndex);

  const handleToggleExpand = (index) => {
    const newExpanded = localExpanded === index ? null : index;
    setLocalExpanded(newExpanded);
    onExpandToggle(newExpanded);
  };

  const formatDuration = (ms) => {
    if (!ms) return '0s';
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: '20px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      maxWidth: '100%',
      animation: 'fadeIn 0.3s ease',
    },
    bubbleWrapper: (isCorrect, isExpanded) => ({
      display: 'flex',
      justifyContent: isCorrect ? 'flex-start' : 'flex-end',
      animation: 'slideIn 0.3s ease',
      '@media (max-width: 768px)': {
        justifyContent: 'center',
      },
    }),
    bubble: (isCorrect) => ({
      backgroundColor: isCorrect ? '#E8F5E9' : '#FFEBEE',
      border: `2px solid ${isCorrect ? '#4CAF50' : '#F44336'}`,
      borderRadius: '16px',
      padding: '16px',
      maxWidth: '85%',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transform: 'translateY(-2px)',
      },
      '@media (max-width: 768px)': {
        maxWidth: '90%',
      },
      '@media (max-width: 480px)': {
        maxWidth: '100%',
      },
    }),
    bubbleHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px',
      fontSize: '14px',
      fontWeight: '600',
    },
    questionNumber: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#333',
    },
    statusIcon: (isCorrect) => ({
      fontSize: '18px',
      fontWeight: 'bold',
      color: isCorrect ? '#4CAF50' : '#F44336',
    }),
    bubbleContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    contentLine: {
      fontSize: '13px',
      color: '#555',
      lineHeight: '1.4',
    },
    label: {
      fontWeight: '700',
      color: '#333',
      marginRight: '4px',
    },
    answer: (isCorrect) => ({
      color: isCorrect ? '#2E7D32' : '#C62828',
      fontWeight: '600',
      wordBreak: 'break-word',
    }),
    correctAnswer: {
      color: '#2E7D32',
      fontWeight: '600',
      wordBreak: 'break-word',
    },
    expandButton: (isExpanded) => ({
      marginTop: '8px',
      fontSize: '12px',
      fontWeight: '600',
      color: '#2196F3',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      background: 'none',
      border: 'none',
      padding: 0,
      transition: 'transform 0.2s ease',
      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
    }),
    expandDetails: {
      marginTop: '12px',
      paddingTop: '12px',
      borderTop: '1px solid rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    },
    keyframes: `
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
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

  return (
    <>
      <style>{styles.keyframes}</style>
      <div style={styles.container} role="region" aria-label="Answer review">
        {responses.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#999',
              fontSize: '14px',
            }}
          >
            No responses to review yet.
          </div>
        ) : (
          responses.map((response, index) => {
            const isCorrect = response.is_correct === true;
            const isExpanded = localExpanded === index;

            return (
              <div
                key={index}
                style={styles.bubbleWrapper(isCorrect, isExpanded)}
                role="article"
                aria-label={`Question ${index + 1} - ${isCorrect ? 'Correct' : 'Incorrect'}`}
              >
                <div
                  style={{
                    ...styles.bubble(isCorrect),
                  }}
                  onClick={() => handleToggleExpand(index)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleToggleExpand(index);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={styles.bubbleHeader}>
                    <span style={styles.questionNumber}>Q{index + 1}</span>
                    <span style={styles.statusIcon(isCorrect)}>
                      {isCorrect ? '✓' : '✗'}
                    </span>
                  </div>

                  <div style={styles.bubbleContent}>
                    <div style={styles.contentLine}>
                      <span style={styles.label}>Question:</span>
                      <span>{response.question_text}</span>
                    </div>

                    <div style={styles.contentLine}>
                      <span style={styles.label}>Your Answer:</span>
                      <span style={styles.answer(isCorrect)}>
                        {response.user_answer || 'Not answered'}
                      </span>
                    </div>

                    {!isCorrect && response.correct_answer && (
                      <div style={styles.contentLine}>
                        <span style={styles.label}>Correct Answer:</span>
                        <span style={styles.correctAnswer}>{response.correct_answer}</span>
                      </div>
                    )}

                    <div style={styles.contentLine}>
                      <span style={styles.label}>Response Time:</span>
                      <span>{formatDuration(response.response_duration_ms)}</span>
                    </div>

                    {isExpanded && (
                      <div style={styles.expandDetails}>
                        <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                          Click to collapse details
                        </div>
                      </div>
                    )}

                    <button
                      style={styles.expandButton(isExpanded)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleExpand(index);
                      }}
                      aria-label={
                        isExpanded ? 'Collapse details' : 'Expand details'
                      }
                    >
                      <span>▶</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

AnswerReview.propTypes = {
  responses: PropTypes.arrayOf(
    PropTypes.shape({
      question_text: PropTypes.string,
      user_answer: PropTypes.string,
      correct_answer: PropTypes.string,
      is_correct: PropTypes.bool,
      response_duration_ms: PropTypes.number,
    })
  ),
  onExpandToggle: PropTypes.func,
  expandedIndex: PropTypes.number,
};

export default AnswerReview;
