import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './NavBar.css';

const NavBar = ({ onStart }) => {
  const navigate = useNavigate();

  return (
    <nav className="app-nav">
      <div className="nav-left" onClick={() => navigate('/') } style={{cursor: 'pointer'}}>
        <div className="brand">Elevare</div>
      </div>
      <div className="nav-links">
        <NavLink to="/" className={({isActive}) => isActive ? 'active' : ''}>Home</NavLink>
        <NavLink to="/form" className={({isActive}) => isActive ? 'active' : ''}>Profile</NavLink>
        <NavLink to="/aptitude" className={({isActive}) => isActive ? 'active' : ''}>Aptitude</NavLink>
        <NavLink to="/results" className={({isActive}) => isActive ? 'active' : ''}>Results</NavLink>
        <NavLink to="/career" className={({isActive}) => isActive ? 'active' : ''}>Career</NavLink>
        <NavLink to="/mentors" className={({isActive}) => isActive ? 'active' : ''}>Mentors</NavLink>
        <NavLink to="/challenge" className={({isActive}) => isActive ? 'active' : ''}>Challenge</NavLink>
        <NavLink to="/tracker" className={({isActive}) => isActive ? 'active' : ''}>Tracker</NavLink>
      </div>
      <div className="nav-actions">
        <button className="btn-outline" onClick={() => onStart ? onStart() : navigate('/form')}>Get Started</button>
      </div>
    </nav>
  );
};

export default NavBar;
