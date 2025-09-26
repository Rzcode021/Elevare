import React, { useEffect, useState } from 'react';
import './Mentorship.css';
import defaultAvatar from '../../assets/download (7).jpg';
import { useNavigate } from 'react-router-dom';


const MentorList = ({ mentors: initialMentors, onSelect }) => {
  const [mentors, setMentors] = useState(initialMentors || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadMentors = async () => {
    if (initialMentors) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/mentors/');
      const data = await res.json();
      console.log('Fetched mentors:', data);
      setMentors(data || []);
    } catch (e) {
      console.error('Failed to load mentors', e);
      setError('Failed to load mentors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMentors();
  }, [initialMentors]);

  const navigate = useNavigate();
  const handleClick = (mentor) => {
    console.log('Mentor clicked:', mentor);
    if (onSelect) return onSelect(mentor);
    navigate(`/mentors/${mentor.id}`, { state: { mentor } });
  };

  return (
    <div className="mentor-list-container">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem'}}>
        <h2>Available Mentors</h2>
        <div style={{display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
          <div style={{color: '#bcd8ff', fontSize: '0.95rem'}}>{loading ? 'Loading...' : `${mentors.length} mentors`}</div>
          <button type="button" className="btn-primary" onClick={loadMentors} style={{padding: '0.45rem 0.9rem'}}>Refresh</button>
        </div>
      </div>

      {error && <div style={{color: '#ffb3b3', marginBottom: '0.5rem'}}>{error}</div>}

      {mentors.length === 0 && !loading ? (
        <div style={{color: '#cfe7ff'}}>No mentors found.</div>
      ) : (
        <ul className="mentor-list">
          {mentors.map((mentor) => {
            // Normalize avatar: prefer absolute URLs; if backend returns a local path, use imported asset
            let avatarSrc = defaultAvatar;
            if (mentor.avatar_url) {
              const url = mentor.avatar_url;
              if (/^https?:\/\//i.test(url)) {
                avatarSrc = url;
              } else if (url.startsWith('/assets') || url.startsWith('/avatars') || url.includes('download')) {
                // backend points to a local file; use the bundled default asset
                avatarSrc = defaultAvatar;
              } else {
                avatarSrc = url; // try using whatever was provided
              }
            } else if (mentor.avatarUrl) {
              avatarSrc = mentor.avatarUrl;
            }

            return (
              <li key={mentor.id} onClick={() => handleClick(mentor)} className="mentor-card">
                <img src={avatarSrc} alt={mentor.name} />
                <div className="mentor-info">
                  <h3>{mentor.name}</h3>
                  <p>{mentor.expertise}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default MentorList;
