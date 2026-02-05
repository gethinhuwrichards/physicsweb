import React, { useState } from 'react';
import ConfirmModal from '../ConfirmModal';

export default function FinalScorePanel({ score, maxScore, onDone, onReset, aiModeEnabled = false, onAIReview }) {
  const [showConfirm, setShowConfirm] = useState(false);

  let colorClass = 'score-partial';
  if (score === maxScore) colorClass = 'score-full';
  else if (score === 0) colorClass = 'score-zero';

  return (
    <div className="final-score-panel">
      <h3>Total Score</h3>
      <p className={`final-score-value ${colorClass}`}>{score} / {maxScore} marks</p>
      <div className="final-score-buttons">
        <button className="bank-score-btn" onClick={() => onDone(score, maxScore)}>Done</button>
        {aiModeEnabled && onAIReview && (
          <button className="bank-score-btn" onClick={onAIReview}>AI Review</button>
        )}
        <button className="reset-question-btn" onClick={() => setShowConfirm(true)}>Reset</button>
      </div>
      {showConfirm && (
        <ConfirmModal
          message="Are you sure you want to reset this question?"
          onConfirm={onReset}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
