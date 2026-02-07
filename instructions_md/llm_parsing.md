# LLM Parsing: Converting Exam Questions (.docx → .json)

This document is the definitive guide for converting past paper exam questions from `.docx` files into the JSON format used by the physics website.

**Key references:**
- **`public/data/QUESTION_FORMAT.md`** — Full JSON schema, field definitions, validation rules, and examples for every question type. Always consult this for the exact fields required when writing JSON.
- **`instructions_md/CLAUDE.md`** — Project architecture, question type table, and how to add new subtopics.

---

## Recognising Question Types in .docx Files

Exam papers use specific wording patterns that map to the website's question types. When reading a `.docx` file, use the table below to identify the correct type for each question part.

| Wording / Pattern in .docx | Question Type | Notes |
|---|---|---|
| "Tick **one** box" / "Draw a ring around the correct answer" / "Choose the correct answer" with 3–4 options | `single-choice` | 1 mark. Options become radio buttons. |
| "Tick **two** boxes" / "Choose **two** answers" | `multi-choice` | Marks = number of selections required. Set `selectCount` and `scoring`. |
| "Complete the sentence. Choose the answer(s) from the box." / fill-in-the-blank with a word bank | `gap-fill` | Build `segments` array with text and `{ "blank": N }` objects. The word bank becomes `wordBank`. |
| "Complete the table" / "Fill in the missing values" with blank cells in a table | `table-fill` | Use when students fill in text/values in specific table cells. Each blank cell maps to `{ "blank": N }`. Support multiple accepted answers per blank with arrays. |
| "Tick one box in each row" / table with columns like "Increases / Decreases / Stays the same" | `tick-box-table` | 1 mark per row. Marks must equal number of rows. |
| "Draw one line from each..." / "Match each... to..." | `match-up` | Rephrase as "Match each...". Left items → right items with distractors on the right. |
| "Write down the equation that links..." / select from 4 equations | `equation-choice` | Always 1 mark. 4 LaTeX equation options. |
| "Calculate..." / "Determine..." / "Work out..." with a numerical answer | `calculation` | 2–4 marks. Identify the correct equation, correct answer, and tolerance. Build mark scheme as substitution → (rearrangement) → final answer. |
| "Name..." / "State..." / "What is the unit of..." / "What type of..." — 1-mark, one-word or short-phrase answer | `short-answer` | Use when there is a single definitive correct answer (or small set of alternatives). List all accepted spellings/synonyms in `acceptedAnswers`. |
| "Which [option]? Tick one box. Give a reason for your answer." / "Choose... and explain..." | `select-and-explain` | Selection is auto-marked (1 mark). Explanation is self-marked (remaining marks). First mark scheme entry = selection, rest = explanation. |
| "Describe..." / "Explain..." / "Compare..." / "Evaluate..." — 2–4 marks, free-text answer | `extended-written` | Use when the answer is open-ended with no single correct response. Use `**keyword**` syntax in mark scheme to highlight key terms. |
| 6-mark "Describe a method..." / "Plan an investigation..." / "Evaluate..." — mark scheme has "levels" and "indicative content" | `extended-written-levels` | Use for levels-of-response questions (usually 6 marks, occasionally 4). Ignore the "levels" descriptors; use the indicative content points as the mark scheme. There will be more points than marks available. |
| "Tick one box" but the options are **images** (circuit diagrams, graphs, wave patterns, etc.) | `single-choice` with image options | Use `{ "image": "filename.png" }` objects instead of text strings in the `options` array. See **Image options** below. |
| "Tick two boxes" with image options | `multi-choice` with image options | Same as above — use `{ "image": "..." }` objects in `options`. |

### Image options for single-choice / multi-choice

When an exam paper presents visual options (e.g., "Which circuit diagram shows...?", "Which wave pattern represents...?", "Which graph shows...?"), use `{ "image": "filename.png" }` objects in the `options` array instead of text strings:

```json
{
  "type": "single-choice",
  "text": "Which circuit diagram shows a series circuit?",
  "options": [
    { "image": "circuits-opt-a-series.png" },
    { "image": "circuits-opt-b-parallel.png" },
    { "image": "circuits-opt-c-mixed.png" }
  ],
  "correctAnswer": 0
}
```

**How it displays:** Image options are laid out in a 2-column grid, with each image inside a clickable radio/checkbox label. The letter (A, B, C...) appears above each image.

**Image naming for option images:** Follow the same rules as diagram images (see "Handling Images" section), but include `-opt-` and the letter in the filename to make it clear these are option images (e.g., `waves-q3-opt-a-transverse.png`, `waves-q3-opt-b-longitudinal.png`).

**When to use image options vs. `diagrams` field:** Use image options when the student must **choose between** the images. Use the `diagrams` field when the images provide **context** that the student then answers a question about (e.g., "Look at Figure 1. What type of wave is shown?" would use `diagrams`, not image options).

### Decision flowchart for ambiguous cases

Some questions could fit multiple types. Use these rules to decide:

1. **Does it have a definitive single correct answer expressible in 1–3 words?**
   - Yes, with options provided → `single-choice`
   - Yes, no options, 1 mark → `short-answer`
   - Yes, no options, 2+ marks → probably `calculation` or `extended-written` depending on whether it's numerical

2. **Does it ask to select AND explain?**
   - Options + "Give a reason" / "Explain your answer" → `select-and-explain`
   - Just options, no explanation → `single-choice`

3. **Does it involve filling in blanks?**
   - In a sentence, with a word bank → `gap-fill`
   - In a table, with or without a word bank → `table-fill`

