# SkillBytes — Adaptive Quiz Platform

A full-stack quiz platform for competitive exam preparation (JEE, NEET, NPTEL) built with **FastAPI**, **React**, and **MongoDB Atlas**.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Browser                      │
│              React 18 + Vite + Recharts                 │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP / REST
┌──────────────────────────▼──────────────────────────────┐
│                  FastAPI Backend                         │
│   Routes → Services → MongoDB Aggregation Pipelines     │
│   Async I/O (Motor) · Pydantic v2 validation            │
└──────────────────────────┬──────────────────────────────┘
                           │ motor (async driver)
┌──────────────────────────▼──────────────────────────────┐
│              MongoDB Atlas (cloud)                      │
│   7 collections · Compound indexes · IST-aware queries  │
└─────────────────────────────────────────────────────────┘
```

## Features

| Area | Details |
|---|---|
| **Quiz Engine** | Session state machine: `in_progress → completed / interrupted / abandoned` |
| **Content Hierarchy** | Exam → Subject → Chapter → Questions |
| **Answer Grading** | Accepts option letter (A/B/C/D) or full text; correct answer stored in DB |
| **Explanations** | Per-question explanation served with answer review |
| **Response Timing** | `response_duration_ms` recorded per question for analytics |
| **Analytics** | 14+ metrics: DAU, WAU, drop-off funnel, accuracy by subject/chapter, peak hours |
| **Overview API** | Single `/analytics/overview` call returns all dashboard KPIs |

## Tech Stack

- **Frontend**: React 18 · Vite · React Router v6 · Recharts · Axios
- **Backend**: FastAPI · Motor (async MongoDB) · Pydantic v2 · Uvicorn
- **Database**: MongoDB Atlas (M0 free tier)
- **Deployment**: Backend → Render/Railway · Frontend → Vercel/Netlify

## Project Structure

```
SkillBytes/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, lifespan, CORS, router registration
│   │   ├── config.py            # Pydantic settings (env-driven)
│   │   ├── database/
│   │   │   └── db.py            # Motor client, connection pool, index creation
│   │   ├── models/              # Pydantic request/response schemas
│   │   │   ├── analytics.py     # Typed analytics response models
│   │   │   ├── exam.py          # Exam, Subject, Chapter, Question models
│   │   │   ├── quiz.py          # Session, Answer, Result models
│   │   │   └── user.py          # User models
│   │   ├── routes/              # Thin API layer — delegates to services
│   │   │   ├── analytics.py     # 15 analytics endpoints
│   │   │   ├── exams.py         # Exam & Subject listing
│   │   │   ├── subjects.py      # Subject & Chapter listing
│   │   │   ├── quiz.py          # Quiz session lifecycle
│   │   │   ├── users.py         # User management
│   │   │   └── admin.py         # Seeding & system stats
│   │   └── services/            # Business logic & DB queries
│   │       ├── analytics_service.py  # MongoDB aggregation pipelines
│   │       ├── quiz_service.py       # Quiz session management
│   │       ├── exam_service.py       # Content retrieval
│   │       ├── user_service.py       # User operations
│   │       └── data_seeder.py        # Realistic demo data generator
│   ├── tests/                   # Pytest test suite
│   ├── requirements.txt
│   └── .env                     # Environment config (not committed)
│
├── frontend/
│   └── src/
│       ├── pages/               # Route-level components
│       │   ├── ExamList.jsx
│       │   ├── SubjectList.jsx
│       │   ├── ChapterList.jsx
│       │   ├── Quiz.jsx
│       │   ├── Results.jsx
│       │   ├── Analytics.jsx
│       │   └── Home.jsx
│       ├── components/          # Reusable UI components
│       ├── services/
│       │   └── api.js           # Axios client with interceptors
│       ├── hooks/               # Custom React hooks
│       ├── context/             # React context providers
│       ├── utils/               # Utility functions
│       └── styles/              # CSS per component
│
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB Atlas account (or local MongoDB 5.0+)

### Backend

