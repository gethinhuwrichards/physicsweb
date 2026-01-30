import React from 'react';
import { countAnsweredForSubtopic } from '../utils/storage';

export default function SubtopicSelection({ mainTopic, scores, onSelectSubtopic, onBack }) {
  return (
    <section>
      <button className="back-btn" onClick={onBack}>
        &larr; Back to Topics
      </button>
      <h2>{mainTopic.name}</h2>

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
