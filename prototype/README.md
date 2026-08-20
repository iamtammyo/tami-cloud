# Worry Jar — visual prototype

`worry-jar.html` is a single self-contained file. Open it in a browser — no build, no server,
no dependencies. Nothing in this folder is wired into the Next.js app; it's a look-and-feel
study to react to before any of it becomes code.

## What it's exploring

The build plan's Phase 2 ("make it feel like a jar") pulled to the front, plus one idea that
isn't in the plan: **the paper is a live ink canvas, so the handwriting is literally yours.**
Drawing with a finger, trackpad or stylus is the default input; typing is the fallback, and it
renders in a handwriting face with per-character tremor so it never looks typeset.

## The loop, as staged here

1. **The room.** Dark, one warm lamp, jar on a shelf. Slips are visible and countable, not
   readable. Pointer movement parallaxes the glass and the slips inside it.
2. **Take a page.** A pad sits at the bottom edge; the top sheet lifts out and the room pulls
   back so the jar stays in view the whole time you're writing.
3. **Write it.** Ink width follows drawing speed. `T` switches to typing.
4. **One question.** *Is there a step you could take on this — one that's actually within your
   control?* Three equally weighted outcomes: a step, sealed, or "not now — just put it in".
   What you wrote stays faintly visible under the question.
5. **It goes in.** The page folds, tumbles through the lid and lands in a physics heap.
   Sealed slips are cool-grey with a wax dot; open ones are warm paper.
6. **Open one.** Click a slip in the jar and it rises, unfolds and shows your actual ink.

## Choices worth arguing with

- **Committed dark, no light theme.** The spec says it gets opened at 4am; a theme toggle that
  can flash white fails that.
- **Sealed is a colour temperature, not a badge.** Warm paper = open, cool grey + wax = sealed.
  Readable at a glance across the whole jar without a single label.
- **The count is the only number.** No ages, no streaks, no badges — per the anti-features list.
- **Everything is hand-drawn on a 2D canvas.** No Three.js, no Framer Motion. The "3D" is
  parallax, depth-scaled slips and painted glass, which keeps the no-CDN rule intact and stays
  smooth on a phone.

## Known edges

- `localStorage` under `worry-jar-visual:v1` keeps the jar between visits (capped at 34 slips).
  Clearing site data resets it to the seeded worries from the session.
- Google Fonts is the one external request. It degrades to system serif/mono if blocked.
- Switching to typing clears the page — the two input modes don't merge yet.
