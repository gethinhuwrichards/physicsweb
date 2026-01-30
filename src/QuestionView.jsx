import React, { useReducer, useRef, useCallback } from 'react';
import QuestionHeader from './components/QuestionHeader';
import QuestionPart from './components/QuestionPart';
import SelfMarkingView from './components/marking/SelfMarkingView';
import FinalScorePanel from './components/marking/FinalScorePanel';
import { autoMarkSingleChoice, autoMarkMultiChoice, autoMarkGapFill } from './utils/autoMark';
import { parseMarkScheme } from './utils/parseMarkScheme';

function initState(question) {
  return {
    phase: 'answering',
    answers: {},
    partScores: {},
    autoMarkResults: {},
    selfMarkParts: [],
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
          case 'single-choice': {
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

      selfMarkParts.forEach(i => {
        const part = question.parts[i];
        const points = parseMarkScheme(part.markScheme);
        markingDecisions[i] = points.map(() => null);
        lockedPoints[i] = points.map(() => false);
      });

      const noSelfMark = selfMarkParts.length === 0;

      return {
        ...state,
        phase: noSelfMark ? 'complete' : 'marking',
        partScores,
        autoMarkResults,
        selfMarkParts,
        currentSelfMarkIdx: 0,
        markingDecisions,
        lockedPoints,
      };
    }

    case 'DECIDE_POINT': {
      const { partIndex, pointIndex, decision, pointMarks, question } = action;
      const part = question.parts[partIndex];
      const prevDecisions = state.markingDecisions[partIndex] || [];
      const nextDecisions = [...prevDecisions];
      nextDecisions[pointIndex] = decision;

      const nextMarkingDecisions = { ...state.markingDecisions, [partIndex]: nextDecisions };

      // Check if all points for this part are decided (non-null)
      const allDecided = nextDecisions.every(d => d !== null);

      if (allDecided) {
        // Calculate score for this part
        const points = parseMarkScheme(part.markScheme);
        let score = 0;
        nextDecisions.forEach((d, i) => {
          if (d === true) score += points[i].marks;
        });
        score = Math.min(score, part.marks);

        const nextPartScores = { ...state.partScores, [partIndex]: score };

        return {
          ...state,
          markingDecisions: nextMarkingDecisions,
          partScores: nextPartScores,
        };
      }

      return {
        ...state,
        markingDecisions: nextMarkingDecisions,
      };
    }

    case 'NAV_SELF_MARK': {
      const nextIdx = action.direction === 'next'
        ? state.currentSelfMarkIdx + 1
        : state.currentSelfMarkIdx - 1;
      if (nextIdx < 0 || nextIdx >= state.selfMarkParts.length) return state;
      return { ...state, currentSelfMarkIdx: nextIdx };
    }

    case 'SUBMIT_MARKS': {
      return { ...state, phase: 'complete' };
    }

    default:
      return state;
  }
}

export default function QuestionView({ question, onBankScore, onReset }) {
  const [state, dispatch] = useReducer(reducer, question, initState);
  const containerRef = useRef(null);

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
    dispatch({ type: 'SUBMIT_MARKS' });
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
          selfMarkParts={state.selfMarkParts}
          currentSelfMarkIdx={state.currentSelfMarkIdx}
          answers={state.answers}
          markingDecisions={state.markingDecisions}
          lockedPoints={state.lockedPoints}
          onDecide={handleDecide}
          onNavigate={handleNavigate}
          onSubmitMarks={handleSubmitMarks}
          allPartsFullyDecided={allPartsFullyDecided}
        />
      )}
    </>
  );
}
