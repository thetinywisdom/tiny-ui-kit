import * as THREE from 'three';
import { CityInput } from '../controls/input.js';
import { ActionPad, PAD_LAYOUTS } from '../ui/actionPad.js';
import { PixelOverlay } from '../ui/pixelOverlay.js';
import { createGait, landGait, poseGait, stepGait, tuneOf, setGaitEngine } from '../anim/gait.js';
import { buildPerson, createStage, loadCharacter, randomCharacter } from './stage.js';
import '../style.css';
import './kit.css';

// A starting point for a game: your character (from the designer) in a small
// park with a few townspeople, the walk joystick + keyboard, the action
// buttons (ui/actionPad.js: USE, SLAP, PUSH, TALK, FART, JUMP, PEEL, RUN) and
// the pixel speech / hit bursts (ui/pixelOverlay.js). The reactions here are
// deliberately simple (a spin, a fall, a line of speech): replace them with
// your game's own. Keyboard: WASD / arrows, Shift run, E use, 1-4 slap / push
// / talk / fart (hold 1 to charge), Space jump, B banana peel.

const D = Math.PI / 180;
const canvas = document.querySelector('#c');
const stage = createStage(canvas);
const { scene, style } = stage;
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
const cam = { yaw: Math.PI, pitch: 0.32, dist: 6 };

// --- a little park -----------------------------------------------------------
const grass = new THREE.Mesh(new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2), style.material('grass'));
grass.receiveShadow = true;
scene.add(grass);
const path = new THREE.Mesh(new THREE.PlaneGeometry(3, 60).rotateX(-Math.PI / 2), style.material('sidewalk', 0xd8cdb4));
path.position.y = 0.01; scene.add(path);
const solid = [];
for (const [x, z, w, d, h, col] of [[-6, -4, 2, 2, 1, 0xd8443c], [7, 3, 1.5, 3, 0.8, 0x3f7fd6], [-8, 8, 3, 1, 1.4, 0xf2c230], [5, -9, 2, 2, 2, 0x6fbf5f]]) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), style.material('signage', col));
  m.position.set(x, h / 2, z); m.castShadow = true; scene.add(m);
  solid.push({ x, z, hw: w / 2, hd: d / 2 });
}
const pushOut = (pos, r) => {
  for (const c of solid) {
    const dx = pos.x - c.x, dz = pos.z - c.z, cx = Math.max(-c.hw, Math.min(c.hw, dx)), cz = Math.max(-c.hd, Math.min(c.hd, dz));
    const ox = dx - cx, oz = dz - cz, d = Math.hypot(ox, oz);
    if (d < r && d > 1e-5) { pos.x += (ox / d) * (r - d); pos.z += (oz / d) * (r - d); }
  }
  pos.x = Math.max(-28, Math.min(28, pos.x)); pos.z = Math.max(-28, Math.min(28, pos.z));
};

// --- people ------------------------------------------------------------------
const look = loadCharacter();
setGaitEngine(look.animation);
const makeWho = (p, x, z) => {
  const root = new THREE.Group(), body = buildPerson(p);
  root.add(body); root.position.set(x, 0, z); scene.add(root);
  return { root, body, x, z, heading: Math.random() * 6.28, speed: 0, gait: createGait(), tune: tuneOf(p), height: p.height ?? 1.7, look: p };
};
const player = makeWho(look, 0, 0);
player.heading = Math.PI;
const LINES = [['Nice day, isn\'t it?', 'Lovely!'], ['Have you seen my cat?', 'Sorry, no.'], ['I like your shoes.', 'Thanks!'], ['Where is the station?', 'Over that way.']];
const npcs = [];
for (let i = 0; i < 7; i++) {
  const a = (i / 7) * Math.PI * 2, r = 5 + (i % 3) * 3;
  const n = makeWho(randomCharacter(), Math.sin(a) * r, Math.cos(a) * r);
  n.home = { x: n.x, z: n.z }; n.to = null; n.wait = Math.random() * 3;
  npcs.push(n);
}

