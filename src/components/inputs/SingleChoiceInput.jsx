import React, { useMemo } from 'react';
import { renderLatex } from '../../utils/renderLatex';

function renderOptionContent(opt) {
  if (typeof opt === 'object' && opt.image) {
    return <img src={`images/${opt.image}`} alt="" className="mc-option-image" />;
  }
  return <span dangerouslySetInnerHTML={{ __html: renderLatex(opt) }} />;
}

export default function SingleChoiceInput({ part, value, onChange, disabled, autoMarkResult }) {
  const hasImageOptions = part.options.some(opt => typeof opt === 'object' && opt.image);

  return (
    <div className={`mc-options${hasImageOptions ? ' mc-options-grid' : ''}`}>
      {part.options.map((opt, i) => {
        const letter = String.fromCharCode(65 + i);
        let extraClass = '';
        if (autoMarkResult) {
          if (i === part.correctAnswer) extraClass = 'correct';
          else if (i === autoMarkResult.selectedIndex && !autoMarkResult.isCorrect) extraClass = 'incorrect';
        }
        return (
          <label className={`mc-option${hasImageOptions ? ' mc-option-image-label' : ''} ${extraClass}`} key={i}>
            <input
              type="radio"
              name={`mc-${part.partLabel}`}
              value={i}
              checked={value === i}
              onChange={() => onChange(i)}
              disabled={disabled}
            />
            <span><strong>{letter}.</strong> {renderOptionContent(opt)}</span>
          </label>
        );
      })}
    </div>
  );
}
