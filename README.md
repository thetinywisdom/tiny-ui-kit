# Tiny UI Kit

The character design, controls and pixel chat bubbles from **Tiny City
Builder**, taken out on their own so a new game can be built on top of them.
three.js + Vite, no other dependencies.

```bash
npm install
npm run dev      # then open the printed address
npm run build    # static site in dist/
```

## Pages

| Page | What it is |
| --- | --- |
| `index.html` | Start page with links to everything below. |
| `character.html` | **Character designer**: body type, build, height, proportions, hair, face, clothes, accessories, walk and run style; Still / Walk / Run preview; save / load as JSON (`{ format: "tiny-character", version: 1, params }`, the same file Tiny City Builder reads). The design is kept in the browser and used by the play demo. |
| `play.html` | **Play demo**: your character in a small park with townspeople. Joystick (touch) or WASD / arrows; every action is a button (USE, SLAP hold-to-charge, PUSH, TALK, FART, JUMP, PEEL, RUN); four button layouts (🎮); pixel speech and hit bursts. Reactions are deliberately simple, so you can replace them with your game's own. |
| `labs/controls-lab.html` | The design options for the action menu and buttons (C, "ghost plates", was picked). |
| `labs/bubble-lab.html` | The design options for speech (B, floating pixel text, was picked). |

## What is in `src/`

The folders match Tiny City Builder's, so files can be copied back and forth.

| Path | Use it for |
| --- | --- |
| `subjects/human.js` (+ `subjects/human/*`) | Building a person: `human.build(params, style)` returns a `THREE.Group` with named joints. `human.schema` (every setting with defaults and options), `human.presets`, `human.randomize(rng)`, `human.applyRules(params)` (no beards on women, etc.). |
| `creator/Creator.js` | The designer panel, built from the schema (tabs, chips, swatches, sliders). |
| `anim/gait.js`, `anim/gaitIK.js` | Walking and running: `createGait()`, `stepGait(g, dt, speed, tune)`, `poseGait(body, g, 'natural', tune)`, `tuneOf(params)` (the walk / run style). Two engines: **New** (feet planted with leg IK, learnt from iso-city; default) and **Classic** (keyframes): `setGaitEngine('New' \| 'Classic')`. `landGait(g, vy)` squashes the legs after a jump. |
| `controls/input.js` | `CityInput`: keyboard, mouse / touch drag to look, pinch zoom, the walk joystick, clicks / taps / long press (mouse only) as events. `axes()` gives `{ x, z, run, handbrake }`. |
| `ui/actionPad.js` | `ActionPad`: one button per action, fires on finger-down (works with a thumb on the joystick), layouts Arc / Grid / Split / Bar (`PAD_LAYOUTS`, `setLayout`), `place(W, H, { touch, joy, riding })`, `tiles(...)` for drawing. Events go into `input.events` (`primary`, `chargeStart` / `chargeEnd`, `choose` n 1-3, `jump`, `banana`; `input.runHeld`). |
| `ui/pixelOverlay.js` | `PixelOverlay`: the pixel layer drawn at the picture's own pixel size: floating speech with earshot (fades with distance), spiky hit bursts, the slap charge dial, the action menu, the action buttons and the joystick. `draw({ W, H, px, speech, bursts, charge, menu, pad, showKeys, stick })`. |
| `styles/`, `render/ps1.js` | The PS1 look: style materials and lights, low-res rendering with dither and pixel outlines. Colour palettes (`styles/palette.js` `PALETTES`: Golden hour (default), Muted, Vibrant, Candy pop, Cool city, Retro 16, Manga ink): `choosePalette(name)` then reload; the active one is read from localStorage `tinycity.palette`. |
| `kit/stage.js` | Shared demo helpers: `createStage(canvas)`, `loadCharacter()` / `saveCharacter()`, `randomCharacter()`, `buildPerson(params)`. |
| `kit/play.js` | The play demo: read this first to see everything wired together. |

## Starting a game from here

1. Copy `play.html` + `src/kit/play.js` to your game's page and script.
2. Replace the park with your world and `act()` / `handle()` with your game's
   actions; keep `ActionPad`, `CityInput` and `PixelOverlay` as they are.
3. Speech: push `{ anchor, text, kind: 'talk' | 'shout' | 'burst', age, life, id }`
   into the bubbles list (`say()` in play.js); `anchor()` returns the world
   point over the speaker's head.

`docs/STYLE_GUIDE.md` is Tiny City Builder's style guide (the look of
characters, controls and speech); keep new work consistent with it.
