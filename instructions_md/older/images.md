# Images & Diagrams in Question JSON

## Overview
Each question **part** has a `diagrams` field — an array of filenames. Supports **multiple images per part**, displayed in a grid (max 2 per row) with "Fig. 1", "Fig. 2" labels.

## JSON Format
```json
{
  "partLabel": "a",
  "type": "single-choice",
  "text": "Question text...",
  "marks": 1,
  "diagrams": ["bungee-before-after.png"]
}
```

Multiple images:
```json
"diagrams": ["heat-thermal1_fig2.jpeg", "heat-thermal1_fig4.jpeg"]
```

No images:
```json
"diagrams": []
```

- **Type:** `string[]`
- **Required:** Yes (use `[]` if no images)
- **Values:** Filenames only, no path prefix (e.g. `"heat-thermal1_fig2.jpeg"`, not `"images/heat-thermal1_fig2.jpeg"`)

## Storage
- All images stored in `public/images/` (flat directory, no subdirectories)
- Formats: PNG, JPG, JPEG
- 169 image files currently in the directory
- Descriptive filenames, e.g. `bungee-before-after.png`, `heat-thermal1_fig2.jpeg`

## Rendering (React)
**Component:** `src/components/QuestionPart.jsx`

```jsx
{part.diagrams && part.diagrams.length > 0 && (
  <div className="part-diagrams-grid">
    {part.diagrams.map((file, i) => (
      <figure key={i} className="part-diagram-figure">
        <img src={`images/${file}`} alt={`Fig. ${i + 1}`} className="part-diagram" />
        <figcaption className="part-diagram-caption">Fig. {i + 1}</figcaption>
      </figure>
    ))}
  </div>
)}
```

- Rendered **below question text, above the input/answer area**
- Shown in all phases: answering, marking, and review
- Grid layout: max 2 images per row, wraps to next row
- Each image labelled "Fig. 1", "Fig. 2", etc.
- Single images display full width

## CSS Styling
**Classes** in `css/style.css`:

- `.part-diagrams-grid` — responsive grid, max 2 columns, 16px gap
- `.part-diagram-figure` — figure wrapper (no margin)
- `.part-diagram` — the image itself: responsive, white bg, rounded corners, border
- `.part-diagram-caption` — centered "Fig. N" label below each image

## Constraints
1. **Array format** — always an array, use `[]` for no images
2. **Filename only** — the `images/` prefix is added by the component
3. **Flat directory** — no subdirectory support
4. **Same image can be reused** — multiple parts can reference the same file
5. **Part-level, not question-level** — each part has its own diagrams field
6. **Max 2 per row** — grid wraps automatically for 3+ images
7. **Ordered** — array order determines Fig. 1, Fig. 2 numbering

## Reuse Example
From `heat-transfer-thermal-energy.json`, multiple parts reference the same diagram:
- Part (a) → `"diagrams": ["heat-thermal1_fig2.jpeg"]`
- Part (b) → `"diagrams": ["heat-thermal1_fig2.jpeg"]` (same image)
- Part (c) → `"diagrams": ["heat-thermal1_fig4.jpeg"]`
- Part (d) → `"diagrams": ["heat-thermal1_fig4.jpeg"]` (same image)

## Bug Reporting
Users can report broken/missing diagrams via the bug report modal with category: `"Image or diagram is broken/missing"`.
