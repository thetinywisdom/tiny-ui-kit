# PLAN: Tiny UI Kit

## Goal

A ready-made front end for the owner's next games: design a character, walk
and run them around with good controls, show pixel speech, in the Tiny City
Builder look. It stays in step with Tiny City Builder (same folders), so
improvements made there can be copied over.

## Decisions (agreed with the owner)

- Exported from Tiny City Builder at the owner's request ("export the character
  design & control & chat bubble options into a new repo, so I can build on top
  of that design later on").
- The same folder layout as Tiny City Builder, so files sync unchanged.
- Controls design C ("ghost plates") and speech design B (floating pixel
  text) are the picked designs; the labs keep the other options.
- Action buttons are solid navy plates (the dithered see-through ones were
  hard to read).
- Golden hour is the default colour palette; buildings keep neutral colours.
- The play demo keeps its action buttons (in Tiny City Builder they are
  switched off for now; this kit is where they live).

## Done

6. **Phones: finer pixels, soft outlines** (synced): the picture keeps ~400
   rows on a phone; only characters get the strong dark outline; the UI layer
   keeps 2 px pixels.
5. **Golden hour default palette** (synced).
4. **Colour palettes** (synced): seven palette-swap variants; `choosePalette`.
3. **Play demo: no slap from a mouse hold on the ground**; a hold that turns
   into a camera drag cancels the charge (input.js synced).
2. **Readable action buttons**: solid navy plates instead of dithered tiles.
1. **First version**: character designer, play demo, controls and bubble
   labs, README, CLAUDE.md, style guide copy.

## Next (only when the owner asks)

1. A 🎨 palette picker on the kit pages (palettes work, but there is no button
   to choose one here yet).
2. Bring the kit's reactions closer to the game's (comic hits, falls, chases)
   if a game needs them.

## Known issues and small ideas

- No palette picker on the kit pages yet (see Next 1).
- The designer's phone preview: the Still / Walk / Run buttons sit over the
  character's feet.

## Open questions for the owner

None right now.
