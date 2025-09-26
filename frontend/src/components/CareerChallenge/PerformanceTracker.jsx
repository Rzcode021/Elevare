import React from 'react';
import './CareerChallenge.css';
const PerformanceTracker = ({ completedDays }) => {
  const totalDays = 14;
  const percentComplete = (completedDays.length / totalDays) * 100;

  return (
    <div className="performance-tracker-container">
      <h2>Challenge Progress</h2>
      <p>
        You have completed {completedDays.length} out of {totalDays} days.
      </p>
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${percentComplete}%` }}
        ></div>
      </div>
      {percentComplete === 100 && <p>Congratulations! You completed the challenge!</p>}
    </div>
  );
};

export default PerformanceTracker;
