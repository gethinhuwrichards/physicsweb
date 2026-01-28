// State
let topicsData = null;
let currentMainTopic = null;
let currentSubtopic = null;
let subtopicQuestions = [];
let currentQuestion = null;
let isMarkingMode = false;
let partScores = {};

// DOM Elements
const topicSelection = document.getElementById('topic-selection');
const subtopicSelection = document.getElementById('subtopic-selection');
const questionSelection = document.getElementById('question-selection');
const questionView = document.getElementById('question-view');
const topicButtons = document.getElementById('topic-buttons');
const subtopicButtons = document.getElementById('subtopic-buttons');
const questionList = document.getElementById('question-list');
const questionContainer = document.getElementById('question-container');
const submitBtn = document.getElementById('submit-btn');
const markingSummary = document.getElementById('marking-summary');
const totalScoreEl = document.getElementById('total-score');
const maxScoreEl = document.getElementById('max-score');

// Initialize
async function init() {
    try {
        const response = await fetch('data/topics.json');
        topicsData = await response.json();
        renderMainTopics();
    } catch (error) {
        console.error('Failed to load topics:', error);
        topicButtons.innerHTML = '<p>Failed to load topics. Please refresh the page.</p>';
    }
}

// View Management
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

// Render Main Topics
function renderMainTopics() {
    topicButtons.innerHTML = topicsData.mainTopics.map(topic =>
        `<button class="topic-btn" data-topic-id="${topic.id}">${topic.name}</button>`
    ).join('');

    topicButtons.addEventListener('click', (e) => {
        const btn = e.target.closest('.topic-btn');
        if (btn) {
            showSubtopicList(btn.dataset.topicId);
        }
    });
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
        subtopicButtons.innerHTML = currentMainTopic.subtopics.map(sub =>
            `<button class="subtopic-btn" data-subtopic-id="${sub.id}" data-file="${sub.file}">
                ${sub.name}
            </button>`
        ).join('');
    }

    showView('subtopic-selection');
}

// Load Subtopic Questions
async function loadSubtopicQuestions(subtopicId, filePath) {
    currentSubtopic = currentMainTopic.subtopics.find(s => s.id === subtopicId);

    try {
        const response = await fetch(`data/${filePath}`);
        const data = await response.json();
        subtopicQuestions = data.questions;

        // Update heading using subtopic field from JSON
        document.getElementById('selected-topic-title').textContent = data.subtopic;

        // Render question list
        questionList.innerHTML = subtopicQuestions.map(q => {
            const totalMarks = q.parts.reduce((sum, p) => sum + p.marks, 0);
            return `
                <div class="question-item" data-id="${q.id}">
                    <span>${q.title}</span>
                    <span class="marks">${totalMarks} marks</span>
                </div>
            `;
        }).join('');

        showView('question-selection');
    } catch (error) {
        console.error('Failed to load subtopic questions:', error);
        alert('Failed to load questions. Please try again.');
    }
}

// Load Question
function loadQuestion(questionId) {
    currentQuestion = subtopicQuestions.find(q => q.id === questionId);
    if (!currentQuestion) return;

    isMarkingMode = false;
    partScores = {};
    submitBtn.disabled = false;
    submitBtn.classList.remove('hidden');
    markingSummary.classList.add('hidden');

    renderQuestion();
    showView('question-view');
}

// Render Question
function renderQuestion() {
    const totalMarks = currentQuestion.parts.reduce((sum, p) => sum + p.marks, 0);

    let html = `
        <div class="question-header">
            <h2>${currentQuestion.title}</h2>
            <p class="total-marks">Total: ${totalMarks} marks</p>
        </div>
    `;

    currentQuestion.parts.forEach((part, index) => {
        let partText;
        if (part.type === 'fill-in-blank') {
            partText = renderFillInBlankWithOptions(part, index);
        } else {
            partText = part.text;
        }

        html += `
            <div class="question-part" data-part-index="${index}">
                <div class="part-label">(${part.partLabel})</div>
                <div class="part-text">${partText}</div>
                ${part.diagram ? `<img src="images/${part.diagram}" alt="Diagram" class="part-diagram">` : ''}
                <div class="part-marks">[${part.marks} mark${part.marks > 1 ? 's' : ''}]</div>
                ${renderAnswerInput(part, index)}
                <div class="mark-scheme hidden" id="mark-scheme-${index}">
                    <h4>Mark Scheme</h4>
                    <ul>${part.markScheme.map(m => `<li>${m}</li>`).join('')}</ul>
                </div>
                <div class="self-mark-container" id="self-mark-${index}"></div>
            </div>
        `;
    });

    questionContainer.innerHTML = html;
    renderMath();
}

