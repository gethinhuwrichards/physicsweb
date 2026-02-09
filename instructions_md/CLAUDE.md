# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A physics exam practice website where students answer multi-part questions, lock answers, and mark against mark schemes. Features auto-marking for objective questions and a split-panel self-marking UI for written answers.

## Technology Stack

- **React 19** with JSX components
- **Vite** for development and builds
- **KaTeX** for LaTeX math rendering (loaded from CDN)
- **CSS** with custom properties for theming (light/dark mode)
- Questions stored in JSON files

## Running the Project

```bash
npm install        # Install dependencies (first time only)
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

## Architecture

### Data Structure
Questions are organized hierarchically:
- **8 Main Topics**: Energy, Electricity, Particle Model, Atomic Structure, Forces, Waves, Magnetism, Space
- **Subtopics**: Each main topic has subtopics (e.g., Energy → Energy Stores)
- **Separate JSON files**: Each subtopic has its own JSON file in `public/data/<topic>/<subtopic>.json`
- **Difficulty**: Every question has a `difficulty` field (`"easy"`, `"medium"`, or `"hard"`). Questions are sorted easy → hard in the question list.
- **Tags**: Every question has 5 tag fields: `source` (`"original"`/`"pastpaper"`), `examBoard` (`"AQA"`/`"Edexcel"`/`"OCR"`/`"iGCSE Edexcel"`/`"iGCSE Cambridge"`), `tier` (`"combined"`/`"separate"`), `subject` (`"physics"`), `level` (`"GCSE"`). Used for future filtering.

### Data Flow
1. `public/data/topics.json` loaded on page init (contains topic/subtopic index)
2. Landing page shown with subject selection
3. Main topics rendered as cards
4. User selects main topic → subtopics displayed
5. User selects subtopic → questions loaded from subtopic JSON file
6. Question parts rendered with appropriate input types
7. "Lock answers and mark" triggers marking mode
8. Auto-marked types show results immediately; self-marked types open split-panel UI

### Key Files

**React Components (`src/`):**
- `src/main.jsx` - Entry point
- `src/App.jsx` - Main app component with routing/state
- `src/QuestionView.jsx` - Question display and answering
- `src/components/` - UI components (TopicSelection, QuestionList, Breadcrumb, etc.)
- `src/components/inputs/` - Question type input components
- `src/components/marking/` - Marking UI components (SelfMarkingView, ScorePage, FinalScorePanel)
- `src/utils/` - Utility functions (autoMark, renderLatex, storage)

**Styles:**
- `css/style.css` - All styling with CSS custom properties for theming

**Data:**
- `public/data/topics.json` - Index of all topics and subtopics with file paths
- `public/data/<topic>/<subtopic>.json` - Question files (e.g., `public/data/energy/energy-stores.json`)
- `public/data/QUESTION_FORMAT.md` - Full schema documentation for LLM parsing
- `public/data/short-answer-synonyms.json` - Reference synonym groups by topic (particles, waves, forces, etc.). Consult when authoring `acceptedAnswers` and `keywords` for short-answer questions to ensure consistent coverage of abbreviations, spacing variants, and plural forms. Not loaded by app code.

**Legacy (still present but not primary):**
- `js/app.js` - Original vanilla JS implementation

### Question Types

| Type | Input | Marking |
|------|-------|---------|
| `single-choice` | Radio buttons (3 or 4 options) | Auto-marked |
| `multi-choice` | Checkboxes with selection limit | Auto-marked (all-or-nothing or partial) |
| `gap-fill` | Inline `<select>` dropdowns with word bank | Auto-marked (case-insensitive) |
| `equation-choice` | Radio buttons with 4 LaTeX equations | Auto-marked |
| `tick-box-table` | Table with radio buttons per row | Auto-marked (1 mark per row) |
| `extended-written` | Textarea for free-text answer | Self-marked via split-panel UI |
| `calculation` | Final answer + step-based working with calculator | Auto-marks final answer; self-mark method if wrong |
| `match-up` | Colour-coded box pairing (left → right) | Auto-marked (1 mark per correct link) |
| `short-answer` | Single text input for 1-word/phrase answer | Auto-marked (exact + fuzzy + keyword matching). See `short-answer-synonyms.json` for standard synonym groups. |
| `select-and-explain` | Radio buttons + textarea for explanation | Auto-marks selection (1 mark); self-mark explanation |
| `table-fill` | Table with text inputs for blank cells | Auto-marked (1 mark per correct cell) |
| `extended-written-levels` | Textarea (same as extended-written) | Self-marked; mark scheme has more points than marks; cap at max marks |

### LaTeX Support
Use `$...$` for inline math and `$$...$$` for block math in question text and mark schemes.

### Converting Exam Questions (.docx → .json)

When converting past paper questions from `.docx` to JSON, follow the instructions in **`instructions_md/llm_parsing.md`**. This covers:
- **Combined vs Separate tier classification** — which topics are separate-only (based on AQA specs)
- **Non-digitisable patterns** — what to skip and what can be reclassified
- **Reclassifying labelling questions** — how to convert diagram-labelling to `short-answer`, `gap-fill`, or `table-fill`
- **Skipping parts and question coherence** — ensuring remaining parts still make sense
- **Image extraction and placement** — how to extract images from `.docx` files and add them to the `diagrams` arrays

### Images

- Question images live in `public/images/` as flat files (no subdirectories)
- The `diagrams` field on each part is an array of filenames (no path prefix): `["static-elec-q1-fig1.jpeg"]`
- Images render at native size (no forced scaling), capped at `max-width: 100%` for small screens
- Naming convention: `{subtopic-prefix}-q{N}-fig{N}.{ext}` (e.g., `cpdr-q3-fig2.jpeg`)
- Displayed as "Fig. 1", "Fig. 2" etc. in a flex-wrap row above the input component
- See `llm_parsing.md` for the full extraction and placement workflow

### Tables

- The `tables` field on each part is an array of structured table objects: `[{ "caption": "...", "headers": [...], "rows": [[...], ...] }]`
- Used for **reference/data tables** that students need to consult (experimental results, material properties, etc.)
- Numbered separately from figures: "Table 1", "Table 2" etc., cumulative across the question
- Rendered inline in the question body and accessible via the sticky sidebar
- For small inline tables (1-2 rows, tightly integrated in text), use HTML in the `text` field instead
- See `QUESTION_FORMAT.md` for the full schema and `llm_parsing.md` for extraction rules

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
  "diagrams": []
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
  "diagrams": []
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
  "diagrams": []
}
```

