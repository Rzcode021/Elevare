import React, { useState, useEffect } from 'react';
import AptitudeQuestion from './AptitudeQuestion';
import './AptitudeTest.css';
import { useNavigate } from 'react-router-dom';

const AptitudeTest = ({ onComplete, questions: propQuestions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Process backend questions - NO FALLBACK TO DEFAULTS
  const questions = Array.isArray(propQuestions) && propQuestions.length > 0
    ? propQuestions.map((q, idx) => ({
        id: q.id || q.question_id || idx + 1,
        type: q.type || (q.options ? 'single' : q.scale ? 'scale' : 'single'),
        question: q.questionText || q.question_text || q.question || q.prompt || 'Question',
        options: q.options || q.choices || [],
        scale: q.scale || (q.options && q.options.length) || 5,
        category: q.category || 'General'
      }))
    : null;

  // Show error if no questions available
  useEffect(() => {
    if (!questions && propQuestions === null) {
      // If propQuestions is null, it means we're still loading
      setIsLoading(true);
    } else if (!questions && propQuestions === undefined) {
      // If propQuestions is undefined, it means there was an error
      setError('No assessment questions available. Please ensure the n8n webhook is properly configured.');
    } else if (questions) {
      // If we have questions, stop loading
      setIsLoading(false);
    }
  }, [questions, propQuestions]);

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

  // Show error state if no questions available
  if (error || !questions) {
    return (
      <div className="aptitude-test-container">
        <div className="error-state">
          <h2>⚠️ Assessment Not Available</h2>
          <p>{error || 'No questions available from the assessment system.'}</p>
          <div className="error-details">
            <h3>This could be because:</h3>
            <ul>
              <li>The n8n webhook is not properly configured</li>
              <li>The webhook is returning an invalid response</li>
              <li>There's a network connectivity issue</li>
            </ul>
          </div>
          <button 
            onClick={() => window.location.href = '/form'} 
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="aptitude-test-container">
        <div className="loading-state">
          <h2>🔄 Generating Your Assessment...</h2>
          <p>Please wait while our AI generates your personalized assessment questions. This may take up to 2 minutes.</p>
          <div className="loading-spinner"></div>
          <div className="loading-tips">
            <h4>💡 What's happening:</h4>
            <ul>
              <li>Analyzing your profile information</li>
              <li>Generating personalized questions</li>
              <li>Preparing your assessment</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="aptitude-test-container">
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>
      <div className="question-header">
        <h3>Question {currentIndex + 1} of {questions.length}</h3>
        {questions[currentIndex]?.category && (
          <span className="question-category">{questions[currentIndex].category}</span>
        )}
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
