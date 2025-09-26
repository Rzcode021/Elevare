import React, { useEffect, useState } from 'react';
import './Mentorship.css';
import MentorCard from './MentorCard';
import { useNavigate } from 'react-router-dom';


const MentorList = ({ mentors: initialMentors, onSelect }) => {
  const [mentors, setMentors] = useState(initialMentors || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState(null);

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

  // Frontend fallback demo mentors to display when backend has none (useful for local dev)
  const demoMentors = [
    { id: 'd1', name: 'Jane Doe', expertise: 'Software Engineering', bio: 'Senior engineer with 10+ years in full-stack.', avatar_url: '/assets/download (7).jpg', tags: ['React','Node','Backend'], rating: 4.8 },
    { id: 'd2', name: 'John Smith', expertise: 'Data Science', bio: 'Data scientist specializing in ML and analytics.', avatar_url: '/assets/download (7).jpg', tags: ['Python','ML','Pandas'], rating: 4.7 },
    { id: 'd3', name: 'Aisha Khan', expertise: 'Product Management', bio: 'PM with a focus on education tech.', avatar_url: '/assets/download (7).jpg', tags: ['PM','Roadmaps','Stakeholders'], rating: 4.6 },
  ];

  const navigate = useNavigate();
  const handleView = (mentor) => {
    if (onSelect) return onSelect(mentor);
    navigate(`/mentors/${mentor.id}`, { state: { mentor } });
  };
  const handleMessage = (mentor) => {
    // Try to create a session on the server, then navigate to profile with session
    (async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/mentors/${mentor.id}/start-session/`, { method: 'POST' });
        if (res.ok) {
          const session = await res.json();
          const mentorWithSession = { ...mentor, session };
          navigate(`/mentors/${mentor.id}`, { state: { mentor: mentorWithSession } });
          return;
        }
      } catch (e) {
        console.error('Failed to start session:', e);
      }
      // fallback to view if start-session failed
      handleView(mentor);
    })();
  };

  // build tag set for quick filters
  const tags = Array.from(new Set((mentors || []).flatMap((m) => m.tags || []))).slice(0, 12);

  const effectiveMentors = (mentors && mentors.length > 0) ? mentors : demoMentors;

  const filtered = (effectiveMentors || []).filter((m) => {
    if (activeTag && !(m.tags || []).includes(activeTag)) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (m.name || '').toLowerCase().includes(q) || (m.expertise || '').toLowerCase().includes(q) || (m.bio || '').toLowerCase().includes(q);
  });

  return (
    <div className="mentor-list-container">
      <div className="mentor-list-header">
        <div>
          <h2>Find a Mentor</h2>
          <p className="subtle">Browse experienced mentors and start a session in one click.</p>
        </div>
        <div className="mentor-list-controls">
          <input aria-label="Search mentors" placeholder="Search by name, skill or bio" className="mentor-search" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button type="button" className="btn-primary" onClick={loadMentors}>{loading ? 'Refreshing...' : 'Refresh'}</button>
        </div>
      </div>

      {error && <div style={{color: '#ffb3b3', marginBottom: '0.5rem'}}>{error}</div>}

      <div className="mentor-filter-row">
        <div className="mentor-filter-tags">
          <button className={`mentor-filter-chip ${activeTag ? '' : 'active' }`} onClick={() => setActiveTag(null)}>All</button>
          {tags.map((t) => (
            <button key={t} className={`mentor-filter-chip ${activeTag === t ? 'active' : ''}`} onClick={() => setActiveTag(activeTag === t ? null : t)}>{t}</button>
          ))}
        </div>
        <div style={{color: '#bcd8ff'}}>{filtered.length} mentors</div>
      </div>

      {filtered.length === 0 && !loading ? (
        <div style={{color: '#cfe7ff'}}>No mentors found.</div>
      ) : (
        <div className="mentor-unique-grid">
          {filtered.map((mentor) => (
            <MentorCard key={mentor.id} mentor={mentor} onView={handleView} onMessage={handleMessage} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MentorList;
