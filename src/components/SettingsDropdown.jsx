import React, { useState, useEffect } from 'react';

export default function SettingsDropdown({ onReportBug }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="top-right-buttons">
      {onReportBug && (
        <button
          className="top-btn bug-btn"
          onClick={onReportBug}
          aria-label="Report bug"
          title="Report bug"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" width="18" height="18" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3.5L6.5 1.5M12 3.5l1.5-2" />
            <path d="M10 4a3.5 3.5 0 0 0-3.5 3.5V8h7V7.5A3.5 3.5 0 0 0 10 4Z" />
            <rect x="5.5" y="8" width="9" height="7.5" rx="2" />
            <path d="M3.5 9.5l2 .75M16.5 9.5l-2 .75M3.5 13.5l2-.75M16.5 13.5l-2-.75" />
          </svg>
        </button>
      )}
      <button
        className="top-btn theme-btn"
        onClick={() => setDark(d => !d)}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {dark ? '\u2600' : '\u263E'}
      </button>
    </div>
  );
}
