import React from 'react';

export default function ScorePage({ score, maxScore, onTryAnother, onReview, onReset }) {
  let colorClass = 'score-color-partial';
  if (score === maxScore) colorClass = 'score-color-full';
  else if (score === 0) colorClass = 'score-color-zero';

  return (
    <div className="score-page-overlay">
      <div className="score-page-score">
        <div className={`score-page-value ${colorClass}`}>{score} / {maxScore}</div>
        <div className="score-page-label">Marks</div>
      </div>
      <div className="score-page-buttons">
        <button className="score-page-btn-primary" onClick={() => onTryAnother(score, maxScore)}>
          Try another question
        </button>
        <button className="score-page-btn-primary" onClick={onReview}>
          Review answer
        </button>
        <button className="score-page-btn-secondary" onClick={onReset}>
          Reset question
        </button>
      </div>
    </div>
  );
}
