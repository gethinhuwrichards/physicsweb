# Claude Code Instructions — Responsive Layout

## Problem

The site looks too spacious on large desktop monitors and too cramped on smaller laptop screens, even at the same 1080p resolution. This is because layout uses fixed pixel values that don't adapt to physical screen size.

## Rules to Follow

### 1. Max-Width Container

- Wrap all page content in a centered container.
- Use `max-width: 900px` (adjust if needed) with `margin: 0 auto`.
- Add horizontal padding so content doesn't touch screen edges on small viewports: `padding-inline: clamp(1rem, 4vw, 3rem)`.

```css
.container {
  max-width: 900px;
  margin: 0 auto;
  padding-inline: clamp(1rem, 4vw, 3rem);
}
```

### 2. Use Relative / Fluid Spacing

- **Do not** use fixed `px` values for padding, margins, or gaps.
- Use `rem` for consistent spacing (e.g. `1.5rem` instead of `24px`).
- Use `clamp()` for anything that should scale with viewport width:
  - Section padding: `clamp(1.5rem, 4vw, 4rem)`
  - Card gaps: `clamp(0.75rem, 2vw, 1.5rem)`
  - Font sizes (headings): `clamp(1.25rem, 2.5vw, 2rem)`

### 3. Breakpoints

Use these breakpoints where needed:

| Label   | Query                        | Purpose                          |
|---------|------------------------------|----------------------------------|
| Laptop  | `@media (max-width: 1024px)` | Tighten spacing, reduce columns  |
| Tablet  | `@media (max-width: 768px)`  | Stack layouts, smaller text      |
| Mobile  | `@media (max-width: 480px)`  | Single column, compact UI        |

### 4. Grid / Flex Layouts

- Prefer `auto-fit` / `auto-fill` with `minmax()` for card grids so columns adapt automatically:

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: clamp(0.75rem, 2vw, 1.5rem);
}
```

- Avoid hardcoding column counts unless inside a specific breakpoint.

### 5. Don'ts

- **Don't** set `width: 100%` on the outermost content wrapper without a `max-width`.
- **Don't** use `vw` units for widths on content areas (causes horizontal scroll issues).
- **Don't** add large fixed pixel padding (e.g. `padding: 80px`) — use fluid values instead.
- **Don't** set fixed `height` on containers — let content determine height.

## How to Apply

1. Identify the outermost content wrapper and apply the `.container` pattern.
2. Audit all `px`-based spacing values and convert to `rem` or `clamp()`.
3. Replace any fixed-column grids with `auto-fill` / `minmax()`.
4. Test at viewport widths of 1440px, 1024px, 768px, and 375px to verify.
