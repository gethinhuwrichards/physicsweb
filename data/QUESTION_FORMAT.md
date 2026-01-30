# Question Format Specification

This document defines the JSON format for exam questions. Use this specification when generating or validating questions.

## File Structure

Questions are stored in `questions.json` with this top-level structure:

```json
{
  "topics": ["Topic1", "Topic2", ...],
  "questions": [...]
}
```

## Field Definitions

### Top Level

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `topics` | string[] | Yes | List of all topic names used in questions |
| `questions` | Question[] | Yes | Array of question objects |

### Question Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | **Globally unique** identifier — see ID rules below |
| `topic` | string | Yes | Must match a value in the `topics` array |
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
| `type` | string | Yes | One of: `"written"`, `"multiple-choice"`, `"numerical"`, `"fill-in-blank"` |
| `text` | string | Yes | The question text (supports LaTeX) |
| `marks` | integer | Yes | Number of marks (1-6) |
| `markScheme` | string[] | Yes | Array of marking criteria |
| `diagram` | string \| null | Yes | Filename in images/ folder, or null |

## Part Types

### 1. Written (`type: "written"`)

Student enters free-text answer in a textarea. Self-marked by student against mark scheme.

**Additional fields:** None

```json
{
  "partLabel": "a",
  "type": "written",
  "text": "State Newton's Second Law of Motion.",
  "marks": 2,
  "markScheme": [
    "1 mark: Force equals mass times acceleration",
    "1 mark: Or F = ma with correct definitions"
  ],
  "diagram": null
}
```

### 2. Multiple Choice (`type: "multiple-choice"`)

Student selects one of **3 options** (A, B, C). Auto-marked.

**Additional fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `options` | string[] | Yes | Exactly 3 option texts |
| `correctAnswer` | integer | Yes | Index of correct answer (0, 1, or 2) |

```json
{
  "partLabel": "b",
  "type": "multiple-choice",
  "text": "Which quantity is a vector?",
  "marks": 1,
  "options": [
    "Speed",
    "Mass",
    "Velocity"
  ],
  "correctAnswer": 2,
  "markScheme": ["Answer: C - Velocity has both magnitude and direction"],
  "diagram": null
}
```

### 3. Numerical (`type: "numerical"`)

Student shows working in a textarea, then enters a numerical final answer. Auto-marked: if final answer is correct, ALL marks are awarded. If incorrect, student can self-award partial marks for working.

**Additional fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `correctAnswer` | number | Yes | The correct numerical value |

```json
{
  "partLabel": "b",
  "type": "numerical",
  "text": "The mass of the cyclist is $80\\,\\text{kg}$. The speed is $12\\,\\text{m/s}$. Calculate the kinetic energy. Use $E_k = 0.5\\,mv^2$.",
  "marks": 2,
  "correctAnswer": 5760,
  "markScheme": [
    "1 mark: Ek = 0.5 × 80 × 12²",
    "1 mark: Ek = 5760 J"
  ],
  "diagram": null
}
```

### 4. Fill-in-Blank (`type: "fill-in-blank"`)

Blanks are marked with `___` in the question text. Inline text inputs appear where each `___` is placed. Auto-marked (case-insensitive exact match).

**Additional fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `correctAnswers` | string[] | Yes | Array of correct values in order of blanks |

```json
{
  "partLabel": "a",
  "type": "fill-in-blank",
  "text": "As the cyclist accelerates, the ___ energy store decreases and the ___ energy increases.",
  "marks": 2,
  "correctAnswers": ["chemical", "kinetic"],
  "markScheme": [
    "1 mark: chemical",
    "1 mark: kinetic"
  ],
  "diagram": null
}
```

## LaTeX Formatting

Use LaTeX delimiters in `text` and `markScheme` fields:

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
      "type": "fill-in-blank",
      "text": "As the cyclist accelerates, the ___ energy store decreases and the ___ energy increases.",
      "marks": 2,
      "correctAnswers": ["chemical", "kinetic"],
      "markScheme": [
        "1 mark: chemical",
        "1 mark: kinetic"
      ],
      "diagram": "cyclist.png"
    },
    {
      "partLabel": "b",
      "type": "numerical",
      "text": "The mass is $80\\,\\text{kg}$ and speed is $12\\,\\text{m/s}$. Calculate the kinetic energy using $E_k = 0.5\\,mv^2$.",
      "marks": 2,
      "correctAnswer": 5760,
      "markScheme": [
        "1 mark: Ek = 0.5 × 80 × 12²",
        "1 mark: Ek = 5760 J"
      ],
      "diagram": null
    },
    {
      "partLabel": "c",
      "type": "multiple-choice",
      "text": "How is internal energy affected by the temperature increase?",
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
      "partLabel": "d",
      "type": "written",
      "text": "Explain why the brake pads get hot when braking.",
      "marks": 2,
      "markScheme": [
        "1 mark: Work is done against friction",
        "1 mark: Energy transferred to thermal energy store"
      ],
      "diagram": null
    }
  ]
}
```

## Validation Rules

1. Every `topic` value in questions must exist in the `topics` array
2. **All `id` values must be globally unique across every question file in the project** (see ID Rules above). Use subtopic-specific prefixes to prevent collisions.
3. `partLabel` values should be sequential within a question (a, b, c or i, ii, iii)
4. `marks` must be a positive integer between 1 and 6
5. For `multiple-choice`: `correctAnswer` must be 0, 1, or 2; `options` must have exactly 3 strings
6. For `numerical`: `correctAnswer` must be a number
7. For `fill-in-blank`: `correctAnswers` array length must match number of `___` in text
8. `diagram` filenames should not include path (just the filename)
9. LaTeX backslashes must be escaped as `\\` in JSON strings
