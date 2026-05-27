# Quick Start Guide - WhatsApp-Style Quiz Application

## ⚡ 5-Minute Setup

### 1. Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB running on localhost:27017

### 2. Backend (30 seconds)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

✅ Backend ready at http://localhost:8000

### 3. Frontend (30 seconds)

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

✅ Frontend ready at http://localhost:5173

### 4. Seed Data (Optional - 2 minutes)

In a third terminal:

```bash
curl -X POST http://localhost:8000/api/admin/seed-data
```

✅ Database populated with 50K+ quiz responses

### 5. Open Application

Visit: **http://localhost:5173**

## 🎮 Usage Flow

```
Home
  ↓
Click "Start Quiz" or go to "Exams"
  ↓
Select Exam
  ↓
Select Subject
  ↓
Select Chapter
  ↓
Take Quiz (One question at a time)
  - Select option (A/B/C/D)
  - Click "Next Question"
  ↓
View Results
  - See Score & Percentage
  - Statistics breakdown
  ↓
View Analytics (From any page)
  - 9+ engagement metrics
```

## 📊 Key Pages

| Page | URL | Purpose |
|------|-----|---------|
| Home | / | Dashboard & CTA |
| Exams | /exams | Browse exams |
| Subjects | /exams/:id/subjects | Select subject |
| Chapters | /subjects/:id/chapters | Select chapter |
| Quiz | /quiz/:id | Take quiz |
| Results | /results/:id | View score |
| Analytics | /analytics | View metrics |

## 🔧 API Endpoints

### Quiz Flow
- `POST /api/quiz/start` → Start quiz
- `GET /api/quiz/session/:id` → Get question
- `POST /api/quiz/answer` → Submit answer
- `GET /api/quiz/session/:id/results` → Get results

### Analytics
- `GET /api/analytics/daily-active-users`
- `GET /api/analytics/weekly-active-users`
- `GET /api/analytics/questions-served`
- `GET /api/analytics/avg-response-time`
- `GET /api/analytics/completion-rate`
- + 4 more metrics

See full docs at http://localhost:8000/docs

## 📁 Project Structure

```
SkillBytes/
├── backend/
│   ├── app/
│   │   ├── main.py (FastAPI app)
│   │   ├── config.py (Settings)
│   │   ├── database/db.py (MongoDB)
│   │   ├── models/ (Data validation)
│   │   ├── services/ (Business logic)
│   │   └── routes/ (API endpoints)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/ (React pages)
│   │   ├── components/ (UI components)
│   │   ├── services/ (API client)
│   │   ├── styles/ (CSS)
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## 🧪 Test Endpoints

### Create User
```bash
curl -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

### Get Exams
```bash
curl http://localhost:8000/api/exams
```

### Get Statistics
```bash
curl http://localhost:8000/api/admin/stats
```

### Get Analytics
```bash
curl http://localhost:8000/api/analytics/daily-active-users
```

## 🎨 Features

✅ WhatsApp-style one-question UX
✅ Exam → Subject → Chapter flow
✅ Anonymous user sessions
✅ Real-time quiz scoring
✅ 9+ analytics metrics
✅ Responsive mobile design
✅ 50K+ dummy data
✅ Automatic progress tracking
✅ No authentication required
✅ No negative marking

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check MongoDB running on :27017 |
| Can't load questions | Seed database: `curl -X POST http://localhost:8000/api/admin/seed-data` |
| CORS errors | Verify frontend URL in backend .env |
| Port in use | Change port: `python -m uvicorn app.main:app --port 8001` |
| Frontend blank | Check browser console for errors |
| Slow database queries | MongoDB indexes should auto-create |

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## 🔐 No Authentication

- Users created automatically
- User ID stored in localStorage
- Anonymous session persistence
- No login/password required

## 📈 Analytics Dashboard

View real-time metrics:
1. Daily Active Users
2. Weekly Active Users
3. Questions Served
4. Questions Answered
5. Average Response Time
6. Completion Rate
7. Drop-off Analysis
8. Peak Activity Hours
9. Average Questions Per Session

## 🚀 Deployment Checklist

- [ ] Backend deployed to cloud
- [ ] MongoDB Atlas configured
- [ ] Frontend deployed to Vercel/Netlify
- [ ] Environment variables set
- [ ] CORS origins updated
- [ ] Health check passing
- [ ] Analytics working
- [ ] User sessions persisting

## 💡 Tips

1. **Mobile Testing**: Open DevTools → Device Toolbar
2. **API Testing**: Use http://localhost:8000/docs (Swagger)
3. **Database**: Connect via MongoDB Compass to localhost:27017
4. **Logs**: Check terminal output for errors
5. **Refresh Cache**: Hard refresh browser (Cmd+Shift+R)

## 📚 Documentation

- Full README: See `README.md`
- Implementation details: See `IMPLEMENTATION_SUMMARY.md`
- Architecture diagrams: See planning docs

## 🤝 Support

For issues:
1. Check logs in terminal
2. Review API docs at /docs
3. Test endpoint with curl
4. Check MongoDB connection

## ⏱️ Performance Targets

- Page load: < 1s
- API response: < 200ms
- Database query: < 100ms
- Quiz question load: < 500ms

---

**Happy Testing!** 🎉

Start at http://localhost:5173
