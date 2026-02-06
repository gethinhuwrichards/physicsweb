# Exam Questions Analysis

Analysis of 11 docx files in `exam questions/` folder against the existing question types in the physics website.

---

## 1. Questions That Fit Existing Types

The majority of exam questions map cleanly to existing types:

| Existing Type | Exam Pattern | Frequency |
|---|---|---|
| `single-choice` | "Tick one box", "Draw a ring around the correct answer" (3-4 options) | **Very high** - appears in almost every question |
| `multi-choice` | "Tick two boxes" | Medium |
| `gap-fill` | "Complete the sentence. Choose the answer(s) from the box." | **Very high** - especially common in atomic structure, waves, EM spectrum |
| `tick-box-table` | "Tick one box in each row" (e.g., increases/decreases/stays the same) | Medium |
| `calculation` | "Calculate the..." with equation + substitution + answer | **Very high** - forces, waves, electricity, density |
| `extended-written` | "Describe...", "Explain..." (2+ marks, free text) | **Very high** |
| `match-up` | "Draw one line from each..." | Medium |
| `equation-choice` | Selecting the correct equation from options | Low (most equation questions are recall-based) |

**Estimated coverage: ~60-65% of all question parts fit existing types directly.**

---

## 2. Suggested New Types

### 2a. `short-answer` - **HIGH PRIORITY**

**Why:** This is the single most common question pattern that doesn't fit any current type. It appears dozens of times across all 11 papers.

**Pattern:** A question with a 1-word or short-phrase answer (1 mark) that has a definitive correct answer. Currently these would need to be `extended-written` (self-marked), but auto-marking would be far better UX.

**Examples from papers:**
- "Name one other type of nuclear radiation." → `beta` / `gamma`
- "What is the unit of resistance?" → `ohm` / `Ω`
- "State the name given to reflected sound waves." → `echo`
- "What type of waves are used for pre-natal scanning?" → `ultrasound`
- "What does the symbol kHz stand for?" → `kilohertz`
- "What is the colour of the neutral wire?" → `blue`
- "What type of current does a battery supply?" → `direct current` / `d.c.` / `DC`
- "What particle is uncharged?" → `neutron`
- "What process causes water to move from puddle to air?" → `evaporation`

**Suggested schema:**
```json
{
  "type": "short-answer",
  "text": "Name one other type of nuclear radiation.",
  "marks": 1,
  "acceptedAnswers": ["beta", "gamma", "positron", "neutrino"],
  "caseSensitive": false,
  "markScheme": ["1 mark: beta / gamma / positron / neutrino"],
  "diagrams": []
}
```

**Key features:**
- Single text input field (not a textarea - just a short input box)
- Auto-marked via case-insensitive string matching against `acceptedAnswers` array
- Supports multiple valid answers (many of these have several acceptable responses)
- Falls back to self-marking if answer doesn't match (like calculation does for method marks)
- Could support partial matching / trimming whitespace

**Impact:** Would convert ~50+ question parts across these papers from self-marked to auto-marked.

---

### 2b. `select-and-explain` - **MEDIUM PRIORITY**

**Why:** Very common exam pattern where students must both choose an answer AND justify it. Currently requires splitting into two separate parts, which loses the connection between them.

**Examples from papers:**
- "What is the mass number of this lithium atom? Tick one box. Give a reason for your answer." (2 marks)
- "Which is an atom of a different element? Give one reason for your answer." (2 marks)
- "Which two are isotopes? Explain your answer." (3 marks)
- "Which running shoe has the best cushioning? Explain the reason for your answer." (3 marks)
- "Which part of the graph shows the greatest acceleration? Give a reason." (2 marks)
- "How does the infrared camera image change? Tick one box. Reason:" (2 marks)

