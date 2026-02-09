import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './components/LandingPage';
import TopicSelection from './components/TopicSelection';
import SubtopicSelection from './components/SubtopicSelection';
import QuestionList from './components/QuestionList';
import FeedbackModal from './components/FeedbackModal';
import BugReportModal from './components/BugReportModal';
import Breadcrumb from './components/Breadcrumb';
import ThemeToggle from './components/ThemeToggle';
import QuestionView from './QuestionView';
import {
  getQuestionScores,
  saveQuestionScore,
  clearQuestionScore,
  clearQuestionAnswers,
  saveQuestionAnswers,
  loadQuestionAnswers,
  setCookie,
  countAnsweredForSubtopic,
  clearScoresForSubtopic,
  clearAllScoresAndAnswers,
} from './utils/storage';

export default function App() {
  const [view, setView] = useState('landing');
  const [topicsData, setTopicsData] = useState(null);
  const [mainTopic, setMainTopic] = useState(null);
  const [subtopic, setSubtopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionKey, setQuestionKey] = useState(0);
  const [savedState, setSavedState] = useState(null);
  const [scores, setScores] = useState(getQuestionScores);
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const isPopstate = useRef(false);
  const [forwardStack, setForwardStack] = useState([]);

  // Load topics data on mount
  useEffect(() => {
    fetch('data/topics.json')
      .then((r) => r.json())
      .then(setTopicsData)
      .catch((err) => console.error('Failed to load topics:', err));
  }, []);

  // Browser history: set initial state and listen for back/forward
  useEffect(() => {
    history.replaceState({ view: 'landing' }, '');
    const handlePopState = (e) => {
      const target = e.state?.view || 'landing';
      isPopstate.current = true;
      setView(target);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Push history entry on view changes (skip if triggered by popstate)
  useEffect(() => {
    if (isPopstate.current) {
      isPopstate.current = false;
      return;
    }
    // Don't push for the initial landing view (already set via replaceState)
    if (view === 'landing') return;
    history.pushState({ view }, '');
  }, [view]);

  // Refresh scores from cookies
  const refreshScores = useCallback(() => {
    setScores(getQuestionScores());
  }, []);

  // Navigation — any "fresh" navigation clears the forward stack
  const navigateTo = useCallback((target) => {
    setForwardStack([]);
    setView(target);
  }, []);

  const goToTopics = useCallback(() => navigateTo('topics'), [navigateTo]);
  const goToLanding = useCallback(() => navigateTo('landing'), [navigateTo]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'instant' });

  const handleBack = useCallback(() => {
    setForwardStack(prev => [...prev, view]);
    scrollToTop();
    if (view === 'question') { setView('questions'); return; }
    if (view === 'questions') { setView('subtopics'); return; }
    if (view === 'subtopics') { setView('topics'); return; }
    if (view === 'topics') { setView('landing'); return; }
    history.back();
  }, [view]);

  const handleForward = useCallback(() => {
    if (forwardStack.length === 0) return;
    const next = forwardStack[forwardStack.length - 1];
    setForwardStack(prev => prev.slice(0, -1));
    setView(next);
    scrollToTop();
  }, [forwardStack]);

  // Arrow-key navigation (only when header arrows are visible)
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.activeElement?.isContentEditable) return;
      if (view === 'landing' || view === 'question') return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); handleBack(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); handleForward(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [view, handleBack, handleForward]);

  const selectTopic = useCallback(
    (topicId) => {
      const topic = topicsData.mainTopics.find((t) => t.id === topicId);
      if (topic) {
        setMainTopic(topic);
        navigateTo('subtopics');
      }
    },
    [topicsData, navigateTo]
  );

  const selectSubtopic = useCallback(
    async (subId, file) => {
      const sub = mainTopic.subtopics.find((s) => s.id === subId);
      if (!sub) return;
      setSubtopic(sub);

      try {
        const response = await fetch('data/' + file);
        const data = await response.json();
        setQuestions(data.questions);

        // Backfill subtopic IDs on old cookie entries
        const currentScores = getQuestionScores();
        let updated = false;
        data.questions.forEach((q) => {
          if (currentScores[q.id] && !currentScores[q.id].subtopic) {
            currentScores[q.id].subtopic = subId;
            updated = true;
          }
        });
        if (updated) {
          setCookie('questionScores', currentScores, 365);
          refreshScores();
        }

        navigateTo('questions');
      } catch (err) {
        console.error('Failed to load subtopic questions:', err);
      }
    },
    [mainTopic, refreshScores, navigateTo]
  );

  const selectQuestion = useCallback(
    (questionId) => {
      const q = questions.find((q) => q.id === questionId);
      if (!q) return;
      setCurrentQuestion(q);
      setSavedState(loadQuestionAnswers(q.id));
      navigateTo('question');
      requestAnimationFrame(() => {
        const el = document.getElementById('question-content-inner');
        if (el) {
          const top = el.getBoundingClientRect().top + window.pageYOffset;
          const offset = 48;
          window.scrollTo({ top: Math.max(top - offset, 0), behavior: 'instant' });
        }
      });
    },
    [questions, navigateTo]
  );

  // Question callbacks
  const handleScoreReady = useCallback(
    (score, maxScore) => {
      saveQuestionScore(currentQuestion.id, score, maxScore, subtopic.id);
      refreshScores();
    },
    [currentQuestion, subtopic, refreshScores]
  );

  const handleBankScore = useCallback(() => {
    refreshScores();
    navigateTo('questions');
  }, [refreshScores, navigateTo]);

  const handleReset = useCallback(() => {
    clearQuestionAnswers(currentQuestion.id);
    clearQuestionScore(currentQuestion.id);
    refreshScores();
    setSavedState(null);
    setQuestionKey((k) => k + 1);
  }, [currentQuestion, refreshScores]);

  const handleSaveAnswers = useCallback(
    (stateToSave) => {
      saveQuestionAnswers(currentQuestion.id, stateToSave);
    },
    [currentQuestion]
  );

  const handleResetFromList = useCallback(
    (questionId) => {
      clearQuestionAnswers(questionId);
      clearQuestionScore(questionId);
      refreshScores();
    },
    [refreshScores]
  );

  // Bulk reset handlers
  const handleResetAllSubtopic = useCallback(() => {
    questions.forEach((q) => {
      clearQuestionAnswers(q.id);
      clearQuestionScore(q.id);
    });
    refreshScores();
  }, [questions, refreshScores]);

  const handleResetAllTopic = useCallback(() => {
    if (!mainTopic) return;
    mainTopic.subtopics.forEach((sub) => {
      clearScoresForSubtopic(sub.id);
    });
    refreshScores();
  }, [mainTopic, refreshScores]);

  const handleResetAll = useCallback(() => {
    clearAllScoresAndAnswers();
    refreshScores();
  }, [refreshScores]);

  // Breadcrumb items
  const breadcrumbItems = [];
  if (view !== 'landing') {
    if (view === 'topics') {
      breadcrumbItems.push({ label: 'Subject', onClick: goToLanding });
      breadcrumbItems.push({ label: 'Topics' });
    } else if (view === 'subtopics') {
      breadcrumbItems.push({ label: 'Subject', onClick: goToLanding });
      breadcrumbItems.push({ label: 'Topics', onClick: goToTopics });
      breadcrumbItems.push({ label: 'Subtopics' });
    } else if (mainTopic) {
      breadcrumbItems.push({ label: 'Subject', onClick: goToLanding });
      breadcrumbItems.push({ label: 'Topics', onClick: goToTopics });
      if (view === 'question') {
        breadcrumbItems.push({ label: 'Subtopics', onClick: () => navigateTo('subtopics') });
        breadcrumbItems.push({ label: 'Questions', onClick: () => navigateTo('questions') });
      } else {
        breadcrumbItems.push({ label: 'Subtopics', onClick: () => navigateTo('subtopics') });
        breadcrumbItems.push({ label: 'Questions' });
      }
    } else {
      breadcrumbItems.push({ label: 'Subject', onClick: goToLanding });
    }
  }

  const getHeaderTitle = () => {
    if (view === 'topics') return 'Physics';
    if (view === 'subtopics') return mainTopic?.name || 'Choose a Subtopic';
    if (view === 'questions') return subtopic?.name || 'Choose a Question';
    if (view === 'question') return '';
    return 'Physics — Exam Questions by Topic';
  };

  const getHeaderSubtitle = () => {
    if (view === 'topics') return 'Select a subject';
    if (view === 'subtopics') return 'Select a subtopic';
    if (view === 'questions') return 'Select a question';
    if (view === 'question') return '';
    return '';
  };

  return (
    <ErrorBoundary>
      <ThemeToggle />
      <FeedbackModal />

      {view !== 'landing' && view !== 'question' && (
        <header>
          <div className="header-top-row">
            <Breadcrumb items={breadcrumbItems} />
          </div>
          <div className="header-title-row">
            <button className="header-nav-btn" onClick={handleBack} aria-label="Go back">
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M12.5 4L6.5 10l6 6" stroke="currentColor" strokeWidth="2.2"
                      strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {getHeaderTitle() && <h1>{getHeaderTitle()}</h1>}
            <button className="header-nav-btn" onClick={handleForward}
                    disabled={forwardStack.length === 0} aria-label="Go forward">
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M7.5 4L13.5 10l-6 6" stroke="currentColor" strokeWidth="2.2"
                      strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </header>
      )}

      <main>
        {view !== 'landing' && view !== 'question' && getHeaderSubtitle() && (
          <p className="content-subtitle">{getHeaderSubtitle()}</p>
        )}
        {view === 'landing' && <LandingPage onStart={goToTopics} />}

        {view === 'topics' && topicsData && (
          <TopicSelection
            topics={topicsData.mainTopics}
            scores={scores}
            onSelectTopic={selectTopic}
            onResetAll={handleResetAll}
          />
        )}

        {view === 'subtopics' && mainTopic && (
          <SubtopicSelection
            mainTopic={mainTopic}
            scores={scores}
            onSelectSubtopic={selectSubtopic}
            onResetAll={handleResetAllTopic}
          />
        )}

        {view === 'questions' && (
          <QuestionList
            title={subtopic?.name || ''}
            questions={questions}
            scores={scores}
            scrollToId={currentQuestion?.id}
            onSelectQuestion={selectQuestion}
            onResetQuestion={handleResetFromList}
            onResetAll={handleResetAllSubtopic}
          />
        )}

        {view === 'question' && currentQuestion && (
          <div id="question-container" className={currentQuestion.parts?.some(p => p.diagrams?.length > 0 || p.tables?.length > 0) ? 'has-figure-sidebar' : ''}>
              <QuestionView
                key={questionKey}
                question={currentQuestion}
                onBankScore={handleBankScore}
                onBack={handleBack}
                onReset={handleReset}
                onSaveAnswers={handleSaveAnswers}
                onScoreReady={handleScoreReady}
                onReportBug={() => setBugReportOpen(true)}
                savedState={savedState}
                subtopicName={subtopic?.name || ''}
                mainTopicName={mainTopic?.name || ''}
              />
          </div>
        )}
      </main>

      {view === 'question' && currentQuestion && (
        <BugReportModal
          visible={bugReportOpen}
          onClose={() => setBugReportOpen(false)}
          questionTitle={currentQuestion.title}
          questionId={currentQuestion.id}
          subtopicName={subtopic?.name || ''}
          mainTopicName={mainTopic?.name || ''}
        />
      )}
      <Analytics />
    </ErrorBoundary>
  );
}
