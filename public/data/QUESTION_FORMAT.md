# Question Format Specification

This document defines the JSON format for exam questions. Use this specification when generating or validating questions.

## File Structure

Each subtopic has its own JSON file in `public/data/<topic>/<subtopic>.json`:

```json
{
  "subtopic": "Energy Stores",
  "mainTopic": "Energy",
  "questions": [...]
}
```

## Field Definitions

### Subtopic File

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subtopic` | string | Yes | Name of the subtopic |
| `mainTopic` | string | Yes | Name of the parent main topic |
| `questions` | Question[] | Yes | Array of question objects |

### Question Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | **Globally unique** identifier — see ID rules below |
| `topic` | string | Yes | Topic name |
| `title` | string | Yes | Display title for the question |
| `difficulty` | string | Yes | One of: `"easy"`, `"medium"`, `"hard"` |
| `source` | string | Yes | `"original"` or `"pastpaper"` — see Tags section below |
| `examBoard` | string | Yes | `"AQA"`, `"Edexcel"`, `"OCR"`, `"iGCSE Edexcel"`, or `"iGCSE Cambridge"` |
| `tier` | string | Yes | `"combined"` or `"separate"` |
| `subject` | string | Yes | `"physics"` (future: `"biology"`, `"chemistry"`) |
| `level` | string | Yes | `"GCSE"` (future: `"KS3"`, `"A-level"`, `"IB"`) |
| `parts` | Part[] | Yes | Array of question parts (minimum 1) |

### Difficulty Classification

Every question **must** have a `difficulty` field. Questions are displayed in the question list ordered from easy → medium → hard.

| Difficulty | Criteria |
|------------|----------|
| `"easy"` | Recall-based or single-step. Typically 1–3 total marks. Uses simple question types (single-choice, basic gap-fill). No calculations or only trivial ones. |
| `"medium"` | Requires some application or multi-step reasoning. Typically 3–5 total marks. May include straightforward calculations, multi-choice with reasoning, or moderate extended-written answers. |
| `"hard"` | Requires evaluation, multi-step calculations, or extended analysis. Typically 5+ total marks. Includes complex extended-written (evaluate/discuss), calculations with rearrangement, or questions combining several concepts. |

These are guidelines — use judgement. A 2-mark question requiring tricky reasoning can be `"medium"`, and a 6-mark question with simple recall points can still be `"medium"`.

### Tags

Every question has 5 tag fields for filtering and organisation:

| Tag | Allowed Values | Notes |
|-----|---------------|-------|
| `source` | `"original"`, `"pastpaper"` | Mutually exclusive. Past papers are real exam board questions; original are custom-written. |
| `examBoard` | `"AQA"`, `"Edexcel"`, `"OCR"`, `"iGCSE Edexcel"`, `"iGCSE Cambridge"` | Primary specification. One per question. |
| `tier` | `"combined"`, `"separate"` | Combined science content is a subset of separate science. When filtering for separate, combined questions must also be shown. The reverse is not true. |
| `subject` | `"physics"` | Future: `"biology"`, `"chemistry"` |
| `level` | `"GCSE"` | Future: `"KS3"`, `"A-level"`, `"IB"` |

### Question ID Rules

**IDs must be globally unique across ALL question files in the entire project**, not just within a single file. The app stores student scores in a single cookie keyed by question ID — if two questions share the same ID (even in different files), their scores will collide and overwrite each other.

**Naming convention:** Use a short subtopic prefix followed by a number.

| Subtopic | Prefix | Example IDs |
|----------|--------|-------------|
| Energy Stores | `energy-stores` | `energy-stores1`, `energy-stores2` |
| Energy Resources | `energy-res` | `energy-res1`, `energy-res2` |
| Series and Parallel Circuits | `sp-circuits` | `sp-circuits1`, `sp-circuits2` |
| Newton's Laws | `newton` | `newton1`, `newton2` |

**Do NOT** use generic prefixes like `energy1`, `elec1`, etc. — these are too likely to collide with questions from other subtopics within the same main topic.

Before assigning IDs, check existing question files to ensure no duplicates.

### Part Object (Common Fields)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `partLabel` | string | Yes | Part identifier (e.g., "a", "b", "c", "i", "ii") |
| `type` | string | Yes | One of: `"single-choice"`, `"multi-choice"`, `"gap-fill"`, `"extended-written"`, `"extended-written-levels"`, `"calculation"`, `"equation-choice"`, `"tick-box-table"`, `"match-up"`, `"short-answer"`, `"select-and-explain"`, `"table-fill"` |
| `text` | string | Yes | The question text (supports LaTeX) |
| `marks` | integer | Yes | Number of marks (1-6) |
| `markScheme` | string[] | Yes | Array of marking criteria |
| `diagrams` | string[] | Yes | Array of filenames in images/ folder, or empty array `[]` |

## Part Types

Types 1-3, 6, 7, 8, 9 and 11 are fully auto-marked. Type 4 (extended-written) is self-marked by the student using a split-panel marking UI. Type 4b (extended-written-levels) is similar but used for 6-mark levels-of-response questions where the mark scheme has more indicative content points than marks available. Type 5 (calculation) auto-marks the final answer; if correct, all marks are awarded. If incorrect, the student self-marks method points via the split-panel UI. Type 10 (select-and-explain) auto-marks the selection (1 mark) and self-marks the explanation (remaining marks).

### 1. Single Choice (`type: "single-choice"`)

Student selects one option from 3 or 4 choices (radio buttons). Auto-marked.

**Additional fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `options` | (string \| object)[] | Yes | 3 or 4 options. Each is either a text string or `{ "image": "filename.png" }` for image options. |
| `correctAnswer` | integer | Yes | 0-based index of the correct option |

**Text options:**
```json
{
  "partLabel": "a",
  "type": "single-choice",
  "text": "Which quantity is a vector?",
  "marks": 1,
  "options": ["Speed", "Mass", "Velocity", "Distance"],
  "correctAnswer": 2,
  "markScheme": ["Answer: C - Velocity has magnitude and direction"],
  "diagrams": []
}
```

**Image options** (displayed in a 2-column grid with images inside radio button labels):
```json
{
  "partLabel": "b",
  "type": "single-choice",
  "text": "Which circuit diagram shows a series circuit?",
  "marks": 1,
  "options": [
    { "image": "circuits-opt-a-series.png" },
    { "image": "circuits-opt-b-parallel.png" },
    { "image": "circuits-opt-c-mixed.png" },
    { "image": "circuits-opt-d-short.png" }
  ],
  "correctAnswer": 0,
  "markScheme": ["Answer: A - Components are connected end-to-end in a single loop"],
  "diagrams": []
}
```

Options can mix text and images within the same question if needed, though in practice they are usually all one type.

### 2. Multi Choice (`type: "multi-choice"`)

Student selects multiple options (checkboxes). The UI enforces a selection limit and shows a remaining counter.

**Additional fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `options` | (string \| object)[] | Yes | 4 or more options. Each is either a text string or `{ "image": "filename.png" }` for image options (see single-choice for example). |
| `correctAnswers` | integer[] | Yes | Array of 0-based indices of correct options |
| `selectCount` | integer | Yes | Number of selections required (shown as "Select N") |
| `scoring` | string | No | `"all-or-nothing"` (default) or `"partial"` |

**Scoring modes:**
- `"all-or-nothing"`: Full marks if all correct selected, 0 otherwise
- `"partial"`: +1 per correct selection, -1 per incorrect, minimum 0

```json
{
  "partLabel": "b",
  "type": "multi-choice",
  "text": "Which two are renewable energy sources?",
  "marks": 2,
  "options": ["Coal", "Wind", "Oil", "Solar", "Gas"],
  "correctAnswers": [1, 3],
  "selectCount": 2,
  "scoring": "all-or-nothing",
  "markScheme": ["1 mark: Wind", "1 mark: Solar"],
  "diagrams": []
}
```

### 3. Gap Fill (`type: "gap-fill"`)

Student completes a sentence by choosing words from dropdown menus. A word bank is shown above the sentence. Each blank is rendered as an inline `<select>` dropdown.

**Additional fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `segments` | (string \| object)[] | Yes | Array of text strings and `{ "blank": N }` objects |
| `wordBank` | string[] | Yes | Words available in the dropdown menus |
| `correctAnswers` | string[] | Yes | Array of correct words matching blank indices |

The `segments` array defines the sentence structure. Text strings are rendered as HTML spans (with LaTeX support). Objects with `{ "blank": N }` are rendered as dropdown selects, where `N` is the 0-based blank index.

The `text` field serves as an introductory instruction (e.g., "Complete the sentence using words from the box.") and is displayed above the word bank.

```json
{
  "partLabel": "c",
  "type": "gap-fill",
  "text": "Complete the sentence using words from the box.",
  "marks": 2,
  "segments": [
    "As the cyclist accelerates, the ",
    { "blank": 0 },
    " energy store decreases and the ",
    { "blank": 1 },
    " energy increases."
  ],
  "wordBank": ["chemical", "kinetic", "nuclear", "elastic potential"],
  "correctAnswers": ["chemical", "kinetic"],
  "markScheme": ["1 mark: chemical", "1 mark: kinetic"],
  "diagrams": []
}
```

### 4. Extended Written (`type: "extended-written"`)

Student writes a free-text answer in a textarea. Self-marked by the student during marking mode via a full-page split-panel view (student's answer on the left, mark scheme on the right).

Use this type for any question where the answer requires a sentence or more, **even if it is only 1 mark**. Questions like "Why does X happen?" or "Give one reason..." should be `extended-written`, not `short-answer`, because auto-marking cannot reliably evaluate sentence-length responses.

**No additional fields** beyond the common Part fields. No `options`, `correctAnswer`, `correctAnswers`, etc.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| *(common fields only)* | | | See Part Object above |

The character limit for the textarea is derived at render time: `marks * 400` (~50 words per mark at ~8 chars/word).

**`**keyword**` syntax in markScheme:** Use double asterisks to highlight key terms in marking points. These are rendered as bold blue text in the self-marking UI, helping students identify the essential terms they need to have included.

```json
{
  "partLabel": "d",
  "type": "extended-written",
  "text": "Explain the process of photosynthesis in plants.",
  "marks": 4,
  "markScheme": [
    "1 mark: Plants take in **carbon dioxide** and water",
    "1 mark: **Light energy** is absorbed by **chlorophyll**",
    "1 mark: **Carbon dioxide** and water are converted into **glucose**",
    "1 mark: **Oxygen** is released as a byproduct"
  ],
  "diagrams": []
}
```

### 4b. Extended Written — Levels of Response (`type: "extended-written-levels"`)

Student writes a free-text answer in a textarea, identical to `extended-written`. Used for 6-mark (occasionally 4-mark) levels-of-response questions where the mark scheme has more indicative content points than marks available.

**No additional fields** beyond the common Part fields. Uses the same textarea input as `extended-written`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| *(common fields only)* | | | See Part Object above |

**Key differences from `extended-written`:**
- The `markScheme` array contains **more entries than `marks`**. For example, a 6-mark question may have 8–10 indicative content points.
- During self-marking, **all** marking points are shown at once (no progressive reveal).
- The student awards up to `marks` points. Once the maximum marks are reached, the Award button is disabled on remaining undecided points. The student does not need to decide every point.
- The Deny button remains available so students can re-allocate marks if they change their mind.
- Each indicative content point is worth 1 mark.

**`**keyword**` syntax in markScheme:** Same as `extended-written` — use double asterisks for key terms.

```json
{
  "partLabel": "a",
  "type": "extended-written-levels",
  "text": "Describe a method to determine the specific heat capacity of a metal block. Include the equipment you would use, the measurements you would take, and how you would use them to calculate the specific heat capacity.",
  "marks": 6,
  "markScheme": [
    "1 mark: Use an **immersion heater** / **heating element** to heat the block",
    "1 mark: Use a **thermometer** to measure the temperature change",
    "1 mark: Use a **balance** to measure the **mass** of the block",
    "1 mark: Use a **joulemeter** to measure the energy transferred (or use $E = P t$ / $E = I V t$)",
    "1 mark: Insulate the block to reduce **heat losses** to the surroundings",
    "1 mark: Record the **initial** and **final** temperature",
    "1 mark: Calculate using $c = \\frac{\\Delta E}{m \\Delta \\theta}$",
    "1 mark: **Repeat** the experiment and calculate a **mean**"
  ],
  "diagrams": []
}
```

### 5. Calculation (`type: "calculation"`)

Student enters a numeric final answer and optionally shows working via a step-based interface with equation selection and a calculator. The final answer is auto-marked using relative tolerance. If correct, all marks are awarded. If incorrect, the student self-marks method points via the split-panel marking UI, with the final answer point locked as incorrect.

**UI Layout:**
1. Final answer box shown first (units are not required and do not carry marks)
2. "Show Working" button reveals equation selection, step inputs, and calculator
3. Equation selection: 3 radio buttons with LaTeX equations
4. Step-based working: Step 1 shown initially, "Add a step" button (up to 6 steps)
5. Calculator button grid for typing into step inputs, with evaluation via `=`

**Additional fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `equations` | string[] | Yes | Exactly 3 LaTeX equation strings (1 correct + 2 distractors) |
| `correctEquation` | integer | Yes | 0-based index of the correct equation |
| `correctAnswer` | number | Yes | The expected numeric answer |
| `tolerance` | number | No | Relative tolerance for comparison (default `0.01` = 1%) |

**Marks must be 2, 3, or 4.** The `markScheme` array must follow one of the three structures below.

#### Format A: 2-mark — Substitute and calculate

Use when the student can substitute directly into the standard form of the equation.

```json
{
  "partLabel": "a",
  "type": "calculation",
  "text": "Calculate the kinetic energy of a 1500 kg car travelling at 30 m/s.",
  "marks": 2,
  "equations": [
    "$E_k = \\frac{1}{2} m v^2$",
    "$E_p = m g h$",
    "$W = F d$"
  ],
  "correctEquation": 0,
  "correctAnswer": 675000,
  "tolerance": 0.01,
  "markScheme": [
    "1 mark: Correct equation selected + correct substitution: $E_k = \\frac{1}{2} \\times 1500 \\times 30^2$",
    "1 mark: Correct final answer: **675 000 J**"
  ],
  "diagrams": []
}
```

#### Format B: 3-mark — Substitute, rearrange, and calculate

Use when the student must rearrange the equation before or after substituting.

```json
{
  "partLabel": "b",
  "type": "calculation",
  "text": "A car has a kinetic energy of 450 000 J and a mass of 1000 kg. Calculate the speed of the car.",
  "marks": 3,
  "equations": [
    "$E_k = \\frac{1}{2} m v^2$",
    "$E_p = m g h$",
    "$F = m a$"
  ],
  "correctEquation": 0,
  "correctAnswer": 30,
  "tolerance": 0.01,
  "markScheme": [
    "1 mark: Correct equation selected + correct substitution: $450000 = \\frac{1}{2} \\times 1000 \\times v^2$",
    "1 mark: Correct rearrangement: $v = \\sqrt{\\frac{2 \\times 450000}{1000}}$",
    "1 mark: Correct final answer: **30 m/s**"
  ],
  "diagrams": []
}
```

#### Format C: 4-mark — Unit conversion, substitute, rearrange, and calculate

Use when a unit conversion is required before the calculation.

```json
{
  "partLabel": "c",
  "type": "calculation",
  "text": "A kettle is rated at 2.5 kW. It is switched on for 3 minutes. Calculate the energy transferred.",
  "marks": 4,
  "equations": [
    "$E = P t$",
    "$P = I V$",
    "$Q = I t$"
  ],
  "correctEquation": 0,
  "correctAnswer": 450000,
  "tolerance": 0.01,
  "markScheme": [
    "1 mark: Correct unit conversions: 2.5 kW = **2500 W** and 3 minutes = **180 s**",
    "1 mark: Correct equation selected + correct substitution: $E = 2500 \\times 180$",
    "1 mark: Correct calculation shown",
    "1 mark: Correct final answer: **450 000 J**"
  ],
  "diagrams": []
}
```

**Marking behaviour:**
- Final answer compared using relative tolerance: `|userAnswer - correctAnswer| / |correctAnswer| <= tolerance`
- If correct (including rounding): all marks awarded automatically, no self-marking needed
- If incorrect: enters self-marking mode. The **last** `markScheme` entry (final answer point) is auto-locked as incorrect. Student self-marks remaining method points independently.
- Each marking point is independently awardable (no dependency logic between points).

### 6. Equation Choice (`type: "equation-choice"`)

Student selects the correct equation from 4 options (radio buttons). Auto-marked. Used for "Write down the equation for..." style questions that appear frequently in GCSE physics.

**Additional fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `options` | string[] | Yes | Exactly 4 LaTeX equation strings |
| `correctAnswer` | integer | Yes | 0-based index of the correct option |

All options **must** be LaTeX equations wrapped in `$...$` delimiters. The question is always worth 1 mark.

```json
{
  "partLabel": "a",
  "type": "equation-choice",
  "text": "Write down the equation that links kinetic energy, mass and speed.",
  "marks": 1,
  "options": [
    "$E_k = \\frac{1}{2} m v^2$",
    "$E_p = m g h$",
    "$W = F d$",
    "$P = \\frac{E}{t}$"
  ],
  "correctAnswer": 0,
  "markScheme": ["Answer: A – $E_k = \\frac{1}{2} m v^2$"],
  "diagrams": []
}
```

### 7. Tick Box Table (`type: "tick-box-table"`)

Student ticks one box per row in a table. Each row has a label on the left and radio buttons under two column headers on the right. Auto-marked. Strictly **1 mark per row**.

**Additional fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `columnHeaders` | string[] | Yes | 2 or more column header labels (e.g., `["Renewable", "Non-renewable"]`) |
| `rows` | object[] | Yes | Array of row objects (see below) |

**Row object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | Yes | Text shown on the left side of the row (supports LaTeX) |
| `correctColumn` | integer | Yes | 0-based index of the correct column |

**Rules:**
- `marks` **must** equal the number of rows (1 mark per row, no exceptions).
- `columnHeaders` must have at least **2** entries.
- `markScheme` must have one entry per row describing the correct answer.

```json
{
  "partLabel": "a",
  "type": "tick-box-table",
  "text": "Put a tick in each row to show whether each energy source is renewable or non-renewable.",
  "marks": 4,
  "columnHeaders": ["Renewable", "Non-renewable"],
  "rows": [
    { "label": "Wind", "correctColumn": 0 },
    { "label": "Coal", "correctColumn": 1 },
    { "label": "Solar", "correctColumn": 0 },
    { "label": "Natural gas", "correctColumn": 1 }
  ],
  "markScheme": [
    "1 mark: Wind — Renewable",
    "1 mark: Coal — Non-renewable",
    "1 mark: Solar — Renewable",
    "1 mark: Natural gas — Non-renewable"
  ],
  "diagrams": []
}
```

### 8. Match Up (`type: "match-up"`)

Student matches items on the left to items on the right using colour-coded pairing. Auto-marked. One mark per correct link. Right side has more or equal items than left (extras on the right are distractors). Each item can only be linked once (1:1 mapping).

**Additional fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `leftItems` | string[] | Yes | Items displayed on the left column. Supports LaTeX. |
| `rightItems` | (string \| object)[] | Yes | Items on the right column. Strings support LaTeX. Objects with `{ "image": "filename.png" }` render an image. |
| `correctLinks` | [number, number][] | Yes | Array of `[leftIndex, rightIndex]` pairs defining the correct matches |

**Rules:**
- `rightItems.length >= leftItems.length` (right side may have distractors)
- Each left item links to at most one right item, and vice versa (1:1 mapping)
- `marks` **must** equal `correctLinks.length` (1 mark per correct link, enforced)
- `markScheme` must have one entry per correct link
- **Question phrasing:** Always use "Match..." wording (e.g., "Match each quantity to its unit."). Never use "Draw lines to match..." since the UI uses colour-coded pairing, not drawn lines.

**UI behaviour:**
- Click a left box to select it, then click a right box to create a link (matched pair shown in same colour)
- Click elsewhere to deselect. Already-linked boxes cannot be selected for a second link.
- Cancel button (✕) appears next to each linked right-side box to remove the link.
- Up to 6 distinct colours are used for pairs (blue, green, yellow, orange, purple, pink). Colours are stable — existing pairs keep their colour when new pairs are added.

```json
{
  "partLabel": "a",
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

**Right-side images:**

Right items can be images instead of text. Use an object with an `image` field referencing a file in `public/images/`:

```json
"rightItems": ["Text option", { "image": "circuit-diagram.png" }, "Another text"]
```

### 9. Short Answer (`type: "short-answer"`)

Student types a short answer (1 word or short phrase) into a text input. Auto-marked via case-insensitive matching against an array of accepted answers, with fuzzy matching for minor misspellings.

**Important:** Only use `short-answer` when the expected answer is a single word or very short phrase (1–3 words), such as a unit name, particle name, or quantity. If the answer requires a sentence (e.g., "Why does...", "Give a reason..."), use `extended-written` instead, even for 1-mark questions.

**Additional fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `acceptedAnswers` | string[] | Yes | Array of accepted correct answers (case-insensitive) |

```json
{
  "partLabel": "a",
  "type": "short-answer",
  "text": "What is the unit of resistance?",
  "marks": 1,
  "acceptedAnswers": ["ohm", "ohms", "Ω"],
  "markScheme": ["1 mark: **ohm** / **Ω**"],
  "diagrams": []
}
```

### 10. Select and Explain (`type: "select-and-explain"`)

Student selects one option from radio buttons AND writes an explanation in a textarea. The selection (1 mark) is auto-marked. The explanation (remaining marks) is self-marked via the split-panel UI. Used for "Choose... and give a reason" style exam questions.

**Additional fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `options` | string[] | Yes | 3 or 4 option texts |
| `correctAnswer` | integer | Yes | 0-based index of the correct option |
| `explanationPrompt` | string | No | Prompt text shown above the explanation textarea (e.g., "Give a reason for your answer.") |

**Marking behaviour:**
- First `markScheme` entry corresponds to the selection (auto-marked, locked)
- Remaining `markScheme` entries are for the explanation (self-marked)
- `marks` must be at least 2 (1 for selection + 1 or more for explanation)

```json
{
  "partLabel": "a",
  "type": "select-and-explain",
  "text": "Which fuse should be used for a 2300 W kettle on a 230 V supply?",
  "marks": 2,
  "options": ["3 A", "5 A", "13 A"],
  "correctAnswer": 2,
  "explanationPrompt": "Give a reason for your answer.",
  "markScheme": [
    "1 mark: Correct answer: **13 A**",
    "1 mark: The current drawn is 10 A so the fuse must be rated above 10 A"
  ],
  "diagrams": []
}
```

### 11. Table Fill (`type: "table-fill"`)

Student fills in missing cells of a table. Blank cells are rendered as text inputs. Auto-marked via case-insensitive matching with fuzzy spelling tolerance.

**Additional fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `headers` | string[] | Yes | Column headers for the table |
| `rows` | object[] | Yes | Array of row objects (see below) |
| `correctAnswers` | (string \| string[])[] | Yes | Array of correct answers, one per blank (indexed by blank number). Each entry can be a single string or an array of accepted alternatives (case-insensitive, with fuzzy spelling tolerance). The first element is shown as the correction when wrong. |

**Row object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `cells` | (string \| object)[] | Yes | Array of cell values. Strings are displayed as-is. Objects with `{ "blank": N }` render as text inputs, where N is the 0-based blank index. |

```json
{
  "partLabel": "a",
  "type": "table-fill",
  "text": "Complete the table to show how each electrical quantity is measured.",
  "marks": 3,
  "headers": ["Quantity", "Measuring instrument", "Unit"],
  "rows": [
    { "cells": ["Current", { "blank": 0 }, "ampere (A)"] },
    { "cells": ["Potential difference", { "blank": 1 }, { "blank": 2 }] }
  ],
  "correctAnswers": ["ammeter", "voltmeter", ["volt (V)", "volt", "volts", "V"]],
  "markScheme": [
    "1 mark: ammeter",
    "1 mark: voltmeter",
    "1 mark: volt (V)"
  ],
  "diagrams": []
}
```

## LaTeX Formatting

Use LaTeX delimiters in `text`, `segments`, `options`, and `markScheme` fields:

- Inline math: `$...$` (e.g., `$v = \\frac{d}{t}$`)
- Display math: `$$...$$` (e.g., `$$E = mc^2$$`)

Escape backslashes in JSON: use `\\` for LaTeX commands (e.g., `\\frac`, `\\text`, `\\times`).

Common patterns:
- Units: `$v = 10\\,\\text{m/s}$` renders as v = 10 m/s
- Fractions: `$\\frac{1}{2}$`
- Greek letters: `$\\lambda$`, `$\\omega$`, `$\\varepsilon$`
- Subscripts: `$v_0$`, `$R_1$`
- Superscripts: `$x^2$`, `$10^{-3}$`
- Degrees: `$50\\,^{\\circ}\\text{C}$`

## Tables

Tables are supported in the `text` field using **inline HTML**. The app renders question text as HTML, so `<table>`, `<tr>`, `<th>`, and `<td>` tags work directly. The app applies dark-theme styling (borders, alternating row colours) automatically.

### Rules for tables in JSON

1. The entire table HTML must be a **single line** inside the JSON string (JSON does not allow literal newlines in strings).
2. Do **not** add `class`, `style`, or other attributes — the app's CSS handles all styling.
3. Use `<th>` for header cells and `<td>` for data cells.
4. LaTeX math works inside table cells (e.g., `<td>$F = ma$</td>`).
5. Keep tables simple: no `colspan`, `rowspan`, or nested tables.

### Example: table in a question `text` field

```json
{
  "partLabel": "a",
  "type": "single-choice",
  "text": "The table shows the speed of a car at different times.<table><tr><th>Time (s)</th><th>Speed (m/s)</th></tr><tr><td>0</td><td>0</td></tr><tr><td>5</td><td>15</td></tr><tr><td>10</td><td>15</td></tr><tr><td>15</td><td>5</td></tr></table>During which time interval was the car decelerating?",
  "marks": 1,
  "options": ["0 – 5 s", "5 – 10 s", "10 – 15 s", "0 – 10 s"],
  "correctAnswer": 2,
  "markScheme": ["Answer: C – Speed decreases from 15 to 5 m/s between 10 and 15 s"],
  "diagrams": []
}
```

This renders as a styled table with header row and alternating row colours, followed by the question text below it.

### Common table patterns

**Results table:**
```
<table><tr><th>Variable</th><th>Value</th></tr><tr><td>Mass</td><td>$2.5\\,\\text{kg}$</td></tr><tr><td>Height</td><td>$4.0\\,\\text{m}$</td></tr></table>
```

**Comparison table:**
```
<table><tr><th>Property</th><th>Series</th><th>Parallel</th></tr><tr><td>Current</td><td>Same everywhere</td><td>Splits between branches</td></tr></table>
```

### Structured `tables` field (preferred for reference tables)

When a question part contains a **reference/data table** that students need to consult (e.g., "Table 1 shows the properties of different materials"), use the `tables` field instead of embedding HTML in the `text` field. The `tables` field is an array of structured table objects on each part, similar to `diagrams`.

**Advantages over inline HTML:** Tables in the `tables` field appear in the sidebar for quick access and can be viewed in a pop-out viewer. They are numbered separately from figures as "Table 1", "Table 2", etc., with cumulative numbering across the question.

**When to use `tables` vs inline HTML:**
- **Use `tables` field:** For reference/data tables that provide context for the question (experimental results, material properties, measurement data). These are tables the student may need to refer back to.
- **Keep inline HTML:** For very small tables (2-3 cells) that are tightly integrated into the question sentence, or for decorative/formatting purposes.

**Format:**
```json
{
  "tables": [
    {
      "caption": "Speed of a car at different times",
      "headers": ["Time (s)", "Speed (m/s)"],
      "rows": [
        ["0", "0"],
        ["5", "15"],
        ["10", "15"],
        ["15", "5"]
      ]
    }
  ]
}
```

**Fields:**
- `caption` (string, optional): Short description of the table. Displayed alongside the "Table N" label.
- `headers` (string[]): Column header texts. LaTeX is supported (e.g., `"Density ($\\text{kg/m}^3$)"`).
- `rows` (string[][]): Array of rows, where each row is an array of cell values. LaTeX is supported in cells.

**Numbering rules:**
- Tables are numbered cumulatively across the entire question: Table 1, Table 2, etc.
- Table numbering is independent from figure numbering (a question can have Fig. 1, Fig. 2 AND Table 1, Table 2).
- If a part has tables, the question text should reference them by number: "Table 1 shows the results."

**Example with tables and diagrams:**
```json
{
  "partLabel": "a",
  "type": "calculation",
  "text": "Table 1 shows the results of an experiment measuring the extension of a spring. Figure 1 shows the apparatus used. Calculate the spring constant.",
  "marks": 3,
  "diagrams": ["springs-q1-fig1.jpeg"],
  "tables": [
    {
      "caption": "Results of the spring extension experiment",
      "headers": ["Force (N)", "Extension (m)"],
      "rows": [
        ["0", "0.00"],
        ["2", "0.05"],
        ["4", "0.10"],
        ["6", "0.15"]
      ]
    }
  ],
  "equations": ["$F = k \\times e$", "$E_e = \\frac{1}{2} k e^2$", "$W = F \\times d$"],
  "correctEquation": 0,
  "correctAnswer": 40,
  "tolerance": 0.1,
  "markScheme": [
    "1 mark: Correct equation: $F = k \\times e$",
    "1 mark: Correct substitution: $6 = k \\times 0.15$",
    "1 mark: Correct answer: **40 N/m**"
  ]
}
```

## Mark Scheme Guidelines

Each string in `markScheme` should describe one marking point:

- Format: `"N mark(s): criterion"`
- Be specific about what earns the mark
- Include acceptable alternative answers
- For calculations, specify: formula, substitution, final answer

## Complete Question Example

```json
{
  "id": "energy-stores1",
  "topic": "Energy stores",
  "title": "Cyclist energy stores",
  "difficulty": "easy",
  "source": "original",
  "examBoard": "AQA",
  "tier": "combined",
  "subject": "physics",
  "level": "GCSE",
  "parts": [
    {
      "partLabel": "a",
      "type": "gap-fill",
      "text": "Complete the sentence using words from the box.",
      "marks": 2,
      "segments": [
        "As the cyclist accelerates, the ",
        { "blank": 0 },
        " energy store decreases and the ",
        { "blank": 1 },
        " energy increases."
      ],
      "wordBank": ["chemical", "kinetic", "nuclear", "elastic potential"],
      "correctAnswers": ["chemical", "kinetic"],
      "markScheme": [
        "1 mark: chemical",
        "1 mark: kinetic"
      ],
      "diagrams": []
    },
    {
      "partLabel": "b",
      "type": "single-choice",
      "text": "How is internal energy affected by a temperature increase?",
      "marks": 1,
      "options": [
        "Decreased",
        "Increased",
        "Not affected"
      ],
      "correctAnswer": 1,
      "markScheme": ["Answer: B - Internal energy increases with temperature"],
      "diagrams": []
    },
    {
      "partLabel": "c",
      "type": "multi-choice",
      "text": "Which two are forms of energy stored in a cyclist and bicycle system?",
      "marks": 2,
      "options": ["Nuclear", "Kinetic", "Magnetic", "Chemical", "Electrostatic"],
      "correctAnswers": [1, 3],
      "selectCount": 2,
      "scoring": "all-or-nothing",
      "markScheme": [
        "1 mark: Kinetic",
        "1 mark: Chemical"
      ],
      "diagrams": []
    }
  ]
}
```

## Validation Rules

1. **All `id` values must be globally unique across every question file in the project** (see ID Rules above). Use subtopic-specific prefixes to prevent collisions.
2. `difficulty` must be one of `"easy"`, `"medium"`, or `"hard"`. Questions within a subtopic file should be ordered easy → medium → hard.
3. `partLabel` values should be sequential within a question (a, b, c or i, ii, iii)
4. `marks` must be a positive integer between 1 and 6
5. For `single-choice`: `correctAnswer` must be a valid index (0 to options.length - 1); `options` must have 3 or 4 strings
6. For `multi-choice`: `correctAnswers` must be an array of valid indices; `options` must have 4+ strings; `selectCount` must be a positive integer; `scoring` must be `"all-or-nothing"` or `"partial"` (defaults to `"all-or-nothing"`)
7. For `gap-fill`: `segments` must alternate between text strings and `{ "blank": N }` objects; `correctAnswers` length must match the number of blanks; all `wordBank` entries should be distinct
8. For `extended-written`: no additional fields beyond common ones; `markScheme` entries may use `**keyword**` for bold rendering; `marks` determines textarea character limit (`marks * 400`)
8b. For `extended-written-levels`: same as `extended-written` but `markScheme` should have **more entries than `marks`** (e.g., 8 entries for 6 marks). `marks` is typically 6 (occasionally 4). Each `markScheme` entry should be 1 mark.
9. For `calculation`: `marks` must be **2**, **3**, or **4**. `equations` must have exactly 3 LaTeX equation strings. `correctEquation` must be a valid index (0-2). The last `markScheme` entry must always be the final answer point. `markScheme` length must equal `marks`. `tolerance` defaults to `0.01` (1% relative)
10. For `equation-choice`: `options` must have exactly 4 LaTeX equation strings; `correctAnswer` must be a valid index (0-3); `marks` must be 1
11. For `tick-box-table`: `columnHeaders` must have at least 2 strings; `rows` must be an array of objects each with `label` (string) and `correctColumn` (0-based index into columnHeaders); `marks` must equal the number of rows (1 mark per row); `markScheme` must have one entry per row
12. For `match-up`: `rightItems` must have at least as many entries as `leftItems`; `correctLinks` must be an array of `[leftIndex, rightIndex]` pairs with valid indices; `marks` must equal `correctLinks.length` (1 mark per correct link); each left/right index must appear at most once across all links; `markScheme` must have one entry per correct link; `rightItems` entries can be strings (with LaTeX) or `{ "image": "filename.png" }` objects
13. `diagrams` is an array of filenames (no path prefix). Use `[]` for no diagrams, `["file.png"]` for one, `["fig1.png", "fig2.png"]` for multiple. Displayed as Fig. 1, Fig. 2, etc. in a grid (max 2 per row)
13. LaTeX backslashes must be escaped as `\\` in JSON strings
