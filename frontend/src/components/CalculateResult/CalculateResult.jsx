import React from 'react';
import './CalculateResult.css';

const CalculateResult = ({ results, onNext }) => {
  if (!results) return <p>Loading results...</p>;

  // Backend may return recommendations as array of objects or strings
  const recommendations = results.recommendations || results.recommended_careers || [];
  const summary = results.summary || results.explanation || results.category_scores ? `Category scores: ${JSON.stringify(results.category_scores)}` : 'No summary available.';

  return (
    <div className="calculate-result-container">
      <h2>Your Aptitude Test Analysis</h2>
      <p className="summary">{summary}</p>

      <h3>Career Recommendations</h3>
      <ul>
        {recommendations.map((rec) => {
          if (typeof rec === 'string') {
            return <li key={rec}>{rec}</li>;
          }
          const key = rec.career || JSON.stringify(rec);
          const confidence = (rec.confidence || 0) * 100;
          return (
            <li key={key}>
              {rec.career} - {isNaN(confidence) ? 'N/A' : `${confidence.toFixed(1)}%`}
            </li>
          );
        })}
      </ul>

      <button className="btn-primary" onClick={onNext}>Proceed to Career Recommendations</button>
    </div>
  );
};

export default CalculateResult;
