# NPTEL Exam Platform Components

React components for the exam interface and results display.

## Quick Start

### ExamTimer
```jsx
import ExamTimer from './ExamTimer';

<ExamTimer 
  timeRemaining={125}
  isRunning={true}
  showWarning5min={false}
  showWarning1min={false}
  showWarning30sec={false}
/>
```

### QuestionPalette
```jsx
import QuestionPalette from './QuestionPalette';

<QuestionPalette 
  totalQuestions={10}
  currentQuestion={3}
  questionStatus={{0: 'answered', 1: 'unanswered', 2: 'marked'}}
  onJump={(questionIndex) => setCurrentQuestion(questionIndex)}
/>
```

### QuestionNav
```jsx
import QuestionNav from './QuestionNav';

<QuestionNav 
  currentQuestion={3}
  totalQuestions={10}
  isAnswered={true}
  onNext={() => setCurrentQuestion(current + 1)}
  onPrev={() => setCurrentQuestion(current - 1)}
/>
```

### QuestionCard
```jsx
import QuestionCard from './QuestionCard';

<QuestionCard 
  question={{
    question_id: 1,
    question_text: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correct_answer: 'B'
  }}
  selectedAnswer="B"
  isMarked={false}
  onSelect={(answer) => handleAnswer(answer)}
  onMark={() => handleMark()}
  onClear={() => handleClear()}
/>
```

### AnswerReview
```jsx
import AnswerReview from './AnswerReview';

<AnswerReview 
  responses={[
    {
      question_text: 'What is 2 + 2?',
      user_answer: 'B',
      correct_answer: 'B',
      is_correct: true,
      response_duration_ms: 3500
    }
  ]}
  onExpandToggle={(index) => setExpanded(index)}
  expandedIndex={0}
/>
```

## Component Features at a Glance

| Component | Key Feature | Animation | Responsive |
|-----------|------------|-----------|-----------|
| ExamTimer | Color warnings | Pulse | Yes |
| QuestionPalette | Status grid | Hover scale | Yes (3-5 cols) |
| QuestionNav | Question counter | Lift on hover | Yes |
| QuestionCard | MCQ options | Smooth selection | Yes |
| AnswerReview | Chat bubbles | Fade/slide in | Yes |

## Styling System

All components use inline styles for portability. They can be easily themed by:
1. Modifying color constants in style objects
2. Adjusting breakpoints in media query strings
3. Overriding with CSS-in-JS solution

## Accessibility

- Keyboard navigation: Tab, Enter, Space
- Screen reader compatible with ARIA labels
- Focus states clearly visible
- Color-blind friendly with status icons

## Common Patterns

### Controlled Components
All components are controlled - parent manages state:
```jsx
const [currentQuestion, setCurrentQuestion] = useState(0);
const [selectedAnswers, setSelectedAnswers] = useState({});
```

### Event Handlers
- `onJump(index)` - Question palette selection
- `onNext()` / `onPrev()` - Navigation
- `onSelect(answer)` - Option selection
- `onMark()` / `onClear()` - Answer controls
- `onExpandToggle(index)` - Review expansion

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Performance Notes

- Components use React.memo for optimization where beneficial
- Animations use CSS transitions for hardware acceleration
- Event listeners properly scoped to prevent memory leaks

## Development

All components use:
- Functional components with Hooks
- PropTypes for type checking
- Inline styles (no CSS files)
- No external UI libraries

To add new components, follow the pattern:
1. Define style objects as constants
2. Use PropTypes for prop validation
3. Include ARIA labels for accessibility
4. Test responsive behavior
