import React, { useState } from 'react';
import { countAnsweredForSubtopic } from '../utils/storage';

export default function TopicSelection({ topics, scores, onSelectTopic, onBack, onResetAll }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const hasAnyScores = Object.keys(scores).length > 0;

  return (
    <section>
      <button className="back-btn" onClick={onBack}>
        &larr; Back
      </button>
      <div className="section-header-row">
        <h2>Select a Topic</h2>
        {hasAnyScores && (
          <button
            className="reset-all-btn"
            onClick={() => setShowConfirm(true)}
          >
            Reset all
          </button>
        )}
      </div>

      {showConfirm && (
        <div className="reset-confirm">
          <p>Are you sure? All questions on the subject will be reset.</p>
          <div className="reset-confirm-buttons">
            <button
              className="reset-confirm-ok"
              onClick={() => {
                onResetAll();
                setShowConfirm(false);
              }}
            >
              OK
            </button>
            <button
              className="reset-confirm-cancel"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="topic-grid">
        {topics.map((topic) => {
          const totalQs = topic.subtopics.reduce(
            (sum, s) => sum + (s.questionCount || 0),
            0
          );
          const answeredQs = topic.subtopics.reduce(
            (sum, s) => sum + countAnsweredForSubtopic(s.id),
            0
          );
          const counterText = totalQs > 0 ? `${answeredQs} / ${totalQs} answered` : '';

          return (
            <button
              key={topic.id}
              className="topic-btn"
              onClick={() => onSelectTopic(topic.id)}
            >
              <span className="btn-name">{topic.name}</span>
              {counterText && <span className="btn-counter">{counterText}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
