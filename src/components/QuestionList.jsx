import React, { useState, useRef } from 'react';

export default function QuestionList({
  title,
  questions,
  scores,
  onSelectQuestion,
  onResetQuestion,
  onResetAll,
}) {
  const [pendingResetId, setPendingResetId] = useState(null);
  const [showResetAll, setShowResetAll] = useState(false);
  const confirmRef = useRef(null);

  const hasAnyScores = questions.some((q) => scores[q.id]);

  const handleResetClick = (e, questionId) => {
    e.stopPropagation();
    setPendingResetId(questionId);
    setShowResetAll(false);
    setTimeout(() => {
      confirmRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 0);
  };

  const handleConfirmReset = () => {
    if (pendingResetId) {
      onResetQuestion(pendingResetId);
      setPendingResetId(null);
    }
  };

  const handleCancelReset = () => {
    setPendingResetId(null);
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

      {showResetAll && (
        <div className="reset-confirm" ref={confirmRef}>
          <p>Are you sure? All questions in {title} will be reset.</p>
          <div className="reset-confirm-buttons">
            <button
              className="reset-confirm-ok"
              onClick={() => {
                onResetAll();
                setShowResetAll(false);
              }}
            >
              OK
            </button>
            <button
              className="reset-confirm-cancel"
              onClick={() => setShowResetAll(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div>
        {questions.map((q) => {
          const totalMarks = q.parts.reduce((sum, p) => sum + p.marks, 0);
          const saved = scores[q.id];

          return (
            <div
              key={q.id}
              className="question-item"
              onClick={() => onSelectQuestion(q.id)}
            >
              <span className="question-item-title">{q.title}</span>
              <div className="question-item-right">
                <span className="marks">{totalMarks} marks</span>
                {saved ? (
                  <>
                    <div className="question-progress">
                      <div
                        className="question-progress-fill"
                        style={{
                          width: `${Math.round((saved.score / saved.max) * 100)}%`,
                        }}
                      />
                      <span className="question-progress-text">
                        {saved.score} / {saved.max}
                      </span>
                    </div>
                    <button
                      className="question-reset-btn"
                      onClick={(e) => handleResetClick(e, q.id)}
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
            </div>
          );
        })}
      </div>

      {pendingResetId !== null && (
        <div className="reset-confirm" ref={confirmRef}>
          <p>
            Are you sure you want to reset this question? Your saved score will
            be cleared.
          </p>
          <div className="reset-confirm-buttons">
            <button className="reset-confirm-ok" onClick={handleConfirmReset}>
              OK
            </button>
            <button
              className="reset-confirm-cancel"
              onClick={handleCancelReset}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
