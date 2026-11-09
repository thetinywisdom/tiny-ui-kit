import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Creator } from '../creator/Creator.js';
import { createGait, poseGait, stepGait, tuneOf, setGaitEngine, WALK_SPEED, RUN_SPEED } from '../anim/gait.js';
import { defaultsFor } from '../viewer/params.js';
import { saveFile, openTextFile } from '../lib/saveFile.js';
import { CHARACTER_FORMAT, buildPerson, createStage, human, loadCharacter, saveCharacter } from './stage.js';
import '../style.css';
import './kit.css';

// The character designer: every setting of a person as chips, swatches and
// sliders (creator/Creator.js), a turning 3D preview with Still / Walk / Run,
// JSON export / import (the same format as Tiny City Builder), and the result
// kept in this browser for the play demo.

const canvas = document.querySelector('#c');
const stage = createStage(canvas);
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
camera.position.set(2.6, 1.6, 4.2);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.9, 0);
controls.enableDamping = true;
const ground = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24).rotateX(-Math.PI / 2), stage.style.material('sidewalk', 0xd8cdb4));
ground.receiveShadow = true;
stage.scene.add(ground);

const params = loadCharacter();
let person = null, anim = 'Walk';
const gait = createGait();
function rebuild() {
  human.applyRules?.(params);
  setGaitEngine(params.animation);
  if (person) stage.scene.remove(person);
  person = buildPerson(params);
  stage.scene.add(person);
  saveCharacter(params);
}
let last = { ...params };
const toastEl = document.querySelector('#toast');
const toast = (t) => { toastEl.textContent = t; toastEl.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { toastEl.hidden = true; }, 1600); };

const creator = new Creator({
  subject: human,
  params,
  onChange: (key) => { if (key) human.adjust?.(params, key, last[key]); last = { ...params }; rebuild(); },
  actions: {
    randomize: () => { Object.assign(params, human.randomize()); rebuild(); },
    reset: () => { Object.assign(params, defaultsFor(human), human.presets[params.bodyType]); rebuild(); },
    preset: (name) => { Object.assign(params, defaultsFor(human), human.presets[name]); rebuild(); },
    anim: (a) => { anim = a; },
    getAnim: () => anim,
    exportJson: async () => {
      const json = JSON.stringify({ format: CHARACTER_FORMAT, version: 1, params }, null, 1);
      if (!(await saveFile(`character-${String(params.bodyType).toLowerCase()}.json`, json))) { navigator.clipboard?.writeText(json); toast('Copied the JSON instead'); }
    },
    importJson: async () => {
      const text = await openTextFile('.json,application/json');
      if (text == null) return;
      try {
        const d = JSON.parse(text);
        Object.assign(params, defaultsFor(human), d.format === CHARACTER_FORMAT ? d.params : d);
        rebuild(); toast('Character loaded');
      } catch { toast('Not a character file'); }
    },
  },
});
creator.el.hidden = false;
creator.play.hidden = false;
rebuild();
creator.render();
creator.updatePlay?.();

let t0 = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
  // the preview sits left of the panel on wide screens, above it on phones
  const wide = window.innerWidth > window.innerHeight;
  camera.aspect = window.innerWidth / window.innerHeight;
  // wide: the panel is on the right, so the character stands left of centre;
  // narrow (phone): the panel covers the lower part, so the character sits up top, smaller
  camera.fov = wide ? 30 : 58;
  camera.setViewOffset(window.innerWidth, window.innerHeight, wide ? Math.min(200, window.innerWidth * 0.21) : 0, wide ? 0 : window.innerHeight * 0.2, window.innerWidth, window.innerHeight);
  camera.updateProjectionMatrix();
  controls.update();
  const tune = tuneOf(params);
  stepGait(gait, dt, anim === 'Run' ? RUN_SPEED : anim === 'Walk' ? WALK_SPEED : 0, tune);
  if (person) { person.rotation.y = 0; poseGait(person, gait, 'natural', tune); }
  stage.render(camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
