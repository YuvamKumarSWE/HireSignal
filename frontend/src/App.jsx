import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';
import Auth from './Auth';
import Interview from './Interview';
import Results from './Results';
import ProfilePage from './ProfilePage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/interview/:sessionId" element={<Interview />} />
        <Route path="/results/:sessionId" element={<Results />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Router>
  );
}

export default App;
