import React, { useReducer, useRef, useCallback, useEffect } from 'react';
import QuestionHeader from './components/QuestionHeader';
import QuestionPart from './components/QuestionPart';
import SelfMarkingView from './components/marking/SelfMarkingView';
import FinalScorePanel from './components/marking/FinalScorePanel';
import ScorePage from './components/marking/ScorePage';
import { autoMarkSingleChoice, autoMarkMultiChoice, autoMarkGapFill, autoMarkCalculation, autoMarkTickBoxTable, autoMarkMatchUp, autoMarkShortAnswer } from './utils/autoMark';
import { parseMarkScheme } from './utils/parseMarkScheme';

function initState({ question, savedState }) {
  if (savedState) {
    if (savedState.phase === 'answering') {
      return {
        phase: 'answering',
        answers: savedState.answers || {},
        partScores: {},
        autoMarkResults: {},
        selfMarkParts: [],
        reviewParts: [],
        currentSelfMarkIdx: 0,
        markingDecisions: {},
        lockedPoints: {},
      };
    }
    return {
      phase: 'complete',
      answers: savedState.answers,
      partScores: savedState.partScores,
      autoMarkResults: savedState.autoMarkResults,
      selfMarkParts: savedState.selfMarkParts || [],
      reviewParts: savedState.reviewParts || [],
      currentSelfMarkIdx: 0,
      markingDecisions: savedState.markingDecisions || {},
      lockedPoints: savedState.lockedPoints || {},
    };
  }
  return {
    phase: 'answering',
    answers: {},
    partScores: {},
    autoMarkResults: {},
    selfMarkParts: [],
    reviewParts: [],
    currentSelfMarkIdx: 0,
    markingDecisions: {},
    lockedPoints: {},
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ANSWER':
      return {
        ...state,
        answers: { ...state.answers, [action.partIndex]: action.value },
      };

    case 'ENTER_MARKING': {
      const { question } = action;
      const partScores = {};
      const autoMarkResults = {};
      const selfMarkParts = [];

      question.parts.forEach((part, i) => {
        const answer = state.answers[i];
        switch (part.type) {
          case 'single-choice':
          case 'equation-choice': {
            const result = autoMarkSingleChoice(part, answer ?? -1);
            partScores[i] = result.score;
            autoMarkResults[i] = result;
            break;
          }
          case 'multi-choice': {
            const result = autoMarkMultiChoice(part, answer || []);
            partScores[i] = result.score;
            autoMarkResults[i] = result;
            break;
          }
          case 'gap-fill': {
            const result = autoMarkGapFill(part, answer || []);
            partScores[i] = result.score;
            autoMarkResults[i] = result;
            break;
          }
          case 'tick-box-table': {
            const result = autoMarkTickBoxTable(part, answer || []);
            partScores[i] = result.score;
            autoMarkResults[i] = result;
            break;
          }
          case 'match-up': {
            const result = autoMarkMatchUp(part, answer || {});
            partScores[i] = result.score;
            autoMarkResults[i] = result;
            break;
          }
          case 'short-answer': {
            const result = autoMarkShortAnswer(part, answer);
            partScores[i] = result.score;
            autoMarkResults[i] = result;
            break;
          }
          case 'calculation': {
            const result = autoMarkCalculation(part, answer || {});
            autoMarkResults[i] = result;
            if (result.isCorrect) {
              partScores[i] = result.score;
            } else {
              selfMarkParts.push(i);
            }
            break;
          }
          case 'extended-written': {
            selfMarkParts.push(i);
            break;
          }
          default:
            partScores[i] = 0;
            break;
        }
      });

      const markingDecisions = {};
      const lockedPoints = {};

      // Self-marked parts: interactive tick/cross
      selfMarkParts.forEach(i => {
        const part = question.parts[i];
        const points = parseMarkScheme(part.markScheme);
        markingDecisions[i] = points.map(() => null);
        lockedPoints[i] = points.map(() => false);

        // For incorrect calculation: lock the last point (final answer) as false
        if (part.type === 'calculation' && points.length > 0) {
          const lastIdx = points.length - 1;
          markingDecisions[i][lastIdx] = false;
          lockedPoints[i][lastIdx] = true;
        }
      });

      // Auto-marked parts: pre-fill locked decisions for review
      question.parts.forEach((part, i) => {
        if (selfMarkParts.includes(i)) return;
        const points = parseMarkScheme(part.markScheme);
        const result = autoMarkResults[i];

        switch (part.type) {
          case 'single-choice':
          case 'equation-choice':
            markingDecisions[i] = points.map(() => result.isCorrect);
            break;
          case 'multi-choice': {
            const selected = result.selectedIndices || [];
            if (part.scoring === 'partial') {
              markingDecisions[i] = part.correctAnswers.map((ci, idx) =>
                idx < points.length ? selected.includes(ci) : false
              );
            } else {
              markingDecisions[i] = points.map(() => result.isCorrect);
            }
            break;
          }
          case 'gap-fill': {
            const gapResults = result.results || [];
            markingDecisions[i] = points.map((_, idx) =>
              idx < gapResults.length ? gapResults[idx].isCorrect : false
            );
            break;
          }
          case 'tick-box-table': {
            const tbtResults = result.results || [];
            markingDecisions[i] = points.map((_, idx) =>
              idx < tbtResults.length ? tbtResults[idx].isCorrect : false
            );
            break;
          }
          case 'match-up': {
            const muResults = result.results || [];
            markingDecisions[i] = points.map((_, idx) =>
              idx < muResults.length ? muResults[idx].isCorrect : false
            );
            break;
          }
          case 'short-answer':
            markingDecisions[i] = points.map(() => result.isCorrect);
            break;
          case 'calculation':
            // Only reaches here if correct (incorrect goes to selfMarkParts)
            markingDecisions[i] = points.map(() => true);
            break;
          default:
            markingDecisions[i] = points.map(() => false);
            break;
        }
        lockedPoints[i] = points.map(() => true);
      });

      const reviewParts = question.parts.map((_, i) => i);

      return {
        ...state,
        phase: 'marking',
        partScores,
        autoMarkResults,
        selfMarkParts,
        reviewParts,
        currentSelfMarkIdx: 0,
        markingDecisions,
        lockedPoints,
      };
    }

    case 'DECIDE_POINT': {
      const { partIndex, pointIndex, decision, question } = action;
      const part = question.parts[partIndex];
      const prevDecisions = state.markingDecisions[partIndex] || [];
      const nextDecisions = [...prevDecisions];
      nextDecisions[pointIndex] = decision;

      return {
        ...state,
        markingDecisions: { ...state.markingDecisions, [partIndex]: nextDecisions },
      };
    }

    case 'NAV_SELF_MARK': {
      const nextIdx = action.direction === 'next'
        ? state.currentSelfMarkIdx + 1
        : state.currentSelfMarkIdx - 1;
      if (nextIdx < 0 || nextIdx >= state.reviewParts.length) return state;
      return { ...state, currentSelfMarkIdx: nextIdx };
    }

    case 'SUBMIT_MARKS': {
      const { question } = action;
      const nextPartScores = { ...state.partScores };

      state.selfMarkParts.forEach(partIdx => {
        const part = question.parts[partIdx];
        const decisions = state.markingDecisions[partIdx] || [];
        const points = parseMarkScheme(part.markScheme);
        let score = 0;
        decisions.forEach((d, i) => {
          if (d === true) score += points[i].marks;
        });
        nextPartScores[partIdx] = Math.min(score, part.marks);
      });

      return { ...state, phase: 'score', partScores: nextPartScores };
    }

    case 'REVIEW_QUESTION': {
      return { ...state, phase: 'complete' };
    }

    default:
      return state;
  }
}

