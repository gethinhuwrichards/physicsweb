import React, { useMemo } from 'react';
import { renderLatex } from '../../utils/renderLatex';
import { parseMarkScheme } from '../../utils/parseMarkScheme';
import MarkingPointRow from './MarkingPointRow';

export default function SelfMarkingView({
  question,
  selfMarkParts,
  currentSelfMarkIdx,
  answers,
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

  const currentAllDecided = decisions.every(d => d !== null);
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
          <div className="self-marking-answer-display">
            {studentAnswer || <span className="self-marking-no-answer">No answer provided</span>}
          </div>
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
          className="self-marking-nav-btn"
          onClick={() => onNavigate('next')}
          disabled={isLast || !currentAllDecided}
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
