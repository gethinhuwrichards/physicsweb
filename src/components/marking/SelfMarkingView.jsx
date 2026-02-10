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
}) {
  const partIndex = reviewParts[currentSelfMarkIdx];
  const part = question.parts[partIndex];
  const points = useMemo(() => parseMarkScheme(part.markScheme), [part.markScheme]);
  const decisions = markingDecisions[partIndex] || [];
  const locked = lockedPoints[partIndex] || [];

  const isAutoMarked = !selfMarkParts.includes(partIndex);

  const renderedQuestion = useMemo(() => renderLatex(part.text), [part.text]);
  const studentAnswer = answers[partIndex] || '';
  const numericalResult = part.type === 'calculation' ? (autoMarkResults && autoMarkResults[partIndex]) : null;

  const renderedSelectedEquation = useMemo(() => {
    if (part.type !== 'calculation') return '';
    const ans = answers[partIndex] || {};
    if (ans.selectedEquation != null && part.equations && part.equations[ans.selectedEquation]) {
      return renderLatex(part.equations[ans.selectedEquation]);
    }
    return '';
  }, [part, partIndex, answers]);

  const isLevelsType = part.type === 'extended-written-levels';

  const awardedMarks = useMemo(() => {
    if (!isLevelsType) return 0;
    let count = 0;
    decisions.forEach((d, i) => {
      if (d === true && points[i]) count += points[i].marks;
    });
    return count;
  }, [isLevelsType, decisions, points]);

  const capReached = isLevelsType && awardedMarks >= part.marks;

  const currentAllDecided = capReached || decisions.every(d => d !== null);
  const isFirst = currentSelfMarkIdx === 0;
  const isLast = currentSelfMarkIdx === reviewParts.length - 1;

  // Track whether user has visited the last part at least once
  const [hasVisitedLast, setHasVisitedLast] = useState(isLast);
  useEffect(() => {
    if (isLast) setHasVisitedLast(true);
  }, [isLast]);

  // Animation entry state
  const [animStage, setAnimStage] = useState(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'ready';
    return 'intro';
  });

  useEffect(() => {
    if (animStage === 'ready') return;
    const t1 = setTimeout(() => setAnimStage('popping'), 1200);
    const t2 = setTimeout(() => setAnimStage('blank'), 1800);
    const t3 = setTimeout(() => setAnimStage('fading'), 2100);
    const t4 = setTimeout(() => setAnimStage('ready'), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

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

  // Keyboard navigation: left/right arrow keys
  useEffect(() => {
    const handleKey = (e) => {
      if (animStage !== 'ready') return;
      if (e.key === 'ArrowLeft' && !isFirst) {
        onNavigate('back');
      } else if (e.key === 'ArrowRight' && !isLast && currentAllDecided) {
        onNavigate('next');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isFirst, isLast, currentAllDecided, onNavigate, animStage]);

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

  // Track whether point 1 has ever been decided (prevents trace replay on un-click)
  const [hasDecidedFirst, setHasDecidedFirst] = useState(false);
  useEffect(() => { setHasDecidedFirst(false); }, [currentSelfMarkIdx]);
  useEffect(() => { if (decisions[0] !== null) setHasDecidedFirst(true); }, [decisions]);

  // Progressive reveal: show marking points one at a time for self-marked parts
  const [maxRevealed, setMaxRevealed] = useState(1);
  const prevPartRef = useRef(currentSelfMarkIdx);
  const pointsContainerRef = useRef(null);

  useEffect(() => {
    if (isAutoMarked || isLevelsType) { setMaxRevealed(points.length); return; }

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
  }, [currentSelfMarkIdx, decisions, isAutoMarked, isLevelsType, points.length]);

  // Auto-scroll to newly revealed marking point
  useEffect(() => {
    if (maxRevealed <= 1 || isAutoMarked || isLevelsType) return;
    const container = pointsContainerRef.current;
    if (!container) return;
    // Small delay to let the new point render
    requestAnimationFrame(() => {
      const rows = container.querySelectorAll('.marking-point-row');
      const target = rows[maxRevealed - 1];
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }, [maxRevealed, isAutoMarked, isLevelsType]);


  function renderReviewOptionContent(opt) {
    if (typeof opt === 'object' && opt.image) {
      return <img src={`images/${opt.image}`} alt="" className="review-option-image" />;
    }
    return <span className="review-option-text" dangerouslySetInnerHTML={{ __html: renderLatex(opt) }} />;
  }

  // Render single/equation choice as plain text review
  function renderChoiceReview() {
    const result = autoMarkResults[partIndex];
    const selectedIdx = answers[partIndex];
    const hasImageOptions = part.options.some(opt => typeof opt === 'object' && opt.image);

    return (
      <div className={`review-options-list${hasImageOptions ? ' review-options-grid' : ''}`}>
        {part.options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          const isSelected = i === selectedIdx;
          const isCorrectAnswer = i === part.correctAnswer;
          let className = 'review-option-item';
          if (hasImageOptions) className += ' review-option-image-item';
          if (isSelected && isCorrectAnswer) className += ' review-correct';
          else if (isSelected && !isCorrectAnswer) className += ' review-incorrect';
          else if (isCorrectAnswer) className += ' review-was-correct';

          return (
            <div key={i} className={className}>
              <span className="review-option-letter">{letter}.</span>
              {renderReviewOptionContent(opt)}
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
    const hasImageOptions = part.options.some(opt => typeof opt === 'object' && opt.image);

    return (
      <div className={`review-options-list${hasImageOptions ? ' review-options-grid' : ''}`}>
        {part.options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          const isSelected = selected.includes(i);
          const isCorrect = part.correctAnswers.includes(i);
          let className = 'review-option-item';
          if (hasImageOptions) className += ' review-option-image-item';
          if (isSelected && isCorrect) className += ' review-correct';
          else if (isSelected && !isCorrect) className += ' review-incorrect';
          else if (isCorrect) className += ' review-was-correct';

          return (
            <div key={i} className={className}>
              <span className="review-option-letter">{letter}.</span>
              {renderReviewOptionContent(opt)}
              {isSelected && isCorrect && <span className="review-badge badge-correct">Correct</span>}
              {isSelected && !isCorrect && <span className="review-badge badge-incorrect">Wrong</span>}
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

  // Render match-up review
  function renderMatchUpReview() {
    const result = autoMarkResults[partIndex];
    const userLinks = result?.userLinks || {};

    return (
      <div className="review-matchup">
        {result.results.map(({ isCorrect, leftIdx, rightIdx, userLinked }, i) => {
          const leftText = part.leftItems[leftIdx];
          const rightItem = part.rightItems[rightIdx];
          const rightText = typeof rightItem === 'string' ? rightItem : `Image ${rightIdx + 1}`;
          const userRightItem = userLinked !== undefined ? part.rightItems[userLinked] : null;
          const userRightText = userRightItem
            ? (typeof userRightItem === 'string' ? userRightItem : `Image ${userLinked + 1}`)
            : null;

          return (
            <div key={i} className={`review-matchup-row ${isCorrect ? 'review-correct' : 'review-incorrect'}`}>
              <span
                className="review-matchup-left"
                dangerouslySetInnerHTML={{ __html: renderLatex(leftText) }}
              />
              <span className="review-matchup-arrow">{isCorrect ? '\u2192' : '\u2192'}</span>
              {isCorrect ? (
                <span
                  className="review-matchup-right"
                  dangerouslySetInnerHTML={{ __html: renderLatex(rightText) }}
                />
              ) : (
                <>
                  {userRightText ? (
                    <span className="review-matchup-right review-matchup-wrong">
                      <span dangerouslySetInnerHTML={{ __html: renderLatex(userRightText) }} />
                    </span>
                  ) : (
                    <span className="review-matchup-right review-matchup-missing">No link</span>
                  )}
                  <span className="review-matchup-correction">
                    <span dangerouslySetInnerHTML={{ __html: renderLatex(rightText) }} />
                  </span>
                </>
              )}
              <span className="review-badge">
                {isCorrect
                  ? <span className="badge-correct">&#10003;</span>
                  : <span className="badge-incorrect">&#10007;</span>
                }
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Render short-answer review
  function renderShortAnswerReview() {
    const result = autoMarkResults[partIndex];
    const userAnswer = answers[partIndex] || '';
    return (
      <div className="review-short-answer">
        <span className={`review-sa-value ${result?.isCorrect ? 'review-correct' : 'review-incorrect'}`}>
          {userAnswer || '(no answer)'}
        </span>
        {result?.misspelt && (
          <span className="review-sa-misspelt">Misspelt but answer still accepted</span>
        )}
        {result && !result.isCorrect && (
          <span className="review-sa-correct">Correct answer: {result.correctAnswer}</span>
        )}
      </div>
    );
  }

  // Render table-fill review
  function renderTableFillReview() {
    const result = autoMarkResults[partIndex];
    const userAnswers = answers[partIndex] || [];
    const renderedHeaders = part.headers.map(h => renderLatex(h));

    return (
      <table className="review-table-fill">
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
                  return <td key={ci} dangerouslySetInnerHTML={{ __html: renderLatex(cell) }} />;
                }
                const blankIdx = cell.blank;
                const blankResult = result?.results?.[blankIdx];
                const isCorrect = blankResult?.isCorrect;
                return (
                  <td key={ci} className={isCorrect ? 'review-tf-correct' : 'review-tf-incorrect'}>
                    <span className="review-tf-answer">{userAnswers[blankIdx] || '(empty)'}</span>
                    {blankResult?.misspelt && (
                      <span className="review-tf-misspelt">Misspelt but accepted</span>
                    )}
                    {!isCorrect && blankResult?.correctAnswer && (
                      <span className="review-tf-correction">{blankResult.correctAnswer}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // Render select-and-explain review (for self-marking panel)
  function renderSelectAndExplainReview() {
    const result = autoMarkResults[partIndex];
    const ans = answers[partIndex] || {};
    const selectedIdx = ans.selectedOption;
    const hasImageOptions = part.options.some(opt => typeof opt === 'object' && opt.image);

    return (
      <div className="review-sae">
        <div className={`review-options-list${hasImageOptions ? ' review-options-grid' : ''}`}>
          {part.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            const isSelected = i === selectedIdx;
            const isCorrectAnswer = i === part.correctAnswer;
            let className = 'review-option-item';
            if (hasImageOptions) className += ' review-option-image-item';
            if (isSelected && isCorrectAnswer) className += ' review-correct';
            else if (isSelected && !isCorrectAnswer) className += ' review-incorrect';
            else if (isCorrectAnswer) className += ' review-was-correct';

            return (
              <div key={i} className={className}>
                <span className="review-option-letter">{letter}.</span>
                {renderReviewOptionContent(opt)}
                {isSelected && isCorrectAnswer && <span className="review-badge badge-correct">Correct</span>}
                {isSelected && !isCorrectAnswer && <span className="review-badge badge-incorrect">Your answer</span>}
                {isCorrectAnswer && !isSelected && <span className="review-badge badge-missed">Correct answer</span>}
              </div>
            );
          })}
        </div>
        <div className="review-sae-explanation">
          <div className="review-sae-label">Your explanation:</div>
          <div className="self-marking-answer-display">
            {ans.explanation || <span className="self-marking-no-answer">No explanation provided</span>}
          </div>
        </div>
      </div>
    );
  }

  // Render calculation display (shared between auto and self-marked)
  function renderCalculationDisplay(isCorrectCalc) {
    const ans = answers[partIndex] || {};
    return (
      <div className="numerical-display">
        {renderedSelectedEquation && (
          <div className="numerical-display-section">
            <div className="numerical-display-label">Selected equation:</div>
            <div className="numerical-display-value" dangerouslySetInnerHTML={{ __html: renderedSelectedEquation }} />
          </div>
        )}
        {ans.steps && ans.steps.some(s => s && s.trim()) && (
          <div className="numerical-display-section">
            <div className="numerical-display-label">Working steps:</div>
            {ans.steps.filter(s => s && s.trim()).map((step, i) => (
              <div key={i} className="numerical-display-value">Step {i + 1}: {step}</div>
            ))}
          </div>
        )}
        <div className="numerical-display-section">
          <div className="numerical-display-label">Final answer:</div>
          <div className="numerical-display-value">
            <span className={`numerical-display-answer ${isCorrectCalc ? 'correct' : 'incorrect'}`}>
              {numericalResult?.userAnswer || 'No answer'}
            </span>
          </div>
          {!isCorrectCalc && (
            <div className="numerical-correct-answer">
              Correct answer: {numericalResult?.correctAnswer}
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
      case 'match-up':
        return renderMatchUpReview();
      case 'short-answer':
        return renderShortAnswerReview();
      case 'table-fill':
        return renderTableFillReview();
      case 'calculation':
        return renderCalculationDisplay(true);
      default:
        return null;
    }
  }

  function renderSelfMarkedAnswer() {
    if (part.type === 'calculation') {
      return renderCalculationDisplay(false);
    }
    if (part.type === 'select-and-explain') {
      return renderSelectAndExplainReview();
    }
    return (
      <div className="self-marking-answer-display">
        {studentAnswer || <span className="self-marking-no-answer">No answer provided</span>}
      </div>
    );
  }

  return (
    <div className="self-marking-overlay" data-anim-stage={animStage}>
      {animStage !== 'ready' && (
        <div className="sm-intro-curtain">
          {(animStage === 'intro' || animStage === 'popping') && (
            <span className="sm-intro-title">Review Mode</span>
          )}
        </div>
      )}
      <div className={`self-marking-header${isAutoMarked ? ' auto-marked-header' : ''}`}>
        <div className="self-marking-header-left">
          <span className="self-marking-counter">
            Part ({part.partLabel}) &mdash; {currentSelfMarkIdx + 1} of {reviewParts.length}
          </span>
        </div>
        <div className="self-marking-header-center">
          <span className="self-marking-title">
            <span className="self-marking-title-text">{isAutoMarked ? 'Auto Marked' : 'Self Marked'}</span>
            {!isAutoMarked && (
              <span className="self-mark-badge badge-action">Action Required</span>
            )}
          </span>
        </div>
        <div className="self-marking-header-right">
        </div>
      </div>

      <div className="self-marking-panels">
        <div className="self-marking-left">
          <h3 className="self-marking-panel-heading">Your Answer</h3>
          <div className="self-marking-panel-scroll">
            <div
              className="self-marking-question-text"
              dangerouslySetInnerHTML={{ __html: renderedQuestion }}
            />
            {isAutoMarked ? renderAutoMarkedAnswer() : renderSelfMarkedAnswer()}
          </div>
        </div>

        <div className="self-marking-right">
          <div className="self-marking-panel-heading-row">
            <h3 className="self-marking-panel-heading">Mark Scheme</h3>
            {capReached && (
              <span className="levels-cap-badge">
                Maximum marks reached ({part.marks}/{part.marks})
              </span>
            )}
          </div>
          <div className="self-marking-panel-scroll">
            {!isAutoMarked && isLevelsType && (
              <p className="levels-hint-text">
                Award up to <strong>{part.marks} marks</strong> from the indicative content below. You do not need to decide every point.
              </p>
            )}
            <div className="self-marking-points" ref={pointsContainerRef}>
            {points.map((point, i) => {
              if (!isAutoMarked && !isLevelsType && i >= maxRevealed) return null;

              let depNote = null;
              if (part.type === 'select-and-explain' && i > 0 && decisions[0] === false) {
                depNote = '— Depends on correct selection';
              }

              return (
                <MarkingPointRow
                  key={i}
                  point={point}
                  decision={decisions[i] ?? null}
                  onDecide={(val) => onDecide(partIndex, i, val, point.marks)}
                  locked={locked[i] === true}
                  awardDisabled={capReached && decisions[i] !== true}
                  pointNumber={i + 1}
                  dependencyNote={depNote}
                  highlight={!isAutoMarked && !isLevelsType && i === 0 && !hasDecidedFirst}
                />
              );
            })}
          </div>
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
          <div
            className={`self-marking-score ${totalScoreClass}`}
            onClick={canSubmit ? onSubmitMarks : undefined}
            style={canSubmit ? { cursor: 'pointer' } : undefined}
          >
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
