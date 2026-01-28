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
- **Separate JSON files**: Each subtopic has its own JSON file in `data/<topic>/<subtopic>.json`

### Data Flow
1. `data/topics.json` loaded on page init (contains topic/subtopic index)
2. Main topics rendered as buttons on splash page
3. User selects main topic → subtopics displayed
4. User selects subtopic → questions loaded from subtopic JSON file
5. Question parts rendered with appropriate input types
6. "Lock answers and mark" triggers marking mode (inputs disabled, mark schemes shown)
7. Auto-marking for multiple-choice, numerical, and fill-in-blank; self-marking for written

### Key Files
- `js/app.js` - All application logic and state management
- `css/style.css` - All styling
- `data/topics.json` - Index of all topics and subtopics with file paths
- `data/<topic>/<subtopic>.json` - Question files (e.g., `data/energy/energy-stores.json`)
- `data/QUESTION_FORMAT.md` - Full schema documentation for LLM parsing

### Question Types

| Type | Input | Marking |
|------|-------|---------|
| `written` | Textarea | Self-marked by student |
| `multiple-choice` | 3 radio buttons (A, B, C) | Auto-marked |
| `numerical` | Working textarea + final answer input | Auto-marked if correct; else self-mark working |
| `fill-in-blank` | Inline inputs within question text | Auto-marked (case-insensitive) |

### LaTeX Support
Use `$...$` for inline math and `$$...$$` for block math in question text and mark schemes.

## Adding Questions

### Adding a New Subtopic
1. Add entry to `data/topics.json` under the appropriate main topic:
```json
{ "id": "energy-transfers", "name": "Energy Transfers", "file": "energy/energy-transfers.json" }
```

2. Create the subtopic JSON file (e.g., `data/energy/energy-transfers.json`):
```json
{
  "subtopic": "Energy Transfers",
  "mainTopic": "Energy",
  "questions": []
}
```

### Question Part Examples
See `data/QUESTION_FORMAT.md` for complete schema. Quick examples:

**Written:**
```json
{
  "partLabel": "a",
  "type": "written",
  "text": "Explain why...",
  "marks": 2,
  "markScheme": ["1 mark: Reason 1", "1 mark: Reason 2"],
  "diagram": null
}
```

**Multiple choice (3 options):**
```json
{
  "partLabel": "b",
  "type": "multiple-choice",
  "text": "Which is correct?",
  "marks": 1,
  "options": ["Option A", "Option B", "Option C"],
  "correctAnswer": 2,
  "markScheme": ["Answer: C - explanation"],
  "diagram": null
}
```

**Numerical:**
```json
{
  "partLabel": "c",
  "type": "numerical",
  "text": "Calculate the energy...",
  "marks": 3,
  "correctAnswer": 5760,
  "markScheme": ["1 mark: Formula", "1 mark: Substitution", "1 mark: Answer"],
  "diagram": null
}
```

**Fill-in-blank:**
```json
{
  "partLabel": "d",
  "type": "fill-in-blank",
  "text": "The ___ energy decreases and ___ energy increases.",
  "marks": 2,
  "correctAnswers": ["chemical", "kinetic"],
  "markScheme": ["1 mark: chemical", "1 mark: kinetic"],
  "diagram": null
}
```
