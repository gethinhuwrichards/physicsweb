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

### Combined vs Separate Science (AQA Tier Classification)

The `tier` tag determines whether a question is suitable for Combined Science students (`"combined"`) or only for Separate Physics students (`"separate"`). Based on the AQA specifications (Combined Science: Trilogy 8464, Separate Physics: 8463):

- **`"combined"`** — Content appears in both specs. Suitable for all students. Use this as the default.
- **`"separate"`** — Content appears only in the Separate Physics spec. Combined Science students do not study this material.

**Rule:** If a question covers ANY separate-only content, tag it `"separate"`. Only tag `"combined"` if the question exclusively covers shared content.

**Separate-only content by topic:**

| Topic | Separate-Only Content |
|---|---|
| **Energy** | Required practical: thermal insulation investigation |
| **Electricity** | Static electricity (static charge, electron transfer, sparking); Electric fields (field patterns, non-contact forces) |
| **Particle Model** | Pressure in gases ($pV$ = constant); Increasing pressure of a gas (work done on gas) |
| **Atomic Structure** | Background radiation (sources, sieverts, dose by occupation/location); Different half-lives (hazards); Uses of nuclear radiation (medical imaging/treatment); Nuclear fission (chain reactions, reactors); Nuclear fusion (joining light nuclei) |
| **Forces** | Moments, levers and gears ($M = Fd$, principle of moments); Pressure in fluids ($p = F/A$, $p = h\rho g$, upthrust, atmospheric pressure); Terminal velocity (detailed graphs); Stopping distances (estimating, speed-distance graphs); Momentum calculations for collisions; Changes in momentum ($F = m\Delta v / \Delta t$, safety features) |
| **Waves** | Reflection of waves (ray diagrams, specular vs diffuse); Sound waves (vibrations in solids, hearing range); Waves for detection/exploration (ultrasound, seismic); Lenses (convex/concave, focal length, ray diagrams, magnification); Visible light (colour, filters, opaque/transparent); Black body radiation (emission/absorption, Earth temperature equilibrium) |
| **Magnetism** | Loudspeakers (motor effect for sound); Induced potential (generator effect, alternator vs dynamo); Uses of generator effect; Microphones; Transformers ($V_p/V_s = n_p/n_s$, $V_s I_s = V_p I_p$) |
| **Space** | **Entire topic** — solar system, orbital motions, satellites, red-shift, Big Bang, dark energy. All Space questions must be tagged `"separate"`. |

**Examples:**
- "Calculate the current using $V = IR$" → `"combined"` (basic electricity, shared content)
- "Explain how a transformer steps up voltage" → `"separate"` (transformers are separate-only)
- "Describe the life cycle of a star" → `"separate"` (all Space content is separate-only)
- "Calculate the moment of a force about a pivot" → `"separate"` (moments are separate-only)
- "Explain what happens during nuclear fission" → `"separate"` (fission is separate-only)
- "Describe the structure of an atom" → `"combined"` (basic atomic structure is shared)

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
| `short-answer` | Single text input for 1-word/phrase answer | Auto-marked (fuzzy matching) |
| `select-and-explain` | Radio buttons + textarea for explanation | Auto-marks selection (1 mark); self-mark explanation |
| `table-fill` | Table with text inputs for blank cells | Auto-marked (1 mark per correct cell) |

### LaTeX Support
Use `$...$` for inline math and `$$...$$` for block math in question text and mark schemes.

### Question Patterns That Cannot Be Digitised

Some exam question parts are inherently paper-based and cannot be represented with the existing question types. When converting past papers or writing questions based on exam content, follow these rules:

**Must skip (no digital equivalent):**
- Drawing on diagrams (e.g., "Show the wavelength on the diagram and label it W")
- Drawing circuit diagrams (e.g., "Draw a circuit for a hairdryer")
- Completing or drawing bar charts / graphs
- Drawing ray paths or wave diagrams
- Drawing lines of best fit on graphs

**Can be reclassified to an existing type:**
| Original pattern | Reclassify to | How |
|---|---|---|
| Labelling a diagram ("Write the name of each particle in the spaces") | `short-answer`, `gap-fill`, or `table-fill` | See **Reclassifying labelling questions** below |
| "Draw a line from each... to..." | `match-up` | Use colour-coded pairing instead of drawn lines. Rephrase as "Match each..." |
| Reading values from a graph then answering | `calculation` or `short-answer` | Provide the values in the question text or a table instead of requiring graph reading |
| Nuclear equation completion ("Complete the symbol for...") | `short-answer` or `gap-fill` | Ask for the particle name, mass number, or atomic number as text |
| "Tick one box" / "Draw a ring around" | `single-choice` | Direct mapping — use radio buttons |
| "Tick two boxes" | `multi-choice` | Direct mapping — use checkboxes |

#### Reclassifying labelling questions

Exam questions that ask students to label a diagram (e.g., "Write the name of each particle in the spaces") cannot be reproduced directly because they rely on pointing at specific positions on an image. Instead, rephrase them as text-based questions using the distinguishing property that each label refers to. Choose the type based on how many labels and whether a word bank is appropriate:

- **1 label → `short-answer`**: Rephrase using the property that identifies what should be labelled.
  - Original: *"Label particle X on the diagram"* (where X sits in the nucleus and has +1 charge)
  - Reclassified: *"Name the particle found in the nucleus that has a relative charge of +1."* with `acceptedAnswers: ["proton"]`

- **2+ labels, word bank available → `gap-fill`**: When the original provides a word bank or the answers come from a closed set, use gap-fill with a sentence per label.
  - Original: *"Label the parts of the wave on the diagram"* (with a box containing: amplitude, wavelength, crest, trough)
  - Reclassified: Use segments like `"The distance from rest to the peak is the "`, `{ "blank": 0 }`, `". The distance for one complete cycle is the "`, `{ "blank": 1 }`, `"."` with the word bank.

- **2+ labels, no word bank → `table-fill`**: When students must recall the answers without a word bank, use a table where each row gives the identifying property and the student fills in the name.
  - Original: *"Write the name of each particle in the spaces"* (pointing to proton, neutron, electron on an atom diagram)
  - Reclassified: A table with headers `["Location", "Relative charge", "Particle name"]` and rows like `{ "cells": ["In the nucleus", "+1", { "blank": 0 }] }` with `correctAnswers: ["proton", "neutron", ["electron", "e-"]]`.

- **If a diagram is available as an image file**, you can still include it via the `diagrams` field and rephrase to reference it (e.g., "Look at Figure 1. Name the part labelled X."). This preserves visual context while keeping the answer as text input.

### Skipping Parts and Question Coherence

When a multi-part exam question has parts that must be skipped (e.g., drawing tasks), **you must check that the remaining parts still make sense as a standalone question**. Follow these rules:

1. **If a skipped part provides context needed by later parts** (e.g., "Draw the circuit in part (a)" followed by "Use your circuit to explain..."), you must either:
   - Rewrite the later part to be self-contained (provide the context in its `text` field)
   - Skip the dependent part as well
   - Provide a diagram image if available and reference it instead

2. **If skipping a part leaves only 1 part remaining**, consider whether the question is still worth including. A single 1-mark part on its own may not be valuable.

3. **Re-label parts sequentially** after skipping. If original parts were (a), (b), (c) and (b) is skipped, the remaining parts should be labelled (a), (b) — not (a), (c).

4. **Adjust the question title** if the skipped part was the main focus. The title should reflect what the remaining parts actually ask about.

5. **Never leave dangling references.** If the question text says "Use Figure 2 to answer parts (b) and (c)" but Figure 2 was for a drawing task, remove or rewrite that reference.

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
