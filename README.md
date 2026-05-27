# WhatsApp-Style Quiz Application

A full-stack quiz application with React frontend, FastAPI backend, and MongoDB database featuring a WhatsApp-like UX for one-question-at-a-time quiz flow.

## Features

✅ **Quiz Flow**: Exam → Subject → Chapter → Quiz Starts
✅ **One-Question-At-A-Time**: WhatsApp-style single question UX
✅ **Multiple Choice**: Single correct answer per question
✅ **No Negative Marking**: Right answers score points only
✅ **Analytics Dashboard**: 9+ metrics tracking user engagement
✅ **Dummy Data**: 50K+ realistic quiz responses
✅ **Responsive Design**: Mobile & desktop optimized

## Tech Stack

- **Frontend**: React 18 + Vite + React Router + Recharts
- **Backend**: FastAPI + Motor (async MongoDB driver)
- **Database**: MongoDB
- **Styling**: CSS3 with WhatsApp color scheme

## Project Structure

```
SkillBytes/
├── frontend/                 # React application
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API client
│   │   ├── styles/          # CSS files
│   │   └── App.jsx          # Main app
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── config.py        # Settings
│   │   ├── database/
│   │   │   └── db.py        # MongoDB connection
│   │   ├── models/          # Pydantic models
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   └── middleware/      # Custom middleware
│   ├── requirements.txt
│   ├── .env
│   └── README.md
│
└── README.md                 # This file
```

## Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB 5.0+ (running locally on localhost:27017)

### Backend Setup