// Render fill-in-blank with options box
function renderFillInBlankWithOptions(part, partIndex) {
    const optionsHtml = part.options
        ? part.options.map(opt => `<strong>${opt}</strong>`).join('&nbsp;&nbsp;&nbsp;')
        : '';

    const sentenceHtml = renderFillInBlankText(part.text, partIndex);

    return `
        <p class="fill-blank-header">Complete the sentence. Choose answers from the box.</p>
        <div class="fill-blank-options-box">
            ${optionsHtml}
        </div>
        <p class="fill-blank-sentence">${sentenceHtml}</p>
    `;
}

// Render fill-in-blank text with inline inputs
function renderFillInBlankText(text, partIndex) {
    let blankIndex = 0;
    return text.replace(/___/g, () => {
        const input = `<input type="text" class="fill-blank-input" id="blank-${partIndex}-${blankIndex}" data-blank-index="${blankIndex}">`;
        blankIndex++;
        return input;
    });
}

// Render Answer Input based on type
function renderAnswerInput(part, index) {
    switch (part.type) {
        case 'multiple-choice':
            return renderMultipleChoice(part, index);
        case 'numerical':
            return renderNumerical(part, index);
        case 'fill-in-blank':
            // Input is inline in the text, no separate answer box
            return '';
        case 'written':
        default:
            return `<textarea class="answer-textarea" id="answer-${index}" placeholder="Enter your answer here..."></textarea>`;
    }
}

// Render Multiple Choice (3 options)
function renderMultipleChoice(part, index) {
    const optionLetters = ['A', 'B', 'C'];
    return `
        <div class="mc-options" id="mc-options-${index}">
            ${part.options.slice(0, 3).map((opt, i) => `
                <label class="mc-option" data-option-index="${i}">
                    <input type="radio" name="mc-${index}" value="${i}">
                    <span><strong>${optionLetters[i]}.</strong> ${opt}</span>
                </label>
            `).join('')}
        </div>
    `;
}

// Render Numerical Answer
function renderNumerical(part, index) {
    return `
        <div class="numerical-answer" id="numerical-${index}">
            <label>Working out:</label>
            <textarea class="working-out" id="working-${index}" placeholder="Show your working here..."></textarea>
            <div class="final-answer-row">
                <label>Final answer:</label>
                <input type="number" class="final-answer-input" id="final-answer-${index}" step="any" placeholder="0">
            </div>
            <p class="numerical-note">If your final answer is correct, you will be awarded all ${part.marks} marks.</p>
        </div>
    `;
}

// Render Math with KaTeX
function renderMath() {
    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(questionContainer, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
            ],
            throwOnError: false
        });
    }
}

// Submit Answers
function submitAnswers() {
    isMarkingMode = true;
    submitBtn.disabled = true;

    currentQuestion.parts.forEach((part, index) => {
        // Show mark scheme
        document.getElementById(`mark-scheme-${index}`).classList.remove('hidden');

        // Show marking input
        const selfMarkContainer = document.getElementById(`self-mark-${index}`);

        switch (part.type) {
            case 'multiple-choice':
                markMultipleChoice(part, index, selfMarkContainer);
                break;
            case 'numerical':
                markNumerical(part, index, selfMarkContainer);
                break;
            case 'fill-in-blank':
                markFillInBlank(part, index, selfMarkContainer);
                break;
            case 'written':
            default:
                markWritten(part, index, selfMarkContainer);
                break;
        }
    });

    // Show marking summary
    markingSummary.classList.remove('hidden');
    updateTotalScore();
    renderMath();
}

// Mark Multiple Choice
function markMultipleChoice(part, index, container) {
    // Disable inputs
    document.querySelectorAll(`#mc-options-${index} input`).forEach(input => {
        input.disabled = true;
    });

    const selected = document.querySelector(`#mc-options-${index} input:checked`);
    const selectedIndex = selected ? parseInt(selected.value) : -1;
    const isCorrect = selectedIndex === part.correctAnswer;
    const score = isCorrect ? part.marks : 0;
    partScores[index] = score;

    // Highlight correct/incorrect
    document.querySelectorAll(`#mc-options-${index} .mc-option`).forEach((opt, i) => {
        if (i === part.correctAnswer) {
            opt.classList.add('correct');
        } else if (i === selectedIndex && !isCorrect) {
            opt.classList.add('incorrect');
        }
    });

    container.innerHTML = `
        <div class="auto-mark-result ${isCorrect ? 'correct' : 'incorrect'}">
            ${isCorrect ? 'Correct!' : 'Incorrect'} - ${score}/${part.marks} mark${part.marks > 1 ? 's' : ''}
        </div>
    `;
}

