import React, { useState } from 'react';
import { parseMarkScheme } from '../../utils/parseMarkScheme';
import { renderLatex } from '../../utils/renderLatex';
import ConfirmModal from '../ConfirmModal';
import BugReportModal from '../BugReportModal';

function getScoreClass(score, maxScore) {
  if (score === maxScore) return 'score-full';
  if (score === 0) return 'score-zero';
  return 'score-partial';
}

function renderMarkdownBold(text) {
  if (!text) return '';
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function renderPointText(text) {
  return renderMarkdownBold(renderLatex(text));
}

function formatAutoMarkedAnswer(part, answer, autoResult) {
  switch (part.type) {
    case 'single-choice':
    case 'equation-choice': {
      const selectedIdx = answer;
      if (selectedIdx == null || selectedIdx < 0)
        return <em className="ai-review-no-answer">(No answer selected)</em>;
      const letter = String.fromCharCode(65 + selectedIdx);
      const isCorrect = autoResult?.isCorrect;
      return (
        <div className={`ai-review-auto-answer ${isCorrect ? 'auto-correct' : 'auto-incorrect'}`}>
          <span className="ai-review-auto-label">{letter}.</span>{' '}
          <span dangerouslySetInnerHTML={{ __html: renderLatex(part.options?.[selectedIdx] || '') }} />
        </div>
      );
    }

    case 'multi-choice': {
      const selected = answer || [];
      if (selected.length === 0)
        return <em className="ai-review-no-answer">(No answer selected)</em>;
      return (
        <div className="ai-review-auto-answer">
          {selected.map((idx, i) => {
            const letter = String.fromCharCode(65 + idx);
            const isCorrect = part.correctAnswers?.includes(idx);
            return (
              <span key={i} className={isCorrect ? 'auto-correct' : 'auto-incorrect'}>
                {letter}. <span dangerouslySetInnerHTML={{ __html: renderLatex(part.options?.[idx] || '') }} />
                {i < selected.length - 1 ? ', ' : ''}
              </span>
            );
          })}
        </div>
      );
    }

    case 'gap-fill': {
      const gapAnswers = answer || [];
      const results = autoResult?.results || [];
      return (
        <div className="ai-review-auto-answer">
          {gapAnswers.map((ans, i) => {
            const isCorrect = results[i]?.isCorrect;
            return (
              <span key={i}>
                <span className={isCorrect ? 'auto-correct' : 'auto-incorrect'}>
                  {ans || '\u2014'}
                </span>
                {!isCorrect && results[i]?.correctAnswer && (
                  <span className="ai-review-correction"> {'\u2192'} {results[i].correctAnswer}</span>
                )}
                {i < gapAnswers.length - 1 ? ', ' : ''}
              </span>
            );
          })}
        </div>
      );
    }

    case 'tick-box-table': {
      const userAnswers = answer || [];
      const cols = part.columnHeaders || [];
      const results = autoResult?.results || [];
      return (
        <table className="review-tick-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}></th>
              {cols.map((header, i) => (
                <th key={i}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {part.rows?.map((row, ri) => {
              const isCorrect = results[ri]?.isCorrect;
              const userChoice = userAnswers[ri];
              return (
                <tr key={ri} className={isCorrect ? 'review-tick-row-correct' : 'review-tick-row-incorrect'}>
                  <td style={{ textAlign: 'left' }} dangerouslySetInnerHTML={{ __html: renderLatex(row.label) }} />
                  {cols.map((_, ci) => {
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

    case 'short-numerical': {
      const finalAnswer = answer?.finalAnswer || '';
      const unit = part.showUnit && part.unit ? ` ${part.unit}` : '';
      return (
        <div className="ai-review-auto-answer auto-correct">
          {finalAnswer}{unit}
        </div>
      );
    }

    default:
      return <div>{String(answer || '')}</div>;
  }
}

function formatSelfMarkedAnswer(part, answer) {
  if (!answer && answer !== 0)
    return <em className="ai-review-no-answer">(No answer provided)</em>;

  switch (part.type) {
    case 'extended-written':
      return <div className="ai-review-text-answer">{answer}</div>;

    case 'short-numerical': {
      const finalAnswer = answer?.finalAnswer || '';
      const unit = part.showUnit && part.unit ? ` ${part.unit}` : '';
      return (
        <div className="ai-review-numerical-answer">
          <strong>Final answer:</strong> {finalAnswer}{unit}
          {answer?.substitution && (
            <div className="ai-review-working">
              <strong>Working:</strong> {answer.substitution}
            </div>
          )}
        </div>
      );
    }

    default:
      return <div>{String(answer)}</div>;
  }
}

/* Mark scheme point for AI-reviewed parts — stacked layout with explanation below */
function AIMarkingPoint({ point, aiAwarded, aiComment }) {
  return (
    <div className="ai-marking-point">
      <div className="ai-marking-point-header">
        <span className={`ai-mark-indicator ${aiAwarded ? 'awarded' : 'denied'}`}>
          {aiAwarded ? '\u2713' : '\u2717'}
        </span>
        <span
          className="ai-marking-point-text"
          dangerouslySetInnerHTML={{ __html: renderPointText(point.text) }}
        />
      </div>
      {aiComment && (
        <div className="ai-explanation">
          <span className="ai-explanation-label">AI Explanation</span>
          <p
            className="ai-explanation-text"
            dangerouslySetInnerHTML={{ __html: renderMarkdownBold(aiComment) }}
          />
        </div>
      )}
    </div>
  );
}

/* Mark scheme point for auto-marked parts — simple single-column */
function AutoMarkingPoint({ point, awarded }) {
  return (
    <div className="ai-marking-point">
      <div className="ai-marking-point-header">
        <span className={`ai-mark-indicator ${awarded ? 'awarded' : 'denied'}`}>
          {awarded ? '\u2713' : '\u2717'}
        </span>
        <span
          className="ai-marking-point-text"
          dangerouslySetInnerHTML={{ __html: renderPointText(point.text) }}
        />
      </div>
    </div>
  );
}

/* AI-reviewed part (extended-written / incorrect numerical) */
function AIReviewPart({ part, answer, aiMarks }) {
  const points = parseMarkScheme(part.markScheme);
  const isNumerical = part.type === 'short-numerical';
  const lastIdx = points.length - 1;

  return (
    <div className="ai-review-part">
      <div className="ai-review-part-header">
        <h3 className="ai-review-part-label">Part ({part.partLabel})</h3>
        <span className="ai-review-part-badge badge-ai">AI Reviewed</span>
      </div>
      <div className="ai-review-part-body">
        <div className="ai-review-part-left">
          <div
            className="ai-review-question"
            dangerouslySetInnerHTML={{ __html: renderLatex(part.text) }}
          />
          <div className="ai-review-answer">
            <h4>Your answer</h4>
            {formatSelfMarkedAnswer(part, answer)}
          </div>
        </div>
        <div className="ai-review-part-right">
          <h4>Mark scheme</h4>
          {points.map((point, i) => {
            const isFinalAnswerPoint = isNumerical && i === lastIdx;

            return (
              <AIMarkingPoint
                key={i}
                point={point}
                aiAwarded={isFinalAnswerPoint ? false : (aiMarks?.[i]?.awarded ?? false)}
                aiComment={isFinalAnswerPoint
                  ? 'Final answer was incorrect (auto-marked)'
                  : (aiMarks?.[i]?.comment || '')}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* Auto-marked part */
function AutoMarkedPart({ part, answer, decisions, autoResult, deemphasize }) {
  const points = parseMarkScheme(part.markScheme);

  return (
    <div className={`ai-review-part${deemphasize ? ' ai-review-part-deemphasize' : ''}`}>
      <div className="ai-review-part-header">
        <h3 className="ai-review-part-label">Part ({part.partLabel})</h3>
        <span className="ai-review-part-badge badge-auto-review">Auto Marked</span>
      </div>
      <div className="ai-review-part-body">
        <div className="ai-review-part-left">
          <div
            className="ai-review-question"
            dangerouslySetInnerHTML={{ __html: renderLatex(part.text) }}
          />
          <div className="ai-review-answer">
            <h4>Your answer</h4>
            {formatAutoMarkedAnswer(part, answer, autoResult)}
          </div>
        </div>
        <div className="ai-review-part-right">
          <h4>Mark scheme</h4>
          {points.map((point, i) => (
            <AutoMarkingPoint
              key={i}
              point={point}
              awarded={decisions?.[i] ?? false}
            />
          ))}
          {deemphasize && (
            <div className="ai-review-auto-note">Auto-marked &mdash; not reviewed by AI</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AIReviewScreen({
  question,
  answers,
  markingDecisions,
  aiResults,
  selfMarkParts,
  autoMarkResults,
  onTryAnother,
  onReset,
  onReportBug,
  questionTitle,
  questionId,
  subtopicName,
  mainTopicName,
  isRestored = false,
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [bugReportOpen, setBugReportOpen] = useState(false);

  // Calculate totals across ALL parts
  let selfTotal = 0;
  let aiTotal = 0;
  let maxMarks = 0;

  question.parts.forEach((part, partIdx) => {
    const points = parseMarkScheme(part.markScheme);
    const decisions = markingDecisions[partIdx] || [];
    const isAIReviewed = selfMarkParts.includes(partIdx);

    points.forEach((pt) => {
      maxMarks += pt.marks;
    });

    if (isAIReviewed) {
      const aiQuestion = aiResults?.questions?.find((q) => q.partLabel === part.partLabel);
      const isNumerical = part.type === 'short-numerical';
      const lastIdx = points.length - 1;

      points.forEach((pt, i) => {
        if (decisions[i] === true) selfTotal += pt.marks;
        const isFinalAnswerPoint = isNumerical && i === lastIdx;
        if (!isFinalAnswerPoint && aiQuestion?.marks?.[i]?.awarded) {
          aiTotal += pt.marks;
        }
      });
    } else {
      // Auto-marked parts: both scores are the same
      points.forEach((pt, i) => {
        if (decisions[i] === true) {
          selfTotal += pt.marks;
          aiTotal += pt.marks;
        }
      });
    }
  });

  const selfClass = getScoreClass(selfTotal, maxMarks);
  const aiClass = getScoreClass(aiTotal, maxMarks);

  return (
    <div className="ai-review-inline">
      <p className="ai-review-disclaimer">
        AI marks like a strict examiner &mdash; use any differences to spot where you can improve.
      </p>

      {question.parts.map((part, partIdx) => {
        const isAIReviewed = selfMarkParts.includes(partIdx);

        if (isAIReviewed) {
          const aiQuestion = aiResults?.questions?.find(
            (q) => q.partLabel === part.partLabel,
          );
          return (
            <AIReviewPart
              key={partIdx}
              part={part}
              answer={answers[partIdx]}
              aiMarks={aiQuestion?.marks}
            />
          );
        }

        return (
          <AutoMarkedPart
            key={partIdx}
            part={part}
            answer={answers[partIdx]}
            decisions={markingDecisions[partIdx]}
            autoResult={autoMarkResults?.[partIdx]}
            deemphasize={!isRestored}
          />
        );
      })}

      <div className="ai-review-score-bar">
        <div className="ai-review-score-left">
          <span className="ai-review-label">Your marks</span>
          <span className={`ai-review-value ${selfClass}`}>
            {selfTotal} / {maxMarks}
          </span>
        </div>
        <div className="ai-review-score-right">
          <span className="ai-review-label">True score</span>
          <span className={`ai-review-value ${aiClass}`}>
            {aiTotal} / {maxMarks}
          </span>
        </div>
      </div>

      <div className="ai-review-actions">
        <div className="ai-review-actions-primary">
          <button className="score-page-btn-primary" onClick={onTryAnother}>
            Try another question
          </button>
        </div>
        <div className="ai-review-actions-secondary">
          <button className="score-page-link" onClick={() => setShowConfirm(true)}>
            Reset question
          </button>
          <span className="score-page-secondary-sep">&middot;</span>
          <button className="score-page-link" onClick={() => setBugReportOpen(true)}>
            Report bug
          </button>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          message="Are you sure you want to reset this question?"
          onConfirm={onReset}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      <BugReportModal
        visible={bugReportOpen}
        onClose={() => setBugReportOpen(false)}
        questionTitle={questionTitle}
        questionId={questionId}
        subtopicName={subtopicName}
        mainTopicName={mainTopicName}
      />
    </div>
  );
}
