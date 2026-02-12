import React, { useState, useEffect, useCallback, useRef } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './components/LandingPage';
import TopicSelection from './components/TopicSelection';
import SubtopicSelection from './components/SubtopicSelection';
import QuestionList from './components/QuestionList';
import FeedbackModal from './components/FeedbackModal';
import BugReportModal from './components/BugReportModal';
import Breadcrumb from './components/Breadcrumb';
import SettingsDropdown from './components/SettingsDropdown';
import QuestionView from './QuestionView';
import AuthModal from './components/AuthModal';
import ProfilePage from './components/ProfilePage';
import AnalyticsDashboard from './components/admin/AnalyticsDashboard';
import { useAuth } from './contexts/AuthContext';
import { useProgress } from './contexts/ProgressContext';
import { setCookie, getQuestionScores } from './utils/storage';
import { FEATURE_AUTH_UI } from './lib/featureFlags';
import { trackQuestionView, trackQuestionAnswer, trackQuestionSkip } from './lib/analytics';

export default function App() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const {
    scores,
    refreshScores,
    saveQuestionScore,
    clearQuestionScore,
    saveQuestionAnswers,
    loadQuestionAnswers,
    clearQuestionAnswers,
    clearScoresForSubtopic,
    clearAllScoresAndAnswers,
    recordAttempt,
    migrationMessage,
  } = useProgress();

  const [view, setView] = useState(() => {
    if (window.location.pathname === '/admin/analytics') return 'admin';
    return 'landing';
  });
  const [topicsData, setTopicsData] = useState(null);
  const [mainTopic, setMainTopic] = useState(null);
  const [subtopic, setSubtopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionKey, setQuestionKey] = useState(0);
  const [savedState, setSavedState] = useState(null);
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const isPopstate = useRef(false);
  const [forwardStack, setForwardStack] = useState([]);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('signin');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const questionStartTime = useRef(null);

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
    if (view === 'landing') return;
    history.pushState({ view }, '');
  }, [view]);

  // Close user menu on click outside
  useEffect(() => {
    if (!userMenuOpen) return;
    const close = () => setUserMenuOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [userMenuOpen]);

  // Navigation
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
    if (view === 'profile') { setView('landing'); return; }
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

  // Arrow-key navigation
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.activeElement?.isContentEditable) return;
      if (view === 'question') return;
      if (e.key === 'ArrowLeft' && view !== 'landing') { e.preventDefault(); handleBack(); }
      else if (e.key === 'ArrowRight' && forwardStack.length > 0) { e.preventDefault(); handleForward(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [view, handleBack, handleForward, forwardStack]);

  // Track question skip: leaving question view without answering
  const prevViewRef = useRef(view);
  useEffect(() => {
    const prev = prevViewRef.current;
    prevViewRef.current = view;
    if (prev === 'question' && view !== 'question' && questionStartTime.current && currentQuestion) {
      const timeSpent = Math.round((Date.now() - questionStartTime.current) / 1000);
      const partsTotal = currentQuestion.parts ? currentQuestion.parts.length : 0;
      trackQuestionSkip(currentQuestion.id, subtopic?.id, mainTopic?.id, partsTotal, timeSpent);
      questionStartTime.current = null;
    }
  }, [view, currentQuestion, subtopic, mainTopic]);

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
    async (questionId) => {
      const q = questions.find((q) => q.id === questionId);
      if (!q) return;
      setCurrentQuestion(q);
      const saved = await loadQuestionAnswers(q.id);
      setSavedState(saved);
      questionStartTime.current = Date.now();
      const partsTotal = q.parts ? q.parts.length : 0;
      trackQuestionView(q.id, subtopic?.id, mainTopic?.id, partsTotal);
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
    [questions, navigateTo, loadQuestionAnswers]
  );

  // Question callbacks
  const handleScoreReady = useCallback(
    (score, maxScore, partsAnswered) => {
      saveQuestionScore(currentQuestion.id, score, maxScore, subtopic.id);

      // Record attempt analytics
      const timeSpent = questionStartTime.current
        ? Math.round((Date.now() - questionStartTime.current) / 1000)
        : null;
      recordAttempt({
        questionId: currentQuestion.id,
        subtopicId: subtopic.id,
        mainTopicId: mainTopic?.id || '',
        score,
        maxScore,
        difficulty: currentQuestion.difficulty || 'medium',
        timeSpentSeconds: timeSpent,
      });

      const partsTotal = currentQuestion.parts ? currentQuestion.parts.length : 0;
      const partsBlank = partsTotal - (partsAnswered || 0);
      trackQuestionAnswer({
        questionId: currentQuestion.id,
        subtopicId: subtopic?.id,
        mainTopicId: mainTopic?.id,
        score,
        maxScore,
        partsAnswered: partsAnswered || 0,
        partsTotal,
        partsBlank,
        timeSpentSeconds: timeSpent,
      });
      questionStartTime.current = null;
    },
    [currentQuestion, subtopic, mainTopic, saveQuestionScore, recordAttempt]
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
    questionStartTime.current = Date.now();
  }, [currentQuestion, refreshScores, clearQuestionAnswers, clearQuestionScore]);

  const handleSaveAnswers = useCallback(
    (stateToSave) => {
      saveQuestionAnswers(currentQuestion.id, stateToSave);
    },
    [currentQuestion, saveQuestionAnswers]
  );

  const handleResetFromList = useCallback(
    (questionId) => {
      clearQuestionAnswers(questionId);
      clearQuestionScore(questionId);
      refreshScores();
    },
    [refreshScores, clearQuestionAnswers, clearQuestionScore]
  );

  // Bulk reset handlers
  const handleResetAllSubtopic = useCallback(() => {
    questions.forEach((q) => {
      clearQuestionAnswers(q.id);
      clearQuestionScore(q.id);
    });
    refreshScores();
  }, [questions, refreshScores, clearQuestionAnswers, clearQuestionScore]);

  const handleResetAllTopic = useCallback(() => {
    if (!mainTopic) return;
    mainTopic.subtopics.forEach((sub) => {
      clearScoresForSubtopic(sub.id);
    });
    refreshScores();
  }, [mainTopic, refreshScores, clearScoresForSubtopic]);

  const handleResetAll = useCallback(() => {
    clearAllScoresAndAnswers();
    refreshScores();
  }, [refreshScores, clearAllScoresAndAnswers]);

  // Auth helpers
  const openSignIn = useCallback(() => {
    setAuthModalTab('signin');
    setAuthModalVisible(true);
  }, []);

  const openSignUp = useCallback(() => {
    setAuthModalTab('signup');
    setAuthModalVisible(true);
  }, []);

  // Breadcrumb items
  const breadcrumbItems = [];
  if (view !== 'landing' && view !== 'profile') {
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
    if (view === 'topics') return 'GCSE Physics';
    if (view === 'subtopics') return mainTopic?.name || 'Choose a Subtopic';
    if (view === 'questions') return subtopic?.name || 'Choose a Question';
    if (view === 'question') return '';
    if (view === 'profile') return 'Profile';
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
      <SettingsDropdown onReportBug={view === 'question' && currentQuestion ? () => setBugReportOpen(true) : null} />
      <FeedbackModal />
      {FEATURE_AUTH_UI && (
        <AuthModal
          visible={authModalVisible}
          onClose={() => setAuthModalVisible(false)}
          initialTab={authModalTab}
        />
      )}

      {migrationMessage && (
        <div className="migration-toast">{migrationMessage}</div>
      )}

      {(view !== 'landing' || forwardStack.length > 0) && view !== 'question' && view !== 'admin' && (
        <header>
          {view !== 'landing' && (
            <div className="header-top-row">
              <Breadcrumb items={breadcrumbItems} />
              {FEATURE_AUTH_UI && (
                <div className="header-user-area" onClick={(e) => e.stopPropagation()}>
                  {user ? (
                    <div className="user-menu-wrapper">
                      <button
                        className="user-avatar-btn"
                        onClick={() => setUserMenuOpen(prev => !prev)}
                        aria-label="User menu"
                      >
                        {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                      </button>
                      {userMenuOpen && (
                        <div className="user-dropdown">
                          <div className="user-dropdown-email">{user.email}</div>
                          <button onClick={() => { setUserMenuOpen(false); navigateTo('profile'); }}>Profile</button>
                          <button onClick={() => { setUserMenuOpen(false); signOut(); }}>
                            Sign Out
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button className="header-sign-in-btn" onClick={openSignIn}>
                      Sign In
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="header-title-row">
            <button className="header-nav-btn" onClick={handleBack}
                    disabled={view === 'landing'} aria-label="Go back">
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M12.5 4L6.5 10l6 6" stroke="currentColor" strokeWidth="2.2"
                      strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {view !== 'landing' && getHeaderTitle() && <h1>{getHeaderTitle()}</h1>}
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
        {view !== 'landing' && view !== 'question' && view !== 'profile' && getHeaderSubtitle() && (
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
            user={user}
            profile={profile}
            subtopicId={subtopic?.id}
            onSignIn={openSignIn}
          />
        )}

        {view === 'question' && currentQuestion && (
          <div id="question-container" className="has-figure-sidebar">
              <QuestionView
                key={questionKey}
                question={currentQuestion}
                onBankScore={handleBankScore}
                onBack={handleBack}
                onReset={handleReset}
                onSaveAnswers={handleSaveAnswers}
                onScoreReady={handleScoreReady}
                savedState={savedState}
                subtopicName={subtopic?.name || ''}
                mainTopicName={mainTopic?.name || ''}
              />
          </div>
        )}

        {FEATURE_AUTH_UI && view === 'profile' && (
          <ProfilePage onBack={() => navigateTo('landing')} />
        )}

        {view === 'admin' && <AnalyticsDashboard />}
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
    </ErrorBoundary>
  );
}