```bash
cd backend

# Create virtual environment (optional)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
# .env file is pre-configured for local development

# Start backend server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Server runs on http://localhost:8000
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on http://localhost:5173

### Seed Database (Optional)

The backend includes dummy data generation. To populate MongoDB:

```bash
curl -X POST http://localhost:8000/api/admin/seed-data
```

This creates:
- 100 users
- 10 exams
- 50 subjects
- 200 chapters
- 2000 questions
- 5000 quiz sessions
- 50000+ responses

## API Endpoints

### Users
- `GET /api/users` - Get or create user
- `POST /api/users` - Create new user

### Exams
- `GET /api/exams` - List all exams
- `GET /api/exams/{examId}/subjects` - Get subjects for exam
- `GET /api/subjects/{subjectId}/chapters` - Get chapters for subject

### Quiz
- `POST /api/quiz/start` - Start new quiz session
- `GET /api/quiz/session/{sessionId}` - Get current question
- `POST /api/quiz/answer` - Submit answer
- `POST /api/quiz/session/{sessionId}/complete` - Complete session
- `GET /api/quiz/session/{sessionId}/results` - Get results

### Analytics
- `GET /api/analytics/daily-active-users` - DAU metric
- `GET /api/analytics/weekly-active-users` - WAU metric
- `GET /api/analytics/questions-served` - Total questions
- `GET /api/analytics/questions-answered` - Total responses
- `GET /api/analytics/avg-response-time` - Response duration
- `GET /api/analytics/completion-rate` - Session completion %
- `GET /api/analytics/drop-off` - Drop-off analysis
- `GET /api/analytics/peak-hours` - Peak activity hour
- `GET /api/analytics/avg-questions-per-session` - Avg questions

### Admin
- `POST /api/admin/seed-data` - Generate dummy data
- `GET /api/admin/stats` - System statistics

## Usage

1. **Open http://localhost:5173 in your browser**

2. **Home Page**: View dashboard stats

3. **Select Exam**: Browse available exams

4. **Select Subject**: Choose a subject from exam

5. **Select Chapter**: Pick a chapter from subject

6. **Take Quiz**: Answer one question at a time
   - Select an option
   - Click "Next Question"
   - Progress tracked with progress bar

7. **View Results**: See score, percentage, breakdown

8. **Analytics**: View 9+ engagement metrics

## Database Schema

### Collections

**users**
```javascript
{
  user_id: "usr_xxx",
  name: "John Doe",
  email: "john@example.com",
  created_at: ISODate,
  last_active: ISODate
}
```

**quiz_sessions**
```javascript
{
  session_id: "session_xxx",
  user_id: "usr_xxx",
  chapter_id: "ch_xxx",
  status: "completed|in_progress|abandoned",
  total_questions: 10,
  correct_answers: 7,
  score: 70,
  started_at: ISODate,
  completed_at: ISODate
}
```

**responses**
```javascript
{
  response_id: "resp_xxx",
  session_id: "session_xxx",
  question_id: "q_xxx",
  user_answer: "B",
  is_correct: true,
  question_shown_at: ISODate,
  answer_submitted_at: ISODate,
  response_duration_ms: 5234
}
```

See backend README for complete schema.

## Key Features Explained

### One-Question-At-A-Time Flow
- Questions displayed individually
- User selects option and clicks Next
- Maintains focus and reduces cognitive load
- Perfect for mobile/chat-like experience

### Quiz Timing
- `question_shown_at`: When question was displayed
- `answer_submitted_at`: When user submitted answer
- `response_duration_ms`: Calculated difference
- Enables analysis of response patterns

### Analytics Metrics
1. **Daily Active Users**: Unique users taking quizzes today
2. **Weekly Active Users**: Unique users in last 7 days
3. **Questions Served**: Total questions displayed
4. **Questions Answered**: Total responses submitted
5. **Avg Response Time**: Mean response duration
6. **Completion Rate**: % sessions completed
7. **Drop-off Analysis**: % who abandon at each question
8. **Peak Activity Hours**: Hour with most activity
9. **Avg Questions/Session**: Average questions per session

### No Authentication
- Anonymous user creation
- Session-based via localStorage
- User ID stored and reused
- No login/signup required

## Development Notes

### Architecture Decisions

1. **Async/Await**: Motor provides async MongoDB driver for better concurrency
2. **Service Layer**: Business logic separated from routes for testability
3. **Pydantic Models**: Strict type validation for all API requests/responses
4. **CORS Enabled**: Frontend can call backend from different ports
5. **Error Handling**: All endpoints include comprehensive error handling
6. **Logging**: Structured logging throughout for debugging

### Performance Considerations

- MongoDB indexes created on all foreign keys
- Pagination support for list endpoints
- Real-time analytics calculation (pre-aggregation recommended for scale)
- Async operations prevent blocking on DB queries
- Frontend caching via React hooks

### Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers supported
- Requires JavaScript enabled

## Common Issues

### "Connection refused" on Backend
- Ensure MongoDB is running on localhost:27017
- Check .env MONGODB_URI setting
- Verify port 8000 is not in use

### "Cannot GET /api/exams"
- Backend might not be fully started
- Check logs: `tail -f /tmp/backend.log`
- Verify CORS is configured correctly

### Quiz Questions Not Loading
- MongoDB may not be seeded yet
- Run `curl -X POST http://localhost:8000/api/admin/seed-data`
- Check MongoDB has quiz_sessions and responses collections

### Frontend CORS Errors
- Verify frontend URL in backend ALLOWED_ORIGINS
- Check .env files have correct URLs
- Restart backend after .env changes

## Deployment

### Backend (Heroku/Railway/Render)
- Set environment variables: MONGODB_URI
- Use `gunicorn app.main:app`
- Or use Procfile with uvicorn

### Frontend (Vercel/Netlify)
- Build: `npm run build`
- Deploy `dist/` directory
- Set VITE_API_URL to backend URL

## Testing

The application includes:
- Pydantic models for request validation
- Async service methods with error handling
- Comprehensive response formats
- Mock data seeding for testing

## Contributing

1. Follow existing code style
2. Add tests for new endpoints
3. Update documentation
4. Maintain async/await patterns
5. Keep routes thin, logic in services

## License

MIT License

## Support

For issues or questions:
1. Check the Common Issues section
2. Review API documentation at /docs
3. Check backend logs in `/tmp/backend.log`
4. Verify MongoDB connectivity

---

**Status**: Production-ready for demonstration
**Last Updated**: 2024
