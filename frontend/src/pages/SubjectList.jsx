import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../styles/List.css';

// ─── Subject-Specific Icons ──────────────────────────────────────────────────
const IconPhysics = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <ellipse cx="12" cy="12" rx="3" ry="9" transform="rotate(45 12 12)" />
    <ellipse cx="12" cy="12" rx="3" ry="9" transform="rotate(-45 12 12)" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

const IconChemistry = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M10 2h4" />
    <path d="M12 2v7" />
    <path d="M8.5 9h7" />
    <path d="M8.5 9L4 19a2 2 0 0 0 1.7 3h12.6a2 2 0 0 0 1.7-3L15.5 9" />
    <path d="M6.5 16h11" />
  </svg>
);

const IconMathematics = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M18 7H6l6 5-6 5h12" />
  </svg>
);

const IconDefaultSubject = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z" />
  </svg>
);

const getSubjectIcon = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('physic')) return <IconPhysics />;
  if (lower.includes('chemist')) return <IconChemistry />;
  if (lower.includes('math')) return <IconMathematics />;
  return <IconDefaultSubject />;
};

function SubjectList() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubjects();
  }, [examId]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.getSubjects(examId);
      setSubjects(response.data || []);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubject = (subjectId) => {
    navigate(`/subjects/${subjectId}/chapters`);
  };

  return (
    <div className="list-page">
      <div className="container">
        <h1>Subjects</h1>
        <button className="back-button" onClick={() => navigate('/exams')}>← Back</button>

        {loading ? (
          <div className="loading">Loading subjects...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : subjects.length === 0 ? (
          <div className="empty-state">No subjects available</div>
        ) : (
          <div className="items-grid">
            {subjects.map((subject) => (
              <div key={subject._id} className="item-card" onClick={() => handleSelectSubject(subject.subject_id)}>
                 <div className="item-icon">
                   {getSubjectIcon(subject.name)}
                 </div>
                <h2>{subject.name}</h2>
                <button className="item-button">Select →</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SubjectList;
