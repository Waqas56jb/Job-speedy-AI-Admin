import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { LanguageProvider } from './contexts/LanguageContext';

import AdminDashboard from './components/AdminDashboard';
import CandidateManagementPage from './components/CandidateManagementPage';
import CandidateDetailPage from './components/CandidateDetailPage';
import JobManagementPage from './components/JobManagementPage';
import AIToolsPage from './components/AIToolsPage';
import ClientsPage from './components/ClientsPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import AnonymizedProfilePage from './components/AnonymizedProfilePage';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/candidates" element={<CandidateManagementPage />} />
          <Route path="/candidates/:id" element={<CandidateDetailPage />} />
          <Route path="/candidates/:id/anonymized" element={<AnonymizedProfilePage />} />
          <Route path="/jobs" element={<JobManagementPage />} />
          <Route path="/ai-tools" element={<AIToolsPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          { /* Settings page removed */ }
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
