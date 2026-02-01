import React, { useState, useEffect, useCallback } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './components/LandingPage';
import TopicSelection from './components/TopicSelection';
import SubtopicSelection from './components/SubtopicSelection';
import QuestionList from './components/QuestionList';
import FeedbackModal from './components/FeedbackModal';
import BugReportModal from './components/BugReportModal';
import Breadcrumb from './components/Breadcrumb';
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

  // Load topics data on mount
  useEffect(() => {
    fetch('data/topics.json')
      .then((r) => r.json())
      .then(setTopicsData)
      .catch((err) => console.error('Failed to load topics:', err));
  }, []);

  // Refresh scores from cookies
  const refreshScores = useCallback(() => {
    setScores(getQuestionScores());
  }, []);

  // Navigation
  const goToTopics = useCallback(() => setView('topics'), []);

  const handleBack = useCallback(() => {
    switch (view) {
      case 'topics': setView('landing'); break;
      case 'subtopics': setView('topics'); break;
      case 'questions': setView('subtopics'); break;
      case 'question': setView('questions'); break;
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
    (questionId) => {
      const q = questions.find((q) => q.id === questionId);
      if (!q) return;
      setCurrentQuestion(q);
      setSavedState(loadQuestionAnswers(q.id));
      setView('question');
      requestAnimationFrame(() => {
        const el = document.getElementById('question-content-inner');
        if (el) el.scrollIntoView({ behavior: 'instant' });
      });
    },
    [questions]
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
    setView('questions');
  }, [refreshScores]);

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
        </header>
      )}

      <main>
        {view === 'landing' && <LandingPage onStart={goToTopics} />}

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
                savedState={savedState}
                subtopicName={subtopic?.name || ''}
                mainTopicName={mainTopic?.name || ''}
              />
            </div>
          </>
        )}
        {view !== 'landing' && (
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
    </ErrorBoundary>
  );
}