```bash
cd backend
pip install -r requirements.txt

# Configure .env
echo "MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/quiz_app" > .env
echo "DATABASE_NAME=quiz_app" >> .env

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API available at `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend at `http://localhost:5173`

### Seed Demo Data

```bash
curl -X POST http://localhost:8000/api/admin/seed-data \
  -H "X-Admin-Key: skillbytes-admin-2024"
```

## API Reference

### Exams & Navigation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exams` | List all exams |
| GET | `/api/exams/{examId}/subjects` | List subjects for an exam |
| GET | `/api/subjects/{subjectId}/chapters` | List chapters for a subject |

### Quiz Engine
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/quiz/start` | Start new session (`X-User-ID` header required) |
| GET | `/api/quiz/session/{id}` | Get current question |
| POST | `/api/quiz/answer` | Submit answer + response time |
| POST | `/api/quiz/session/{id}/complete` | Mark session complete |
| GET | `/api/quiz/session/{id}/results` | Final score & summary |
| GET | `/api/quiz/session/{id}/responses` | Full answer review with explanations |
| POST | `/api/quiz/session/{id}/interrupt` | Record mid-quiz abandonment |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/overview` | **All KPIs in one call** |
| GET | `/api/analytics/daily-active-users` | DAU (IST, configurable window) |
| GET | `/api/analytics/weekly-active-users` | WAU |
| GET | `/api/analytics/completion-rate` | Session completion % |
| GET | `/api/analytics/drop-off` | Drop-off funnel by question number |
| GET | `/api/analytics/peak-hours` | Activity by hour of day (IST) |
| GET | `/api/analytics/subject-accuracy` | Accuracy ranked by subject |
| GET | `/api/analytics/chapter-accuracy` | Accuracy ranked by chapter |
| GET | `/api/analytics/avg-response-time` | Mean / median / p95 response time |
| GET | `/api/analytics/questions-served` | Total + today + avg per session |
| GET | `/api/analytics/difficulty-served` | Breakdown by easy/medium/hard |

## Database Schema

### Collections & Indexes

**users**
```js
{ user_id, name, email, created_at, last_active }
// Index: user_id (unique)
```

**exams / subjects / chapters / questions**
```js
// Hierarchical: exam_id → subject_id → chapter_id → question_id
// Each level has a unique index; foreign keys have secondary indexes
// questions also indexed on: chapter_id, difficulty
```

**quiz_sessions**
```js
{
  session_id,   // unique
  user_id,      // → users
  chapter_id,   // → chapters
  status,       // in_progress | completed | interrupted | abandoned
  total_questions, correct_answers, score,
  current_question_index,
  answers: [],  // array of submitted answer letters
  started_at, completed_at, created_at
}
// Compound indexes: (user_id, created_at), (created_at), status
```

**responses**
```js
{
  response_id,           // unique
  session_id,            // → quiz_sessions
  question_id,           // → questions
  user_answer,           // option letter or text
  is_correct,            // boolean — pre-computed at submission
  answer_submitted_at,   // timestamp
  response_duration_ms   // client-measured response time
}
// Compound indexes: (session_id, is_correct), (answer_submitted_at)
```

## Analytics Design

All analytics use **MongoDB aggregation pipelines** — no application-level data loading.

Key design choices:
- **IST timezone** applied via `timezone: "+05:30"` in all date groupings
- **`$addToSet`** used for DAU/WAU to deduplicate users within time windows
- **`$lookup` chains** join responses → questions → chapters → subjects → exams in a single pipeline pass
- **Drop-off funnel** built with `$group on current_question_index` (pure DB computation)
- **`/overview` endpoint** aggregates all header KPIs in one database round-trip

## Deployment

### Backend (Render / Railway)
1. Set environment variable `MONGODB_URI` to your Atlas connection string
2. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel / Netlify)
1. Set `VITE_API_URL` to your deployed backend URL
2. Build command: `npm run build` → deploy `dist/`

---

**Stack**: FastAPI · React 18 · MongoDB Atlas · Motor · Pydantic v2 · Recharts  
**Environment**: Python 3.11+ · Node 18+
