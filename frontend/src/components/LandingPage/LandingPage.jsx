import './LandingPage.css';
import React, { useState } from 'react';

const Navbar = ({ onNavigate }) => {
  const [active, setActive] = useState('home');
  const navItems = [{label:'Home', key:'home'}, {label:'Aptitude Test', key:'aptitude'}, {label:'Career Paths', key:'careers'}, {label:'Mentors', key:'mentors'}, {label:'Contact', key:'contact'}];

  const handleClick = (key) => {
    setActive(key);
    try {
      onNavigate && onNavigate(key);
    } catch (e) {
      // fallback: update hash so user can navigate manually
      window.location.hash = `#${key}`;
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={() => handleClick('home')} role="button" tabIndex={0}>Elevare</div>
      <ul className="navbar-links">
        {navItems.map((item) => (
          <li key={item.key}>
            <button type="button" className={`nav-link ${active === item.key ? 'active' : ''}`} onClick={() => handleClick(item.key)}>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

const LandingPage = ({ onStart, onNavigate }) => {
  return (
    <div className="landing-container">
      <Navbar onNavigate={onNavigate} />
      <main className="landing-main">
        <h1>Welcome to Career Companion AI</h1>
        <p>Discover your ideal career path with AI-powered assessments and real-world challenges.</p>
        <button
          type="button"       // explicit type to avoid default submit behavior
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
