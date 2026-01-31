import React, { useState } from 'react';
import { countAnsweredForSubtopic } from '../utils/storage';
import ConfirmModal from './ConfirmModal';

export default function SubtopicSelection({ mainTopic, scores, onSelectSubtopic, onResetAll }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const hasAnyScores = mainTopic.subtopics.some(
    (sub) => countAnsweredForSubtopic(sub.id) > 0
  );

  return (
    <section>
      {hasAnyScores && (
        <div className="section-header-row reset-only">
          <button
            className="reset-all-btn"
            onClick={() => setShowConfirm(true)}
          >
            Reset all
          </button>
        </div>
      )}

      {showConfirm && (
        <ConfirmModal
          message={`Are you sure? All questions in ${mainTopic.name} will be reset.`}
          onConfirm={() => {
            onResetAll();
            setShowConfirm(false);
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {mainTopic.subtopics.length === 0 ? (
        <p
          style={{
            marginTop: 20,
            padding: 30,
            textAlign: 'center',
            color: 'var(--text-secondary)',
            background: 'var(--bg-surface)',
            borderRadius: 8,
            fontStyle: 'italic',
          }}
        >
          No subtopics available yet.
        </p>
      ) : (
        <div className="subtopic-grid">
          {mainTopic.subtopics.map((sub) => {
            const totalQs = sub.questionCount || 0;
            const answeredQs = countAnsweredForSubtopic(sub.id);
            const counterText =
              totalQs > 0 ? `${answeredQs} / ${totalQs} answered` : '';

            return (
              <button
                key={sub.id}
                className="subtopic-btn"
                onClick={() => onSelectSubtopic(sub.id, sub.file)}
              >
                <span className="btn-name">{sub.name}</span>
                {counterText && (
                  <span className="btn-counter">{counterText}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
