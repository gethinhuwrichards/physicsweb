import React from 'react';
import { countAnsweredForSubtopic } from '../utils/storage';

export default function TopicSelection({ topics, scores, onSelectTopic, onBack }) {
  return (
    <section>
      <button className="back-btn" onClick={onBack}>
        &larr; Back
      </button>
      <h2>Select a Topic</h2>
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
