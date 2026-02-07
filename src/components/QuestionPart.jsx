import React, { useMemo } from 'react';
import { renderLatex } from '../utils/renderLatex';
import SingleChoiceInput from './inputs/SingleChoiceInput';
import MultiChoiceInput from './inputs/MultiChoiceInput';
import GapFillInput from './inputs/GapFillInput';
import ExtendedWrittenInput from './inputs/ExtendedWrittenInput';
import CalculationInput from './inputs/CalculationInput';
import TickBoxTableInput from './inputs/TickBoxTableInput';
import MatchUpInput from './inputs/MatchUpInput';
import ShortAnswerInput from './inputs/ShortAnswerInput';
import SelectAndExplainInput from './inputs/SelectAndExplainInput';
import TableFillInput from './inputs/TableFillInput';

export default function QuestionPart({
  part,
  partIndex,
  answer,
  onAnswer,
  disabled,
  markingClass,
  autoMarkResult,
  phase,
  partScore,
  diagramOffset = 0,
  tableOffset = 0,
  onFigureClick,
  onTableClick,
}) {
  const renderedText = useMemo(() => renderLatex(part.text), [part.text]);

  function renderInput() {
    switch (part.type) {
      case 'single-choice':
      case 'equation-choice':
        return (
          <SingleChoiceInput
            part={part}
            value={answer}
            onChange={val => onAnswer(partIndex, val)}
            disabled={disabled}
            autoMarkResult={autoMarkResult}
          />
        );
      case 'multi-choice':
        return (
          <MultiChoiceInput
            part={part}
            value={answer}
            onChange={val => onAnswer(partIndex, val)}
            disabled={disabled}
            autoMarkResult={autoMarkResult}
          />
        );
      case 'gap-fill':
        return (
          <GapFillInput
            part={part}
            value={answer}
            onChange={val => onAnswer(partIndex, val)}
            disabled={disabled}
            autoMarkResult={autoMarkResult}
          />
        );
      case 'extended-written':
      case 'extended-written-levels':
        return (
          <ExtendedWrittenInput
            part={part}
            value={answer}
            onChange={val => onAnswer(partIndex, val)}
            disabled={disabled}
          />
        );
      case 'calculation':
        return (
          <CalculationInput
            part={part}
            value={answer}
            onChange={val => onAnswer(partIndex, val)}
            disabled={disabled}
            autoMarkResult={autoMarkResult}
          />
        );
      case 'tick-box-table':
        return (
          <TickBoxTableInput
            part={part}
            value={answer}
            onChange={val => onAnswer(partIndex, val)}
            disabled={disabled}
            autoMarkResult={autoMarkResult}
          />
        );
      case 'match-up':
        return (
          <MatchUpInput
            part={part}
            value={answer}
            onChange={val => onAnswer(partIndex, val)}
            disabled={disabled}
            autoMarkResult={autoMarkResult}
          />
        );
      case 'short-answer':
        return (
          <ShortAnswerInput
            part={part}
            value={answer}
            onChange={val => onAnswer(partIndex, val)}
            disabled={disabled}
            autoMarkResult={autoMarkResult}
          />
        );
      case 'select-and-explain':
        return (
          <SelectAndExplainInput
            part={part}
            value={answer}
            onChange={val => onAnswer(partIndex, val)}
            disabled={disabled}
            autoMarkResult={autoMarkResult}
          />
        );
      case 'table-fill':
        return (
          <TableFillInput
            part={part}
            value={answer}
            onChange={val => onAnswer(partIndex, val)}
            disabled={disabled}
            autoMarkResult={autoMarkResult}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className={`question-part ${markingClass || ''}`} data-part-index={partIndex}>
      <div className="part-content">
        <div className="part-left">
          {part.type !== 'gap-fill' && (
            <div className="part-text">
              <span className="part-label">({part.partLabel})</span>{' '}
              <span dangerouslySetInnerHTML={{ __html: renderedText }} />
            </div>
          )}
          {part.type === 'gap-fill' && (
            <div className="part-label-standalone">({part.partLabel})</div>
          )}
          {part.diagrams && part.diagrams.length > 0 && (
            <div className="part-diagrams-grid">
              {part.diagrams.map((file, i) => (
                <figure key={i} className="part-diagram-figure">
                  <img
                    src={`images/${file}`}
                    alt={`Fig. ${diagramOffset + i + 1}`}
                    className={`part-diagram${onFigureClick ? ' part-diagram-clickable' : ''}`}
                    onClick={onFigureClick ? () => onFigureClick(diagramOffset + i) : undefined}
                  />
                  <figcaption className="part-diagram-caption">Fig. {diagramOffset + i + 1}</figcaption>
                </figure>
              ))}
            </div>
          )}
          {part.tables && part.tables.length > 0 && (
            <div className="part-tables-grid">
              {part.tables.map((tbl, i) => {
                const tableNum = tableOffset + i + 1;
                return (
                  <div
                    key={i}
                    className={`part-table-block${onTableClick ? ' part-table-clickable' : ''}`}
                    onClick={onTableClick ? () => onTableClick(tableOffset + i) : undefined}
                  >
                    <div className="part-table-label">Table {tableNum}{tbl.caption ? `: ${tbl.caption}` : ''}</div>
                    <table className="part-inline-table">
                      <thead>
                        <tr>
                          {tbl.headers.map((h, hi) => (
                            <th key={hi} dangerouslySetInnerHTML={{ __html: renderLatex(h) }} />
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tbl.rows.map((row, ri) => (
                          <tr key={ri}>
                            {row.map((cell, ci) => (
                              <td key={ci} dangerouslySetInnerHTML={{ __html: renderLatex(cell) }} />
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
          {renderInput()}
          <div className="part-marks">
            [{part.marks} mark{part.marks > 1 ? 's' : ''}]
          </div>
          {phase === 'complete' && partScore !== undefined && (
            <div className={`part-score-badge ${
              partScore === part.marks ? 'score-full' :
              partScore === 0 ? 'score-zero' : 'score-partial'
            }`}>
              {partScore} / {part.marks} mark{part.marks > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
