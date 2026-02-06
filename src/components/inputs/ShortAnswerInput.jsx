import React from 'react';

export default function ShortAnswerInput({ part, value, onChange, disabled, autoMarkResult }) {
  const answer = value || '';

  function getInputClass() {
    let cls = 'sa-input';
    if (autoMarkResult) {
      cls += autoMarkResult.isCorrect ? ' correct' : ' incorrect';
    }
    return cls;
  }

  return (
    <div className="sa-wrapper">
      <input
        type="text"
        className={getInputClass()}
        value={answer}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer..."
        autoComplete="off"
      />
      {autoMarkResult && autoMarkResult.misspelt && (
        <span className="sa-misspelt-note">
          Misspelt but answer still accepted
        </span>
      )}
      {autoMarkResult && !autoMarkResult.isCorrect && (
        <span className="sa-correct-answer">
          Correct answer: {autoMarkResult.correctAnswer}
        </span>
      )}
    </div>
  );
}
