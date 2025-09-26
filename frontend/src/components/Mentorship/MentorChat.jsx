import React, { useState, useEffect, useRef } from 'react';
import './Mentorship.css';


const MentorChat = ({ mentor, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Load existing session messages if session exists
  useEffect(() => {
    async function loadMessages() {
      const sessionId = mentor?.session?.id || mentor?.session?.id;
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
    loadMessages();
  }, [mentor]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg = { sender: 'user', content: input };
    setMessages((prev) => [...prev, { id: Date.now(), from: 'user', content: input }]);
    setInput('');

    // Persist to backend if session exists
    const sessionId = mentor?.session?.id;
    if (sessionId) {
      fetch(`http://127.0.0.1:8000/api/mentorship/sessions/${sessionId}/messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      }).catch((e) => console.error('Failed to save message', e));
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="mentor-chat-container">
      <header>
        <button onClick={onBack}>Back</button>
        <h2>Chat with {mentor.name}</h2>
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
  );
};

export default MentorChat;
