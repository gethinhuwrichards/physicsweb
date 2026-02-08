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
| "Name..." / "State..." / "What is the unit of..." / "What type of..." — 1-mark, one-word or short-phrase answer | `short-answer` | Use **only** when the answer is a single word or very short phrase (1–3 words) like a unit name, particle name, or quantity name. List all accepted spellings/synonyms in `acceptedAnswers`. |
| "Which [option]? Tick one box. Give a reason for your answer." / "Choose... and explain..." | `select-and-explain` | Selection is auto-marked (1 mark). Explanation is self-marked (remaining marks). First mark scheme entry = selection, rest = explanation. |
| "Describe..." / "Explain..." / "Compare..." / "Evaluate..." / "Why..." — any marks, free-text answer | `extended-written` | Use when the answer requires a sentence or more, even if only 1 mark. Use `**keyword**` syntax in mark scheme to highlight key terms. |

### Decision flowchart for ambiguous cases

Some questions could fit multiple types. Use these rules to decide:

1. **Does it have a definitive single correct answer expressible in 1–3 words?**
   - Yes, with options provided → `single-choice`
   - Yes, no options, 1 mark, answer is a single word or short phrase (e.g., a unit, particle name, quantity) → `short-answer`
   - Yes, no options, but answer requires a short sentence → `extended-written` (even if 1 mark)
   - Yes, no options, 2+ marks → probably `calculation` or `extended-written` depending on whether it's numerical

2. **Does it ask to select AND explain?**
   - Options + "Give a reason" / "Explain your answer" → `select-and-explain`
   - Just options, no explanation → `single-choice`

3. **Does it involve filling in blanks?**
   - In a sentence, with a word bank → `gap-fill`
   - In a table, with or without a word bank → `table-fill`

4. **Is it a "describe a method" or "explain a process" question?**
   - Always `extended-written`, even if only 1 mark. Do not try to auto-mark these.

5. **Does the answer require a sentence (e.g., "Why...", "Suggest a reason...", "Give one advantage...")?**
   - Always `extended-written`, even if only 1 mark. Short-answer auto-marking cannot handle sentence-length responses.

6. **Does it ask for a numerical calculation?**
   - Always `calculation`, even if only 2 marks. Never use `short-answer` for numerical answers.

7. **Does it say "1 mark" and ask for a factual recall word?**
   - Use `short-answer` **only if** the answer is a single word or very short phrase (1–3 words). List common alternative phrasings in `acceptedAnswers` (e.g., `["direct current", "DC", "d.c."]`).
   - If the expected answer is a short sentence, use `extended-written` instead.

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

## Extracting and Placing Images from .docx Files

Exam paper `.docx` files contain embedded images (circuit diagrams, graphs, photographs, etc.) that must be extracted and referenced in the JSON.

### Step 1: Extract images from the .docx

A `.docx` file is a ZIP archive. Images are stored in `word/media/` and referenced via relationships in `word/_rels/document.xml.rels`. Images are embedded in two formats:

- **`w:drawing`** — Modern format. Contains `<a:blip r:embed="rIdN"/>` elements. Most common.
- **`w:pict`** — Legacy VML format. Contains `<v:imagedata r:id="rIdN"/>` elements. Uses namespace `{urn:schemas-microsoft-com:vml}imagedata`.

**Extraction process (Python):**
```python
from docx import Document
from docx.opc.constants import RELATIONSHIP_TYPE as RT
import os

doc = Document('exam-paper.docx')
rels = doc.part.rels
for rel_id, rel in rels.items():
    if "image" in rel.reltype:
        image_data = rel.target_part.blob
        ext = os.path.splitext(rel.target_part.partname)[1]  # .jpeg, .png, etc.
        # Save with a descriptive name
```

To map images to questions, walk through `document.xml` paragraph by paragraph. Track which question number (Q1, Q2...) and figure number (Figure 1, Figure 2...) you're in by reading the text. When you encounter an image element (`w:drawing` or `w:pict`), extract its relationship ID and map it to the current question/figure context.

**Naming convention:** `{subtopic-prefix}-q{docx-question-number}-fig{figure-number}.{ext}`
- Examples: `static-elec-q1-fig1.jpeg`, `cpdr-q3-fig2.jpeg`, `dom-elec-q5-fig4.png`
- The subtopic prefix matches the question ID prefix used in the JSON.

**Filtering:** Skip images smaller than 500 bytes — these are typically checkbox decorations, bullet points, or tick marks, not question content. Also skip images that appear in the mark scheme section (after "Mark schemes" or similar heading).

### Step 2: Identify what each image shows

View each extracted image to categorise it:

