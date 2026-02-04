import React from 'react';

export default function QuestionHeader({ title, totalMarks }) {
  return (
    <div className="question-header">
      <h2>{title}</h2>
      <p className="total-marks">Total: {totalMarks} mark{totalMarks !== 1 ? 's' : ''}</p>
    </div>
  );
}
