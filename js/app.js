// State
let topicsData = null;
let currentMainTopic = null;
let currentSubtopic = null;
let subtopicQuestions = [];
let currentQuestion = null;

// Cookie Helpers
function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = name + '=' + encodeURIComponent(JSON.stringify(value))
        + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
}

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) {
        try { return JSON.parse(decodeURIComponent(match[2])); }
        catch (e) { return null; }
    }
    return null;
}

// Score Storage
function getQuestionScores() {
    return getCookie('questionScores') || {};
}

function saveQuestionScore(questionId, score, maxScore, subtopicId) {
    const scores = getQuestionScores();
    scores[questionId] = { score: score, max: maxScore, subtopic: subtopicId };
    setCookie('questionScores', scores, 365);
}

function countAnsweredForSubtopic(subtopicId) {
    const scores = getQuestionScores();
    return Object.values(scores).filter(s => s.subtopic === subtopicId).length;
}

function clearQuestionScore(questionId) {
    const scores = getQuestionScores();
    delete scores[questionId];
    setCookie('questionScores', scores, 365);
}

// Answer Persistence (localStorage)
function saveQuestionAnswers(questionId, stateToSave) {
    localStorage.setItem('answers_' + questionId, JSON.stringify(stateToSave));
}

function loadQuestionAnswers(questionId) {
    try {
        const raw = localStorage.getItem('answers_' + questionId);
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}

function clearQuestionAnswers(questionId) {
    localStorage.removeItem('answers_' + questionId);
}

// DOM Elements
const topicSelection = document.getElementById('topic-selection');
const subtopicSelection = document.getElementById('subtopic-selection');
const questionSelection = document.getElementById('question-selection');
const questionView = document.getElementById('question-view');
const topicButtons = document.getElementById('topic-buttons');
const subtopicButtons = document.getElementById('subtopic-buttons');
const questionList = document.getElementById('question-list');
const questionContainer = document.getElementById('question-container');

// Initialize
async function init() {
    try {
        const response = await fetch('data/topics.json');
        topicsData = await response.json();
        renderMainTopics();
        showView('landing-page');
    } catch (error) {
        console.error('Failed to load topics:', error);
        topicButtons.innerHTML = '<p>Failed to load topics. Please refresh the page.</p>';
    }
}

// View Management
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');

    // Toggle landing page body class for header/background
    if (viewId === 'landing-page') {
        document.body.classList.add('landing-active');
        runLandingAnimation();
    } else {
        document.body.classList.remove('landing-active');
    }
}

// Render Main Topics
function renderMainTopics() {
    rerenderTopicButtons();

    topicButtons.addEventListener('click', (e) => {
        const btn = e.target.closest('.topic-btn');
        if (btn) {
            showSubtopicList(btn.dataset.topicId);
        }
    });
}

function rerenderTopicButtons() {
    topicButtons.innerHTML = topicsData.mainTopics.map(topic => {
        const totalQs = topic.subtopics.reduce((sum, s) => sum + (s.questionCount || 0), 0);
        const answeredQs = topic.subtopics.reduce((sum, s) => sum + countAnsweredForSubtopic(s.id), 0);
        const counterText = totalQs > 0 ? `${answeredQs} / ${totalQs} answered` : '';
        return `<button class="topic-btn" data-topic-id="${topic.id}">
            <span class="btn-name">${topic.name}</span>
            ${counterText ? `<span class="btn-counter">${counterText}</span>` : ''}
        </button>`;
    }).join('');
}

// Show Subtopic List
function showSubtopicList(mainTopicId) {
    currentMainTopic = topicsData.mainTopics.find(t => t.id === mainTopicId);
    if (!currentMainTopic) return;

    document.getElementById('selected-main-topic-title').textContent = currentMainTopic.name;

    const noSubtopicsMsg = document.getElementById('no-subtopics-message');

    if (currentMainTopic.subtopics.length === 0) {
        subtopicButtons.innerHTML = '';
        noSubtopicsMsg.classList.remove('hidden');
    } else {
        noSubtopicsMsg.classList.add('hidden');
        rerenderSubtopicButtons();
    }

    showView('subtopic-selection');
}

function rerenderSubtopicButtons() {
    if (!currentMainTopic) return;
    subtopicButtons.innerHTML = currentMainTopic.subtopics.map(sub => {
        const totalQs = sub.questionCount || 0;
        const answeredQs = countAnsweredForSubtopic(sub.id);
        const counterText = totalQs > 0 ? `${answeredQs} / ${totalQs} answered` : '';
        return `<button class="subtopic-btn" data-subtopic-id="${sub.id}" data-file="${sub.file}">
            <span class="btn-name">${sub.name}</span>
            ${counterText ? `<span class="btn-counter">${counterText}</span>` : ''}
        </button>`;
    }).join('');
}

