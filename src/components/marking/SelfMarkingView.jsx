import React, { useMemo } from 'react';
import { renderLatex } from '../../utils/renderLatex';
import { parseMarkScheme } from '../../utils/parseMarkScheme';
import MarkingPointRow from './MarkingPointRow';

export default function SelfMarkingView({
  question,
  selfMarkParts,
  currentSelfMarkIdx,
  answers,
  autoMarkResults,
  markingDecisions,
  lockedPoints,
  onDecide,
  onNavigate,
  onSubmitMarks,
  allPartsFullyDecided,
}) {
  const partIndex = selfMarkParts[currentSelfMarkIdx];
  const part = question.parts[partIndex];
  const points = useMemo(() => parseMarkScheme(part.markScheme), [part.markScheme]);
  const decisions = markingDecisions[partIndex] || [];
  const locked = lockedPoints[partIndex] || [];

  const renderedQuestion = useMemo(() => renderLatex(part.text), [part.text]);
  const studentAnswer = answers[partIndex] || '';
  const numericalResult = part.type === 'short-numerical' ? (autoMarkResults && autoMarkResults[partIndex]) : null;

  const renderedSelectedFormula = useMemo(() => {
    if (part.type !== 'short-numerical') return '';
    const ans = answers[partIndex] || {};
    if (ans.selectedFormula != null && part.formulas && part.formulas[ans.selectedFormula]) {
      return renderLatex(part.formulas[ans.selectedFormula]);
    }
    return '';
  }, [part, partIndex, answers]);

  const currentAllDecided = decisions.every(d => d !== null);
  const currentTally = decisions.reduce((sum, d, i) => {
    if (d === true && points[i]) return sum + points[i].marks;
    return sum;
  }, 0);
  const tallyColorClass = currentAllDecided
    ? (currentTally === 0 ? 'tally-zero' : currentTally >= part.marks ? 'tally-full' : 'tally-partial')
    : '';
  const isFirst = currentSelfMarkIdx === 0;
  const isLast = currentSelfMarkIdx === selfMarkParts.length - 1;

  return (
    <div className="self-marking-overlay">
      <div className="self-marking-header">
        <span className="self-marking-title">Self Marking</span>
        <span className="self-marking-counter">
          Part ({part.partLabel}) &mdash; {currentSelfMarkIdx + 1} of {selfMarkParts.length}
        </span>
      </div>

      <div className="self-marking-panels">
        <div className="self-marking-left">
          <h3 className="self-marking-panel-heading">Student's Answer</h3>
          <div
            className="self-marking-question-text"
            dangerouslySetInnerHTML={{ __html: renderedQuestion }}
          />
          {part.type === 'short-numerical' ? (
            <div className="numerical-display">
              {(renderedSelectedFormula || answers[partIndex]?.substitution) && (
                <div className="numerical-display-section">
                  <div className="numerical-display-label">Formula &amp; Substitution:</div>
                  {renderedSelectedFormula && (
                    <div className="numerical-display-value" dangerouslySetInnerHTML={{ __html: renderedSelectedFormula }} />
                  )}
                  {(answers[partIndex]?.substitution) && (
                    <div className="numerical-display-value">{answers[partIndex].substitution}</div>
                  )}
                </div>
              )}
              {part.requiresRearrangement && (answers[partIndex]?.rearrangement) && (
                <div className="numerical-display-section">
                  <div className="numerical-display-label">Rearrangement:</div>
                  <div className="numerical-display-value">{answers[partIndex].rearrangement}</div>
                </div>
              )}
              <div className="numerical-display-section">
                <div className="numerical-display-label">Final answer:</div>
                <div className="numerical-display-value">
                  <span className="numerical-display-answer incorrect">
                    {numericalResult?.userAnswer || 'No answer'}
                    {part.showUnit && part.unit ? ` ${part.unit}` : ''}
                  </span>
                </div>
                <div className="numerical-correct-answer">
                  Correct answer: {numericalResult?.correctAnswer}{part.showUnit && part.unit ? ` ${part.unit}` : ''}
                </div>
              </div>
            </div>
          ) : (
            <div className="self-marking-answer-display">
              {studentAnswer || <span className="self-marking-no-answer">No answer provided</span>}
            </div>
          )}
        </div>

        <div className="self-marking-right">
          <h3 className="self-marking-panel-heading">Mark Scheme</h3>
          <div className="self-marking-points">
            {points.map((point, i) => (
              <MarkingPointRow
                key={i}
                point={point}
                decision={decisions[i] ?? null}
                onDecide={(val) => onDecide(partIndex, i, val, point.marks)}
                locked={locked[i] === true}
              />
            ))}
          </div>
          <div className={`self-marking-tally ${tallyColorClass}`}>
            {currentTally} / {part.marks} mark{part.marks !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="self-marking-nav">
        <button
          className="self-marking-nav-btn"
          onClick={() => onNavigate('back')}
          disabled={isFirst}
        >
          &larr; Back
        </button>
        <button
          className="self-marking-submit"
          onClick={onSubmitMarks}
          disabled={!allPartsFullyDecided}
        >
          Submit Marks
        </button>
        <button
          className={`self-marking-nav-btn${currentAllDecided && !isLast ? ' ready-pulse' : ''}`}
          onClick={() => onNavigate('next')}
          disabled={isLast}
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
