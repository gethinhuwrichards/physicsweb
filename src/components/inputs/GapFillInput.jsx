import React, { useMemo } from 'react';
import { renderLatex } from '../../utils/renderLatex';

export default function GapFillInput({ part, value, onChange, disabled, autoMarkResult }) {
  const answers = value || [];

  const renderedText = useMemo(() => renderLatex(part.text), [part.text]);

  const renderedSegments = useMemo(
    () =>
      part.segments.map(seg => {
        if (typeof seg === 'string') return { type: 'text', html: renderLatex(seg) };
        return { type: 'blank', index: seg.blank };
      }),
    [part.segments]
  );

  function handleBlankChange(blankIndex, val) {
    const next = [...answers];
    next[blankIndex] = val;
    onChange(next);
  }

  function dropdownClass(blankIndex) {
    if (!autoMarkResult) return 'gf-dropdown';
    const r = autoMarkResult.results[blankIndex];
    return 'gf-dropdown' + (r ? (r.isCorrect ? ' correct' : ' incorrect') : '');
  }

  return (
    <div>
      <div className="part-text" dangerouslySetInnerHTML={{ __html: renderedText }} />
      <div className="gf-word-bank">
        {part.wordBank.map((word, i) => (
          <strong key={i}>{word}</strong>
        ))}
      </div>
      <p className="gf-sentence">
        {renderedSegments.map((seg, i) => {
          if (seg.type === 'text') {
            return <span key={i} dangerouslySetInnerHTML={{ __html: seg.html }} />;
          }
          const blankIdx = seg.index;
          return (
            <span key={i} className="gf-blank-wrapper">
              <select
                className={dropdownClass(blankIdx)}
                value={answers[blankIdx] || ''}
                onChange={e => handleBlankChange(blankIdx, e.target.value)}
                disabled={disabled}
              >
                <option value="">---</option>
                {part.wordBank.map((word, wi) => (
                  <option key={wi} value={word}>{word}</option>
                ))}
              </select>
              {autoMarkResult && autoMarkResult.results[blankIdx] && !autoMarkResult.results[blankIdx].isCorrect && (
                <span className="gf-correct-answer">
                  {autoMarkResult.results[blankIdx].correctAnswer}
                </span>
              )}
            </span>
          );
        })}
      </p>
    </div>
  );
}