4. **Is it a "describe a method" or "explain a process" question (2+ marks)?**
   - If the mark scheme has **levels** (e.g., "Level 1: 1–2 marks", "Level 2: 3–4 marks") and **indicative content** → `extended-written-levels`. These are typically 6-mark questions. Use only the indicative content points in the mark scheme; ignore the level descriptors.
   - Otherwise → `extended-written`. Do not try to auto-mark these.

5. **Does it ask for a numerical calculation?**
   - Always `calculation`, even if only 2 marks. Never use `short-answer` for numerical answers.

6. **Does it say "1 mark" and ask for a factual recall word?**
   - Use `short-answer`. List common alternative phrasings in `acceptedAnswers` (e.g., `["direct current", "DC", "d.c."]`).

---

## Combined vs Separate Science (AQA Tier Classification)

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

---

## Handling Images from .docx Files

Exam papers contain embedded images (diagrams, graphs, circuit diagrams, equipment setups, etc.). These must be extracted, saved, named, and referenced correctly.

### Where to store images

All images go in `public/images/`. The `diagrams` field in question JSON references filenames only (no path prefix) — the app prepends `images/` at render time.

### Extracting images from .docx

`.docx` files store embedded images in a `word/media/` folder inside the zip archive. To extract:
1. Rename the `.docx` to `.zip` and unzip, or use a tool to extract the `word/media/` contents
2. Images will have generic names like `image1.png`, `image2.emf` — these must be renamed
3. Convert any `.emf` or `.wmf` files to `.png` or `.jpeg` before saving

### Naming conventions

Image filenames must be descriptive and follow this pattern:

```
{subtopic-prefix}-{question-context}-{figure-description}.{ext}
```

**Rules:**
- Use lowercase with hyphens (no spaces or underscores)
- Prefix with the subtopic to avoid collisions across topics (e.g., `waves-`, `forces-`, `sp-circuits-`)
- Include enough context to identify the image without seeing it (e.g., `forces-q3-velocity-time-graph.png` not `image7.png`)
- Use `.png` for diagrams/line-art and `.jpeg` for photographs
- Do NOT keep generic names like `image1.png`, `image5.png` — always rename

**Examples of good names:**
- `sp-circuits-q2-ammeter-reading.png`
- `waves-q3-transverse-wave.jpeg`
- `forces-q7-velocity-time-graph.png`
- `atomic-q1-atom-diagram.png`
- `energy-q4-sankey-diagram.png`

**Examples of bad names:**
- `image12.png` (meaningless)
- `Figure 1.png` (spaces, generic)
- `q1.png` (no subtopic prefix, no description)

### Referencing images in question JSON

Add filenames to the `diagrams` array on the relevant question part:

```json
{
  "partLabel": "a",
  "type": "single-choice",
  "text": "Figure 1 shows a velocity-time graph for a car journey. During which section is the car decelerating?",
  "diagrams": ["forces-q3-velocity-time-graph.png"]
}
```

For multiple figures on a single part:

```json
{
  "diagrams": ["waves-q6-ripple-tank.png", "waves-q6-two-waves.png"]
}
```

### How images are displayed

- Images appear **between the question text and the input controls**, captioned automatically as "Fig. 1", "Fig. 2", etc.
- **Single image**: centred at 50% of the container width
- **Multiple images**: displayed in a responsive grid (auto-fit columns, minimum 200px per image, max 2 per row)
- Images have a white background with rounded corners and a subtle border — this means diagrams with transparent backgrounds will display on white regardless of the site's light/dark theme
- Captions are auto-generated from array position — do not include "Figure 1" numbering in the `text` field unless you need to refer to a specific figure (e.g., "In Figure 2, the wave shown is...")

### When to include images vs. describe in text

Not every image from the .docx needs to be included. Use this decision process:

- **Include the image** if the question cannot be understood without it (e.g., a graph the student must read, an equipment setup they must identify, an oscilloscope trace they must interpret)
- **Describe in text instead** if the image merely illustrates something that can be stated in words (e.g., a picture of a kettle next to "A kettle is rated at 2000 W" — just use the text)
- **Skip the image** if it was part of a drawing/labelling task that has been reclassified — unless the image still adds useful context to the reclassified version
- **Never include images that show answer options** (e.g., tick-box grids from the paper) — these are replaced by the website's interactive UI

### Images shared across parts

If multiple parts of the same question reference the same diagram, put it on the **first part that uses it** only. Do not duplicate it across parts. In the text of later parts, refer back to it (e.g., "Using the graph shown above..." or "Look at Figure 1 in part (a)").

If different parts each have their own distinct figure, put each image on its respective part's `diagrams` array.

---

## Question Patterns That Cannot Be Digitised

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

### Reclassifying labelling questions

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

---

## Skipping Parts and Question Coherence

When a multi-part exam question has parts that must be skipped (e.g., drawing tasks), **you must check that the remaining parts still make sense as a standalone question**. Follow these rules:

1. **If a skipped part provides context needed by later parts** (e.g., "Draw the circuit in part (a)" followed by "Use your circuit to explain..."), you must either:
   - Rewrite the later part to be self-contained (provide the context in its `text` field)
   - Skip the dependent part as well
   - Provide a diagram image if available and reference it instead

2. **If skipping a part leaves only 1 part remaining**, consider whether the question is still worth including. A single 1-mark part on its own may not be valuable.

3. **Re-label parts sequentially** after skipping. If original parts were (a), (b), (c) and (b) is skipped, the remaining parts should be labelled (a), (b) — not (a), (c).

4. **Adjust the question title** if the skipped part was the main focus. The title should reflect what the remaining parts actually ask about.

5. **Never leave dangling references.** If the question text says "Use Figure 2 to answer parts (b) and (c)" but Figure 2 was for a drawing task, remove or rewrite that reference.
