# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A static physics exam practice website where students answer multi-part questions, lock answers, and mark against mark schemes.

## Technology Stack

- Vanilla HTML/CSS/JavaScript (no build step required)
- KaTeX for LaTeX math rendering (loaded from CDN)
- Questions stored in JSON file

## Running the Project

Open `index.html` in a browser. For local development with fetch API to work, use a local server:
```bash
npx serve .
# or
python -m http.server 8000
```

## Architecture

### Data Structure
Questions are organized hierarchically:
- **8 Main Topics**: Energy, Electricity, Particle Model, Atomic Structure, Forces, Waves, Magnetism, Space
- **Subtopics**: Each main topic has subtopics (e.g., Energy → Energy Stores)
- **Separate JSON files**: Each subtopic has its own JSON file in `public/data/<topic>/<subtopic>.json`

### Data Flow
1. `public/data/topics.json` loaded on page init (contains topic/subtopic index)
2. Main topics rendered as buttons on splash page
3. User selects main topic → subtopics displayed
4. User selects subtopic → questions loaded from subtopic JSON file
5. Question parts rendered with appropriate input types
6. "Lock answers and mark" triggers marking mode (inputs disabled, mark schemes shown)
7. All question types are fully auto-marked

### Key Files
- `js/app.js` - All application logic and state management
- `css/style.css` - All styling
- `public/data/topics.json` - Index of all topics and subtopics with file paths
- `public/data/<topic>/<subtopic>.json` - Question files (e.g., `public/data/energy/energy-stores.json`)
- `public/data/QUESTION_FORMAT.md` - Full schema documentation for LLM parsing

### Question Types

| Type | Input | Marking |
|------|-------|---------|
| `single-choice` | Radio buttons (A, B, C or A, B, C, D) | Auto-marked |
| `multi-choice` | Checkboxes with selection limit | Auto-marked (all-or-nothing or partial) |
| `gap-fill` | Inline `<select>` dropdowns with word bank | Auto-marked (case-insensitive) |

### LaTeX Support
Use `$...$` for inline math and `$$...$$` for block math in question text and mark schemes.

## Adding Questions

### Adding a New Subtopic
1. Add entry to `public/data/topics.json` under the appropriate main topic:
```json
{ "id": "energy-transfers", "name": "Energy Transfers", "file": "energy/energy-transfers.json" }
```

2. Create the subtopic JSON file (e.g., `public/data/energy/energy-transfers.json`):
```json
{
  "subtopic": "Energy Transfers",
  "mainTopic": "Energy",
  "questions": []
}
```

### Question Part Examples
See `public/data/QUESTION_FORMAT.md` for complete schema. Quick examples:

**Single choice (3 or 4 options):**
```json
{
  "partLabel": "a",
  "type": "single-choice",
  "text": "Which is correct?",
  "marks": 1,
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 2,
  "markScheme": ["Answer: C - explanation"],
  "diagram": null
}
```

**Multi choice (multiple correct):**
```json
{
  "partLabel": "b",
  "type": "multi-choice",
  "text": "Which two are renewable?",
  "marks": 2,
  "options": ["Coal", "Wind", "Oil", "Solar", "Gas"],
  "correctAnswers": [1, 3],
  "selectCount": 2,
  "scoring": "all-or-nothing",
  "markScheme": ["1 mark: Wind", "1 mark: Solar"],
  "diagram": null
}
```

**Gap fill (dropdown word bank):**
```json
{
  "partLabel": "c",
  "type": "gap-fill",
  "text": "Complete the sentence using words from the box.",
  "marks": 2,
  "segments": [
    "The ",
    { "blank": 0 },
    " energy decreases and ",
    { "blank": 1 },
    " energy increases."
  ],
  "wordBank": ["chemical", "kinetic", "nuclear", "elastic potential"],
  "correctAnswers": ["chemical", "kinetic"],
  "markScheme": ["1 mark: chemical", "1 mark: kinetic"],
  "diagram": null
}
```
