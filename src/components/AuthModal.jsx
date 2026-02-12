import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthModal({ visible, onClose, initialTab = 'signin' }) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sign in fields
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign up fields
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirm, setSignUpConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [yearGroup, setYearGroup] = useState('');
  const [examBoard, setExamBoard] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [targetGrade, setTargetGrade] = useState('');

  if (!visible) return null;

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(signInEmail, signInPassword);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    if (signUpPassword !== signUpConfirm) {
      setError('Passwords do not match');
      return;
    }
    if (signUpPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(signUpEmail, signUpPassword, {
        displayName,
        yearGroup,
        examBoard,
        schoolName,
        targetGrade,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}>&times;</button>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'signin' ? 'active' : ''}`}
            onClick={() => { setTab('signin'); setError(''); }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => { setTab('signup'); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="auth-form">
            <label>
              Email
              <input
                type="email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </label>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="auth-form">
            <label>
              Email <span className="auth-required">*</span>
              <input
                type="email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label>
              Password <span className="auth-required">*</span>
              <input
                type="password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>
            <label>
              Confirm Password <span className="auth-required">*</span>
              <input
                type="password"
                value={signUpConfirm}
                onChange={(e) => setSignUpConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </label>
            <label>
              Display Name
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
            <label>
              Year Group
              <select value={yearGroup} onChange={(e) => setYearGroup(e.target.value)}>
                <option value="">Select...</option>
                {[7, 8, 9, 10, 11, 12, 13].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </label>
            <label>
              Exam Board
              <select value={examBoard} onChange={(e) => setExamBoard(e.target.value)}>
                <option value="">Select...</option>
                {['AQA', 'Edexcel', 'OCR', 'WJEC', 'SQA', 'Other'].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </label>
            <label>
              School Name
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Optional"
              />
            </label>
            <label>
              Target Grade
              <input
                type="text"
                value={targetGrade}
                onChange={(e) => setTargetGrade(e.target.value)}
                placeholder="e.g. 7, A*"
              />
            </label>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
        )}

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button className="auth-google" onClick={handleGoogle} disabled={loading}>
          <svg viewBox="0 0 24 24" width="18" height="18" className="auth-google-icon">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
