import React from 'react';

export default function QuestionHeader({ title, totalMarks, onBack, onReportBug }) {
  return (
    <div className="question-header">
      <div className="question-header-title-row">
        <div className="question-header-left">
          {onBack && (
            <button className="question-back-btn" onClick={onBack} aria-label="Back to question select">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M12.5 4L6.5 10l6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <h2>{title}</h2>
        </div>
        {onReportBug && (
          <button className="bug-report-btn" onClick={onReportBug}>
            Report Bug
          </button>
        )}
      </div>
      <p className="total-marks">Total: {totalMarks} mark{totalMarks !== 1 ? 's' : ''}</p>
    </div>
  );
}
