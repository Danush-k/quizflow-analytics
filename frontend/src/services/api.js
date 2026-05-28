/**
 * SkillBytes API Client
 *
 * Centralised Axios instance with:
 *  - Automatic X-User-ID injection from localStorage
 *  - Consistent error logging
 *  - Typed endpoint helpers grouped by domain
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Inject user identity header on every request
apiClient.interceptors.request.use((config) => {
  const userId = localStorage.getItem('user_id');
  if (userId) config.headers['X-User-ID'] = userId;
  return config;
});

// Unwrap data envelope; surface structured errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const msg = error.response?.data?.detail || error.message;
    console.error(`[SkillBytes API] ${error.config?.url} → ${msg}`);
    return Promise.reject(error);
  }
);

export const api = {
  // ── Users ────────────────────────────────────────────────────
  getOrCreateUser: ()           => apiClient.get('/users'),
  createUser:      (name, email) => apiClient.post('/users', { name, email }),

  // ── Exams & Navigation ───────────────────────────────────────
  getExams:           ()          => apiClient.get('/exams'),
  getSubjects:        (examId)    => apiClient.get(`/exams/${examId}/subjects`),
  getChapters:        (subjectId) => apiClient.get(`/subjects/${subjectId}/chapters`),
  getChapterQuestions:(chapterId) => apiClient.get(`/chapters/${chapterId}/questions`),

  // ── Quiz Engine ──────────────────────────────────────────────
  startQuiz:          (chapterId)  => apiClient.post('/quiz/start', { chapter_id: chapterId }),
  getCurrentQuestion: (sessionId)  => apiClient.get(`/quiz/session/${sessionId}`),
  submitAnswer: (sessionId, questionId, answer, duration) =>
    apiClient.post('/quiz/answer', {
      session_id:           sessionId,
      question_id:          questionId,
      user_answer:          answer,
      response_duration_ms: duration,
    }),
  completeQuiz:   (sessionId) => apiClient.post(`/quiz/session/${sessionId}/complete`),
  interruptQuiz:  (sessionId) => apiClient.post(`/quiz/session/${sessionId}/interrupt`),
  getResults:     (sessionId) => apiClient.get(`/quiz/session/${sessionId}/results`),
  getResponses:   (sessionId) => apiClient.get(`/quiz/session/${sessionId}/responses`),

  // ── Analytics ────────────────────────────────────────────────

  /**
   * Single aggregated call for dashboard header KPIs.
   * Returns: total_users, completion_rate, accuracy, avg_response_time, peak_hour, top_subject.
   * Prefer this over individual metric calls for the overview panel.
   */
  getAnalyticsOverview:      ()         => apiClient.get('/analytics/overview'),
  getDailyActiveUsers:       (days=30)  => apiClient.get(`/analytics/daily-active-users?days=${days}`),
  getWeeklyActiveUsers:      (weeks=4)  => apiClient.get(`/analytics/weekly-active-users?weeks=${weeks}`),
  getQuestionsServed:        ()         => apiClient.get('/analytics/questions-served'),
  getQuestionsAnswered:      ()         => apiClient.get('/analytics/questions-answered'),
  getAvgResponseTime:        ()         => apiClient.get('/analytics/avg-response-time'),
  getCompletionRate:         ()         => apiClient.get('/analytics/completion-rate'),
  getDropOff:                ()         => apiClient.get('/analytics/drop-off'),
  getPeakHours:              ()         => apiClient.get('/analytics/peak-hours'),
  getAvgQuestionsPerSession: ()         => apiClient.get('/analytics/avg-questions-per-session'),
  getSubjectServed:          ()         => apiClient.get('/analytics/subject-served'),
  getChapterServed:          ()         => apiClient.get('/analytics/chapter-served'),
  getExamServed:             ()         => apiClient.get('/analytics/exam-served'),
  getDifficultyServed:       ()         => apiClient.get('/analytics/difficulty-served'),
  getSubjectAccuracy:        ()         => apiClient.get('/analytics/subject-accuracy'),
  getChapterAccuracy:        ()         => apiClient.get('/analytics/chapter-accuracy'),

  /** Fetch all chart-level metrics in parallel for the full analytics dashboard. */
  getAllMetrics: () =>
    Promise.all([
      api.getDailyActiveUsers(),
      api.getWeeklyActiveUsers(),
      api.getQuestionsServed(),
      api.getQuestionsAnswered(),
      api.getAvgResponseTime(),
      api.getCompletionRate(),
      api.getDropOff(),
      api.getPeakHours(),
      api.getAvgQuestionsPerSession(),
    ]).then(([dau, wau, questionsServed, questionsAnswered,
              avgResponseTime, completionRate, dropOff,
              peakHours, avgQuestionsPerSession]) => ({
      dau, wau, questionsServed, questionsAnswered,
      avgResponseTime, completionRate, dropOff,
      peakHours, avgQuestionsPerSession,
    })),

  // ── Admin ────────────────────────────────────────────────────
  seedData: () => apiClient.post('/admin/seed-data', null, {
    headers: { 'X-Admin-Key': 'skillbytes-admin-2024' }
  }),
  getStats: () => apiClient.get('/admin/stats'),
};

export default apiClient;
