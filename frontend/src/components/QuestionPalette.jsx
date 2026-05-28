import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const QuestionPalette = ({
  totalQuestions = 10,
  currentQuestion = 0,
  questionStatus = {},
  onJump = () => {},
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const currentButton = containerRef.current?.querySelector('[data-current="true"]');
    if (currentButton) {
      currentButton.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentQuestion]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'answered':
        return '#4CAF50';
      case 'unanswered':
        return '#F44336';
      case 'marked':
        return '#9C27B0';
      default:
        return '#E0E0E0';
    }
  };

  const getGridColumns = () => {
    return {
      desktop: 5,
      tablet: 4,
      mobile: 3,
    };
  };

  const styles = {
    container: {
      width: '100%',
      padding: '16px',
      backgroundColor: '#fafafa',
      borderRadius: '8px',
      overflowX: 'auto',
      overflowY: 'hidden',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(40px, 1fr))',
      gap: '12px',
      minWidth: 'min-content',
      '@media (max-width: 768px)': {
        gridTemplateColumns: 'repeat(auto-fit, minmax(36px, 1fr))',
        gap: '10px',
      },
      '@media (max-width: 480px)': {
        gridTemplateColumns: 'repeat(auto-fit, minmax(32px, 1fr))',
        gap: '8px',
      },
    },
    button: (qNum) => {
      const isCurrent = qNum === currentQuestion;
      const status = questionStatus[qNum] || 'unanswered';
      const borderColor = getStatusColor(status);

      return {
        width: '40px',
        height: '40px',
        minWidth: '40px',
        minHeight: '40px',
        padding: 0,
        fontSize: '14px',
        fontWeight: '600',
        border: `2px solid ${borderColor}`,
        borderRadius: '8px',
        backgroundColor: isCurrent ? '#FFC107' : '#ffffff',
        color: isCurrent ? '#fff' : '#333',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ':hover': {
          transform: 'scale(1.1)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        },
        '@media (max-width: 768px)': {
          width: '36px',
          height: '36px',
          fontSize: '12px',
        },
        '@media (max-width: 480px)': {
          width: '32px',
          height: '32px',
          fontSize: '11px',
        },
      };
    },
    label: {
      display: 'block',
      fontSize: '12px',
      fontWeight: '600',
      marginBottom: '8px',
      color: '#666',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    legend: {
      display: 'flex',
      gap: '16px',
      marginTop: '12px',
      fontSize: '11px',
      flexWrap: 'wrap',
    },
    legendItem: (color) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    }),
    legendBox: (color) => ({
      width: '12px',
      height: '12px',
      borderRadius: '3px',
      borderLeft: `2px solid ${color}`,
      backgroundColor: 'transparent',
    }),
  };

  // Custom style injection for hover effects
  const styleSheet = `
    .question-button:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    .question-palette-container {
      scrollbar-width: thin;
      scrollbar-color: #ccc #f5f5f5;
    }
    .question-palette-container::-webkit-scrollbar {
      height: 6px;
    }
    .question-palette-container::-webkit-scrollbar-track {
      background: #f5f5f5;
    }
    .question-palette-container::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 3px;
    }
  `;

  return (
    <>
      <style>{styleSheet}</style>
      <div>
        <label style={styles.label}>Questions</label>
        <div
          ref={containerRef}
          style={styles.container}
          className="question-palette-container"
          role="region"
          aria-label="Question navigation palette"
        >
          <div style={styles.grid}>
            {Array.from({ length: totalQuestions }, (_, i) => (
              <button
                key={i}
                onClick={() => onJump(i)}
                className="question-button"
                style={{
                  ...styles.button(i),
                  backgroundColor:
                    i === currentQuestion ? '#FFC107' : '#ffffff',
                  color: i === currentQuestion ? '#333' : '#333',
                  fontWeight: i === currentQuestion ? '700' : '600',
                }}
                data-current={i === currentQuestion}
                aria-label={`Question ${i + 1} - ${questionStatus[i] || 'unanswered'}`}
                aria-current={i === currentQuestion ? 'true' : 'false'}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendBox('#4CAF50') }} />
            <span>Answered</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendBox('#F44336') }} />
            <span>Unanswered</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendBox('#9C27B0') }} />
            <span>Marked</span>
          </div>
        </div>
      </div>
    </>
  );
};

QuestionPalette.propTypes = {
  totalQuestions: PropTypes.number,
  currentQuestion: PropTypes.number,
  questionStatus: PropTypes.object,
  onJump: PropTypes.func,
};

export default QuestionPalette;
