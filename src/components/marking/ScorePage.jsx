import React, { useState } from 'react';
import ConfirmModal from '../ConfirmModal';
import BugReportModal from '../BugReportModal';

export default function ScorePage({ score, maxScore, onTryAnother, onReview, onReset, questionTitle, questionId, subtopicName, mainTopicName }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [bugReportOpen, setBugReportOpen] = useState(false);

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
        <button className="score-page-btn-secondary" onClick={() => setShowConfirm(true)}>
          Reset question
        </button>
        <button className="bug-report-btn" onClick={() => setBugReportOpen(true)}>
          Report Bug
        </button>
      </div>
      {showConfirm && (
        <ConfirmModal
          message="Are you sure you want to reset this question?"
          onConfirm={onReset}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      <BugReportModal
        visible={bugReportOpen}
        onClose={() => setBugReportOpen(false)}
        questionTitle={questionTitle}
        questionId={questionId}
        subtopicName={subtopicName}
        mainTopicName={mainTopicName}
      />
    </div>
  );
}