// --- speech and bursts (drawn by the pixel overlay) ---------------------------
const bubbles = [];
let nextId = 0;
const headOf = (who) => { const f = () => new THREE.Vector3(who.root.position.x, who.root.position.y + who.height + 0.25, who.root.position.z); f.who = who; return f; };
const say = (who, text, kind = 'talk', delay = 0) => bubbles.push({ anchor: headOf(who), text, kind, age: -delay, life: kind === 'burst' ? 0.9 : 3, id: nextId++ });

// --- input: keyboard, drag to look, the joystick, the action buttons -----------
const input = new CityInput(canvas, document.querySelector('#joystick'));
input.active = true;
const pad = new ActionPad(document.querySelector('#cityActions'), input);
const padBtn = document.querySelector('#padBtn');
const showPad = () => { padBtn.innerHTML = `🎮<span> ${pad.layout}</span>`; };
showPad();
padBtn.onclick = () => { pad.setLayout(PAD_LAYOUTS[(PAD_LAYOUTS.indexOf(pad.layout) + 1) % PAD_LAYOUTS.length]); showPad(); };
const pixels = new PixelOverlay(document.querySelector('#overlay'));

// who the buttons act on: the nearest person in front of you (up to 7 m)
function target() {
  const hx = Math.sin(player.heading), hz = Math.cos(player.heading);
  let best = null, bs = Infinity;
  for (const n of npcs) {
    if (n.down > 0) continue;
    const dx = n.x - player.x, dz = n.z - player.z, d = Math.hypot(dx, dz);
    if (d > 7) continue;
    const dot = (dx * hx + dz * hz) / (d || 1);
    if (dot < -0.1 && d > 1.2) continue;
    const s = d * (1.6 - dot);
    if (s < bs) { bs = s; best = n; }
  }
  return best;
}
const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd23f }));
ring.position.y = 0.02; scene.add(ring);

// what each action does (simple on purpose: put your game's here)
let goal = null, charge = null;
const peels = [];
function act(kind, who) {
  if (!who) return;
  if (Math.hypot(who.x - player.x, who.z - player.z) > (kind === 'talk' ? 1.6 : 1.1)) { goal = { kind, who }; return; } // run over first
  goal = null;
  player.heading = Math.atan2(who.x - player.x, who.z - player.z);
  if (kind === 'talk') { const [a, b] = LINES[Math.floor(Math.random() * LINES.length)]; say(player, a); say(who, b, 'talk', 1.2); who.face = player; }
  if (kind === 'slap' || kind === 'powerslap') { say(who, kind === 'powerslap' ? 'SMAAACK!!' : 'SLAP!', 'burst'); who.spin = kind === 'powerslap' ? 3 : 1; say(who, 'OW!', 'shout', 0.5); }
  if (kind === 'push') { say(who, 'SHOVE!', 'burst'); who.down = 2.5; who.kb = { x: Math.sin(player.heading) * 3, z: Math.cos(player.heading) * 3 }; }
}
function handle(ev) {
  if (ev.type === 'jump') { if (!(player.jumpY > 0)) { player.vy = 4.4; player.jumpY = 0.001; } return; }
  if (ev.type === 'banana') {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.035, 4, 8, Math.PI), style.material('signage', 0xf2c230));
    m.rotation.x = -Math.PI / 2; m.position.set(player.x - Math.sin(player.heading) * 0.6, 0.04, player.z - Math.cos(player.heading) * 0.6);
    scene.add(m); peels.push(m); return;
  }
  if (ev.type === 'chargeCancel') { charge = null; return; } // held, then dragged the camera
  if (ev.type === 'chargeStart') { if (ev.x !== undefined) return; const t = target(); if (t) charge = { t: 0, who: t }; return; } // a mouse hold on the ground is not a slap (only the SLAP button / key 1)
  if (ev.type === 'chargeEnd') { if (charge) act(charge.t > 1.6 ? 'powerslap' : 'slap', charge.who); charge = null; return; }
  if (ev.type === 'choose') {
    if (ev.n === 3) { say(player, 'PFFT!', 'burst'); for (const n of npcs) if (Math.hypot(n.x - player.x, n.z - player.z) < 3.5) { say(n, 'EWW!', 'shout', 0.3); n.down = 2; } return; }
    act(['slap', 'push', 'talk'][ev.n], target());
    return;
  }
  if (ev.type === 'primary') act('talk', target());
}

