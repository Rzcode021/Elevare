import React, { useState } from 'react';
import './Mentorship.css';

const SessionAgenda = ({ agendaItems, onAddItem }) => {
  const [newItemText, setNewItemText] = useState('');

  const addItem = () => {
    if (!newItemText.trim()) return;
    onAddItem(newItemText);
    setNewItemText('');
  };

  return (
    <div className="session-agenda-container">
      <h2>Session Agenda</h2>
      <ul>
        {agendaItems.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
      <input
        type="text"
        placeholder="Add agenda item"
        value={newItemText}
        onChange={(e) => setNewItemText(e.target.value)}
      />
      <button onClick={addItem}>Add Item</button>
    </div>
  );
};

export default SessionAgenda;
