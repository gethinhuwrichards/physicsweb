import React from 'react';

export default function AIMarkingToggle({ enabled, onToggle }) {
  return (
    <button
      className={`ai-toggle${enabled ? ' ai-toggle-enabled' : ''}`}
      onClick={onToggle}
      aria-label={enabled ? 'Disable AI marking' : 'Enable AI marking'}
      title={enabled ? 'AI marking enabled' : 'AI marking disabled'}
    >
      AI
    </button>
  );
}