export default function QuestionView({
  question,
  onBankScore,
  onReset,
  onSaveAnswers,
  onScoreReady,
  onReportBug,
  savedState,
  subtopicName,
  mainTopicName,
}) {
  const [state, dispatch] = useReducer(reducer, { question, savedState }, initState);
  const containerRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const totalMarks = question.parts.reduce((sum, p) => sum + p.marks, 0);

  const handleAnswer = useCallback((partIndex, value) => {
    dispatch({ type: 'SET_ANSWER', partIndex, value });
  }, []);

  const handleEnterMarking = useCallback(() => {
    dispatch({ type: 'ENTER_MARKING', question });
  }, [question]);

  const handleDecide = useCallback((partIndex, pointIndex, decision, pointMarks) => {
    dispatch({ type: 'DECIDE_POINT', partIndex, pointIndex, decision, pointMarks, question });
  }, [question]);

  const handleNavigate = useCallback((direction) => {
    dispatch({ type: 'NAV_SELF_MARK', direction });
  }, []);

  const handleSubmitMarks = useCallback(() => {
    dispatch({ type: 'SUBMIT_MARKS', question });
  }, [question]);

  const handleReview = useCallback(() => {
    dispatch({ type: 'REVIEW_QUESTION' });
  }, []);

  useEffect(() => {
    if (state.phase === 'score') {
      if (onScoreReady) onScoreReady(totalScore, totalMarks);
      if (onSaveAnswers) {
        onSaveAnswers({
          answers: state.answers,
          partScores: state.partScores,
          autoMarkResults: state.autoMarkResults,
          selfMarkParts: state.selfMarkParts,
          reviewParts: state.reviewParts,
          markingDecisions: state.markingDecisions,
          lockedPoints: state.lockedPoints,
        });
      }
    }
  }, [state.phase]);

  // Save partial answers when unmounting during answering phase
  useEffect(() => {
    return () => {
      const s = stateRef.current;
      if (s.phase === 'answering' && Object.keys(s.answers).length > 0 && onSaveAnswers) {
        onSaveAnswers({ phase: 'answering', answers: s.answers });
      }
    };
  }, []);

  const allPartsFullyDecided = state.selfMarkParts.every(partIdx => {
    const d = state.markingDecisions[partIdx];
    return d && d.every(v => v !== null);
  });

  // Calculate total score for final panel
  const totalScore = Object.values(state.partScores).reduce((sum, s) => sum + s, 0);

  return (
    <>
      <div
        ref={containerRef}
        id="question-content-inner"
      >
        <QuestionHeader title={question.title} totalMarks={totalMarks} />

        {question.parts.map((part, i) => (
          <QuestionPart
            key={i}
            part={part}
            partIndex={i}
            answer={state.answers[i]}
            onAnswer={handleAnswer}
            disabled={state.phase !== 'answering'}
            markingClass={state.phase !== 'answering' ? 'marking-done' : ''}
            autoMarkResult={state.autoMarkResults[i] || null}
            phase={state.phase}
            partScore={state.partScores[i]}
          />
        ))}

        {state.phase === 'answering' && (
          <button className="submit-btn" onClick={handleEnterMarking}>
            Lock answers and mark
          </button>
        )}

        {state.phase === 'complete' && (
          <FinalScorePanel
            score={totalScore}
            maxScore={totalMarks}
            onDone={onBankScore}
            onReset={onReset}
          />
        )}
      </div>

      {state.phase === 'marking' && (
        <SelfMarkingView
          question={question}
          reviewParts={state.reviewParts}
          selfMarkParts={state.selfMarkParts}
          currentSelfMarkIdx={state.currentSelfMarkIdx}
          answers={state.answers}
          autoMarkResults={state.autoMarkResults}
          markingDecisions={state.markingDecisions}
          lockedPoints={state.lockedPoints}
          onDecide={handleDecide}
          onNavigate={handleNavigate}
          onSubmitMarks={handleSubmitMarks}
          allPartsFullyDecided={allPartsFullyDecided}
          onReportBug={onReportBug}
        />
      )}

      {state.phase === 'score' && (
        <ScorePage
          score={totalScore}
          maxScore={totalMarks}
          onTryAnother={onBankScore}
          onReview={handleReview}
          onReset={onReset}
          questionTitle={question.title}
          questionId={question.id}
          subtopicName={subtopicName}
          mainTopicName={mainTopicName}
        />
      )}
    </>
  );
}