// Mark Numerical
function markNumerical(part, index, container) {
    // Disable inputs
    const workingTextarea = document.getElementById(`working-${index}`);
    const finalAnswerInput = document.getElementById(`final-answer-${index}`);
    if (workingTextarea) workingTextarea.disabled = true;
    if (finalAnswerInput) finalAnswerInput.disabled = true;

    const userAnswer = parseFloat(finalAnswerInput.value);
    const correctAnswer = part.correctAnswer;

    // Check if answer is correct (with small tolerance for floating point)
    const tolerance = Math.abs(correctAnswer) * 0.001 || 0.001;
    const isCorrect = !isNaN(userAnswer) && Math.abs(userAnswer - correctAnswer) <= tolerance;

    const score = isCorrect ? part.marks : 0;
    partScores[index] = score;

    // Style the input
    finalAnswerInput.classList.add(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
        container.innerHTML = `
            <div class="auto-mark-result correct">
                Correct! All ${part.marks} marks awarded.
            </div>
        `;
    } else {
        // If incorrect, allow self-marking for partial credit
        partScores[index] = 0;
        container.innerHTML = `
            <div class="auto-mark-result incorrect">
                Final answer incorrect. (Correct answer: ${correctAnswer})
            </div>
            <div class="self-mark">
                <label>Award marks for working:</label>
                <input type="number"
                       id="score-${index}"
                       min="0"
                       max="${part.marks}"
                       value="0"
                       onchange="updateScore(${index}, this.value, ${part.marks})">
                <span class="max-marks">/ ${part.marks}</span>
            </div>
        `;
    }
}

// Mark Fill in Blank
function markFillInBlank(part, index, container) {
    const blanks = document.querySelectorAll(`[id^="blank-${index}-"]`);
    let correctCount = 0;

    blanks.forEach((input, i) => {
        input.disabled = true;
        const userAnswer = input.value.trim().toLowerCase();
        const correctAnswer = part.correctAnswers[i].toLowerCase();

        if (userAnswer === correctAnswer) {
            input.classList.add('correct');
            correctCount++;
        } else {
            input.classList.add('incorrect');
        }
    });

    // Award 1 mark per correct blank (up to total marks)
    const score = Math.min(correctCount, part.marks);
    partScores[index] = score;

    container.innerHTML = `
        <div class="auto-mark-result ${score === part.marks ? 'correct' : 'incorrect'}">
            ${correctCount}/${blanks.length} blanks correct - ${score}/${part.marks} mark${part.marks > 1 ? 's' : ''}
        </div>
    `;
}

// Mark Written (self-mark)
function markWritten(part, index, container) {
    const textarea = document.getElementById(`answer-${index}`);
    if (textarea) textarea.disabled = true;

    partScores[index] = 0;
    container.innerHTML = `
        <div class="self-mark">
            <label>Marks awarded:</label>
            <input type="number"
                   id="score-${index}"
                   min="0"
                   max="${part.marks}"
                   value="0"
                   onchange="updateScore(${index}, this.value, ${part.marks})">
            <span class="max-marks">/ ${part.marks}</span>
        </div>
    `;
}

// Update Score for a Part
function updateScore(index, value, maxMarks) {
    let score = parseInt(value) || 0;
    score = Math.max(0, Math.min(score, maxMarks));
    document.getElementById(`score-${index}`).value = score;
    partScores[index] = score;
    updateTotalScore();
}

// Update Total Score
function updateTotalScore() {
    const total = Object.values(partScores).reduce((sum, s) => sum + s, 0);
    const maxTotal = currentQuestion.parts.reduce((sum, p) => sum + p.marks, 0);
    totalScoreEl.textContent = total;
    maxScoreEl.textContent = maxTotal;
}

// Event Listeners
document.getElementById('back-to-topics').addEventListener('click', () => {
    showView('topic-selection');
});

document.getElementById('back-to-subtopics').addEventListener('click', () => {
    showView('subtopic-selection');
});

document.getElementById('back-to-questions').addEventListener('click', () => {
    showView('question-selection');
});

// Subtopic button click handler
subtopicButtons.addEventListener('click', (e) => {
    const btn = e.target.closest('.subtopic-btn');
    if (btn) {
        loadSubtopicQuestions(btn.dataset.subtopicId, btn.dataset.file);
    }
});

// Question list click handler
questionList.addEventListener('click', (e) => {
    const item = e.target.closest('.question-item');
    if (item) {
        loadQuestion(item.dataset.id);
    }
});

submitBtn.addEventListener('click', submitAnswers);

document.getElementById('try-another').addEventListener('click', () => {
    showView('question-selection');
});

// Make updateScore available globally
window.updateScore = updateScore;

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
        '1': '#f8b4b4',
        '2': '#f9c4a8',
        '3': '#fad4a0',
        '4': '#fbe4a0',
        '5': '#fcf4a0',
        '6': '#e8f5a0',
        '7': '#d4eca0',
        '8': '#c0e8a8',
        '9': '#a8e4b0',
        '10': '#a0e0b0'
    };
    this.style.backgroundColor = colors[this.value] || '';
    this.style.color = '#333';
});

// Initialize feedback modal on load
initFeedbackModal();

// Initialize on load
init();
