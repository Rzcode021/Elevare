import React, { useState } from 'react';
import './CareerChallenge.css';

const sampleTasks = [
  'Research your dream career options.',
  'Create a LinkedIn profile or improve your existing one.',
  'Take an online course about a skill you want to learn.',
  'Network with professionals in your field.',
  // Add more tasks up to 14
];

const DailyTask = ({ day, onComplete, onPrev }) => {
  const [completed, setCompleted] = useState(false);

  const handleComplete = () => {
    setCompleted(true);
    if (onComplete) onComplete(day);
  };

  return (
    <div className="daily-task-container">
      <h2>Day {day}</h2>
      <p>{sampleTasks[day - 1] || 'No task for today, rest and prepare!'}</p>
      <div className="task-actions">
        {day > 1 && <button onClick={onPrev}>Previous Day</button>}
        <button disabled={completed} onClick={handleComplete}>
          {completed ? 'Completed' : 'Mark as Complete'}
        </button>
      </div>
    </div>
  );
};

export default DailyTask;
