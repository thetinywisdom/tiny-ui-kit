# Instructions for agents working in this repository

This kit was taken out of Tiny City Builder (thetinywisdom/character-creator):
the character designer, the walk / run animation, the controls (joystick,
action buttons) and the pixel speech bubbles. Read `README.md` first, and
`docs/STYLE_GUIDE.md` for how everything must look.

- Keep the folder layout the same as Tiny City Builder's (`src/subjects`,
  `src/anim`, `src/ui`, ...) so files can be synced between the two.
- **Keep the docs up to date. With every change, in the same commit:**
  update `SKILLS.md` (files, APIs, settings, workflows), `PLAN.md` (move
  finished work to Done, add next steps, known issues and the owner's
  decisions), `README.md` (pages, modules, APIs) and `docs/STYLE_GUIDE.md`
  for anything that changes how things look. Read SKILLS.md and PLAN.md
  before working.
- `npm run build` must pass; check changes visually (Playwright screenshots
  of `character.html` and `play.html`, on desktop and a phone size).
- The owner writes comics in Japanese: when asked for help with Japanese
  (signs, text), include the hiragana reading, an English translation and
  grammar notes.
