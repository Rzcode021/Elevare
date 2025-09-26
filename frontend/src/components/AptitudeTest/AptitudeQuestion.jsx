import React from 'react';

const AptitudeQuestion = ({ question, selectedAnswer, onAnswer }) => {
  // For multi choice toggle selection
  const handleMultiChange = (option) => {
    if (!Array.isArray(selectedAnswer)) {
      onAnswer([option]);
    } else if (selectedAnswer.includes(option)) {
      onAnswer(selectedAnswer.filter((a) => a !== option));
    } else {
      onAnswer([...selectedAnswer, option]);
    }
  };

  return (
    <div className="aptitude-question">
      <h3>{question.question}</h3>
      {question.type === 'single' && (
        <ul>
          {question.options.map((option) => (
            <li key={option}>
              <label className={selectedAnswer === option ? 'selected' : ''}>
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={selectedAnswer === option}
                  onChange={() => onAnswer(option)}
                />
                {option}
              </label>
            </li>
          ))}
        </ul>
      )}
      {question.type === 'multi' && (
        <ul>
          {question.options.map((option) => (
            <li key={option}>
              <label className={Array.isArray(selectedAnswer) && selectedAnswer.includes(option) ? 'selected' : ''}>
                <input
                  type="checkbox"
                  name={`question-${question.id}`}
                  value={option}
                  checked={Array.isArray(selectedAnswer) && selectedAnswer.includes(option)}
                  onChange={() => handleMultiChange(option)}
                />
                {option}
              </label>
            </li>
          ))}
        </ul>
      )}
      {question.type === 'scale' && (
        <div className="scale-container" role="radiogroup" aria-labelledby={`question-${question.id}`}>
          {[...Array(question.scale)].map((_, index) => {
            const value = index + 1;
            return (
              <label
                key={value}
                className={selectedAnswer === value ? 'selected scale-label' : 'scale-label'}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={value}
                  checked={selectedAnswer === value}
                  onChange={() => onAnswer(value)}
                />
                {value}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AptitudeQuestion;