**Extended written (self-marked):**
```json
{
  "partLabel": "d",
  "type": "extended-written",
  "text": "Explain why the temperature increases.",
  "marks": 3,
  "markScheme": [
    "1 mark: **Particles** gain kinetic energy",
    "1 mark: Particles move **faster**",
    "1 mark: More **collisions** occur"
  ],
  "diagrams": []
}
```

**Calculation (2, 3, or 4 marks):**
```json
{
  "partLabel": "e",
  "type": "calculation",
  "text": "Calculate the kinetic energy of a 2 kg object moving at 5 m/s.",
  "marks": 2,
  "equations": ["$E_k = \\frac{1}{2} m v^2$", "$E_p = m g h$", "$W = F d$"],
  "correctEquation": 0,
  "correctAnswer": 25,
  "tolerance": 0.01,
  "markScheme": [
    "1 mark: Correct equation selected + correct substitution: $E_k = \\frac{1}{2} \\times 2 \\times 5^2$",
    "1 mark: Correct final answer: **25 J**"
  ],
  "diagrams": []
}
```

**Match up (colour-coded pairing). Always phrase as "Match..." not "Draw lines to match...":**
```json
{
  "partLabel": "f",
  "type": "match-up",
  "text": "Match each electrical quantity to its correct unit.",
  "marks": 4,
  "leftItems": ["Current", "Potential difference", "Resistance", "Power"],
  "rightItems": ["Volt (V)", "Ampere (A)", "Watt (W)", "Ohm ($\\Omega$)", "Coulomb (C)"],
  "correctLinks": [[0, 1], [1, 0], [2, 3], [3, 2]],
  "markScheme": [
    "1 mark: Current → Ampere (A)",
    "1 mark: Potential difference → Volt (V)",
    "1 mark: Resistance → Ohm (Ω)",
    "1 mark: Power → Watt (W)"
  ],
  "diagrams": []
}
```
