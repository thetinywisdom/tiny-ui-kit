import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Several pages: the start page, the character designer, the play demo and
// the two design labs.
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        character: resolve(import.meta.dirname, 'character.html'),
        play: resolve(import.meta.dirname, 'play.html'),
        controlsLab: resolve(import.meta.dirname, 'labs/controls-lab.html'),
        bubbleLab: resolve(import.meta.dirname, 'labs/bubble-lab.html'),
      },
    },
  },
});
