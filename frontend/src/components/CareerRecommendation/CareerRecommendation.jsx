import React from 'react';
import './CareerRecommendation.css';

const CareerRecommendation = ({ recommendations, onAccept, onChallenge, onCancel }) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="recommendation-container">
        <p className="no-recommendation">
          No career matches found. Please retake the test or update your inputs.
        </p>
      </div>
    );
  }

  return (
    <div className="recommendation-container glass-card">
      <h2>Your Recommended Career Paths</h2>
      <ul className="career-list">
        {recommendations.map((career) => (
          <li key={career} className="career-item">
            {career}
          </li>
        ))}
      </ul>
      <div className="action-buttons">
        <button className="btn-primary" onClick={onAccept}>
          Accept Career Roadmap
        </button>
        <button className="btn-cancel" onClick={onCancel}>
          Cancel
        </button>
      <button className="btn-secondary" onClick={onChallenge}>
  Try 14-Day Career Challenge
</button>

      </div>

    </div>
  );
};

export default CareerRecommendation;
 