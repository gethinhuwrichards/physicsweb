import React, { useState, useRef } from 'react';

const CATEGORIES = [
  'Question displays incorrectly',
  'Mark scheme displays incorrectly',
  'Question makes no sense',
  'Image or diagram is broken/missing',
  'Another issue',
];

export default function BugReportModal({ visible, onClose, questionTitle, questionId, subtopicName, mainTopicName }) {
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState('');
  const [details, setDetails] = useState('');
  const formRef = useRef(null);

  if (!visible) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(formRef.current.action, {
        method: 'POST',
        body: new FormData(formRef.current),
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        alert('Thank you for reporting this issue!');
        setCategory('');
        setDetails('');
        onClose();
      } else {
        alert('There was a problem submitting your report. Please try again.');
      }
    } catch {
      alert('There was a problem submitting your report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bugreport-overlay" onClick={onClose}>
      <div className="bugreport-box" onClick={e => e.stopPropagation()}>
        <h2>Report a Problem</h2>

        <form
          ref={formRef}
          action="https://formspree.io/f/xwvqpbjp"
          method="POST"
          onSubmit={handleSubmit}
        >
          <input type="hidden" name="questionTitle" value={questionTitle || ''} />
          <input type="hidden" name="questionId" value={questionId || ''} />
          <input type="hidden" name="subtopic" value={subtopicName || ''} />
          <input type="hidden" name="mainTopic" value={mainTopicName || ''} />

          <div className="bugreport-field">
            <label htmlFor="bugreport-category">What is the issue?</label>
            <select
              id="bugreport-category"
              name="category"
              required
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="">Select an issue...</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="bugreport-field">
            <label htmlFor="bugreport-details">
              Fill in as much detail as you can below
            </label>
            <textarea
              id="bugreport-details"
              name="details"
              rows="4"
              placeholder="Describe the problem..."
              value={details}
              onChange={e => setDetails(e.target.value)}
            />
          </div>

          <div className="bugreport-buttons">
            <button
              type="submit"
              className="bugreport-submit-btn"
              disabled={!category || submitting}
            >
              {submitting ? 'Sending...' : 'Submit Report'}
            </button>
            <button
              type="button"
              className="bugreport-cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
