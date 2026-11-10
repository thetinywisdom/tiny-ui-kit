# SKILLS: how the Tiny UI Kit works and how to extend it

Read this before changing anything. `PLAN.md` says what is done and what is
next; `docs/STYLE_GUIDE.md` says how everything must look; `README.md` is the
short version for people.

## What this is

The reusable front end of **Tiny City Builder**
(thetinywisdom/character-creator), taken out so a new game can start from it:
the character designer, the walk / run animation, the controls (keyboard,
mouse / touch, joystick, action buttons), the pixel speech and hit bursts, the
PS1 look and the colour palettes. three.js 0.187 + Vite; no other libraries.

## Run, build, publish

```bash
npm install
npm run dev      # open the printed address: index.html links every page
npm run build    # must pass before committing; static site in dist/
```

Pages (multi-page Vite build, `vite.config.js`): `index.html` (start page),
`character.html` (designer), `play.html` (play demo),
`labs/controls-lab.html`, `labs/bubble-lab.html` (design options; plain HTML,
no imports). The default branch is `main`.

## Code map

Folders match Tiny City Builder's, so files can be copied between the two
repos unchanged (only `src/controls/input.js` lives at `src/city/input.js`
there, and `src/kit/` exists only here).

```
src/kit/stage.js       demo helpers: createStage(canvas) (renderer + PS1 post
                       step + scene with the style's sky and lights;
                       stage.render(camera) -> { W, H } in CSS px),
                       loadCharacter() / saveCharacter() (localStorage
                       'tinykit.character'), randomCharacter(), buildPerson(p),
                       CHARACTER_FORMAT 'tiny-character'
src/kit/character.js   the designer page: Creator panel, OrbitControls preview,
                       Still / Walk / Run, JSON export / import; the preview
                       sits left of the panel (wide) or above it (phone)
src/kit/play.js        the play demo: park, townspeople, joystick + keys, the
                       action pad, pixel speech; act() / handle() hold the
                       (deliberately simple) reactions to replace
src/kit/kit.css        top-bar links, page basics (everything else: style.css)
src/subjects/human.js  + human/*: the person builder (schema, presets,
                       randomize, applyRules, adjust, build(params, style))
src/creator/Creator.js the designer panel, generated from the schema
src/anim/gait.js       walk / run: createGait, stepGait, poseGait, tuneOf,
                       WALKS / RUNS styles, setGaitEngine('New' | 'Classic'),
                       landGait; gaitIK.js = the New engine (foot targets, leg IK)
src/controls/input.js  CityInput: keys, drag-look, pinch, joystick, click / tap
                       / double / long-press (mouse only) events; axes();
                       runHeld (RUN button); chargeCancel when a hold turns
                       into a drag
src/ui/actionPad.js    ActionPad: one button per action, PAD_LAYOUTS Arc / Grid
                       / Split / Bar, fire on pointerdown (works with a thumb
                       on the joystick), place(W, H, opts), tiles(...)
src/ui/pixelOverlay.js PixelOverlay: speech (earshot fade), bursts, charge
                       dial, action menu, pad tiles (solid navy plates),
                       joystick; draw({ W, H, px, ... }) with px = 2 (the UI's
                       own pixel size, not the picture's)
src/styles/            index.js (style = ps1Clear, lighting presets), ps1.js
                       (materials, pixelScale that follows the screen, alpha
                       flag: characters 1, the rest 0.5), palette.js (swatches,
                       snapColor, PALETTES: Golden hour default, Muted, Vibrant,
                       Candy pop, Cool city, Retro 16, Manga ink;
                       choosePalette() then reload)
src/render/ps1.js      low-res render, dither, outlines (strong on characters,
                       soft x0.8 fading with distance on everything else)
src/lib/               shapes, merge, rng, saveFile
src/viewer/params.js   defaultsFor(subject)
docs/STYLE_GUIDE.md    Tiny City Builder's style guide (copy)
```

## Common tasks

- **Start a game:** copy `play.html` + `src/kit/play.js`, replace the park and
  `act()` / `handle()`; keep CityInput, ActionPad and PixelOverlay.
- **Say something:** push `{ anchor, text, kind: 'talk' | 'shout' | 'burst',
  age, life, id }` into the bubbles list (`say()` in play.js); `anchor()`
  returns the world point over the speaker's head (`anchor.who` = speaker).
- **A new action button:** add it to `BUTTONS` in actionPad.js (id, label,
  key, icon), an 11x11 icon in `ICONS` (pixelOverlay.js), a place in each
  layout, and handle its event.
- **A new character setting:** add it to `human.schema`; the designer shows it
  by itself; rules go in `human/rules.js`.
- **Sync from Tiny City Builder:** copy the changed files over (same paths,
  input.js -> src/controls/), build, check both pages, note it in PLAN.md.

## Testing and checking

`npm run build` must pass. Check visually with Playwright (pre-installed:
`require('playwright')`, launch with `--use-gl=angle --use-angle=swiftshader`):
`npx vite preview`, screenshot `character.html` and `play.html` on a desktop
size and on a phone (`devices['iPhone 13']` and `['iPhone 13 landscape']`),
and look at the pictures. For the play demo also press keys / tap buttons and
check the reaction.

## Keeping the docs up to date

With every change, in the same commit: update this file for any added,
removed or renamed file, API, setting or workflow; update `PLAN.md` (move
finished work to Done, add next steps, known issues, owner decisions);
`README.md` for what people see; `docs/STYLE_GUIDE.md` for looks.
