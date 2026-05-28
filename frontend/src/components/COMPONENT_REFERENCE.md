# React Components - Quick Reference Card

## Component Overview

```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  ╔════════════════════════════════════════════════════╗  │
│  ║  ⏱️  ExamTimer (MM:SS format)                      ║  │
│  ║  Colors: ��→🟡→🟠→🔴 with pulse animation        ║  │
│  ╚════════════════════════════════════════════════════╝  │
│                                                           │
│  ┌──────────────────────────┐  ┌──────────────────────┐  │
│  │ 📋 QuestionPalette       │  │ 📄 QuestionCard      │  │
│  │ Status grid (5x cols)    │  │ MCQ options (2x2)    │  │
│  │ 🟢Answered 🔴Unanswered  │  │ Mark/Clear buttons   │  │
│  │ 🟣Marked 🟡Current       │  │                      │  │
│  └──────────────────────────┘  └──────────────────────┘  │
│                                                           │
│  ╔════════════════════════════════════════════════════╗  │
│  ║  [← Previous]  Q5/10  [Next →]                    ║  │
│  ║  QuestionNav (disabled when appropriate)          ║  │
│  ╚════════════════════════════════════════════════════╝  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  💬 AnswerReview (Chat bubbles)                    │  │
│  │  Left (✓ Green) for correct                        │  │
│  │  Right (✗ Red) for incorrect                       │  │
│  │  Expandable with response time                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Component Props Cheat Sheet

### ExamTimer
```
Props:
  ✓ timeRemaining: number (seconds)
  ✓ isRunning: bool
  ✓ showWarning5min: bool
  ✓ showWarning1min: bool
  ✓ showWarning30sec: bool

Colors:
  > 300s  🟢 Green     (#4CAF50)
  ≤ 300s  🟡 Yellow    (#FFC107)
  ≤ 60s   🟠 Orange    (#FF9800)
  ≤ 30s   🔴 Red       (#F44336)

Animation:
  < 60s → Pulse effect with glow
```

### QuestionPalette
```
Props:
  ✓ totalQuestions: number
  ✓ currentQuestion: number (0-indexed)
  ✓ questionStatus: {[index]: 'answered'|'unanswered'|'marked'}
  ✓ onJump: (index) => void

Grid Layout:
  Desktop (1024+)   → 5 columns
  Tablet (768+)     → 4 columns
  Mobile (<768)     → 3 columns

Status Colors:
  answered   → 🟢 #4CAF50
  unanswered → 🔴 #F44336
  marked     → 🟣 #9C27B0
```

### QuestionNav
```
Props:
  ✓ currentQuestion: number
  ✓ totalQuestions: number
  ✓ isAnswered: bool
  ✓ onNext: () => void
  ✓ onPrev: () => void

Disabled States:
  Previous → Q === 0
  Next → Q === last && !isAnswered

Format: [← Previous] Q{n}/{total} [Next →]
```

### QuestionCard
```
Props:
  ✓ question: {
      question_id: number,
      question_text: string,
      options: [string, string, string, string],
      correct_answer: string
    }
  ✓ selectedAnswer: string|null (A/B/C/D)
  ✓ isMarked: bool
  ✓ onSelect: (answer: string) => void
  ✓ onMark: () => void
  ✓ onClear: () => void

Option Format:
  "A) Option text"
  "B) Option text"
  etc.

Selected Styling:
  Border: 2px solid #2196F3
  Background: #E3F2FD
```

### AnswerReview
```
Props:
  ✓ responses: [{
      question_text: string,
      user_answer: string|null,
      correct_answer: string,
      is_correct: bool,
      response_duration_ms: number
    }]
  ✓ onExpandToggle: (index: number) => void
  ✓ expandedIndex: number|null

Layout:
  ✓ Correct → Left bubble, Green border
  ✗ Incorrect → Right bubble, Red border

Display:
  Q{n} ✓/✗ Question text
       Your Answer: {answer}
       Correct Answer: {answer} (if wrong)
       Response Time: {duration}s
```

## Event Handler Patterns

```javascript
// Question selection
onJump(index)
→ setCurrentQuestion(index)

// Navigation
onNext()
→ setCurrentQuestion(current + 1)

onPrev()
→ setCurrentQuestion(current - 1)

// Answer management
onSelect(answer)
→ setSelectedAnswers({...prev, [current]: answer})

onMark()
→ setMarkedQuestions(... toggle current ...)

onClear()
→ setSelectedAnswers({...prev, [current]: null})

// Review
onExpandToggle(index)
→ setExpandedIndex(index === expandedIndex ? null : index)
```

## Styling Quick Reference

### Colors
```
Primary: #2196F3 (Blue)
Success: #4CAF50 (Green)
Error: #F44336 (Red)
Warning: #FF9800 (Orange)
Secondary: #9C27B0 (Purple)
Accent: #FFC107 (Yellow)
```

### Typography
```
Headings: fontSize 20px, fontWeight 700
Labels: fontSize 14px, fontWeight 600
Body: fontSize 13-14px, fontWeight 400/500
Mono (Timer): Courier New, fontFamily monospace
```

### Spacing
```
Gap between elements: 8px, 12px, 16px, 20px, 28px
Padding in cards: 16px, 20px, 28px
Border radius: 8px (small), 12px (buttons), 16px (bubbles)
```

### Animations
```
slideIn:    300ms ease
pulse:      1000ms infinite
fadeIn:     300ms ease
Hover:      transform 0.2s, box-shadow 0.2s
Scale:      1.1x on hover
Lift:       translateY(-2px)
```

## Integration Checklist

- [ ] Import components from `./components/`
- [ ] Set up state for question tracking
- [ ] Implement timer with countdown
- [ ] Connect question status mapping
- [ ] Handle all event callbacks
- [ ] Format API response data
- [ ] Test responsive layouts
- [ ] Verify keyboard navigation
- [ ] Check accessibility with screen reader

## Responsive Breakpoints

```
Mobile:   < 480px    (3-column palette)
Tablet:   480-768px  (4-column palette)
Desktop:  > 768px    (5-column palette)
```

## Performance Tips

1. Memoize question status object to prevent unnecessary re-renders
2. Use useCallback for event handlers
3. Throttle timer updates if needed
4. Lazy load answer review if > 100 questions
5. Use React.memo for palette if > 50 questions

## Accessibility Features

✅ Keyboard navigation (Tab, Enter, Space)
✅ ARIA labels on all interactive elements
✅ ARIA roles (button, region, navigation)
✅ Focus states clearly visible
✅ Status updates with aria-live
✅ Color contrast ratios meet WCAG AA
✅ Touch targets ≥ 44x44px on mobile

## Browser Support

✓ Chrome/Edge 90+
✓ Firefox 88+
✓ Safari 14+
✓ Mobile browsers

## Common Patterns

### State Shape
```javascript
{
  currentQuestion: 0,
  selectedAnswers: { 0: 'A', 2: 'B' },
  markedQuestions: new Set([1, 3]),
  timeRemaining: 3600,
  expandedReview: 0
}
```

### Question Status Derivation
```javascript
const questionStatus = {};
questions.forEach((_, i) => {
  if (marked.has(i)) status[i] = 'marked';
  else if (answers[i]) status[i] = 'answered';
  else status[i] = 'unanswered';
});
```

