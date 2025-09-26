import React, { useState } from 'react';
import './Mentorship.css';


const SessionSummary = ({ initialNotes }) => {
  const [notes, setNotes] = useState(initialNotes || '');

  return (
    <div className="session-summary-container">
      <h2>Session Summary</h2>
      <textarea
        rows={10}
        placeholder="Write summary or next steps..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
    </div>
  );
};

export default SessionSummary;
