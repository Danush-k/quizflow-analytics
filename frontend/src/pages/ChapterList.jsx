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
                <div className="item-icon">📝</div>
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
