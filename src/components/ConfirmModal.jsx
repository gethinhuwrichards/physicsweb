import React from 'react';

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-message">{message}</p>
        <div className="confirm-buttons">
          <button className="confirm-ok" onClick={onConfirm}>OK</button>
          <button className="confirm-cancel" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
