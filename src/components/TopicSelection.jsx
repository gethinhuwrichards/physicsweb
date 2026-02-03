import React, { useState } from 'react';
import { countAnsweredForSubtopic } from '../utils/storage';
import ConfirmModal from './ConfirmModal';

export default function TopicSelection({ topics, scores, onSelectTopic, onResetAll }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const hasAnyScores = Object.keys(scores).length > 0;

  return (
    <section className="topic-selection">
      <div className={`section-header-row${hasAnyScores ? ' reset-only' : ''}`}>
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
        <ConfirmModal
          message="Are you sure? All questions on the subject will be reset."
          onConfirm={() => {
            onResetAll();
            setShowConfirm(false);
          }}
          onCancel={() => setShowConfirm(false)}
        />
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
          const isEmpty = totalQs === 0;

          return (
            <button
              key={topic.id}
              className={`topic-btn${isEmpty ? ' topic-btn-empty' : ''}`}
              onClick={() => !isEmpty && onSelectTopic(topic.id)}
              disabled={isEmpty}
            >
              <span className="btn-name">{topic.name}</span>
              {isEmpty
                ? <span className="btn-counter">Coming soon</span>
                : counterText && <span className="btn-counter">{counterText}</span>
              }
            </button>
          );
        })}
      </div>
    </section>
  );
}
