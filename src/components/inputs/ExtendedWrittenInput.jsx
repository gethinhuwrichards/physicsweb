import React from 'react';

export default function ExtendedWrittenInput({ part, value, onChange, disabled }) {
  const maxLength = part.marks * 400;
  const length = (value || '').length;
  const nearLimit = length >= maxLength * 0.9;

  return (
    <div className="ew-container">
      {!disabled && (
        <div className="ew-encouragement">
          Tip: Use key scientific terms and explain your reasoning step by step. Refer to the mark allocation for how much detail is expected.
        </div>
      )}
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
