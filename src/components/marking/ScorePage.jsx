import React, { useState } from 'react';
import ConfirmModal from '../ConfirmModal';
import BugReportModal from '../BugReportModal';

export default function ScorePage({
  score,
  maxScore,
  onTryAnother,
  onReview,
  onReset,
  questionTitle,
  questionId,
  subtopicName,
  mainTopicName,
  aiModeEnabled = false,
  onAIReview,
  aiError,
  hasSelfMarkParts = false,
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [bugReportOpen, setBugReportOpen] = useState(false);

  let colorClass = 'score-color-partial';
  let emoji = '\u{1F642}';
  if (score === maxScore) { colorClass = 'score-color-full'; emoji = '\u{1F973}'; }
  else if (score === 0) { colorClass = 'score-color-zero'; emoji = '\u{1F914}'; }

  const showAIReview = aiModeEnabled && hasSelfMarkParts && onAIReview;

  return (
    <div className="score-page-overlay">
      <div className="score-page-content">
        <div className="score-page-score">
          <div className={`score-page-value ${colorClass}`}>
            <span className="score-page-earned">{score}</span>
            <span className="score-page-separator"> / </span>
            <span className="score-page-total">{maxScore}</span>
          </div>
          <div className="score-page-label">Marks</div>
          <div className="score-page-emoji">{emoji}</div>
        </div>

        {aiError && (
          <div className="score-page-ai-error">
            AI review unavailable &mdash; try again or review manually.
          </div>
        )}

        <div className="score-page-actions">
          <div className="score-page-primary">
            <button className="score-page-btn-primary" onClick={() => onTryAnother(score, maxScore)}>
              Try another question
            </button>
            {showAIReview ? (
              <button className="score-page-btn-primary" onClick={onAIReview}>
                AI Review
              </button>
            ) : (
              <button className="score-page-btn-primary" onClick={onReview}>
                Review answer
              </button>
            )}
          </div>
          <div className="score-page-secondary">
            {showAIReview && (
              <>
                <button className="score-page-link" onClick={onReview}>
                  Review answer
                </button>
                <span className="score-page-secondary-sep">&middot;</span>
              </>
            )}
            <button className="score-page-link" onClick={() => setShowConfirm(true)}>
              Reset question
            </button>
            <span className="score-page-secondary-sep">&middot;</span>
            <button className="score-page-link" onClick={() => setBugReportOpen(true)}>
              Report bug
            </button>
          </div>
        </div>
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
