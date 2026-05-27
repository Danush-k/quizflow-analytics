import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">📚</span>
          <span className="brand-text">Quiz App</span>
        </Link>
        
        <ul className="nav-menu">
          <li>
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Home
            </Link>
          </li>
          <li>
            <Link 
              to="/exams" 
              className={`nav-link ${location.pathname === '/exams' ? 'active' : ''}`}
            >
              Exams
            </Link>
          </li>
          <li>
            <Link 
              to="/analytics" 
              className={`nav-link ${location.pathname === '/analytics' ? 'active' : ''}`}
            >
              Analytics
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
