import React, { useMemo } from 'react';
import { renderLatex } from '../../utils/renderLatex';

function renderOptionContent(opt) {
  if (typeof opt === 'object' && opt.image) {
    return <img src={`images/${opt.image}`} alt="" className="mc-option-image" />;
  }
  return <span dangerouslySetInnerHTML={{ __html: renderLatex(opt) }} />;
}

export default function SelectAndExplainInput({ part, value, onChange, disabled, autoMarkResult }) {
  const answer = value || { selectedOption: null, explanation: '' };

  const hasImageOptions = part.options.some(opt => typeof opt === 'object' && opt.image);

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
      <div className={`mc-options${hasImageOptions ? ' mc-options-grid' : ''}`}>
        {part.options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          let extraClass = '';
          if (autoMarkResult) {
            if (i === part.correctAnswer) extraClass = 'correct';
            else if (i === answer.selectedOption && !autoMarkResult.selectionCorrect) extraClass = 'incorrect';
          }
          return (
            <label className={`mc-option${hasImageOptions ? ' mc-option-image-label' : ''} ${extraClass}`} key={i}>
              <input
                type="radio"
                name={`sae-${part.partLabel}`}
                value={i}
                checked={answer.selectedOption === i}
                onChange={() => handleOptionChange(i)}
                disabled={disabled}
              />
              <span><strong>{letter}.</strong> {renderOptionContent(opt)}</span>
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
