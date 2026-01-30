import React, { useState, useEffect, useRef } from 'react';

const RATING_COLORS = {
  '': '',
  '1': '#3b1c1c',
  '2': '#3b2a1c',
  '3': '#3b351c',
  '4': '#33361c',
  '5': '#2b361c',
  '6': '#1f3322',
  '7': '#1a3328',
  '8': '#16332e',
  '9': '#123330',
  '10': '#0d3326',
};

export default function FeedbackModal() {
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ratingColor, setRatingColor] = useState('');
  const formRef = useRef(null);

  useEffect(() => {
    let visitCount = parseInt(localStorage.getItem('visitCount') || '0');
    visitCount++;
    localStorage.setItem('visitCount', visitCount.toString());

    if (visitCount >= 3 && !localStorage.getItem('feedbackCompleted')) {
      setVisible(true);
    }
  }, []);

  const close = () => {
    setVisible(false);
    localStorage.setItem('feedbackCompleted', 'true');
  };

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
        alert('Thank you for your feedback!');
        close();
      } else {
        alert('There was a problem submitting your feedback. Please try again.');
        setSubmitting(false);
      }
    } catch {
      alert('There was a problem submitting your feedback. Please try again.');
      setSubmitting(false);
    }
  };

  const handleRatingChange = (e) => {
    setRatingColor(RATING_COLORS[e.target.value] || '');
  };

  if (!visible) return null;

  return (
    <div className="feedback-overlay">
      <div className="feedback-box">
        <h2>Please provide your feedback on the site</h2>

        <form
          ref={formRef}
          action="https://formspree.io/f/xbdyjvok"
          method="POST"
          onSubmit={handleSubmit}
        >
          <div className="feedback-question">
            <label htmlFor="feedback-rating">
              How would you rate the usefulness of the website?
            </label>
            <select
              id="feedback-rating"
              name="rating"
              className="rating-dropdown"
              required
              onChange={handleRatingChange}
              style={
                ratingColor
                  ? { backgroundColor: ratingColor, color: '#e8eaf0' }
                  : {}
              }
            >
              <option value="">Select a rating...</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="feedback-question">
            <label htmlFor="feedback-suggestions">
              Please include any suggestions which you think would make the site
              better
            </label>
            <textarea
              id="feedback-suggestions"
              name="suggestions"
              rows="5"
              placeholder="Your suggestions..."
            />
          </div>

          <div className="feedback-buttons">
            <button
              type="submit"
              className="feedback-submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Sending...' : 'Submit Feedback'}
            </button>
            <button
              type="button"
              className="feedback-skip-btn"
              onClick={close}
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
