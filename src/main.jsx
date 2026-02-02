import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import { ProgressProvider } from './contexts/ProgressContext';
import App from './App';
import '../css/style.css';

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <ProgressProvider>
      <App />
    </ProgressProvider>
  </AuthProvider>
);
