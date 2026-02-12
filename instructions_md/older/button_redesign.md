Goal: keep actions always reachable on small screens, but restore the score as the visual hero on desktop.

Do this:
Split actions into primary (Try another, Review answer) and secondary (Reset, Report bug).
On min-width: 768px:
Move actions below the score (or alongside it) inside the same max-width container.
Keep primary buttons; render secondary as text buttons/links.

On max-width: 767px:
Use a sticky bottom action bar:
two primary buttons visible
secondary actions tucked into a “More” (⋯) menu or a single small link row.

Add safe-area padding (padding-bottom: env(safe-area-inset-bottom)).
Constraints:
No redesign of colours/typography

Acceptance checks:
Score is the first thing you notice on desktop
On mobile, primary actions are always visible without scrolling