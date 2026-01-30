import React from 'react';

export default function ExtendedWrittenInput({ part, value, onChange, disabled }) {
  const maxLength = part.marks * 400;
  const length = (value || '').length;
  const nearLimit = length >= maxLength * 0.9;

  return (
    <div className="ew-container">
      <textarea
        className="ew-textarea"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        readOnly={disabled}
        maxLength={maxLength}
        placeholder="Type your answer here..."
        rows={6}
      />
      <div className={`ew-char-counter${nearLimit ? ' near-limit' : ''}`}>
        {length} / {maxLength}
      </div>
    </div>
  );
}
