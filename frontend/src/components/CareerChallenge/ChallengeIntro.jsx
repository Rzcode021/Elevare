import React from 'react';
import './CareerChallenge.css';

const ChallengeIntro = ({ onStart }) => (
  <div className="challenge-intro-container">
    <h1>Welcome to the 14-Day Career Challenge!</h1>
    <p>Complete daily tasks to build your skills and boost your career growth.</p>
    <button onClick={onStart}>Start Challenge</button>
  </div>
);

export default ChallengeIntro;
