import React, { useMemo } from 'react';
import { renderLatex } from '../utils/renderLatex';
import SingleChoiceInput from './inputs/SingleChoiceInput';
import MultiChoiceInput from './inputs/MultiChoiceInput';
import GapFillInput from './inputs/GapFillInput';
import ExtendedWrittenInput from './inputs/ExtendedWrittenInput';
import NumericalInput from './inputs/NumericalInput';

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
      case 'short-numerical':
        return (
          <NumericalInput
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
      <div className="part-label">({part.partLabel})</div>
      <div className="part-content">
        <div className="part-left">
          {part.type !== 'gap-fill' && (
            <div className="part-text" dangerouslySetInnerHTML={{ __html: renderedText }} />
          )}
          {part.diagram && (
            <img src={`images/${part.diagram}`} alt="Diagram" className="part-diagram" />
          )}
          <div className="part-marks">
            [{part.marks} mark{part.marks > 1 ? 's' : ''}]
          </div>
          {renderInput()}
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