**Suggested schema:**
```json
{
  "type": "select-and-explain",
  "text": "What is the atomic number of a helium atom?",
  "marks": 2,
  "options": ["2", "4", "6"],
  "correctAnswer": 0,
  "explanationPrompt": "Give a reason for your answer.",
  "markScheme": [
    "1 mark: Correct answer: **2**",
    "1 mark: (It is the) number of protons"
  ],
  "diagrams": []
}
```

**Key features:**
- Radio buttons for the selection (auto-marked, 1 mark)
- Textarea for the explanation (self-marked, remaining marks)
- Clear visual connection between selection and explanation
- First mark auto-awarded if correct option selected

**Impact:** Would properly represent ~20-30 question parts across these papers.

---

### 2c. `table-fill` - **LOW-MEDIUM PRIORITY**

**Why:** Several questions ask students to fill in missing cells of a table with text or numbers.

**Examples from papers:**
- "Complete the table by adding the names of the particles" (particle, relative mass, relative charge)
- "Complete the table to show the relative charges of the atomic particles"
- "Complete the table below to show the readings on ammeters A2 and A5"

**Suggested schema:**
```json
{
  "type": "table-fill",
  "text": "Complete the table by adding the names of the particles.",
  "marks": 2,
  "headers": ["Particle", "Relative Mass", "Relative Charge"],
  "rows": [
    { "cells": [{ "blank": 0 }, "1", "+1"] },
    { "cells": [{ "blank": 1 }, "very small", "-1"] },
    { "cells": [{ "blank": 2 }, "1", "0"] }
  ],
  "correctAnswers": ["proton", "electron", "neutron"],
  "markScheme": [
    "1 mark for each correct row (all 3 required for 2 marks, allow 1 mark for 1 correct)"
  ],
  "diagrams": []
}
```

**Impact:** Would properly represent ~10-15 question parts.

---

## 3. Question Patterns That Cannot Be Digitised

These exam patterns are inherently paper-based and should be **skipped** or **adapted** when converting:

| Pattern | Example | Recommendation |
|---|---|---|
| **Drawing on diagrams** | "Show the wavelength on the diagram and label it W" | Skip - cannot replicate |
| **Drawing circuit diagrams** | "Draw a circuit for a hairdryer" | Skip |
| **Completing bar charts** | "Complete the bar chart to show all results" | Skip |
| **Labelling diagrams** | "Write the name of each particle in the spaces" | Adapt to `short-answer` or `gap-fill` by rephrasing |
| **Drawing ray paths** | "Draw the path of wave K to show reflection" | Skip |
| **Drawing lines on graphs** | "Draw a line of best fit", "Complete the velocity-time graph" | Skip |
| **Nuclear equation completion** | "Complete the symbols for alpha/beta particles" | Could potentially be a specialised type, but very niche |

**Estimated: ~15-20% of question parts fall into this category.**

---

## 4. Display & UX Improvements

### 4a. Data Tables in Question Stems

**Issue:** Many questions contain reference tables that students need to read (e.g., radiation doses, half-life values, appliance currents). These appear as `[TABLE]` blocks in the docx files.

**Recommendation:** Support rendering markdown/HTML tables within `text` fields. Currently the `text` field is a string - add support for a simple table syntax or allow HTML table markup that renders properly. This is important for:
- Density/changes of state questions (measurement data)
- Electricity questions (appliance tables)
- Nuclear questions (half-life data)
- Waves questions (pulse timing data)

### 4b. Given Equations in Calculations

**Issue:** Many calculation questions explicitly provide the equation to use: "Use the equation: wave speed = frequency x wavelength". The current `calculation` type has `equations` (3 choices) but doesn't handle the case where the equation is simply stated in the question text.

**Recommendation:** For questions that state the equation (rather than asking students to select it), consider:
- Embedding the equation in the `text` field using LaTeX: `"Calculate the wave speed.\n\nUse the equation:\n$$v = f \\lambda$$"`
- Or adding an optional `givenEquation` field that displays prominently

### 4c. Units in Calculation Answers

**Issue:** Some questions ask for both the numerical answer AND the unit: "Wave speed = ___ Unit ___". The current `calculation` type only handles the numerical answer.

