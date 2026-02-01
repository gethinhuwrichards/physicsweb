import React, { useMemo, useState, useEffect } from 'react';
import { renderLatex } from '../../utils/renderLatex';
import { parseMarkScheme } from '../../utils/parseMarkScheme';
import MarkingPointRow from './MarkingPointRow';
import SingleChoiceInput from '../inputs/SingleChoiceInput';
import MultiChoiceInput from '../inputs/MultiChoiceInput';
import GapFillInput from '../inputs/GapFillInput';
import NumericalInput from '../inputs/NumericalInput';
import TickBoxTableInput from '../inputs/TickBoxTableInput';

export default function SelfMarkingView({
  question,
  reviewParts,
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
  const partIndex = reviewParts[currentSelfMarkIdx];
  const part = question.parts[partIndex];
  const points = useMemo(() => parseMarkScheme(part.markScheme), [part.markScheme]);
  const decisions = markingDecisions[partIndex] || [];
  const locked = lockedPoints[partIndex] || [];

  const isAutoMarked = !selfMarkParts.includes(partIndex);

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
  const isLast = currentSelfMarkIdx === reviewParts.length - 1;

  // Delayed pulse for auto-marked parts
  const [delayedPulse, setDelayedPulse] = useState(false);
  useEffect(() => {
    setDelayedPulse(false);
    if (isAutoMarked && !isLast) {
      const timer = setTimeout(() => setDelayedPulse(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentSelfMarkIdx, isAutoMarked, isLast]);

  const nextPulse = isAutoMarked
    ? (delayedPulse && !isLast)
    : (currentAllDecided && !isLast);

  function renderAutoMarkedAnswer() {
    const result = autoMarkResults[partIndex];
    switch (part.type) {
      case 'single-choice':
      case 'equation-choice':
        return (
          <div className="auto-marked-answer">
            <SingleChoiceInput
              part={part}
              value={answers[partIndex]}
              onChange={() => {}}
              disabled={true}
              autoMarkResult={result}
            />
          </div>
        );
      case 'multi-choice':
        return (
          <div className="auto-marked-answer">
            <MultiChoiceInput
              part={part}
              value={answers[partIndex] || []}
              onChange={() => {}}
              disabled={true}
              autoMarkResult={result}
            />
          </div>
        );
      case 'gap-fill':
        return (
          <div className="auto-marked-answer">
            <GapFillInput
              part={part}
              value={answers[partIndex] || []}
              onChange={() => {}}
              disabled={true}
              autoMarkResult={result}
            />
          </div>
        );
      case 'tick-box-table':
        return (
          <div className="auto-marked-answer">
            <TickBoxTableInput
              part={part}
              value={answers[partIndex] || []}
              onChange={() => {}}
              disabled={true}
              autoMarkResult={result}
            />
          </div>
        );
      case 'short-numerical':
        // Correct numerical — show as correct
        return (
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
                <span className="numerical-display-answer correct">
                  {numericalResult?.userAnswer || 'No answer'}
                  {part.showUnit && part.unit ? ` ${part.unit}` : ''}
                </span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  function renderSelfMarkedAnswer() {
    if (part.type === 'short-numerical') {
      return (
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
      );
    }
    return (
      <div className="self-marking-answer-display">
        {studentAnswer || <span className="self-marking-no-answer">No answer provided</span>}
      </div>
    );
  }

  return (
    <div className="self-marking-overlay">
      <div className={`self-marking-header${isAutoMarked ? ' auto-marked-header' : ''}`}>
        <span className="self-marking-title">
          {isAutoMarked ? 'Review \u2014 Auto Marked' : 'Self Marking \u2014 Mark Your Answer'}
        </span>
        <span className="self-marking-counter">
          Part ({part.partLabel}) &mdash; {currentSelfMarkIdx + 1} of {reviewParts.length}
        </span>
      </div>

      <div className="self-marking-panels">
        <div className="self-marking-left">
          <h3 className="self-marking-panel-heading">Student's Answer</h3>
          <div
            className="self-marking-question-text"
            dangerouslySetInnerHTML={{ __html: renderedQuestion }}
          />
          {isAutoMarked ? renderAutoMarkedAnswer() : renderSelfMarkedAnswer()}
        </div>

        <div className="self-marking-right">
          <h3 className="self-marking-panel-heading">Mark Scheme</h3>
          <div className="self-marking-points">
            {points.map((point, i) => {
              const isRearrangement = part.type === 'short-numerical'
                && part.requiresRearrangement && points.length === 3 && i === 1;
              return (
                <MarkingPointRow
                  key={i}
                  point={point}
                  decision={decisions[i] ?? null}
                  onDecide={(val) => onDecide(partIndex, i, val, point.marks)}
                  locked={locked[i] === true}
                  pointNumber={i + 1}
                  dependencyNote={isRearrangement ? '(depends on substitution marking point)' : null}
                />
              );
            })}
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
          className={`self-marking-nav-btn${nextPulse ? ' ready-pulse' : ''}`}
          onClick={() => onNavigate('next')}
          disabled={isLast || !currentAllDecided}
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
