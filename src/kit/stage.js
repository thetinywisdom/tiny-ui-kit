import * as THREE from 'three';
import { human } from '../subjects/human.js';
import { style } from '../styles/index.js';
import { createPs1Renderer } from '../render/ps1.js';
import { defaultsFor } from '../viewer/params.js';

// Shared by the demos: a renderer with the PS1 look (low-res picture, dither,
// pixel outlines), a scene in the style's sky colour and lights, and the
// character you designed (kept in this browser, shared by every page).

export const CHARACTER_FORMAT = 'tiny-character'; // the same JSON as Tiny City Builder's
const KEY = 'tinykit.character';

/** A full-window renderer + PS1 post step + scene with the style's lights. */
export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const ps1 = createPs1Renderer(renderer);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(style.background);
  const lights = style.createLights({ renderer });
  scene.add(...lights.objects);
  lights.key.position.set(6, 12, 8);
  const stage = { scene, style, renderer, lights };
  const size = () => {
    const W = window.innerWidth, H = window.innerHeight;
    renderer.setSize(W, H, false);
    return { W, H };
  };
  stage.render = (camera) => {
    const { W, H } = size();
    ps1.render(stage, camera, 0, 0, W, H); // CSS pixels (three.js applies the pixel ratio)
    return { W, H };
  };
  return stage;
}

/** Your character's settings (defaults on the first visit). */
export function loadCharacter() {
  const p = defaultsFor(human);
  try { Object.assign(p, JSON.parse(localStorage.getItem(KEY) ?? '{}')); } catch { /* defaults */ }
  human.applyRules?.(p);
  return p;
}
export function saveCharacter(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private window: fine */ }
}

/** A random townsperson's settings (child: 'kid' | 'adult' | undefined for either). */
export function randomCharacter(rng = Math.random) {
  const p = { ...defaultsFor(human), ...human.randomize(rng) };
  human.applyRules?.(p);
  return p;
}

/** Build a person (a THREE.Group with named joints, see anim/gait.js). */
export function buildPerson(p) {
  const body = human.build(p, style);
  style.decorate?.(body);
  return body;
}

export { style, human };