| Category | Action |
|---|---|
| **Question diagram** (circuit, graph, apparatus, photograph) | Add to the correct part's `diagrams` array |
| **Equation image** (e.g., "current = charge flow / time") | Do NOT add as a diagram — express as LaTeX in the question text instead |
| **Blank/artifact** (tiny checkbox, tick mark, empty square) | Discard — these are formatting artifacts from the docx |
| **Option images** (e.g., 4 circuit symbols as answer choices for "Tick one box") | Use `single-choice` with image options: `"options": [{ "image": "file.png" }, ...]` |

### Step 3: Place images in the correct part's `diagrams` array

The `diagrams` field is per-part, not per-question. Place each image in the part that references it:

- **Figures in the question preamble** (before any part letter): Place in the **first part's** `diagrams` array.
- **Figures referenced within a specific part** (e.g., "Figure 2 shows..." appears between part (c) and part (d)): Place in **that part's** `diagrams` array.
- **Figures used across multiple parts**: Place in the **earliest part** that references the figure.

Example: If Q1 has "Figure 1 shows a generator" (before part a), "Figure 2 shows a student" (also before part a), and "Figure 3 shows the dome and conductor" (before part d):
```json
{ "partLabel": "a", "diagrams": ["static-elec-q1-fig1.jpeg", "static-elec-q1-fig2.jpeg"], ... },
{ "partLabel": "b", "diagrams": [], ... },
{ "partLabel": "c", "diagrams": [], ... },
{ "partLabel": "d", "diagrams": ["static-elec-q1-fig3.jpeg"], ... }
```

### Step 4: Restore figure references in question text

When an image is placed in a part's `diagrams` array, the question text **must** reference the figure so students know to look at it. Use the original docx wording:

- "Figure 1 shows the circuit used."
- "The diagram shows a negatively charged rod held near a thin stream of water."
- "The graph shows how the current changes during the first second after switching on."

**Do NOT** describe the image contents in text as a substitute for including the image. If the docx says "Figure 1 shows...", keep that phrasing and include the actual image file.

**Figure numbering is cumulative across the whole question, not per-part.** The website labels figures sequentially across all parts: if part (a) has 2 diagrams (Fig. 1, Fig. 2), then part (d)'s first diagram will be labelled Fig. 3, not Fig. 1. When writing figure references in the question text, use the cumulative number. For example:

- Part (a) has 2 images → text says "Figure 1 shows..." and "Figure 2 shows..."
- Parts (b) and (c) have no images
- Part (d) has 1 image → text must say "Figure **3** shows...", not "Figure 1 shows..."

To calculate the correct figure number for a part's Nth diagram: count the total number of diagrams in all preceding parts, then add N.

### Step 5: Handle images for dropped parts

Some question parts are dropped because they require drawing (see "Question Patterns That Cannot Be Digitised" below). Their images become orphaned. Check whether:

1. The image provides **context for other parts** that were kept → add it to the relevant kept part's `diagrams`
2. The image is **only relevant to the dropped part** → leave it unreferenced (it stays in `public/images/` but isn't used)

### Duplicate images

Some docx files reuse the same image across multiple questions (e.g., the same Van de Graaff generator photo in Q1 and Q8). Extract each occurrence separately — the files will be identical but named differently. This is fine; it keeps the mapping simple.

---

## Extracting Tables from .docx Files

Exam papers frequently include **data/reference tables** (experimental results, material properties, measurement values, etc.) that students need to consult when answering questions. These should be extracted into the `tables` field on question parts rather than embedded as inline HTML in the `text` field.

### Recognising tables to extract

Extract a table into the `tables` field when:
- The docx says "Table 1 shows..." or "The table below shows..." followed by a data table
- The table provides reference data needed to answer the question (e.g., results, measurements, properties)
- The table is large enough (3+ rows) that a student might need to scroll back to see it

**Do NOT** extract into `tables` if:
- The table is part of the answer mechanism (tick-box-table, table-fill question types have their own fields)
- The table is tiny (1-2 data cells) and tightly integrated into a sentence

### Table data format

```json
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
]
```

- `caption`: Brief description. Use the docx wording if available (e.g., "Speed of a car at different times").
- `headers`: Column headings from the `<th>` cells. Include units in parentheses.
- `rows`: Each row is an array of strings. Use LaTeX for mathematical content (e.g., `"$2.5 \\times 10^3$"`).

### Table numbering

- Tables are numbered **separately from figures**: Table 1, Table 2, etc.
- Numbering is **cumulative across the whole question** (same rule as figures).
- The question text must reference tables by their cumulative number: "Table 1 shows the results."
- If part (a) has 1 table and part (c) has 1 table, the text in part (c) should say "Table **2** shows..." not "Table 1 shows..."

### Table placement

Follow the same rules as images:
- Tables in the question preamble (before any part letter) → place in the **first part's** `tables` array.
- Tables referenced within a specific part → place in **that part's** `tables` array.
- Tables used across multiple parts → place in the **earliest part** that references the table.

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
