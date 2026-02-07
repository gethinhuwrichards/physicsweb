import React, { useMemo } from 'react';
import { renderLatex } from '../../utils/renderLatex';

export default function SelectAndExplainInput({ part, value, onChange, disabled, autoMarkResult }) {
  const answer = value || { selectedOption: null, explanation: '' };

  const renderedOptions = useMemo(
    () => part.options.map(opt => renderLatex(opt)),
    [part.options]
  );

  const renderedPrompt = useMemo(
    () => part.explanationPrompt ? renderLatex(part.explanationPrompt) : null,
    [part.explanationPrompt]
  );

  function handleOptionChange(idx) {
    onChange({ ...answer, selectedOption: idx });
  }

  function handleExplanationChange(e) {
    onChange({ ...answer, explanation: e.target.value });
  }

  const maxLength = (part.marks - 1) * 400;
  const length = (answer.explanation || '').length;
  const nearLimit = length >= maxLength * 0.9;

  return (
    <div className="sae-container">
      <div className="mc-options">
        {renderedOptions.map((optHtml, i) => {
          const letter = String.fromCharCode(65 + i);
          let extraClass = '';
          if (autoMarkResult) {
            if (i === part.correctAnswer) extraClass = 'correct';
            else if (i === answer.selectedOption && !autoMarkResult.selectionCorrect) extraClass = 'incorrect';
          }
          return (
            <label className={`mc-option ${extraClass}`} key={i}>
              <input
                type="radio"
                name={`sae-${part.partLabel}`}
                value={i}
                checked={answer.selectedOption === i}
                onChange={() => handleOptionChange(i)}
                disabled={disabled}
              />
              <span><strong>{letter}.</strong> <span dangerouslySetInnerHTML={{ __html: optHtml }} /></span>
            </label>
          );
        })}
      </div>

      {renderedPrompt && (
        <div className="sae-explain-prompt" dangerouslySetInnerHTML={{ __html: renderedPrompt }} />
      )}

      <div className="ew-container sae-explain-section">
        <textarea
          className="ew-textarea"
          value={answer.explanation || ''}
          onChange={handleExplanationChange}
          disabled={disabled}
          readOnly={disabled}
          maxLength={maxLength}
          placeholder="Explain your answer..."
          rows={4}
        />
        <div className={`ew-char-counter${nearLimit ? ' near-limit' : ''}`}>
          {length} / {maxLength}
        </div>
      </div>
    </div>
  );
}
