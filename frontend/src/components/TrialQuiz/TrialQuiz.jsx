import React, { useState } from 'react';
import './TrialQuiz.css';
import { useNavigate } from 'react-router-dom';

const defaultQuestions = Array.from({length: 14}).map((_, idx) => ({
  id: idx + 1,
  question: `Trial question ${idx + 1}: which option fits you best?`,
  options: ['A', 'B', 'C', 'D']
}));

const TrialQuiz = ({ questions: propQuestions }) => {
  const questions = Array.isArray(propQuestions) ? propQuestions : defaultQuestions;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const navigate = useNavigate();

  const handleSelect = (opt) => {
    setAnswers(prev => ({...prev, [questions[index].id]: opt}));
  };

  const next = () => { if (index < questions.length - 1) setIndex(i => i + 1); };
  const prev = () => { if (index > 0) setIndex(i => i - 1); };

  const submit = () => {
    // For demo, compute a simple score: count non-empty answers
    const answered = Object.keys(answers).length;
    const percent = Math.round((answered / questions.length) * 100);
    navigate('/results', { state: { trial: true, score: percent, answered } });
  };

  return (
    <div className="trial-quiz-container">
      <h2>14-Day Trial Quiz</h2>
      <div className="trial-question">
        <div className="trial-question-text">{questions[index].question}</div>
        <div className="trial-options">
          {questions[index].options.map((opt) => (
            <button key={opt} className={`trial-opt ${answers[questions[index].id] === opt ? 'selected' : ''}`} onClick={() => handleSelect(opt)}>{opt}</button>
          ))}
        </div>
      </div>

      <div className="trial-nav">
        <button onClick={prev} disabled={index === 0}>Previous</button>
        {index < questions.length - 1 ? (
          <button onClick={next}>Next</button>
        ) : (
          <button onClick={submit}>Submit Trial</button>
        )}
      </div>
    </div>
  );
};

export default TrialQuiz;
