import React, { useEffect, useState, useRef } from 'react';
import './Mentorship.css';
import defaultAvatar from '../../assets/download (7).jpg';
import { useParams, useLocation } from 'react-router-dom';

const MentorProfile = ({ mentor: propMentor, onBack, onStartSession }) => {
  const { mentorId } = useParams();
  const location = useLocation();
  const [mentor, setMentor] = useState(propMentor || location?.state?.mentor || null);

  // If navigation provided a mentor (for example after starting a session), update local state
  useEffect(() => {
    if (location?.state?.mentor) {
      setMentor(location.state.mentor);
    }
  }, [location?.state?.mentor]);
  
  useEffect(() => {
    // If we don't have a mentor object via props, fetch by ID from the API
    async function fetchMentor() {
      if (!propMentor && !location?.state?.mentor && mentorId) {
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/mentors/${mentorId}/`);
          const data = await res.json();
          setMentor(data);
        } catch (e) {
          console.error('Failed to fetch mentor', e);
        }
      }
    }
    fetchMentor();
  }, [propMentor, mentorId]);

  if (!mentor) return <div style={{padding: '2rem', color: '#cfe7ff'}}>Loading mentor...</div>;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function load() {
      const sessionId = mentor?.session?.id;
      if (sessionId) {
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/mentorship/sessions/${sessionId}/messages/`);
          const data = await res.json();
          setMessages(data);
        } catch (e) {
          console.error('Failed to load messages', e);
        }
      } else {
        setMessages([{ id: Date.now(), from: 'mentor', content: `Hello! I'm ${mentor.name}. How can I help?` }]);
      }
    }
    load();
  }, [mentor]);

  // Normalize avatar source (prefer absolute URLs; fall back to bundled asset for local paths)
  let avatarSrc = defaultAvatar;
  if (mentor?.avatar_url) {
    const url = mentor.avatar_url;
    if (/^https?:\/\//i.test(url)) {
      avatarSrc = url;
    } else if (url.startsWith('/assets') || url.startsWith('/avatars') || url.includes('download')) {
      avatarSrc = defaultAvatar;
    } else {
      avatarSrc = url;
    }
  } else if (mentor?.avatarUrl) {
    avatarSrc = mentor.avatarUrl;
  }

  const sendMessage = async () => {
    if (!input.trim()) return;
    const msg = { sender: 'user', content: input };
    setMessages((prev) => [...prev, { id: Date.now(), from: 'user', content: input }]);
    setInput('');

    const sessionId = mentor?.session?.id;
    if (sessionId) {
      try {
        await fetch(`http://127.0.0.1:8000/api/mentorship/sessions/${sessionId}/messages/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg),
        });
      } catch (e) {
        console.error('Failed to save message', e);
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="mentor-profile-container wavy-glass">
      <button className="back-btn" onClick={onBack}>Back to mentors</button>
      <div className="profile-card wavy-glass">
        <img src={avatarSrc} alt={mentor.name} />
        <div className="profile-info">
          <h2>{mentor.name}</h2>
          <p className="expertise">{mentor.expertise}</p>
          <p className="bio">{mentor.bio}</p>
          <div className="profile-actions">
            <button className="btn-primary" onClick={() => onStartSession(mentor)}>Start Session</button>
          </div>
        </div>
      </div>

      {/* Embedded chat */}
  <div className="mentor-chat-container wavy-glass" style={{ marginTop: '1.5rem' }}>
        <header>
          <h2>Message {mentor.name}</h2>
        </header>
        <div className="chat-history">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.from}`}>
              {msg.content}
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>
        <div className="chat-input-area">
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default MentorProfile;
