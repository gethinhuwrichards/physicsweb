// Cookie helpers
export function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie =
    name +
    '=' +
    encodeURIComponent(JSON.stringify(value)) +
    ';expires=' +
    d.toUTCString() +
    ';path=/;SameSite=Lax';
}

export function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) {
    try {
      return JSON.parse(decodeURIComponent(match[2]));
    } catch (e) {
      return null;
    }
  }
  return null;
}

// Score storage (cookies)
export function getQuestionScores() {
  return getCookie('questionScores') || {};
}

export function saveQuestionScore(questionId, score, maxScore, subtopicId) {
  const scores = getQuestionScores();
  scores[questionId] = { score, max: maxScore, subtopic: subtopicId };
  setCookie('questionScores', scores, 365);
}

export function countAnsweredForSubtopic(subtopicId) {
  const scores = getQuestionScores();
  return Object.values(scores).filter((s) => s.subtopic === subtopicId).length;
}

export function clearQuestionScore(questionId) {
  const scores = getQuestionScores();
  delete scores[questionId];
  setCookie('questionScores', scores, 365);
}

// Answer persistence (localStorage)
export function saveQuestionAnswers(questionId, stateToSave) {
  localStorage.setItem('answers_' + questionId, JSON.stringify(stateToSave));
}

export function loadQuestionAnswers(questionId) {
  try {
    const raw = localStorage.getItem('answers_' + questionId);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function clearQuestionAnswers(questionId) {
  localStorage.removeItem('answers_' + questionId);
}
