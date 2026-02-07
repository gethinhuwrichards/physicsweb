import React, { useMemo } from 'react';
import { renderLatex } from '../../utils/renderLatex';

export default function TableFillInput({ part, value, onChange, disabled, autoMarkResult }) {
  const answers = value || [];

  const renderedHeaders = useMemo(
    () => part.headers.map(h => renderLatex(h)),
    [part.headers]
  );

  function handleBlankChange(blankIndex, val) {
    const next = [...answers];
    next[blankIndex] = val;
    onChange(next);
  }

  function getCellClass(blankIndex) {
    if (!autoMarkResult) return 'tf-cell-input';
    const r = autoMarkResult.results[blankIndex];
    return 'tf-cell-input' + (r ? (r.isCorrect ? ' correct' : ' incorrect') : '');
  }

  return (
    <div className="tf-wrapper">
      <table className="tf-table">
        <thead>
          <tr>
            {renderedHeaders.map((html, i) => (
              <th key={i} dangerouslySetInnerHTML={{ __html: html }} />
            ))}
          </tr>
        </thead>
        <tbody>
          {part.rows.map((row, ri) => (
            <tr key={ri}>
              {row.cells.map((cell, ci) => {
                if (typeof cell === 'string') {
                  return (
                    <td key={ci} dangerouslySetInnerHTML={{ __html: renderLatex(cell) }} />
                  );
                }
                // cell is { blank: N }
                const blankIdx = cell.blank;
                return (
                  <td key={ci} className="tf-blank-cell">
                    <input
                      type="text"
                      className={getCellClass(blankIdx)}
                      value={answers[blankIdx] || ''}
                      onChange={e => handleBlankChange(blankIdx, e.target.value)}
                      disabled={disabled}
                      placeholder="..."
                      autoComplete="off"
                    />
                    {autoMarkResult && autoMarkResult.results[blankIdx] && autoMarkResult.results[blankIdx].misspelt && (
                      <span className="tf-misspelt-note">Misspelt but accepted</span>
                    )}
                    {autoMarkResult && autoMarkResult.results[blankIdx] && !autoMarkResult.results[blankIdx].isCorrect && (
                      <span className="tf-correct-answer">
                        {autoMarkResult.results[blankIdx].correctAnswer}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
