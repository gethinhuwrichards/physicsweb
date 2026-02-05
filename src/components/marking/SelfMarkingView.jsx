import React, { useMemo, useState, useEffect, useRef } from 'react';
import { renderLatex } from '../../utils/renderLatex';
import { parseMarkScheme } from '../../utils/parseMarkScheme';
import MarkingPointRow from './MarkingPointRow';

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
  onReportBug,
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
  const isFirst = currentSelfMarkIdx === 0;
  const isLast = currentSelfMarkIdx === reviewParts.length - 1;

  // Track whether user has visited the last part at least once
  const [hasVisitedLast, setHasVisitedLast] = useState(isLast);
  useEffect(() => {
    if (isLast) setHasVisitedLast(true);
  }, [isLast]);

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

  // Submit button pulse when it becomes available
  const canSubmit = allPartsFullyDecided && hasVisitedLast;

  const totalMarks = useMemo(
    () => question.parts.reduce((sum, p) => sum + p.marks, 0),
    [question.parts]
  );

  const totalScore = useMemo(() => {
    return question.parts.reduce((sum, part, idx) => {
      const partDecisions = markingDecisions[idx];
      if (!partDecisions) return sum;
      const partPoints = parseMarkScheme(part.markScheme);
      let score = 0;
      partDecisions.forEach((d, i) => {
        if (d === true && partPoints[i]) score += partPoints[i].marks;
      });
      return sum + Math.min(score, part.marks);
    }, 0);
  }, [question.parts, markingDecisions]);

  const totalScoreClass = totalScore === 0
    ? 'score-zero'
    : totalScore >= totalMarks
      ? 'score-full'
      : 'score-partial';

  const handleReportBug = onReportBug || (() => {});

  // Track whether point 1 has ever been decided (prevents trace replay on un-click)
  const [hasDecidedFirst, setHasDecidedFirst] = useState(false);
  useEffect(() => { setHasDecidedFirst(false); }, [currentSelfMarkIdx]);
  useEffect(() => { if (decisions[0] !== null) setHasDecidedFirst(true); }, [decisions]);

  // Progressive reveal: show marking points one at a time for self-marked parts
  const [maxRevealed, setMaxRevealed] = useState(1);
  const prevPartRef = useRef(currentSelfMarkIdx);

  useEffect(() => {
    if (isAutoMarked) { setMaxRevealed(points.length); return; }

    let consecutive = 0;
    for (let i = 0; i < decisions.length; i++) {
      if (decisions[i] !== null) consecutive++;
      else break;
    }
    const reveal = Math.min(consecutive + 1, points.length);

    if (prevPartRef.current !== currentSelfMarkIdx) {
      prevPartRef.current = currentSelfMarkIdx;
      setMaxRevealed(reveal);
    } else {
      setMaxRevealed(prev => Math.max(prev, reveal));
    }
  }, [currentSelfMarkIdx, decisions, isAutoMarked, points.length]);


  // Render single/equation choice as plain text review
  function renderChoiceReview() {
    const result = autoMarkResults[partIndex];
    const selectedIdx = answers[partIndex];
    const renderedOptions = part.options.map(opt => renderLatex(opt));

    return (
      <div className="review-options-list">
        {renderedOptions.map((optHtml, i) => {
          const letter = String.fromCharCode(65 + i);
          const isSelected = i === selectedIdx;
          const isCorrectAnswer = i === part.correctAnswer;
          let className = 'review-option-item';
          if (isSelected && isCorrectAnswer) className += ' review-correct';
          else if (isSelected && !isCorrectAnswer) className += ' review-incorrect';
          else if (isCorrectAnswer) className += ' review-was-correct';

          return (
            <div key={i} className={className}>
              <span className="review-option-letter">{letter}.</span>
              <span className="review-option-text" dangerouslySetInnerHTML={{ __html: optHtml }} />
              {isSelected && isCorrectAnswer && <span className="review-badge badge-correct">Correct</span>}
              {isSelected && !isCorrectAnswer && <span className="review-badge badge-incorrect">Your answer</span>}
              {isCorrectAnswer && !isSelected && <span className="review-badge badge-missed">Correct answer</span>}
            </div>
          );
        })}
      </div>
    );
  }

  // Render multi-choice as plain text review
  function renderMultiChoiceReview() {
    const result = autoMarkResults[partIndex];
    const selected = answers[partIndex] || [];
    const renderedOptions = part.options.map(opt => renderLatex(opt));

    return (
      <div className="review-options-list">
        {renderedOptions.map((optHtml, i) => {
          const letter = String.fromCharCode(65 + i);
          const isSelected = selected.includes(i);
          const isCorrect = part.correctAnswers.includes(i);
          let className = 'review-option-item';
          if (isSelected && isCorrect) className += ' review-correct';
          else if (isSelected && !isCorrect) className += ' review-incorrect';
          else if (isCorrect) className += ' review-was-correct';

          return (
            <div key={i} className={className}>
              <span className="review-option-letter">{letter}.</span>
              <span className="review-option-text" dangerouslySetInnerHTML={{ __html: optHtml }} />
              {isSelected && isCorrect && <span className="review-badge badge-correct">Correct</span>}
              {isSelected && !isCorrect && <span className="review-badge badge-incorrect">Your answer</span>}
              {isCorrect && !isSelected && <span className="review-badge badge-missed">Correct answer</span>}
            </div>
          );
        })}
      </div>
    );
  }

  // Render gap-fill as plain text review
  function renderGapFillReview() {
    const result = autoMarkResults[partIndex];
    const gapAnswers = answers[partIndex] || [];
    const renderedSegments = part.segments.map(seg => {
      if (typeof seg === 'string') return { type: 'text', html: renderLatex(seg) };
      return { type: 'blank', index: seg.blank };
    });

    return (
      <p className="review-gap-sentence">
        {renderedSegments.map((seg, i) => {
          if (seg.type === 'text') {
            return <span key={i} dangerouslySetInnerHTML={{ __html: seg.html }} />;
          }
          const blankIdx = seg.index;
          const userAnswer = gapAnswers[blankIdx] || '---';
          const gapResult = result?.results?.[blankIdx];
          const isCorrect = gapResult?.isCorrect;

          return (
            <span key={i}>
              <span className={`review-gap-answer ${isCorrect ? 'gap-correct' : 'gap-incorrect'}`}>
                {userAnswer}
              </span>
              {!isCorrect && gapResult?.correctAnswer && (
                <span className="review-gap-correction">{gapResult.correctAnswer}</span>
              )}
            </span>
          );
        })}
      </p>
    );
  }

  // Render tick-box table as plain text review
  function renderTickBoxReview() {
    const result = autoMarkResults[partIndex];
    const userAnswers = answers[partIndex] || [];
    const columnHeaders = part.columnHeaders || [];

    return (
      <table className="review-tick-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}></th>
            {columnHeaders.map((header, i) => (
              <th key={i}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {part.rows.map((row, ri) => {
            const rowResult = result?.results?.[ri];
            const isCorrect = rowResult?.isCorrect;
            const userChoice = userAnswers[ri];
            return (
              <tr key={ri} className={isCorrect ? 'review-tick-row-correct' : 'review-tick-row-incorrect'}>
                <td style={{ textAlign: 'left' }} dangerouslySetInnerHTML={{ __html: renderLatex(row.label) }} />
                {columnHeaders.map((_, ci) => {
                  const isSelected = userChoice === ci;
                  const isCorrectCol = part.rows[ri].correctColumn === ci;
                  return (
                    <td key={ci} className={isSelected ? 'review-tick-selected' : ''}>
                      {isSelected && <span className="review-tick-indicator">{isCorrect ? '\u2713' : '\u2717'}</span>}
                      {!isSelected && isCorrectCol && <span style={{ color: 'var(--color-correct-text)', fontSize: '0.8rem' }}>{'\u2713'}</span>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  // Render numerical display (shared between auto and self-marked)
  function renderNumericalDisplay(isCorrectNumerical) {
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
            <span className={`numerical-display-answer ${isCorrectNumerical ? 'correct' : 'incorrect'}`}>
              {numericalResult?.userAnswer || 'No answer'}
              {part.showUnit && part.unit ? ` ${part.unit}` : ''}
            </span>
          </div>
          {!isCorrectNumerical && (
            <div className="numerical-correct-answer">
              Correct answer: {numericalResult?.correctAnswer}{part.showUnit && part.unit ? ` ${part.unit}` : ''}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderAutoMarkedAnswer() {
    switch (part.type) {
      case 'single-choice':
      case 'equation-choice':
        return renderChoiceReview();
      case 'multi-choice':
        return renderMultiChoiceReview();
      case 'gap-fill':
        return renderGapFillReview();
      case 'tick-box-table':
        return renderTickBoxReview();
      case 'short-numerical':
        return renderNumericalDisplay(true);
      default:
        return null;
    }
  }

  function renderSelfMarkedAnswer() {
    if (part.type === 'short-numerical') {
      return renderNumericalDisplay(false);
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
        <div className="self-marking-header-left">
          <span className="self-marking-title">
            <span className="self-marking-title-text">{isAutoMarked ? 'Review' : 'Self Marking'}</span>
            <span className={`self-mark-badge ${isAutoMarked ? 'badge-auto' : 'badge-self'}`}>
              {isAutoMarked ? 'Auto Marked' : 'Mark Required'}
            </span>
          </span>
        </div>
        <div className="self-marking-header-center">
          <button className="bug-report-btn self-marking-report-btn" onClick={handleReportBug}>
            Report Bug
          </button>
        </div>
        <div className="self-marking-header-right">
          <span className="self-marking-counter">
            Part ({part.partLabel}) &mdash; {currentSelfMarkIdx + 1} of {reviewParts.length}
          </span>
        </div>
      </div>

      <div className="self-marking-panels">
        <div className="self-marking-left">
          <h3 className="self-marking-panel-heading">
            {isAutoMarked ? 'Your Answer' : "Your Answer"}
          </h3>
          <div
            className="self-marking-question-text"
            dangerouslySetInnerHTML={{ __html: renderedQuestion }}
          />
          {isAutoMarked ? renderAutoMarkedAnswer() : renderSelfMarkedAnswer()}
        </div>

        <div className="self-marking-right">
          <h3 className="self-marking-panel-heading">Mark Scheme</h3>
          {!isAutoMarked && (
            <div className="self-mark-hint-banner">
              Compare your answer with the marking points below. Award or deny each point using the buttons.
            </div>
          )}
          <div className="self-marking-points">
            {points.map((point, i) => {
              if (!isAutoMarked && i >= maxRevealed) return null;
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
                  highlight={!isAutoMarked && i === 0 && !hasDecidedFirst}
                />
              );
            })}
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
        <div className="self-marking-submit-group">
          <button
            className={`self-marking-submit${canSubmit ? ' ready-pulse' : ''}`}
            onClick={onSubmitMarks}
            disabled={!canSubmit}
          >
            Submit Marks
          </button>
          <div className={`self-marking-score ${totalScoreClass}`}>
            <span className="score-label-text">Score:</span>&nbsp;{totalScore} / {totalMarks}
          </div>
        </div>
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
