import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../styles/List.css';

// ─── Subject-Specific Icons ──────────────────────────────────────────────────
const IconPhysics = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#128C7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', filter: 'drop-shadow(0 2px 4px rgba(18, 140, 126, 0.15))' }}>
    <ellipse cx="12" cy="12" rx="3" ry="9" transform="rotate(45 12 12)" />
    <ellipse cx="12" cy="12" rx="3" ry="9" transform="rotate(-45 12 12)" />
    <ellipse cx="12" cy="12" rx="9" ry="3" />
    <circle cx="12" cy="12" r="3" fill="#25D366" />
  </svg>
);

const IconChemistry = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#128C7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', filter: 'drop-shadow(0 2px 4px rgba(18, 140, 126, 0.15))' }}>
    <path d="M10 2h4" />
    <path d="M12 2v6" />
    <path d="M8 9h8" />
    <path d="M19 17l-4-8V2H9v7l-4 8a3 3 0 0 0 2.5 4.5h11A3 3 0 0 0 19 17z" />
    <path d="M7 16h10v2a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" fill="#25D366" opacity="0.8" />
  </svg>
);

const IconMathematics = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#128C7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', filter: 'drop-shadow(0 2px 4px rgba(18, 140, 126, 0.15))' }}>
    <rect x="3" y="3" width="18" height="18" rx="3" fill="#d9fdd3" stroke="#25D366" strokeWidth="2" />
    <path d="M16 8H8l4 4-4 4h8" stroke="#128C7E" strokeWidth="2.5" />
  </svg>
);

const IconBiology = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#128C7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', filter: 'drop-shadow(0 2px 4px rgba(18, 140, 126, 0.15))' }}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-9 8.2z" fill="#25D366" opacity="0.8" />
    <path d="M9 22v-3" />
    <path d="M11 20l3.5-3.5" />
  </svg>
);

const IconDefaultSubject = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#128C7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', filter: 'drop-shadow(0 2px 4px rgba(18, 140, 126, 0.15))' }}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" fill="#25D366" opacity="0.4" />
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z" />
  </svg>
);

const getSubjectIcon = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('physic')) return <IconPhysics />;
  if (lower.includes('chemist')) return <IconChemistry />;
  if (lower.includes('math')) return <IconMathematics />;
  if (lower.includes('biolog')) return <IconBiology />;
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
