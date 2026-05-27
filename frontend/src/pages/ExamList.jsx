import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../styles/ExamList.css';

function ExamList() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await api.getExams();
      setExams(response.data || []);
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExam = (examId) => {
    navigate(`/exams/${examId}/subjects`);
  };

  return (
    <div className="exam-list">
      <div className="container">
        <h1>Select an Exam</h1>
        <p className="subtitle">Choose an exam to get started</p>

        {loading ? (
          <div className="loading">Loading exams...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : exams.length === 0 ? (
          <div className="empty-state">
            <p>No exams available</p>
          </div>
        ) : (
          <div className="exams-grid">
            {exams.map((exam) => (
              <div
                key={exam._id}
                className="exam-card"
                onClick={() => handleSelectExam(exam.exam_id)}
              >
                <div className="exam-icon">📚</div>
                <h2>{exam.name}</h2>
                <p>{exam.description}</p>
                <button className="exam-button">Start Exam →</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ExamList;