**Recommendation:** Add an optional `requiresUnit` boolean and `correctUnit`/`acceptedUnits` fields to the calculation type. When enabled, display a separate input for the unit alongside the numerical answer. Award 1 mark for the unit separately.

### 4d. Hierarchical Part Labels

**Issue:** Exam questions have a hierarchical structure: Q1 → (a) → (i), (ii), (iii), (b) → (i), (ii). The current system uses flat `partLabel` values like "a", "b", "c". Sub-parts (i, ii, iii) under a main part are not visually grouped.

**Recommendation:** Consider adding a `subPartLabel` field or allowing nested part labels like "a.i", "a.ii". Visually indent sub-parts and group them under their parent part with a shared context paragraph.

### 4e. Context/Stem Text Shared Across Parts

**Issue:** In exam papers, a main question stem introduces the scenario (e.g., "A swimming pool is being filled with water.") and then parts (a), (b), (c) relate to that context. Some parts also have sub-context (e.g., "Figure 2 shows a diving board...") that applies to multiple sub-parts.

**Recommendation:** Add an optional `context` field at the question level (separate from individual part `text` fields) that displays as a shared introduction above all parts. This avoids repeating context in every part's text.

### 4f. "Required Working" Display for Calculations

**Issue:** Many calculation questions say "Show clearly how you work out your answer" or "Use the equation:". The current calculation type has step-based working, but the prompt could be more explicit about showing working.

**Recommendation:** Display a clear instruction like "Show your working" above the working area. For questions that provide specific values (e.g., "gravitational field strength = 9.8 N/kg"), display these as a data box alongside the question.

### 4g. Level-of-Response (QWC) Mark Schemes

**Issue:** Some 4-6 mark extended-written questions use level-based marking (Level 1: 1-2 marks, Level 2: 3-4 marks, Level 3: 5-6 marks) rather than individual mark points. These are "describe a method" or "evaluate" style questions.

**Recommendation:** In the self-marking view for `extended-written` questions, support an alternative marking scheme display for level-of-response questions. Instead of individual tick/cross per mark point, show the level descriptors and let students select which level they achieved. This could be a `markingStyle: "levels"` flag.

---

## 5. Summary of Priorities

| Priority | Item | Impact |
|---|---|---|
| **HIGH** | New `short-answer` type | Converts ~50+ parts from self-marked to auto-marked |
| **HIGH** | Data tables in question stems | Required for many existing questions to make sense |
| **MEDIUM** | New `select-and-explain` type | Properly represents ~20-30 common exam parts |
| **MEDIUM** | Units in calculation answers | Adds ~1 mark accuracy per calculation question |
| **MEDIUM** | Given equations display | Better context for calculation questions |
| **LOW** | New `table-fill` type | Represents ~10-15 parts |
| **LOW** | Hierarchical part labels | Visual improvement for question structure |
| **LOW** | Level-of-response marking | Better marking UX for 4-6 mark methods questions |

---

## 6. Topic Coverage of Exam Papers

| File | Maps to Topic | Subtopic |
|---|---|---|
| Atomic Structure.docx | Atomic Structure | Atomic Structure |
| nuclear radiation.docx | Atomic Structure | Nuclear Radiation |
| nuclear fission and fusion.docx | Atomic Structure | Nuclear Fission & Fusion |
| Basic properties of waves.docx | Waves | Properties of Waves |
| Electromagnet waves.docx | Waves | Electromagnetic Waves |
| density and changes of state.docx | Particle Model | Density & Changes of State |
| pressure in a gas.docx | Particle Model | Pressure in a Gas |
| forces and motion.docx | Forces | Forces & Motion |
| current potential difference and resistance.docx | Electricity | Current, PD & Resistance |
| series parallel circuits.docx | Electricity | Series & Parallel Circuits |
| domestic uses electricity.docx | Electricity | Domestic Uses of Electricity |
