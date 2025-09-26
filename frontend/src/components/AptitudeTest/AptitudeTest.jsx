import React, { useState } from 'react';
import AptitudeQuestion from './AptitudeQuestion';
import './AptitudeTest.css';

const defaultQuestions = [
  {
    id: 1,
    type: 'single',
    question: 'Which subject do you enjoy the most?',
    options: ['Math', 'Science', 'Arts', 'Sports'],
  },
  {
    id: 2,
    type: 'multi',
    question: 'Select hobbies you enjoy:',
    options: ['Reading', 'Coding', 'Music', 'Sports', 'Gaming'],
  },
  {
    id: 3,
    type: 'scale',
    question: 'Rate your interest in logical reasoning (1-5):',
    scale: 5,
  },
];

const AptitudeTest = ({ onComplete, questions: propQuestions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  // Use backend questions if provided, otherwise fallback to defaults
  const questions = Array.isArray(propQuestions)
    ? propQuestions.map((q, idx) => ({
        id: q.id || q.question_id || idx + 1,
        type: q.type || (q.options ? 'single' : q.scale ? 'scale' : 'single'),
        question: q.questionText || q.question_text || q.question || q.prompt || 'Question',
        options: q.options || q.choices || [],
        scale: q.scale || (q.options && q.options.length) || 5,
      }))
    : defaultQuestions;

  const handleAnswer = (questionId, answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
  };
  const prevQuestion = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const submitTest = () => {
    onComplete(answers);
  };

  return (
    <div className="aptitude-test-container">
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>
      <AptitudeQuestion
        question={questions[currentIndex]}
        selectedAnswer={answers[questions[currentIndex].id]}
        onAnswer={(answer) => handleAnswer(questions[currentIndex].id, answer)}
      />
      <div className="navigation-buttons">
        <button onClick={prevQuestion} disabled={currentIndex === 0}>
          Previous
        </button>
        {currentIndex < questions.length - 1 ? (
          <button
            onClick={nextQuestion}
            disabled={answers[questions[currentIndex].id] === undefined || answers[questions[currentIndex].id] === null}
          >
            Next
          </button>
        ) : (
          <button
            onClick={submitTest}
            disabled={answers[questions[currentIndex].id] === undefined || answers[questions[currentIndex].id] === null}
          >
            Submit
          </button>
        )}
      </div>

      {currentIndex === questions.length - 1 && (
        <div className="summary-preview">
          <h3>Summary of your answers:</h3>
          <ul>
            {questions.map((q) => (
              <li key={q.id}>
                <b>{q.question}</b>:{" "}
                {Array.isArray(answers[q.id])
                  ? answers[q.id].join(", ")
                  : answers[q.id]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AptitudeTest;
