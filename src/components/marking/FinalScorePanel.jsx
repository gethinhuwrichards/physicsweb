import React, { useState } from 'react';

export default function FinalScorePanel({ score, maxScore, onDone, onReset }) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="final-score-panel">
      <h3>Total Score</h3>
      <p className="final-score-value">{score} / {maxScore} marks</p>
      <div className="final-score-buttons">
        <button className="bank-score-btn" onClick={() => onDone(score, maxScore)}>Done</button>
        {!showConfirm ? (
          <button className="reset-question-btn" onClick={() => setShowConfirm(true)}>Reset</button>
        ) : (
          <div className="reset-inline-confirm">
            <span>Are you sure?</span>
            <button className="reset-confirm-ok" onClick={onReset}>OK</button>
            <button className="reset-confirm-cancel" onClick={() => setShowConfirm(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
