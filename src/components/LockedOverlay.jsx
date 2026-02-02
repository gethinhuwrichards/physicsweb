import React from 'react';

export default function LockedOverlay({ reason, onSignIn }) {
  return (
    <div className="locked-overlay" onClick={(e) => { e.stopPropagation(); if (onSignIn) onSignIn(); }}>
      <span className="lock-icon">&#x1F512;</span>
      <span className="locked-text">{reason}</span>
    </div>
  );
}