// Load Subtopic Questions
async function loadSubtopicQuestions(subtopicId, filePath) {
    currentSubtopic = currentMainTopic.subtopics.find(s => s.id === subtopicId);

    try {
        const response = await fetch(`data/${filePath}`);
        const data = await response.json();
        subtopicQuestions = data.questions;

        // Backfill subtopic ID on any old cookie entries missing it
        const scores = getQuestionScores();
        let updated = false;
        subtopicQuestions.forEach(q => {
            if (scores[q.id] && !scores[q.id].subtopic) {
                scores[q.id].subtopic = subtopicId;
                updated = true;
            }
        });
        if (updated) {
            setCookie('questionScores', scores, 365);
            rerenderTopicButtons();
            rerenderSubtopicButtons();
        }

        // Update heading using subtopic field from JSON
        document.getElementById('selected-topic-title').textContent = data.subtopic;

        // Render question list
        rerenderQuestionList();

        showView('question-selection');
    } catch (error) {
        console.error('Failed to load subtopic questions:', error);
        alert('Failed to load questions. Please try again.');
    }
}

// Difficulty sort order
const difficultyOrder = { easy: 0, medium: 1, hard: 2 };

// Render Question List with Progress Bars
function rerenderQuestionList() {
    const scores = getQuestionScores();
    const sorted = [...subtopicQuestions].sort((a, b) =>
        (difficultyOrder[a.difficulty] ?? 1) - (difficultyOrder[b.difficulty] ?? 1)
    );
    questionList.innerHTML = sorted.map(q => {
        const totalMarks = q.parts.reduce((sum, p) => sum + p.marks, 0);
        const saved = scores[q.id];

        let progressHtml;
        if (saved) {
            const pct = Math.max(Math.round((saved.score / saved.max) * 100), 6);
            progressHtml = `
                <div class="question-progress">
                    <div class="question-progress-fill" style="width: ${pct}%"></div>
                    <span class="question-progress-text">${saved.score} / ${saved.max}</span>
                </div>
                <button class="question-reset-btn" data-reset-id="${q.id}">Reset</button>
            `;
        } else {
            progressHtml = `
                <div class="question-progress">
                    <span class="question-progress-text">&ndash;</span>
                </div>
                <button class="question-reset-btn" style="visibility: hidden">Reset</button>
            `;
        }

        const diffLabel = q.difficulty || 'medium';

        return `
            <div class="question-item" data-id="${q.id}">
                <span class="question-item-title">${q.title} <span class="difficulty-label difficulty-${diffLabel}">(${diffLabel})</span></span>
                <div class="question-item-right">
                    <span class="marks">${totalMarks} marks</span>
                    ${progressHtml}
                </div>
            </div>
        `;
    }).join('');

    // Hide reset confirm dialog when list re-renders
    document.getElementById('reset-confirm').classList.add('hidden');
}

// Load Question — mount React component
function loadQuestion(questionId) {
    currentQuestion = subtopicQuestions.find(q => q.id === questionId);
    if (!currentQuestion) return;

    if (typeof window.mountQuestionView !== 'function') {
        console.error('mountQuestionView not loaded. Check that dist/question-view.iife.js is served.');
        questionContainer.innerHTML = '<p style="color:red;padding:20px;">Failed to load question viewer. Please refresh the page.</p>';
        showView('question-view');
        return;
    }

    const savedState = loadQuestionAnswers(currentQuestion.id);

    window.mountQuestionView(questionContainer, currentQuestion, {
        onBankScore: (score, maxScore) => {
            saveQuestionScore(currentQuestion.id, score, maxScore, currentSubtopic.id);
            window.unmountQuestionView();
            showView('question-selection');
            rerenderQuestionList();
            rerenderTopicButtons();
            rerenderSubtopicButtons();
        },
        onReset: () => {
            clearQuestionAnswers(currentQuestion.id);
            clearQuestionScore(currentQuestion.id);
            window.unmountQuestionView();
            loadQuestion(currentQuestion.id);
        },
        onSaveAnswers: (stateToSave) => {
            saveQuestionAnswers(currentQuestion.id, stateToSave);
        },
        savedState: savedState,
    });

    showView('question-view');
}

// Event Listeners
// Landing page - Physics subject button
document.getElementById('subject-physics').addEventListener('click', () => {
    showView('topic-selection');
});

// Back to landing from topic selection
document.getElementById('back-to-landing').addEventListener('click', () => {
    showView('landing-page');
});

