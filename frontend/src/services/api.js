import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include user_id
apiClient.interceptors.request.use((config) => {
  const userId = localStorage.getItem('user_id');
  if (userId) {
    config.headers['X-User-ID'] = userId;
  }
  return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const api = {
  // Users
  getOrCreateUser: () => apiClient.get('/users'),
  createUser: (name, email) => apiClient.post('/users', { name, email }),

  // Exams
  getExams: () => apiClient.get('/exams'),
  getSubjects: (examId) => apiClient.get(`/exams/${examId}/subjects`),
  getChapters: (subjectId) => apiClient.get(`/subjects/${subjectId}/chapters`),

  // Quiz
  startQuiz: (chapterId) => apiClient.post('/quiz/start', { chapter_id: chapterId }),
  getCurrentQuestion: (sessionId) => apiClient.get(`/quiz/session/${sessionId}`),
  submitAnswer: (sessionId, questionId, answer, duration) =>
    apiClient.post(`/quiz/answer`, {
      session_id: sessionId,
      question_id: questionId,
      user_answer: answer,
      response_duration_ms: duration,
    }),
  completeQuiz: (sessionId) => apiClient.post(`/quiz/session/${sessionId}/complete`),
  getResults: (sessionId) => apiClient.get(`/quiz/session/${sessionId}/results`),

  // Analytics
  getDailyActiveUsers: () => apiClient.get('/analytics/daily-active-users'),
  getWeeklyActiveUsers: () => apiClient.get('/analytics/weekly-active-users'),
  getQuestionsServed: () => apiClient.get('/analytics/questions-served'),
  getQuestionsAnswered: () => apiClient.get('/analytics/questions-answered'),
  getAvgResponseTime: () => apiClient.get('/analytics/avg-response-time'),
  getCompletionRate: () => apiClient.get('/analytics/completion-rate'),
  getDropOff: () => apiClient.get('/analytics/drop-off'),
  getPeakHours: () => apiClient.get('/analytics/peak-hours'),
  getAvgQuestionsPerSession: () => apiClient.get('/analytics/avg-questions-per-session'),
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
    ]).then((results) => ({
      dau: results[0],
      wau: results[1],
      questionsServed: results[2],
      questionsAnswered: results[3],
      avgResponseTime: results[4],
      completionRate: results[5],
      dropOff: results[6],
      peakHours: results[7],
      avgQuestionsPerSession: results[8],
    })),

  // Admin
  seedData: () => apiClient.post('/admin/seed-data'),
  getStats: () => apiClient.get('/admin/stats'),
};

export default apiClient;
