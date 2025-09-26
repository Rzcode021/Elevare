import './LandingPage.css';
import React from 'react';

const LandingPage = ({ onStart, onNavigate }) => {
  return (
    <div className="landing-container">
      <main className="landing-main">
        <h1>Welcome to Career Companion AI</h1>
        <p>Discover your ideal career path with AI-powered assessments and real-world challenges.</p>
        <button
          type="button"
          className="start-btn"
          onClick={onStart}
        >
          Get Started
        </button>
      </main>
    </div>
  );
};

export default LandingPage;