document.getElementById('back-to-topics').addEventListener('click', () => {
    showView('topic-selection');
});

document.getElementById('back-to-subtopics').addEventListener('click', () => {
    showView('subtopic-selection');
});

document.getElementById('back-to-questions').addEventListener('click', () => {
    window.unmountQuestionView();
    showView('question-selection');
});

// Subtopic button click handler
subtopicButtons.addEventListener('click', (e) => {
    const btn = e.target.closest('.subtopic-btn');
    if (btn) {
        loadSubtopicQuestions(btn.dataset.subtopicId, btn.dataset.file);
    }
});

// Question list click handler (includes reset button)
let pendingResetId = null;

questionList.addEventListener('click', (e) => {
    const resetBtn = e.target.closest('.question-reset-btn');
    if (resetBtn) {
        e.stopPropagation();
        pendingResetId = resetBtn.dataset.resetId;
        const confirmEl = document.getElementById('reset-confirm');
        confirmEl.classList.remove('hidden');
        confirmEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
    }

    const item = e.target.closest('.question-item');
    if (item) {
        loadQuestion(item.dataset.id);
    }
});

// Reset confirm dialog handlers
document.getElementById('reset-confirm-ok').addEventListener('click', () => {
    if (pendingResetId) {
        clearQuestionAnswers(pendingResetId);
        clearQuestionScore(pendingResetId);
        pendingResetId = null;
        rerenderQuestionList();
        rerenderTopicButtons();
        rerenderSubtopicButtons();
    }
});

document.getElementById('reset-confirm-cancel').addEventListener('click', () => {
    pendingResetId = null;
    document.getElementById('reset-confirm').classList.add('hidden');
});

// ============================================
// Feedback Modal
// ============================================

const feedbackModal = document.getElementById('feedback-modal');
const feedbackForm = document.getElementById('feedback-form');
const feedbackRating = document.getElementById('feedback-rating');
const feedbackSkipBtn = document.getElementById('feedback-skip');

// Track visits and show modal on second visit
function initFeedbackModal() {
    // Increment visit count
    let visitCount = parseInt(localStorage.getItem('visitCount') || '0');
    visitCount++;
    localStorage.setItem('visitCount', visitCount.toString());

    // Show modal only on 3rd+ visit AND if not already submitted/skipped
    if (visitCount >= 3 && !localStorage.getItem('feedbackCompleted')) {
        feedbackModal.classList.remove('hidden');
    } else {
        feedbackModal.classList.add('hidden');
    }
}

// Close feedback modal
function closeFeedbackModal() {
    feedbackModal.classList.add('hidden');
    localStorage.setItem('feedbackCompleted', 'true');
}

// Handle form submission via Formspree
feedbackForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('feedback-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
        const response = await fetch(feedbackForm.action, {
            method: 'POST',
            body: new FormData(feedbackForm),
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            alert('Thank you for your feedback!');
            closeFeedbackModal();
        } else {
            alert('There was a problem submitting your feedback. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Feedback';
        }
    } catch (error) {
        alert('There was a problem submitting your feedback. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Feedback';
    }
});

// Handle skip
feedbackSkipBtn.addEventListener('click', closeFeedbackModal);

// Update dropdown background color when selection changes (pastel palette)
feedbackRating.addEventListener('change', function() {
    const colors = {
        '': '',
        '1': '#3b1c1c', '2': '#3b2a1c', '3': '#3b351c',
        '4': '#33361c', '5': '#2b361c', '6': '#1f3322',
        '7': '#1a3328', '8': '#16332e', '9': '#123330',
        '10': '#0d3326'
    };
    this.style.backgroundColor = colors[this.value] || '';
    this.style.color = '#e8eaf0';
});

// Initialize feedback modal on load
initFeedbackModal();

// ============================================
// Landing Page Animation
// ============================================

function runLandingAnimation() {
    const strapline = document.querySelector('.landing-strapline');
    const subjects = document.querySelector('.landing-subjects');
    const content = document.querySelector('.landing-content');
    const explainer = document.getElementById('landing-explainer');

    // Reset animation state
    strapline.classList.remove('fade-in');
    subjects.classList.remove('fade-in');
    content.classList.remove('slid-up');
    explainer.classList.remove('fade-in');

    setTimeout(() => strapline.classList.add('fade-in'), 400);
    setTimeout(() => subjects.classList.add('fade-in'), 900);
    setTimeout(() => content.classList.add('slid-up'), 1800);
    setTimeout(() => explainer.classList.add('fade-in'), 2400);
}

// Initialize on load
init();
