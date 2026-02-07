import React from 'react';
import { renderLatex } from '../../utils/renderLatex';

function renderOptionContent(opt) {
  if (typeof opt === 'object' && opt.image) {
    return <img src={`images/${opt.image}`} alt="" className="mc-option-image" />;
  }
  return <span dangerouslySetInnerHTML={{ __html: renderLatex(opt) }} />;
}

export default function MultiChoiceInput({ part, value, onChange, disabled, autoMarkResult }) {
  const selected = value || [];
  const selectCount = part.selectCount || part.correctAnswers.length;
  const remaining = selectCount - selected.length;
  const hasImageOptions = part.options.some(opt => typeof opt === 'object' && opt.image);

  function handleToggle(index) {
    if (selected.includes(index)) {
      onChange(selected.filter(i => i !== index));
    } else if (selected.length < selectCount) {
      onChange([...selected, index]);
    }
  }

  return (
    <div>
      <div className="mc-selection-info">
        Select {selectCount}
        {!disabled && (
          <span className="mc-selection-remaining">
            {remaining > 0
              ? ` \u2014 ${remaining} selection${remaining > 1 ? 's' : ''} remaining`
              : ' \u2014 all selected'}
          </span>
        )}
      </div>
      <div className={`mc-options${hasImageOptions ? ' mc-options-grid' : ''}`}>
        {part.options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          const isChecked = selected.includes(i);
          const atLimit = selected.length >= selectCount;

          let extraClass = '';
          if (autoMarkResult) {
            const correctSet = new Set(autoMarkResult.correctAnswers);
            if (correctSet.has(i)) extraClass = 'correct';
            else if (isChecked && !correctSet.has(i)) extraClass = 'incorrect';
          }

          return (
            <label className={`mc-option${hasImageOptions ? ' mc-option-image-label' : ''} ${extraClass}`} key={i}>
              <input
                type="checkbox"
                value={i}
                checked={isChecked}
                onChange={() => handleToggle(i)}
                disabled={disabled || (!isChecked && atLimit)}
              />
              <span><strong>{letter}.</strong> {renderOptionContent(opt)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
