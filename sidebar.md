
# Feature: Sticky Figure Sidebar + Click-to-Pop Viewer

## Problem
- Some figures/diagrams/tables are referenced across multiple parts of a question.
- In the current scroll layout, students must scroll back to re-see figures, increasing friction and cognitive load.
- Repeating full figures inline looks clunky and makes pages long.

## Goal
Add a **sticky right sidebar** that shows **thumbnails of all figures/tables used in the current question**, in first-appearance order (Figure 1, Figure 2, …). Clicking a thumbnail opens a **pop-out viewer** above the question content; clicking again (or outside) closes it.

## Requirements (Desktop)
1) **Layout**
- Main question content remains in the central/left column.
- Add a **right sidebar** dedicated to figures/tables.
- Sidebar is **sticky** (remains visible while scrolling the question).

2) **Sidebar content**
- Show a vertical list of **thumbnails/cards** for each figure/table asset.
- Preserve **order of first appearance** in the question: Fig 1, Fig 2, Fig 3…
- Each sidebar item shows:
  - Label: `Figure 1`, `Figure 2` … (or `Table 1`, etc.)
  - Optional short caption (if available)
  - Thumbnail image (or a table icon + title for tables)

3) **Click behaviour**
- Clicking a sidebar thumbnail:
  - Opens a **viewer** positioned **above the question content** (not inside the sidebar).
  - Viewer shows the full asset (image/table) at readable size.
- Clicking the same thumbnail again, clicking the viewer overlay, or pressing `Esc` closes the viewer.

4) **Inline figures remain**
- Figures are still displayed inline in the question body as they are now (no removal required).
- No repeated full-size images should be introduced; the sidebar is for navigation + quick access.

## Requirements (Mobile)
- The right sidebar should collapse into a **bottom “Figures (N)” button** (sticky).
- Tapping opens a **drawer** showing the same ordered list of thumbnails.
- Viewer behaviour remains the same (opens above question content or as a modal).

## Data/Rendering rules
- Assets are deduplicated by ID/filepath: if referenced multiple times, it appears once in the sidebar.
- Order = first time the asset appears while rendering the question.
- Support asset types:
  - `image` (png/jpg/webp/svg)
  - `table` (rendered HTML or image snapshot)

## UI details
- Sidebar scrolls internally if too many figures (max-height = viewport height minus header).
- Thumbnails should be consistent size (e.g., 64x48 / 80x60) with object-fit cover/contain.
- Viewer should have:
  - Close affordance (X) + click-outside to close
  - Optional caption + figure label
  - Reasonable max height (e.g., 60–70vh) with zoom/scroll as needed

## Acceptance criteria
- On a multi-figure question, the sidebar shows all figures exactly once in correct order.
- Sidebar remains visible while scrolling the question.
- Clicking a thumbnail opens a viewer above question content; click-outside/Esc closes it.
- Works on desktop + mobile (sidebar collapses to drawer/button).
- Does not break existing inline figure rendering.

---

## Implementation Choices & Rationale

### Layout: CSS Grid on `#question-container`

Rather than wrapping the entire app in a new layout component, the sidebar is a sibling of `#question-content-inner` inside `#question-container`. When a question has figures, App.jsx adds the class `has-figure-sidebar` to `#question-container`, which switches it to `display: grid; grid-template-columns: 1fr 180px`. The body max-width widens from 920px to 1120px via `body:has(.has-figure-sidebar)`.

**Why**: This avoids any structural changes to the existing component hierarchy. The sidebar simply appears as a grid column when figures exist and vanishes when they don't, with zero layout shift for questions without diagrams.

### Two components: `FigureSidebar` + `FigureViewer`

Separated rather than combined because they have different rendering contexts — the sidebar is part of the page flow (grid column), while the viewer is a fixed overlay above everything. This follows the existing pattern where modals (ConfirmModal, FeedbackModal) are independent components.

### Viewer state in `QuestionView` via `useState`

The viewer open/close state (`viewerIndex`) is kept outside the existing `useReducer` because it's purely presentational UI state with no persistence or marking-flow implications. Using `useState` keeps it simple and avoids polluting the reducer with unrelated concerns.

### Inline figures gain click-to-open

The `onFigureClick` callback is passed through to `QuestionPart`, so clicking any inline figure opens the same viewer. This required only adding an optional prop and a conditional class (`part-diagram-clickable`) — no structural changes to the existing diagram rendering.

### z-index layering

The viewer uses `z-index: 100`, deliberately below ConfirmModal (200) and well below the self-marking overlay (950) and score page (1000). This ensures that if a modal or marking view opens, it always appears on top. The sidebar itself needs no z-index on desktop (it's in normal flow). On mobile, the fixed bottom bar uses `z-index: 50`.

### Mobile: fixed bottom bar + horizontal drawer

Below 900px, the sidebar becomes a fixed bottom bar with a "Figures (N)" toggle. Tapping opens a horizontal scrollable row of thumbnails. This follows the same pattern used by the score page actions (fixed bottom bar with safe-area padding). The question container gets extra `padding-bottom: 4rem` to prevent the bar from overlapping content.

### Sidebar hidden during marking/score phases

The sidebar only shows during `answering` and `complete` phases. During `marking`, the self-marking overlay takes over the full screen (z-index 950), so the sidebar would be invisible anyway. During `score`, the score page overlay covers everything. The viewer auto-closes when the phase changes.

### Table support in the sidebar

Tables use a structured `tables` field on each part (`{ caption, headers, rows }`) rather than inline HTML. This enables:
- **Sidebar access**: Tables appear as labelled buttons ("Table 1", "Table 2") below the figure thumbnails
- **Viewer support**: Clicking a table button opens the same lightbox overlay, but renders a styled HTML table instead of an image
- **Separate numbering**: Tables get their own counter (Table 1, Table 2...) independent of figure numbering (Fig. 1, Fig. 2...), matching exam paper convention
- **Cumulative numbering**: Like figures, table numbers are cumulative across all parts of a question

**Why structured data over inline HTML?** Structured `{ headers, rows }` is easier to render consistently, supports LaTeX in cells via `renderLatex()`, and keeps the data parseable for the sidebar. Inline HTML tables in the `text` field are still supported for small, tightly-integrated tables that don't need sidebar access.

**Why separate viewer state?** Figure and table viewers use independent `viewerIndex` / `tableViewerIndex` state. Opening a table closes any open figure and vice versa. This keeps navigation simple — arrow keys cycle within the same asset type.

### Files changed

| File | Change |
|------|--------|
| `src/components/FigureViewer.jsx` | Lightbox overlay — now supports `tableData` prop to render tables as HTML instead of images |
| `src/components/FigureSidebar.jsx` | Sticky sidebar — now accepts `tables` prop, renders table buttons below figure thumbnails |
| `src/components/QuestionPart.jsx` | Renders inline tables from `part.tables`, accepts `tableOffset` + `onTableClick` props |
| `src/QuestionView.jsx` | Collects figures + tables, manages both viewer states, passes all props to children |
| `src/App.jsx` | `has-figure-sidebar` class now also triggers when tables are present |
| `css/style.css` | Inline table styles, table sidebar buttons, viewer table rendering, mobile responsive rules |
| `public/data/QUESTION_FORMAT.md` | Documented `tables` field schema, numbering rules, and usage guidance |
| `instructions_md/llm_parsing.md` | Added table extraction section for docx conversion |
| `instructions_md/CLAUDE.md` | Added Tables subsection describing the data format |
