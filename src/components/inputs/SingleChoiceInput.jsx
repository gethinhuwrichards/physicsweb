import React, { useMemo } from 'react';
import { renderLatex } from '../../utils/renderLatex';

export default function SingleChoiceInput({ part, value, onChange, disabled, autoMarkResult }) {
  const renderedOptions = useMemo(
    () => part.options.map(opt => renderLatex(opt)),
    [part.options]
  );

  return (
    <div className="mc-options">
      {renderedOptions.map((optHtml, i) => {
        const letter = String.fromCharCode(65 + i);
        let extraClass = '';
        if (autoMarkResult) {
          if (i === part.correctAnswer) extraClass = 'correct';
          else if (i === autoMarkResult.selectedIndex && !autoMarkResult.isCorrect) extraClass = 'incorrect';
        }
        return (
          <label className={`mc-option ${extraClass}`} key={i}>
            <input
              type="radio"
              name={`mc-${part.partLabel}`}
              value={i}
              checked={value === i}
              onChange={() => onChange(i)}
              disabled={disabled}
            />
            <span><strong>{letter}.</strong> <span dangerouslySetInnerHTML={{ __html: optHtml }} /></span>
          </label>
        );
      })}
    </div>
  );
}
