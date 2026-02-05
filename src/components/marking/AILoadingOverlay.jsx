import React from 'react';

export default function AILoadingOverlay() {
  return (
    <div className="ai-loading-overlay">
      <div className="ai-loading-content">
        <div className="ai-spinner"></div>
        <p>AI is reviewing your answers...</p>
      </div>
    </div>
  );
}
