import React, { useMemo } from 'react';
import { renderLatex } from '../utils/renderLatex';
import SingleChoiceInput from './inputs/SingleChoiceInput';
import MultiChoiceInput from './inputs/MultiChoiceInput';
import GapFillInput from './inputs/GapFillInput';
import ExtendedWrittenInput from './inputs/ExtendedWrittenInput';
import CalculationInput from './inputs/CalculationInput';
import TickBoxTableInput from './inputs/TickBoxTableInput';

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
          {part.diagram && (
            <img src={`images/${part.diagram}`} alt="Diagram" className="part-diagram" />
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
