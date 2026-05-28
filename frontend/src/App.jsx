import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { api } from './services/api';
import './styles/App.css';

// Pages
import Home from './pages/Home';
import ExamList from './pages/ExamList';
import SubjectList from './pages/SubjectList';
import ChapterList from './pages/ChapterList';
import Quiz from './pages/Quiz';
import Results from './pages/Results';
import Analytics from './pages/Analytics';
import Navbar from './components/Navbar';

function App() {
  useEffect(() => {
    // Initialize user on app load
    const initializeUser = async () => {
      try {
        let userId = localStorage.getItem('user_id');
        if (!userId) {
          const response = await api.getOrCreateUser();
          userId = response?.data?.user_id;
          localStorage.setItem('user_id', userId);
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    };

    initializeUser();
  }, []);

  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/exams" element={<ExamList />} />
            <Route path="/exams/:examId/subjects" element={<SubjectList />} />
            <Route path="/subjects/:subjectId/chapters" element={<ChapterList />} />
            <Route path="/quiz/:chapterId" element={<Quiz />} />
            <Route path="/results/:sessionId" element={<Results />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
