import React, { useState, useEffect } from 'react';
import ConfirmModal from './ConfirmModal';
import LockedOverlay from './LockedOverlay';
import { useAccessControl } from '../hooks/useAccessControl';
import { FEATURE_AUTH_UI } from '../lib/featureFlags';

function QuestionItem({ q, index, scores, onSelectQuestion, onResetRequest, user, profile, subtopicId, onSignIn }) {
  const { isLocked: rawLocked, reason } = useAccessControl(subtopicId, index, user, profile);
  const isLocked = FEATURE_AUTH_UI ? rawLocked : false;
  const totalMarks = q.parts.reduce((sum, p) => sum + p.marks, 0);
  const saved = scores[q.id];

  let progressClass = '';
  if (saved) {
    const pct = saved.max > 0 ? saved.score / saved.max : 0;
    progressClass = pct >= 1 ? 'progress-full' : pct === 0 ? 'progress-zero' : 'progress-partial';
  }

  return (
    <div
      data-question-id={q.id}
      className={`question-item${isLocked ? ' question-item-locked' : ''}`}
      onClick={isLocked ? undefined : () => onSelectQuestion(q.id)}
    >
      <span className="question-item-title">
        {q.title}{' '}
        <span className={`difficulty-label difficulty-${q.difficulty || 'medium'}`}>
          ({q.difficulty || 'medium'})
        </span>
      </span>
      <div className="question-item-right">
        <span className="marks">{totalMarks} marks</span>
        {saved ? (
          <>
            <div className="question-progress">
              <div
                className={`question-progress-fill ${progressClass}`}
                style={{
                  width: `${Math.max(Math.round((saved.score / saved.max) * 100), 6)}%`,
                }}
              />
              <span className="question-progress-text">
                {saved.score} / {saved.max}
              </span>
            </div>
            <button
              className="question-reset-btn"
              onClick={(e) => { e.stopPropagation(); onResetRequest(q.id); }}
            >
              Reset
            </button>
          </>
        ) : (
          <>
            <div className="question-progress">
              <span className="question-progress-text">&ndash;</span>
            </div>
            <button
              className="question-reset-btn"
              style={{ visibility: 'hidden' }}
            >
              Reset
            </button>
          </>
        )}
      </div>
      {isLocked && <LockedOverlay reason={reason} onSignIn={onSignIn} />}
    </div>
  );
}

export default function QuestionList({
  title,
  questions,
  scores,
  scrollToId,
  onSelectQuestion,
  onResetQuestion,
  onResetAll,
  user,
  profile,
  subtopicId,
  onSignIn,
}) {
  const [pendingResetId, setPendingResetId] = useState(null);
  const [showResetAll, setShowResetAll] = useState(false);

  useEffect(() => {
    if (!scrollToId) return;
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-question-id="${scrollToId}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [scrollToId]);

  const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
  const sorted = [...questions].sort(
    (a, b) => (difficultyOrder[a.difficulty] ?? 1) - (difficultyOrder[b.difficulty] ?? 1)
  );

  const hasAnyScores = questions.some((q) => scores[q.id]);

  const handleConfirmReset = () => {
    if (pendingResetId) {
      onResetQuestion(pendingResetId);
      setPendingResetId(null);
    }
  };

  return (
    <section>
      {hasAnyScores && (
        <div className="section-header-row reset-only">
          <button
            className="reset-all-btn"
            onClick={() => {
              setShowResetAll(true);
              setPendingResetId(null);
            }}
          >
            Reset all
          </button>
        </div>
      )}

      <div>
        {sorted.map((q, index) => (
          <QuestionItem
            key={q.id}
            q={q}
            index={index}
            scores={scores}
            onSelectQuestion={onSelectQuestion}
            onResetRequest={(id) => { setPendingResetId(id); setShowResetAll(false); }}
            user={user}
            profile={profile}
            subtopicId={subtopicId}
            onSignIn={onSignIn}
          />
        ))}
      </div>

      {showResetAll && (
        <ConfirmModal
          message={`Are you sure? All questions in ${title} will be reset.`}
          onConfirm={() => {
            onResetAll();
            setShowResetAll(false);
          }}
          onCancel={() => setShowResetAll(false)}
        />
      )}

      {pendingResetId !== null && (
        <ConfirmModal
          message="Are you sure you want to reset this question? Your saved score will be cleared."
          onConfirm={handleConfirmReset}
          onCancel={() => setPendingResetId(null)}
        />
      )}
    </section>
  );
}
