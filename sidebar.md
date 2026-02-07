
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

### Table asset type deferred

The spec mentions table support, but currently no questions use table assets in the `diagrams` array — tables are rendered as interactive HTML components (table-fill, tick-box-table). Table thumbnail support can be added later when the data format requires it.

### Files changed

| File | Change |
|------|--------|
| `src/components/FigureViewer.jsx` | New — lightbox overlay with close/nav/keyboard support |
| `src/components/FigureSidebar.jsx` | New — sticky sidebar (desktop) / bottom drawer (mobile) |
| `src/components/QuestionPart.jsx` | Added `onFigureClick` prop, click handler on inline diagrams |
| `src/QuestionView.jsx` | Figure collection, viewer state, renders sidebar + viewer |
| `src/App.jsx` | Added `has-figure-sidebar` class to `#question-container` |
| `css/style.css` | ~170 lines: layout grid, sidebar, viewer, clickable diagrams, mobile drawer, responsive rules |
