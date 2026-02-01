import React, { useMemo } from 'react';
import { renderLatex } from '../../utils/renderLatex';

export default function TickBoxTableInput({ part, value, onChange, disabled, autoMarkResult }) {
  const selections = value || [];

  const renderedRows = useMemo(
    () => part.rows.map(row => renderLatex(row.label)),
    [part.rows]
  );

  const handleSelect = (rowIndex, colIndex) => {
    if (disabled) return;
    const next = [...selections];
    next[rowIndex] = colIndex;
    onChange(next);
  };

  return (
    <table className="tick-box-table">
      <thead>
        <tr>
          <th></th>
          {part.columnHeaders.map((header, i) => (
            <th key={i} className="tick-box-col-header">{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {part.rows.map((row, ri) => {
          let rowClass = '';
          if (autoMarkResult) {
            const isCorrect = autoMarkResult.results[ri]?.isCorrect;
            rowClass = isCorrect ? 'correct' : 'incorrect';
          }
          return (
            <tr key={ri} className={rowClass}>
              <td
                className="tick-box-row-label"
                dangerouslySetInnerHTML={{ __html: renderedRows[ri] }}
              />
              {part.columnHeaders.map((_, ci) => (
                <td key={ci} className="tick-box-cell">
                  <input
                    type="radio"
                    name={`tick-${part.partLabel}-row-${ri}`}
                    checked={selections[ri] === ci}
                    onChange={() => handleSelect(ri, ci)}
                    disabled={disabled}
                  />
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
