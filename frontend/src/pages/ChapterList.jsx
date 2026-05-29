import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../styles/List.css';

function ChapterList() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchChapters();
  }, [subjectId]);

  const fetchChapters = async () => {
    try {
      setLoading(true);
      const response = await api.getChapters(subjectId);
      setChapters(response.data || []);
    } catch (err) {
      console.error('Error fetching chapters:', err);
      setError('Failed to load chapters');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = (chapterId) => {
    navigate(`/quiz/${chapterId}`);
  };

  return (
    <div className="list-page">
      <div className="container">
        <h1>Chapters</h1>
        <button className="back-button" onClick={() => navigate(-1)}>← Back</button>

        {loading ? (
          <div className="loading">Loading chapters...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : chapters.length === 0 ? (
          <div className="empty-state">No chapters available</div>
        ) : (
          <div className="items-grid">
            {chapters.map((chapter) => (
              <div key={chapter._id} className="item-card" onClick={() => handleStartQuiz(chapter.chapter_id)}>
                 <div className="item-icon">
                   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                     <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                     <polyline points="14 2 14 8 20 8" />
                     <line x1="16" y1="13" x2="8" y2="13" />
                     <line x1="16" y1="17" x2="8" y2="17" />
                     <polyline points="10 9 9 9 8 9" />
                   </svg>
                 </div>
                <h2>{chapter.name}</h2>
                <button className="item-button">Start Quiz →</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChapterList;
