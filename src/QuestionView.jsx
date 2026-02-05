import React, { useReducer, useRef, useCallback, useEffect } from 'react';
import QuestionHeader from './components/QuestionHeader';
import QuestionPart from './components/QuestionPart';
import SelfMarkingView from './components/marking/SelfMarkingView';
import FinalScorePanel from './components/marking/FinalScorePanel';
import ScorePage from './components/marking/ScorePage';
import AILoadingOverlay from './components/marking/AILoadingOverlay';
import AIReviewScreen from './components/marking/AIReviewScreen';
import { autoMarkSingleChoice, autoMarkMultiChoice, autoMarkGapFill, autoMarkNumerical, autoMarkTickBoxTable } from './utils/autoMark';
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
      aiResults: savedState.aiResults || null,
      aiError: null,
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
    aiResults: null,
    aiError: null,
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
          case 'short-numerical': {
            const result = autoMarkNumerical(part, answer || {});
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

        // For incorrect short-numerical: lock the last point (final answer) as false
        if (part.type === 'short-numerical' && points.length > 0) {
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
          case 'short-numerical':
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

      // Dependency logic for 3-mark numerical with rearrangement
      // After reorder: index 0 = substitution, index 1 = rearrangement, index 2 = final answer
      if (part.type === 'short-numerical' && part.requiresRearrangement && nextDecisions.length === 3) {
        if (pointIndex === 0 && decision === false) {
          // Substitution wrong → rearrangement must also be wrong
          nextDecisions[1] = false;
        }
        if (pointIndex === 0 && decision === null) {
          // Substitution toggled off → rearrangement must also reset
          nextDecisions[1] = null;
        }
        if (pointIndex === 1 && decision === true) {
          // Rearrangement correct → substitution must also be correct
          nextDecisions[0] = true;
        }
      }

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

    case 'REQUEST_AI_MARKING': {
      return { ...state, phase: 'ai-loading', aiError: null, aiReturnPhase: state.phase };
    }

    case 'AI_MARKING_SUCCESS': {
      return { ...state, phase: 'ai-review', aiResults: action.aiResults };
    }

    case 'AI_MARKING_FAILURE': {
      // Return to whichever phase triggered the AI request
      return { ...state, phase: state.aiReturnPhase || 'score', aiError: action.error };
    }

    case 'AI_TRY_ANOTHER': {
      return state; // Will be handled by parent callback
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
  aiModeEnabled = false,
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

  const handleCheckWithAI = useCallback(async () => {
    console.log('[AI] Starting AI marking check');
    console.log('[AI] selfMarkParts:', state.selfMarkParts);
    console.log('[AI] aiModeEnabled:', aiModeEnabled);

    dispatch({ type: 'REQUEST_AI_MARKING' });

    try {
      // Prepare self-marked parts data for API
      const parts = state.selfMarkParts.map(partIdx => {
        const part = question.parts[partIdx];
        const answer = state.answers[partIdx];

        // Format answer based on type
        let formattedAnswer = '';
        let markSchemeToSend = part.markScheme;

        if (part.type === 'extended-written') {
          formattedAnswer = answer || '';
        } else if (part.type === 'short-numerical') {
          // For incorrect short-numerical: only send working for AI to check
          // Final answer is already known to be wrong (that's why it's in selfMarkParts)
          const workingParts = [];
          if (answer?.substitution) {
            workingParts.push(`Substitution: ${answer.substitution}`);
          }
          if (part.requiresRearrangement && answer?.rearrangement) {
            workingParts.push(`Rearrangement: ${answer.rearrangement}`);
          }
          formattedAnswer = workingParts.length > 0
            ? workingParts.join('\n')
            : '(No working shown)';

          // Exclude the final answer mark scheme point (always the last one)
          // Only send substitution and rearrangement points for AI to evaluate
          markSchemeToSend = part.markScheme.slice(0, -1);
        } else {
          formattedAnswer = String(answer || '');
        }

        return {
          partLabel: part.partLabel,
          questionText: part.text,
          answer: formattedAnswer,
          markScheme: markSchemeToSend,
          isNumericalWithWrongAnswer: part.type === 'short-numerical',
        };
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch('/api/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parts }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || `API error: ${response.status}`);
      }

      const aiResults = await response.json();
      console.log('[AI] API response:', aiResults);

      if (aiResults.error) {
        throw new Error(aiResults.error);
      }

      console.log('[AI] Dispatching AI_MARKING_SUCCESS');
      dispatch({ type: 'AI_MARKING_SUCCESS', aiResults });
    } catch (error) {
      console.error('[AI] AI marking failed:', error);
      dispatch({ type: 'AI_MARKING_FAILURE', error: error.message || 'AI marking unavailable', question });
    }
  }, [state.selfMarkParts, state.answers, question]);

  const saveFields = {
    answers: state.answers,
    partScores: state.partScores,
    autoMarkResults: state.autoMarkResults,
    selfMarkParts: state.selfMarkParts,
    reviewParts: state.reviewParts,
    markingDecisions: state.markingDecisions,
    lockedPoints: state.lockedPoints,
  };

  useEffect(() => {
    if (state.phase === 'score') {
      if (onScoreReady) onScoreReady(totalScore, totalMarks);
      if (onSaveAnswers) onSaveAnswers(saveFields);
    }
    if (state.phase === 'ai-review' && onSaveAnswers) {
      onSaveAnswers({ ...saveFields, aiResults: state.aiResults });
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

        {/* Hide question parts when AI review is displayed (it has its own) */}
        {state.phase !== 'ai-review' && !(state.phase === 'complete' && state.aiResults) &&
          question.parts.map((part, i) => (
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
          ))
        }

        {state.phase === 'answering' && (
          <button className="submit-btn" onClick={handleEnterMarking}>
            Lock answers and mark
          </button>
        )}

        {state.phase === 'complete' && !state.aiResults && (
          <FinalScorePanel
            score={totalScore}
            maxScore={totalMarks}
            onDone={onBankScore}
            onReset={onReset}
            aiModeEnabled={aiModeEnabled}
            onAIReview={handleCheckWithAI}
          />
        )}

        {state.phase === 'complete' && state.aiResults && (
          <AIReviewScreen
            question={question}
            answers={state.answers}
            markingDecisions={state.markingDecisions}
            aiResults={state.aiResults}
            selfMarkParts={state.selfMarkParts}
            autoMarkResults={state.autoMarkResults}
            onTryAnother={onBankScore}
            onReset={onReset}
            onReportBug={onReportBug}
            questionTitle={question.title}
            questionId={question.id}
            subtopicName={subtopicName}
            mainTopicName={mainTopicName}
            isRestored
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

      {state.phase === 'ai-loading' && <AILoadingOverlay />}

      {state.phase === 'ai-review' && (
        <AIReviewScreen
          question={question}
          answers={state.answers}
          markingDecisions={state.markingDecisions}
          aiResults={state.aiResults}
          selfMarkParts={state.selfMarkParts}
          autoMarkResults={state.autoMarkResults}
          onTryAnother={onBankScore}
          onReset={onReset}
          onReportBug={onReportBug}
          questionTitle={question.title}
          questionId={question.id}
          subtopicName={subtopicName}
          mainTopicName={mainTopicName}
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
          aiModeEnabled={aiModeEnabled}
          onAIReview={handleCheckWithAI}
          aiError={state.aiError}
          hasSelfMarkParts={state.selfMarkParts.length > 0}
        />
      )}
    </>
  );
}
