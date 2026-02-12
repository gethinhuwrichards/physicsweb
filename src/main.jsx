import React from 'react';
import { createRoot } from 'react-dom/client';
import { inject } from '@vercel/analytics';
import { AuthProvider } from './contexts/AuthContext';
import { ProgressProvider } from './contexts/ProgressContext';
import { initAnalytics } from './lib/analytics';
import App from './App';
import '../css/style.css';

inject();
initAnalytics();

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <ProgressProvider>
      <App />
    </ProgressProvider>
  </AuthProvider>
);
