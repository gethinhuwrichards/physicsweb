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
| `parts` | Part[] | Yes | Array of question parts (minimum 1) |

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
| `type` | string | Yes | One of: `"single-choice"`, `"multi-choice"`, `"gap-fill"`, `"extended-written"`, `"short-numerical"` |
| `text` | string | Yes | The question text (supports LaTeX) |
| `marks` | integer | Yes | Number of marks (1-6) |
| `markScheme` | string[] | Yes | Array of marking criteria |
| `diagram` | string \| null | Yes | Filename in images/ folder, or null |

## Part Types

Types 1-3 are fully auto-marked. Type 4 (extended-written) is self-marked by the student using a split-panel marking UI. Type 5 (short-numerical) auto-marks the final answer; if incorrect, the student self-marks method points.

### 1. Single Choice (`type: "single-choice"`)

Student selects one option from 3 or 4 choices (radio buttons). Auto-marked.

**Additional fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `options` | string[] | Yes | 3 or 4 option texts |
| `correctAnswer` | integer | Yes | 0-based index of the correct option |

```json
{
  "partLabel": "a",
  "type": "single-choice",
  "text": "Which quantity is a vector?",
  "marks": 1,
  "options": ["Speed", "Mass", "Velocity", "Distance"],
  "correctAnswer": 2,
  "markScheme": ["Answer: C - Velocity has magnitude and direction"],
  "diagram": null
}
```

### 2. Multi Choice (`type: "multi-choice"`)

Student selects multiple options (checkboxes). The UI enforces a selection limit and shows a remaining counter.

**Additional fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `options` | string[] | Yes | 4 or more option texts |
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
  "diagram": null
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
  "diagram": null
}
```

### 4. Extended Written (`type: "extended-written"`)

Student writes a free-text answer in a textarea. Self-marked by the student during marking mode via a full-page split-panel view (student's answer on the left, mark scheme on the right).

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
  "diagram": null
}
```

### 5. Short Numerical (`type: "short-numerical"`)

Student enters a numeric final answer and optionally shows working (formula selection, substitution, rearrangement). The final answer is auto-marked using relative tolerance. If correct, all marks are awarded. If incorrect, the student self-marks method points via the split-panel marking UI, with the final answer point locked as incorrect.

**Additional fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `correctAnswer` | number | Yes | The expected numeric answer |
| `tolerance` | number | No | Relative tolerance for comparison (default `0.01` = 1%) |
| `unit` | string | No | Unit label (e.g., "J", "m/s") |
| `showUnit` | boolean | No | Whether to display the unit beside the input (default `false`) |
| `formulas` | string[] | No | LaTeX formula strings for the formula selector (includes distractors) |
| `requiresRearrangement` | boolean | No | Show rearrangement field in working section (default `false`) |

**Marking behaviour:**
- Final answer compared using relative tolerance: `|userAnswer - correctAnswer| / |correctAnswer| <= tolerance`
- If correct: all marks awarded automatically, no self-marking needed
- If incorrect: enters self-marking mode. The **last** `markScheme` entry (final answer point) is auto-locked as incorrect. Student self-marks remaining method points (formula, substitution, etc.)
- The last entry in `markScheme` **must** always be the final answer point

**2-mark example:**

```json
{
  "partLabel": "b",
  "type": "short-numerical",
  "text": "Calculate the kinetic energy of a 1500 kg car travelling at 30 m/s.",
  "marks": 2,
  "correctAnswer": 675000,
  "tolerance": 0.01,
  "unit": "J",
  "showUnit": true,
  "formulas": [
    "$E_k = \\frac{1}{2} m v^2$",
    "$E_p = m g h$",
    "$W = F d$"
  ],
  "requiresRearrangement": false,
  "markScheme": [
    "1 mark: Correct substitution: $E_k = \\frac{1}{2} \\times 1500 \\times 30^2$",
    "1 mark: Final answer: **675 000 J**"
  ],
  "diagram": null
}
```

**3-mark example (with rearrangement):**

```json
{
  "partLabel": "c",
  "type": "short-numerical",
  "text": "A car has a kinetic energy of 450 000 J and a mass of 1000 kg. Calculate the speed of the car.",
  "marks": 3,
  "correctAnswer": 30,
  "tolerance": 0.01,
  "unit": "m/s",
  "showUnit": true,
  "formulas": [
    "$E_k = \\frac{1}{2} m v^2$",
    "$v = \\sqrt{\\frac{2 E_k}{m}}$",
    "$F = m a$"
  ],
  "requiresRearrangement": true,
  "markScheme": [
    "1 mark: Correct substitution: $v = \\sqrt{\\frac{2 \\times 450000}{1000}}$",
    "1 mark: Correct rearrangement: $v = \\sqrt{\\frac{2 E_k}{m}}$",
    "1 mark: Final answer: **30 m/s**"
  ],
  "diagram": null
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
      "diagram": null
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
      "diagram": null
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
      "diagram": null
    }
  ]
}
```

## Validation Rules

1. **All `id` values must be globally unique across every question file in the project** (see ID Rules above). Use subtopic-specific prefixes to prevent collisions.
2. `partLabel` values should be sequential within a question (a, b, c or i, ii, iii)
3. `marks` must be a positive integer between 1 and 6
4. For `single-choice`: `correctAnswer` must be a valid index (0 to options.length - 1); `options` must have 3 or 4 strings
5. For `multi-choice`: `correctAnswers` must be an array of valid indices; `options` must have 4+ strings; `selectCount` must be a positive integer; `scoring` must be `"all-or-nothing"` or `"partial"` (defaults to `"all-or-nothing"`)
6. For `gap-fill`: `segments` must alternate between text strings and `{ "blank": N }` objects; `correctAnswers` length must match the number of blanks; all `wordBank` entries should be distinct
7. For `extended-written`: no additional fields beyond common ones; `markScheme` entries may use `**keyword**` for bold rendering; `marks` determines textarea character limit (`marks * 400`)
8. For `short-numerical`: `correctAnswer` must be a number; `tolerance` defaults to `0.01` (1% relative); `formulas` is an optional array of LaTeX strings; `requiresRearrangement` is optional boolean; the **last** entry in `markScheme` must be the final answer point; `unit` and `showUnit` are optional
9. `diagram` filenames should not include path (just the filename)
10. LaTeX backslashes must be escaped as `\\` in JSON strings