// --- the loop -------------------------------------------------------------------
let t0 = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
  const look = input.takeLook();
  cam.yaw += look.yaw; cam.pitch = Math.max(0.05, Math.min(1.2, cam.pitch + look.pitch)); cam.dist = Math.max(3, Math.min(14, cam.dist + look.zoom * 0.6));
  for (const ev of input.takeEvents()) handle(ev);
  if (charge) charge.t += dt;

  // you: move relative to the camera, speed builds up, Shift / RUN runs
  const a = input.axes();
  const fwd = { x: -Math.sin(cam.yaw), z: -Math.cos(cam.yaw) }, right = { x: -fwd.z, z: fwd.x };
  let mx = right.x * a.x - fwd.x * a.z, mz = right.z * a.x - fwd.z * a.z;
  if (Math.hypot(mx, mz) > 0.05) goal = null;
  if (goal) { mx = goal.who.x - player.x; mz = goal.who.z - player.z; if (Math.hypot(mx, mz) < 1.0) act(goal.kind, goal.who); }
  const moving = Math.hypot(mx, mz) > 0.05;
  const want = moving ? (a.run || goal ? 4.6 : 1.6) : 0;
  player.speed += Math.sign(want - player.speed) * Math.min(Math.abs(want - player.speed), (want < player.speed ? 9 : player.speed < 1.6 ? 6 : 1.7) * dt);
  if (moving) {
    let d = Math.atan2(mx, mz) - player.heading; d = Math.atan2(Math.sin(d), Math.cos(d));
    player.heading += d * Math.min(1, dt * 10);
    const l = Math.hypot(mx, mz); player.x += (mx / l) * player.speed * dt; player.z += (mz / l) * player.speed * dt;
  }
  pushOut(player, 0.3);
  for (const n of npcs) { const dx = player.x - n.x, dz = player.z - n.z, d = Math.hypot(dx, dz); if (d < 0.6 && d > 1e-4) { player.x += dx / d * (0.6 - d); player.z += dz / d * (0.6 - d); } }
  if (player.jumpY > 0 || player.vy) { player.vy -= 13 * dt; player.jumpY = Math.max(0, player.jumpY + player.vy * dt); if (player.jumpY === 0 && player.vy < 0) { landGait(player.gait, player.vy); player.vy = 0; } }
  player.root.position.set(player.x, player.jumpY ?? 0, player.z);
  player.root.rotation.y = player.heading;
  stepGait(player.gait, dt, player.speed, player.tune);
  poseGait(player.body, player.gait, 'natural', player.tune);

  // townspeople: stroll between spots near home; spin when slapped, fall when pushed
  for (const n of npcs) {
    let speed = 0;
    if (n.down > 0) {
      n.down -= dt;
      if (n.kb) { n.x += n.kb.x * dt; n.z += n.kb.z * dt; n.kb.x *= 1 - dt * 3; n.kb.z *= 1 - dt * 3; }
      n.body.rotation.x = -Math.min(1, (2.5 - n.down) * 4) * 1.45 * Math.min(1, n.down * 2);
      n.root.position.set(n.x, 0, n.z); continue;
    }
    if (n.spin > 0) { n.root.rotation.y += dt * 18; n.spin -= dt * 2.5; }
    else if (n.face) { n.root.rotation.y = Math.atan2(n.face.x - n.x, n.face.z - n.z); if ((n.faceT = (n.faceT ?? 3) - dt) < 0) { n.face = null; n.faceT = 3; } }
    else {
      if (!n.to && (n.wait -= dt) < 0) n.to = { x: n.home.x + (Math.random() - 0.5) * 8, z: n.home.z + (Math.random() - 0.5) * 8 };
      if (n.to) {
        const dx = n.to.x - n.x, dz = n.to.z - n.z, d = Math.hypot(dx, dz);
        if (d < 0.2) { n.to = null; n.wait = 2 + Math.random() * 4; } else { speed = 1.2; n.x += dx / d * speed * dt; n.z += dz / d * speed * dt; n.root.rotation.y = Math.atan2(dx, dz); }
      }
      // banana peels: step on one and over you go
      for (const pl of peels) if (Math.hypot(pl.position.x - n.x, pl.position.z - n.z) < 0.35) { scene.remove(pl); peels.splice(peels.indexOf(pl), 1); say(n, 'WHOA!', 'burst'); n.down = 2.5; n.kb = { x: Math.sin(n.root.rotation.y) * 2, z: Math.cos(n.root.rotation.y) * 2 }; break; }
    }
    pushOut(n, 0.3);
    n.root.position.set(n.x, 0, n.z);
    stepGait(n.gait, dt, speed, n.tune);
    poseGait(n.body, n.gait, 'natural', n.tune);
  }

  // the ring under whoever the buttons would act on
  const tg = charge?.who ?? target();
  ring.visible = !!tg; if (tg) ring.position.set(tg.x, 0.02, tg.z);

  // camera: behind and above you
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
  const cp = Math.cos(cam.pitch);
  camera.position.set(player.x + Math.sin(cam.yaw) * cam.dist * cp, 1.4 + Math.sin(cam.pitch) * cam.dist, player.z + Math.cos(cam.yaw) * cam.dist * cp);
  camera.lookAt(player.x, 1.2, player.z);
  const { W, H } = stage.render(camera);

  // the pixel layer: speech, bursts, the slap dial, the buttons and the joystick
  const px = Math.max(1, Math.round(style.pixelScale || 2));
  const toScreen = (v) => { const s = v.clone().project(camera); return { x: (s.x + 1) / 2 * W, y: (1 - s.y) / 2 * H, ok: s.z < 1 }; };
  const speech = [], bursts = [];
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i]; b.age += dt;
    if (b.age > b.life) { bubbles.splice(i, 1); continue; }
    if (b.age < 0) continue;
    const at = b.anchor(), s = toScreen(at);
    if (!s.ok) continue;
    s.dist = Math.hypot(at.x - player.x, at.z - player.z);
    (b.kind === 'burst' ? bursts : speech).push({ b, s });
  }
  let dial = null;
  if (charge) {
    const f1 = Math.min(1, charge.t / 0.8), second = charge.t > 0.8, f = second ? Math.min(1, (charge.t - 0.8) / 0.8) : f1;
    dial = { f, col: second ? 'rgb(232,64,47)' : 'rgb(255,210,63)', grow: second ? f : 0, shake: charge.t > 1.6, s: toScreen(headOf(charge.who)().add(new THREE.Vector3(0, 0.45, 0))) };
  }
  const touch = matchMedia('(pointer: coarse)').matches || W < 900;
  const joyEl = document.querySelector('#joystick');
  joyEl.hidden = !touch;
  pad.place(W, H, { touch, riding: false, joy: touch ? joyEl.getBoundingClientRect() : null });
  const tiles = pad.tiles({ riding: false, target: tg }).map((t) => { const x = Math.round(t.x / px), y = Math.round(t.y / px); return { ...t, x, y, s: Math.round((t.x + t.s) / px) - x }; });
  let stick = null;
  if (touch) {
    const r = joyEl.getBoundingClientRect(), k = joyEl.querySelector('.knob').getBoundingClientRect();
    stick = { cx: Math.round((r.left + r.width / 2) / px), cy: Math.round((r.top + r.height / 2) / px), r: Math.round(r.width / 2 / px), kx: Math.round((k.left + k.width / 2) / px), ky: Math.round((k.top + k.height / 2) / px), kr: Math.round(k.width / 2 / px), active: input.move.x !== 0 || input.move.z !== 0 };
  }
  pixels.draw({ W, H, px, speech, bursts, charge: dial, menu: null, pad: tiles, showKeys: !touch, stick });
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
say(player, 'Walk up to someone and try the buttons!', 'talk', 0.5);
