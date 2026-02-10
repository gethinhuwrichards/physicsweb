import React, { useReducer, useRef, useCallback, useEffect, useMemo, useState } from 'react';
import QuestionHeader from './components/QuestionHeader';
import QuestionPart from './components/QuestionPart';
import FigureSidebar from './components/FigureSidebar';
import FigureViewer from './components/FigureViewer';
import SelfMarkingView from './components/marking/SelfMarkingView';
import FinalScorePanel from './components/marking/FinalScorePanel';
import ScorePage from './components/marking/ScorePage';
import { autoMarkSingleChoice, autoMarkMultiChoice, autoMarkGapFill, autoMarkCalculation, autoMarkTickBoxTable, autoMarkMatchUp, autoMarkShortAnswer, autoMarkSelectAndExplain, autoMarkTableFill } from './utils/autoMark';
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
          case 'select-and-explain': {
            const result = autoMarkSelectAndExplain(part, answer || {});
            autoMarkResults[i] = result;
            selfMarkParts.push(i);
            break;
          }
          case 'table-fill': {
            const result = autoMarkTableFill(part, answer || []);
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
          case 'extended-written':
          case 'extended-written-levels': {
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

        // For select-and-explain: lock the first point (selection) based on auto-mark
        // If selection is wrong, lock all explanation points as false too
        if (part.type === 'select-and-explain' && points.length > 0) {
          const selResult = autoMarkResults[i];
          markingDecisions[i][0] = selResult.selectionCorrect;
          lockedPoints[i][0] = true;
          if (!selResult.selectionCorrect) {
            for (let p = 1; p < points.length; p++) {
              markingDecisions[i][p] = false;
              lockedPoints[i][p] = true;
            }
          }
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
          case 'table-fill': {
            const tfResults = result.results || [];
            markingDecisions[i] = points.map((_, idx) =>
              idx < tfResults.length ? tfResults[idx].isCorrect : false
            );
            break;
          }
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
  onBack,
  onReset,
  onSaveAnswers,
  onScoreReady,
  savedState,
  subtopicName,
  mainTopicName,
}) {
  const [state, dispatch] = useReducer(reducer, { question, savedState }, initState);
  const containerRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const totalMarks = question.parts.reduce((sum, p) => sum + p.marks, 0);

  // Collect all unique figures across parts in first-appearance order
  const figures = useMemo(() => {
    const seen = new Set();
    const result = [];
    let n = 1;
    question.parts.forEach(p => {
      (p.diagrams || []).forEach(f => {
        if (!seen.has(f)) {
          seen.add(f);
          result.push({ src: f, label: `Fig. ${n}`, index: n - 1 });
          n++;
        }
      });
    });
    return result;
  }, [question]);

  // Collect all tables across parts in order
  const tables = useMemo(() => {
    const result = [];
    let n = 1;
    question.parts.forEach(p => {
      (p.tables || []).forEach(tbl => {
        result.push({ data: tbl, label: `Table ${n}`, index: n - 1 });
        n++;
      });
    });
    return result;
  }, [question]);

  const [viewerIndex, setViewerIndex] = useState(null);
  const [tableViewerIndex, setTableViewerIndex] = useState(null);
  const [eqPage, setEqPage] = useState(null);
  const EQ_PAGES = ['images/equationssheet_page-0001.jpg', 'images/equationssheet_page-0002.jpg'];

  const handleFigureClick = useCallback((figIndex) => {
    setTableViewerIndex(null);
    setEqPage(null);
    setViewerIndex(figIndex);
  }, []);

  const handleTableClick = useCallback((tblIndex) => {
    setViewerIndex(null);
    setEqPage(null);
    setTableViewerIndex(tblIndex);
  }, []);

  const handleEquationsClick = useCallback(() => {
    setViewerIndex(null);
    setTableViewerIndex(null);
    setEqPage(0);
  }, []);

  const handleViewerClose = useCallback(() => {
    setViewerIndex(null);
    setTableViewerIndex(null);
    setEqPage(null);
  }, []);

  const handleViewerPrev = useCallback(() => {
    setViewerIndex(i => (i > 0 ? i - 1 : i));
  }, []);

  const handleViewerNext = useCallback(() => {
    setViewerIndex(i => (i < figures.length - 1 ? i + 1 : i));
  }, [figures.length]);

  const handleTableViewerPrev = useCallback(() => {
    setTableViewerIndex(i => (i > 0 ? i - 1 : i));
  }, []);

  const handleTableViewerNext = useCallback(() => {
    setTableViewerIndex(i => (i < tables.length - 1 ? i + 1 : i));
  }, [tables.length]);

  // Close viewers when leaving answering/complete phases
  useEffect(() => {
    if (state.phase !== 'answering' && state.phase !== 'complete') {
      setViewerIndex(null);
      setTableViewerIndex(null);
      setEqPage(null);
    }
  }, [state.phase]);

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
    if (!d) return false;
    if (d.every(v => v !== null)) return true;
    // For extended-written-levels: cap reached means fully decided
    const part = question.parts[partIdx];
    if (part.type === 'extended-written-levels') {
      const points = parseMarkScheme(part.markScheme);
      let awarded = 0;
      d.forEach((v, i) => { if (v === true && points[i]) awarded += points[i].marks; });
      return awarded >= part.marks;
    }
    return false;
  });

  // Calculate total score for final panel
  const totalScore = Object.values(state.partScores).reduce((sum, s) => sum + s, 0);

  const showSidebar = state.phase === 'answering' || state.phase === 'complete';

  return (
    <>
      <div
        ref={containerRef}
        id="question-content-inner"
      >
        <QuestionHeader title={question.title} totalMarks={totalMarks} onBack={onBack} />

        {question.parts.map((part, i) => {
          const diagramOffset = question.parts.slice(0, i).reduce(
            (sum, p) => sum + (p.diagrams ? p.diagrams.length : 0), 0
          );
          const tableOffset = question.parts.slice(0, i).reduce(
            (sum, p) => sum + (p.tables ? p.tables.length : 0), 0
          );
          return (
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
              diagramOffset={diagramOffset}
              tableOffset={tableOffset}
              onFigureClick={figures.length > 0 ? handleFigureClick : undefined}
              onTableClick={tables.length > 0 ? handleTableClick : undefined}
            />
          );
        })}

        {state.phase === 'answering' && (
          <button className="submit-btn" onClick={handleEnterMarking}>
            Lock Answers & Mark
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

      {showSidebar && (
        <FigureSidebar
          figures={figures}
          tables={tables}
          onFigureClick={handleFigureClick}
          onTableClick={handleTableClick}
          onEquationsClick={handleEquationsClick}
          activeFigure={viewerIndex}
          activeTable={tableViewerIndex}
          activeEquations={eqPage !== null}
        />
      )}

      {viewerIndex !== null && figures[viewerIndex] && (
        <FigureViewer
          src={`images/${figures[viewerIndex].src}`}
          label={figures[viewerIndex].label}
          onClose={handleViewerClose}
          onPrev={viewerIndex > 0 ? handleViewerPrev : null}
          onNext={viewerIndex < figures.length - 1 ? handleViewerNext : null}
        />
      )}

      {tableViewerIndex !== null && tables[tableViewerIndex] && (
        <FigureViewer
          tableData={tables[tableViewerIndex].data}
          label={tables[tableViewerIndex].label}
          onClose={handleViewerClose}
          onPrev={tableViewerIndex > 0 ? handleTableViewerPrev : null}
          onNext={tableViewerIndex < tables.length - 1 ? handleTableViewerNext : null}
        />
      )}

      {eqPage !== null && (
        <FigureViewer
          src={EQ_PAGES[eqPage]}
          className="equation-sheet-viewer"
          label={`Equation Sheet — Page ${eqPage + 1} of ${EQ_PAGES.length}`}
          onClose={handleViewerClose}
          onPrev={eqPage > 0 ? () => setEqPage(p => p - 1) : null}
          onNext={eqPage < EQ_PAGES.length - 1 ? () => setEqPage(p => p + 1) : null}
        />
      )}

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
