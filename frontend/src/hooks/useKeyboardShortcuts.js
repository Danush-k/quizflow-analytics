import { useEffect } from 'react';

/**
 * useKeyboardShortcuts - Listen for keyboard shortcuts in quiz
 * Maps keys to quiz actions (1-4 for A-D, N for next, P for previous, etc.)
 * 
 * @param {object} handlers - Object containing callback functions:
 *   - onSelectA, onSelectB, onSelectC, onSelectD: Select option
 *   - onNext, onPrev: Navigate questions
 *   - onMark: Mark question for review
 *   - onClear: Clear current answer
 *   - onSubmit: Submit exam
 *   - onFullscreen: Toggle fullscreen
 */
export const useKeyboardShortcuts = (handlers = {}) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      // Respect user's motion/animation preferences for accessibility
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      let handled = false;

      // Map keys to option selection (1/2/3/4 to A/B/C/D)
      switch (event.key) {
        case '1':
          if (handlers.onSelectA) {
            handlers.onSelectA();
            handled = true;
          }
          break;

        case '2':
          if (handlers.onSelectB) {
            handlers.onSelectB();
            handled = true;
          }
          break;

        case '3':
          if (handlers.onSelectC) {
            handlers.onSelectC();
            handled = true;
          }
          break;

        case '4':
          if (handlers.onSelectD) {
            handlers.onSelectD();
            handled = true;
          }
          break;

        case 'n':
        case 'N':
          if (handlers.onNext) {
            handlers.onNext();
            handled = true;
          }
          break;

        case 'p':
        case 'P':
          if (handlers.onPrev) {
            handlers.onPrev();
            handled = true;
          }
          break;

        case 'm':
        case 'M':
          if (handlers.onMark) {
            handlers.onMark();
            handled = true;
          }
          break;

        case 'c':
        case 'C':
          if (handlers.onClear) {
            handlers.onClear();
            handled = true;
          }
          break;

        case 's':
        case 'S':
          if (handlers.onSubmit) {
            handlers.onSubmit();
            handled = true;
          }
          break;

        case 'f':
        case 'F':
          if (handlers.onFullscreen) {
            handlers.onFullscreen();
            handled = true;
          }
          break;

        default:
          break;
      }

      // Prevent default only for quiz-relevant keys
      if (handled) {
        event.preventDefault();
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers]);

  // This is a side-effect hook, returns nothing
  return null;
};

export default useKeyboardShortcuts;
