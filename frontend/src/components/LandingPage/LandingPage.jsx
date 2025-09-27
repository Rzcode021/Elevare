import './LandingPage.css';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = ({ onStart, onNavigate }) => {
  const navigate = useNavigate();

  const handleTrial = () => {
    // Prefer parent handler when provided (keeps App control), otherwise use router navigate
    if (typeof onNavigate === 'function') return onNavigate('trial');
    return navigate('/trial');
  };

  return (
    <div className="landing-container">
      <main className="landing-main wavy-glass">
        <h1>Welcome to Career Companion AI</h1>
        <p>Discover your ideal career path with AI-powered assessments and real-world challenges.</p>
        <div className="landing-cta">
          <button
            type="button"
            className="start-btn"
            onClick={onStart}
          >
            Get Started
          </button>
          <button type="button" className="trial-btn" onClick={handleTrial}>
            Try 14-day trial
          </button>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
