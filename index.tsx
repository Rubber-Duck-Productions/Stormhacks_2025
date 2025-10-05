import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import LandingPage from './components/LandingPage';
import Chatbot from './components/Chatbot';
import './main.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<App />} />
        <Route path="/chatbot" element={<Chatbot />} />
      </Routes>
    </Router>
  </React.StrictMode>
);