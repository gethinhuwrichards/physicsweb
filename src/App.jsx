import React, { useState, useEffect, useCallback, useRef } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './components/LandingPage';
import TopicSelection from './components/TopicSelection';
import SubtopicSelection from './components/SubtopicSelection';
import QuestionList from './components/QuestionList';
import FeedbackModal from './components/FeedbackModal';
import BugReportModal from './components/BugReportModal';
import Breadcrumb from './components/Breadcrumb';
import QuestionView from './QuestionView';
import AuthModal from './components/AuthModal';
import ProfilePage from './components/ProfilePage';
import { useAuth } from './contexts/AuthContext';
import { useProgress } from './contexts/ProgressContext';
import { supabase } from './lib/supabase';
import { setCookie, getQuestionScores } from './utils/storage';

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

  const [view, setView] = useState('landing');
  const [topicsData, setTopicsData] = useState(null);
  const [mainTopic, setMainTopic] = useState(null);
  const [subtopic, setSubtopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionKey, setQuestionKey] = useState(0);
  const [savedState, setSavedState] = useState(null);
  const [bugReportOpen, setBugReportOpen] = useState(false);

  // Auth UI state
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState('signin');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Session tracking
  const sessionIdRef = useRef(null);

  // Load topics data on mount
  useEffect(() => {
    fetch('data/topics.json')
      .then((r) => r.json())
      .then(setTopicsData)
      .catch((err) => console.error('Failed to load topics:', err));
  }, []);

  // Session tracking: create session on mount, update on unload
  useEffect(() => {
    if (!user) return;

    let sid = null;

    const startSession = async () => {
      try {
        const { data } = await supabase
          .from('session_logs')
          .insert({ user_id: user.id, questions_attempted: 0 })
          .select('id')
          .single();
        if (data) {
          sid = data.id;
          sessionIdRef.current = data.id;
        }
      } catch {
        // Non-critical
      }
    };

    const endSession = () => {
      if (!sid) return;
      // Best-effort update on page unload
      supabase
        .from('session_logs')
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: Math.round((Date.now() - sessionStart) / 1000),
        })
        .eq('id', sid)
        .then(() => {});
    };

    const sessionStart = Date.now();
    startSession();

    window.addEventListener('beforeunload', endSession);
    return () => {
      window.removeEventListener('beforeunload', endSession);
      // Also try to end session on cleanup
      if (sid) {
        supabase
          .from('session_logs')
          .update({
            ended_at: new Date().toISOString(),
            duration_seconds: Math.round((Date.now() - sessionStart) / 1000),
          })
          .eq('id', sid)
          .then(() => {});
      }
    };
  }, [user]);

  // Close user menu when clicking outside
  useEffect(() => {
    if (!showUserMenu) return;
    const handler = () => setShowUserMenu(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showUserMenu]);

  // Navigation
  const goToTopics = useCallback(() => setView('topics'), []);

  const handleBack = useCallback(() => {
    switch (view) {
      case 'topics': setView('landing'); break;
      case 'subtopics': setView('topics'); break;
      case 'questions': setView('subtopics'); break;
      case 'question': setView('questions'); break;
      case 'profile': setView('topics'); break;
      default: break;
    }
  }, [view]);

  const selectTopic = useCallback(
    (topicId) => {
      const topic = topicsData.mainTopics.find((t) => t.id === topicId);
      if (topic) {
        setMainTopic(topic);
        setView('subtopics');
      }
    },
    [topicsData]
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

        setView('questions');
      } catch (err) {
        console.error('Failed to load subtopic questions:', err);
      }
    },
    [mainTopic, refreshScores]
  );

  const selectQuestion = useCallback(
    async (questionId) => {
      const q = questions.find((q) => q.id === questionId);
      if (!q) return;
      setCurrentQuestion(q);
      const saved = await loadQuestionAnswers(q.id);
      setSavedState(saved);
      setView('question');
      requestAnimationFrame(() => {
        const el = document.getElementById('question-content-inner');
        if (el) el.scrollIntoView({ behavior: 'instant' });
      });
    },
    [questions, loadQuestionAnswers]
  );

  // Question callbacks
  const handleScoreReady = useCallback(
    (score, maxScore) => {
      saveQuestionScore(currentQuestion.id, score, maxScore, subtopic.id);
    },
    [currentQuestion, subtopic, saveQuestionScore]
  );

  const handleBankScore = useCallback(() => {
    refreshScores();
    setView('questions');
  }, [refreshScores]);

  const handleReset = useCallback(() => {
    clearQuestionAnswers(currentQuestion.id);
    clearQuestionScore(currentQuestion.id);
    refreshScores();
    setSavedState(null);
    setQuestionKey((k) => k + 1);
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

  // Record attempt (called from QuestionView)
  const handleRecordAttempt = useCallback(
    (attemptData) => {
      recordAttempt(attemptData);
    },
    [recordAttempt]
  );

  // Auth helpers
  const openSignIn = () => {
    setAuthTab('signin');
    setShowAuth(true);
  };
  const openSignUp = () => {
    setAuthTab('signup');
    setShowAuth(true);
  };

  // Breadcrumb items
  const breadcrumbItems = [];
  if (view === 'subtopics' && mainTopic) {
    breadcrumbItems.push({ label: mainTopic.name });
  } else if (view === 'questions' && mainTopic && subtopic) {
    breadcrumbItems.push({ label: mainTopic.name, onClick: () => setView('subtopics') });
    breadcrumbItems.push({ label: subtopic.name });
  } else if (view === 'question' && mainTopic && subtopic) {
    breadcrumbItems.push({ label: mainTopic.name, onClick: () => setView('subtopics') });
    breadcrumbItems.push({ label: subtopic.name, onClick: () => setView('questions') });
  }

  return (
    <ErrorBoundary>
      <FeedbackModal />

      {view !== 'landing' && (
        <header>
          <h1>Physics &mdash; Exam Questions by Topic</h1>
          <div className="header-auth">
            {authLoading ? null : user ? (
              <div className="user-menu-wrapper">
                <button
                  className="user-menu-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu((v) => !v);
                  }}
                >
                  <span className="user-avatar">
                    {(profile?.display_name || profile?.email || '?')[0].toUpperCase()}
                  </span>
                  <span className="user-name">{profile?.display_name || profile?.email}</span>
                </button>
                {showUserMenu && (
                  <div className="user-dropdown" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => { setView('profile'); setShowUserMenu(false); }}>
                      Profile
                    </button>
                    <button onClick={() => { signOut(); setShowUserMenu(false); }}>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="header-signin-btn" onClick={openSignIn}>
                Sign In
              </button>
            )}
          </div>
        </header>
      )}

      {migrationMessage && (
        <div className="migration-toast">{migrationMessage}</div>
      )}

      <main>
        {view === 'landing' && (
          <LandingPage
            onStart={goToTopics}
            onSignIn={openSignIn}
            user={user}
          />
        )}

        {view === 'topics' && topicsData && (
          <>
            <Breadcrumb items={[]} />
            <TopicSelection
              topics={topicsData.mainTopics}
              scores={scores}
              onSelectTopic={selectTopic}
              onResetAll={handleResetAll}
            />
          </>
        )}

        {view === 'subtopics' && mainTopic && (
          <>
            <Breadcrumb items={breadcrumbItems} />
            <SubtopicSelection
              mainTopic={mainTopic}
              scores={scores}
              onSelectSubtopic={selectSubtopic}
              onResetAll={handleResetAllTopic}
            />
          </>
        )}

        {view === 'questions' && (
          <>
            <Breadcrumb items={breadcrumbItems} />
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
          </>
        )}

        {view === 'question' && currentQuestion && (
          <>
            <Breadcrumb items={breadcrumbItems} />
            <div id="question-container">
              <QuestionView
                key={questionKey}
                question={currentQuestion}
                onBankScore={handleBankScore}
                onReset={handleReset}
                onSaveAnswers={handleSaveAnswers}
                onScoreReady={handleScoreReady}
                onRecordAttempt={handleRecordAttempt}
                savedState={savedState}
                subtopicName={subtopic?.name || ''}
                subtopicId={subtopic?.id || ''}
                mainTopicName={mainTopic?.name || ''}
                mainTopicId={mainTopic?.id || ''}
              />
            </div>
          </>
        )}

        {view === 'profile' && (
          <ProfilePage onBack={() => setView('topics')} />
        )}

        {view !== 'landing' && view !== 'profile' && (
          <div className={`bottom-nav-row${view === 'question' ? ' has-report' : ''}`}>
            <button className="back-btn-fixed" onClick={handleBack}>
              &larr; Back
            </button>
            {view === 'question' && (
              <button className="bug-report-btn" onClick={() => setBugReportOpen(true)}>
                Report Bug
              </button>
            )}
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

      <AuthModal
        visible={showAuth}
        onClose={() => setShowAuth(false)}
        initialTab={authTab}
      />
    </ErrorBoundary>
  );
}
