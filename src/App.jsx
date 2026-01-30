import React, { useState, useEffect, useCallback } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './components/LandingPage';
import TopicSelection from './components/TopicSelection';
import SubtopicSelection from './components/SubtopicSelection';
import QuestionList from './components/QuestionList';
import FeedbackModal from './components/FeedbackModal';
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
    },
    [questions]
  );

  const goBack = useCallback(() => {
    switch (view) {
      case 'topics':
        setView('landing');
        break;
      case 'subtopics':
        setView('topics');
        break;
      case 'questions':
        setView('subtopics');
        break;
      case 'question':
        setView('questions');
        break;
    }
  }, [view]);

  // Question callbacks
  const handleBankScore = useCallback(
    (score, maxScore) => {
      saveQuestionScore(currentQuestion.id, score, maxScore, subtopic.id);
      refreshScores();
      setView('questions');
    },
    [currentQuestion, subtopic, refreshScores]
  );

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

  return (
    <ErrorBoundary>
      <FeedbackModal />

      {view !== 'landing' && view !== 'question' && (
        <header>
          <h1>Physics Exam Practice</h1>
        </header>
      )}

      <main>
        {view === 'landing' && <LandingPage onStart={goToTopics} />}

        {view === 'topics' && topicsData && (
          <TopicSelection
            topics={topicsData.mainTopics}
            scores={scores}
            onSelectTopic={selectTopic}
            onBack={() => setView('landing')}
          />
        )}

        {view === 'subtopics' && mainTopic && (
          <SubtopicSelection
            mainTopic={mainTopic}
            scores={scores}
            onSelectSubtopic={selectSubtopic}
            onBack={() => setView('topics')}
          />
        )}

        {view === 'questions' && (
          <QuestionList
            title={subtopic?.name || ''}
            questions={questions}
            scores={scores}
            onSelectQuestion={selectQuestion}
            onResetQuestion={handleResetFromList}
            onBack={() => setView('subtopics')}
          />
        )}

        {view === 'question' && currentQuestion && (
          <>
            <button className="back-btn" onClick={goBack}>
              &larr; Back to Questions
            </button>
            <div id="question-container">
              <QuestionView
                key={questionKey}
                question={currentQuestion}
                onBankScore={handleBankScore}
                onReset={handleReset}
                onSaveAnswers={handleSaveAnswers}
                savedState={savedState}
              />
            </div>
          </>
        )}
      </main>
    </ErrorBoundary>
  );
}
