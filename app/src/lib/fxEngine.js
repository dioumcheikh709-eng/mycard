/* Moteur des effets holographiques — indépendant de React.
   React affiche la carte (textes, calques vides) ; ce moteur y accroche les calques dessinés (canvas), suit le doigt
   ou le gyroscope, et anime l'effet à la fréquence de l'écran (120 → 100 → 90 → 60 images/s, puis simplification). */

const AXX = Math.sin(115 * Math.PI / 180), AXY = -Math.cos(115 * Math.PI / 180), DPR = Math.min(3, window.devicePixelRatio || 1);
const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
const HG = document.createElement('canvas'), HS = document.createElement('canvas'), GL = document.createElement('canvas');
const SK = document.createElement('div'), S1 = document.createElement('canvas'), S2 = document.createElement('canvas'), tileImg = new Image();
HG.className = 'hg'; HS.className = 'hs'; GL.className = 'gl'; SK.className = 'spk'; SK.append(S2, S1);
let CW = 320, CH = 533, SPG = null, spkDims = '';

/* grains de paillettes : dessinés une fois à la taille de la carte */
function buildSpark() {
  const key = CW + 'x' + CH + '@' + DPR; if (key === spkDims || !tileImg.complete || !tileImg.naturalWidth) return; spkDims = key;
  const mk = (cv, m, tile) => {
    cv.width = Math.round((CW + 2 * m) * DPR); cv.height = Math.round((CH + 2 * m) * DPR); cv.style.width = (CW + 2 * m) + 'px'; cv.style.height = (CH + 2 * m) + 'px';
    const g = cv.getContext('2d'), tc = document.createElement('canvas'); tc.width = tc.height = Math.round(tile * DPR); tc.getContext('2d').drawImage(tileImg, 0, 0, tc.width, tc.height);
    g.setTransform(1, 0, 0, 1, m * DPR, m * DPR); g.fillStyle = g.createPattern(tc, 'repeat'); g.fillRect(-m * DPR, -m * DPR, cv.width, cv.height);
  };
  mk(S1, 125, 220); mk(S2, 95, 143);
  const Lc = CW * Math.abs(AXX) + CH * Math.abs(AXY), Sw = .44 * Lc, Sh = CW * Math.abs(AXY) + CH * Math.abs(AXX) + 60;
  SK.style.width = Sw + 'px'; SK.style.height = Sh + 'px'; SPG = { Lc, Sw, Sh };
}
tileImg.onload = () => { spkDims = ''; buildSpark(); };
tileImg.src = "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27220%27%20height%3D%27220%27%3E%3Cfilter%20id%3D%27n%27%20x%3D%270%27%20y%3D%270%27%20width%3D%27100%25%27%20height%3D%27100%25%27%3E%3CfeTurbulence%20type%3D%27fractalNoise%27%20baseFrequency%3D%27.85%27%20numOctaves%3D%272%27%20stitchTiles%3D%27stitch%27%2F%3E%3CfeColorMatrix%20values%3D%270%200%200%200%201%200%200%200%200%201%200%200%200%200%201%200%200%2016%200%20-9.6%27%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%27220%27%20height%3D%27220%27%20filter%3D%27url(%23n)%27%2F%3E%3C%2Fsvg%3E";
function sizeFx() { const R = Math.hypot(CW, CH); GL.style.width = GL.style.height = (2 * R) + 'px'; buildSpark(); }

/* calques du holo classique : dessinés une fois (et à chaque changement d'intensité), ensuite seulement déplacés.
   Luminosité, contraste et saturation selon l'intensité k sont calculés ici, comme le ferait un filtre CSS. */
const toneRGB = (r, g, b, k) => {
  const cl = v => Math.max(0, Math.min(1, v)), Br = .55 + k * .2, Co = 1.05 + k * .2, S = .9 + k * .4;
  let c = [r, g, b].map(v => cl(v / 255 * Br)).map(v => cl((v - .5) * Co + .5));
  const M = [[.213 + .787 * S, .715 - .715 * S, .072 - .072 * S], [.213 - .213 * S, .715 + .285 * S, .072 - .072 * S], [.213 - .213 * S, .715 - .715 * S, .072 + .928 * S]];
  c = M.map(m => cl(m[0] * c[0] + m[1] * c[1] + m[2] * c[2])); return c.map(v => Math.round(v * 255));
};
let paintedK = null;
function paintFx(k) {
  k = +k; if (!(k >= 0)) k = 1; if (k === paintedK) return; paintedK = k;
  const th = 115 * Math.PI / 180, dx = Math.sin(th), dy = -Math.cos(th);
  const lin = (cv, w, h, stops) => {
    cv.width = w; cv.height = h; const g = cv.getContext('2d'), L = w * Math.abs(dx) + h * Math.abs(dy), gr = g.createLinearGradient(w / 2 - dx * L / 2, h / 2 - dy * L / 2, w / 2 + dx * L / 2, h / 2 + dy * L / 2);
    stops.forEach(([q, c]) => gr.addColorStop(q, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    try {
      const im = g.getImageData(0, 0, w, h), d = im.data, memo = new Map();
      for (let i = 0; i < d.length; i += 4) { const key = d[i] << 16 | d[i + 1] << 8 | d[i + 2]; let t = memo.get(key); if (!t) { t = toneRGB(d[i], d[i + 1], d[i + 2], k); memo.set(key, t); } d[i] = t[0]; d[i + 1] = t[1]; d[i + 2] = t[2]; }
      g.putImageData(im, 0, 0);
    } catch (e) { /* canvas illisible : couleurs d'origine */ }
  };
  lin(HG, 128, 179, [[0, '#ff6b6b'], [.18, '#ffd86b'], [.36, '#6bffa8'], [.54, '#6bd6ff'], [.72, '#8f7bff'], [.9, '#ff6bd6'], [1, '#ff6b6b']]);
  const bd = .16 / 3; lin(HS, 128, 179, [[.5 - bd, 'rgba(255,255,255,0)'], [.5, '#fff'], [.5 + bd, 'rgba(255,255,255,0)']]);
}
paintFx(1);
GL.width = GL.height = 128;
{ const g = GL.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, '#fff'); r.addColorStop(.25, 'rgba(255,255,255,.333)'); r.addColorStop(.6, 'rgba(255,255,255,0)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }

/* ---------------- état ---------------- */
let card = null, glowEl = null, shEl = null, FX = {}, fxDirty = true, kNow = 1, lastFx = '';
let t = { mx: 50, my: 50, rx: 0, ry: 0, o: 0 }, s = { ...t }, active = false;
const t0 = performance.now();
let gyroOn = false, gyroWanted = false, g0 = null, onGyroData = null;
const listeners = new Set();
const emit = () => listeners.forEach(f => f());

/* ---------------- régulateur de fluidité ----------------
   Mesure la fréquence réelle de l'écran (120 / 100 / 90 / 60, ou 30 si le navigateur bride lui-même), vise d'abord cette
   fréquence, puis descend par étapes (100, 90, 60 images/s) en gardant l'effet complet ; seulement ensuite il simplifie
   l'effet (paliers 1 à 3). Il remonte tout seul quand il a de la marge. */
let lastNow = 0, prevT = performance.now(), idleT = 0, lastRaf = 0, liveRun = 0, fxFrame = 0, stride = 1, fxPending = false, pace = 0, lastActive = performance.now(), saver = false, drawn = 0;
export const gov = { hz: 60, fps: 60, tt: 16.7, ema: 16.7, tier: 0, lvl: 0, levels: [], bad: 0, good: 0, floor: 0, justUp: 0, s: [], n: 0 };
const SAVER_MS = 60000;   /* au repos depuis 1 minute (sans toucher ni gyroscope) : 30 images/s pour ménager la batterie */
function buildLevels() {
  const hz = gov.hz, L = [120, 100, 90, 60].filter(f => f <= hz + 1).map(fps => ({ fps, q: 0 })); if (!L.length) L.push({ fps: hz, q: 0 });
  const low = Math.min(60, hz); [1, 2, 3].forEach(q => L.push({ fps: low, q })); gov.levels = L;
}
export function setLevel(i, save) {
  i = Math.max(0, Math.min(gov.levels.length - 1, i)); const L = gov.levels[i];
  gov.lvl = i; gov.fps = L.fps; gov.tt = 1000 / L.fps; gov.tier = L.q; document.body.dataset.q = L.q; stride = L.q >= 3 ? 3 : L.q === 2 ? 2 : 1; gov.ema = gov.tt; pace = 0;
  fxDirty = true; if (save) { try { localStorage.setItem('mycard-lvl', JSON.stringify({ fps: L.fps, q: L.q })); } catch (e) { /* ignoré */ } }
}
const levelFor = (fps, q) => { const i = gov.levels.findIndex(L => L.fps <= fps && L.q >= q); return i < 0 ? gov.levels.length - 1 : i; };
export function setTier(n, save) { setLevel(levelFor(n > 0 ? 60 : gov.hz, n), save); }
export function setHz(hz) {
  if (hz === gov.hz && gov.levels.length) return; const c = gov.levels[gov.lvl]; gov.hz = hz; buildLevels();
  setLevel(c ? levelFor(Math.min(c.fps, hz), c.q) : 0);
}
export function govern(dt) {
  gov.ema = gov.ema * .9 + dt * .1; if (gov.justUp > 0) gov.justUp--;
  if (gov.ema > gov.tt * 1.3) { gov.bad++; gov.good = 0; } else if (gov.ema < gov.tt * 1.1) { gov.good++; gov.bad = 0; } else { gov.bad = 0; gov.good = 0; }
  if (gov.bad >= Math.round(gov.fps / 4) && gov.lvl < gov.levels.length - 1) { if (gov.justUp > 0) gov.floor = gov.lvl + 1; setLevel(gov.lvl + 1, true); gov.bad = gov.good = 0; }
  else if (gov.good >= gov.fps * 3 && gov.lvl > gov.floor) { setLevel(gov.lvl - 1, true); gov.justUp = gov.fps * 8; gov.bad = gov.good = 0; }
}
buildLevels();
try { const sv = JSON.parse(localStorage.getItem('mycard-lvl') || 'null'); setLevel(sv ? levelFor(sv.fps, sv.q) : 0); } catch (e) { setLevel(0); }

const sv_ = (els, o) => { for (const el of els) if (el) for (const q in o) el.style.setProperty(q, o[q]); };
function applyClassic(fx, o, k, mx, my) {         /* calques pré-dessinés : seulement des transform et des opacités */
  const px = mx / 100 * CW, py = my / 100 * CH;
  if (fx === 'classic' && FX.holo) {
    FX.holo.style.opacity = ((.3 + o * .5) * k).toFixed(3);
    HG.style.transform = 'translate3d(' + (-1.6 * CW * mx / 100).toFixed(1) + 'px,' + (-1.6 * CH * my / 100).toFixed(1) + 'px,0)';
    const d = (mx / 100 - .5) * (CW * Math.abs(AXX) + CH * Math.abs(AXY));
    HS.style.transform = 'translate3d(' + (-CW + d * AXX).toFixed(1) + 'px,' + (-CH + d * AXY).toFixed(1) + 'px,0)';
  }
  if (fx === 'classic' && SPG && FX.sparkle) {     /* paillettes : bande de lumière déplacée, grains fixes (+ léger décalage) */
    const { Lc, Sw, Sh } = SPG, d = (mx / 100 - .5) * Lc, cx = CW / 2 + d * AXX, cy = CH / 2 + d * AXY;
    SK.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0) rotate(25deg) translate(' + (-Sw / 2).toFixed(1) + 'px,' + (-Sh / 2).toFixed(1) + 'px)';
    const tr = (cv, m, fx_, fy_) => { cv.style.transform = 'translate(' + (Sw / 2).toFixed(1) + 'px,' + (Sh / 2).toFixed(1) + 'px) rotate(-25deg) translate(' + (-m + fx_ * mx - cx).toFixed(1) + 'px,' + (-m + fy_ * my - cy).toFixed(1) + 'px)'; };
    tr(S1, 125, -1.2, -1.2); tr(S2, 95, .8, .9);
    FX.sparkle.style.opacity = (o * .9 * k).toFixed(3);
  }
  if (!FX.glare) return;
  const R = Math.hypot(CW, CH), r = Math.hypot(Math.max(px, CW - px), Math.max(py, CH - py));
  FX.glare.style.opacity = ((.25 + o * .5) * k).toFixed(3);
  GL.style.transform = 'translate3d(' + (px - R).toFixed(1) + 'px,' + (py - R).toFixed(1) + 'px,0) scale(' + (r / R).toFixed(3) + ')';
}

/* ---------------- branchement sur la carte affichée ---------------- */
let R = null;
function aim(e) {
  if (!R) R = card.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (e.clientX - R.left) / R.width)), y = Math.min(1, Math.max(0, (e.clientY - R.top) / R.height));
  t = { mx: x * 100, my: y * 100, rx: (0.5 - y) * 26, ry: (x - 0.5) * 26, o: 1 };
}
const onDown = e => { active = true; if (gyroWanted) setGyro(false); document.body.classList.add('touching'); R = card.getBoundingClientRect(); try { card.setPointerCapture(e.pointerId); } catch (_) { /* ignoré */ } aim(e); };
const onMove = e => { active = true; aim(e); };
const onUp = () => { active = false; R = null; document.body.classList.remove('touching'); };
const onResize = () => { R = null; if (card) { CW = card.offsetWidth || CW; CH = card.offsetHeight || CH; sizeFx(); fxDirty = true; } };
addEventListener('resize', onResize); addEventListener('scroll', () => { R = null; }, { passive: true });

/* À appeler après chaque rendu de la carte : remet les calques dessinés dans les calques vides de React. */
export function refresh() {
  if (!card) return;
  const q = s => card.querySelector(s);
  FX = { holo: q('.holo'), sparkle: q('.sparkle'), glare: q('.glare'), revwrap: q('.revwrap'), fxa: q('.fxa'), fxg: q('.fxg') };
  if (FX.holo && HG.parentNode !== FX.holo) FX.holo.append(HG, HS);
  if (FX.glare && GL.parentNode !== FX.glare) FX.glare.append(GL);
  if (FX.sparkle && SK.parentNode !== FX.sparkle) FX.sparkle.append(SK);
  CW = card.offsetWidth || CW; CH = card.offsetHeight || CH; sizeFx(); fxDirty = true;
}
export function attach(el, glow, shadow) {
  if (card === el) { glowEl = glow; shEl = shadow; refresh(); return; }
  detach();
  card = el; glowEl = glow; shEl = shadow; R = null;
  card.addEventListener('pointerdown', onDown); card.addEventListener('pointermove', onMove);
  ['pointerleave', 'pointerup', 'pointercancel'].forEach(n => card.addEventListener(n, onUp));
  refresh();
}
export function detach() {
  if (!card) return;
  card.removeEventListener('pointerdown', onDown); card.removeEventListener('pointermove', onMove);
  ['pointerleave', 'pointerup', 'pointercancel'].forEach(n => card.removeEventListener(n, onUp));
  card = null; glowEl = shEl = null; active = false; FX = {};
}
export function setIntensity(k) { kNow = +k >= 0 ? +k : 1; paintFx(kNow); fxDirty = true; }
export const markDirty = () => { fxDirty = true; };

/* ---------------- gyroscope (téléphone) ---------------- */
export const touchy = matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0;
export const needsAsk = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
const clamp = v => Math.max(-1, Math.min(1, v / 16));
addEventListener('deviceorientation', e => {
  if (!gyroWanted || e.beta == null || e.gamma == null) return;
  const was = gyroOn; gyroOn = true; if (!was) emit();
  if (onGyroData) onGyroData(e.beta, e.gamma);
  if (!g0) g0 = { b: e.beta, g: e.gamma };
  g0.b += (e.beta - g0.b) * .002; g0.g += (e.gamma - g0.g) * .002;   /* le point neutre suit doucement ta posture */
  const dx = clamp(e.gamma - g0.g), dy = clamp(e.beta - g0.b);
  t = { mx: 50 + dx * 50, my: 50 + dy * 50, rx: -dy * 20, ry: dx * 20, o: 1 };
});
/* renvoie 'on' | 'off' | 'denied' | 'error' */
export async function setGyro(on) {
  gyroWanted = on; g0 = null; if (!on) gyroOn = false;
  let r = on ? 'on' : 'off';
  if (on && needsAsk) {
    try { if (await DeviceOrientationEvent.requestPermission() !== 'granted') { gyroWanted = false; r = 'denied'; } }
    catch (err) { gyroWanted = false; r = 'error'; }
  }
  emit(); return r;
}
export const gyroState = () => ({ wanted: gyroWanted, on: gyroOn });
export const onGyro = fn => { onGyroData = fn; };
export const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
export const stats = () => ({ hz: gov.hz, fps: gov.fps, tier: gov.tier, stride, saver, drawn });

/* ---------------- boucle d'animation (une seule pour toute l'appli) ---------------- */
(function loop(now) {
  requestAnimationFrame(loop);
  const rd = now - lastRaf; lastRaf = now;
  const viewing = !!card && card.isConnected && !document.hidden;
  if (!viewing || gov.n < 60) {                          /* images légères (hors carte) : on mesure la vraie fréquence de l'écran */
    if (rd > 2 && rd < 60) { gov.s.push(rd); if (gov.s.length > 60) gov.s.shift(); if (++gov.n % 60 === 0) { const m = [...gov.s].sort((x, y) => x - y)[30]; setHz(m < 9 ? 120 : m < 10.6 ? 100 : m < 12.4 ? 90 : m < 22 ? 60 : 30); } }
  }
  if (!viewing) { liveRun = 0; lastActive = now; return; }
  const live = active || gyroOn; if (live) lastActive = now;
  saver = !live && now - lastActive > SAVER_MS;
  if (saver) { liveRun = 0; if (now - idleT < 33) return; idleT = now; }   /* au repos depuis 1 min : 30 images/s */
  else {
    pace += Math.min(rd, 100); if (pace + 1.5 < gov.tt) return; pace = Math.min(pace - gov.tt, gov.tt);   /* rythme visé */
    if (liveRun > 0) { const dt = now - lastNow; if (dt > 0 && dt < 200) govern(dt); } liveRun++;
  }
  lastNow = now; drawn++;
  if (!live) {
    const kk = calm ? 0 : (now - t0) / 1600;
    t = { mx: 50 + Math.sin(kk) * 40, my: 50 + Math.cos(kk * .8) * 30, rx: Math.cos(kk * .8) * 6, ry: Math.sin(kk) * 8, o: .35 };
  }
  const base = gyroOn && !active ? .4 : .14, f = 1 - Math.pow(1 - base, Math.min(4, (now - prevT) / 16.7)); prevT = now; let moved = 0;
  for (const key in s) { const d = t[key] - s[key]; s[key] += d * f; moved += Math.abs(d); }
  const fx = card.dataset.fx; if (fx !== lastFx) { lastFx = fx; fxDirty = true; }
  if (moved > .003 || fxDirty || fxPending) {
    card.style.transform = 'rotateX(' + s.rx.toFixed(2) + 'deg) rotateY(' + s.ry.toFixed(2) + 'deg)';   /* inclinaison : toujours à la cadence visée */
    if (glowEl) glowEl.style.opacity = (s.o * .8).toFixed(2);
    if (shEl) {
      const dd = Math.min(1, Math.hypot(s.mx - 50, s.my - 50) / 50);
      shEl.style.transform = 'translate(' + (-(s.mx - 50) * .5).toFixed(1) + 'px,' + (22 - (s.my - 50) * .3).toFixed(1) + 'px) scale(' + (1 + dd * .06).toFixed(3) + ')';
      shEl.style.opacity = (.95 - dd * .3).toFixed(2);
    }
    const force = fxDirty;
    if (force) { const w = card.offsetWidth, h = card.offsetHeight; if (w && (w !== CW || h !== CH)) { CW = w; CH = h; sizeFx(); } }
    if (force || ++fxFrame % stride === 0) {
      fxDirty = false; fxPending = false;
      if (fx === 'classic' || fx === 'reverse') applyClassic(fx, s.o, kNow, s.mx, s.my);
      if (fx === 'reverse') sv_([FX.revwrap], { '--mx': s.mx.toFixed(2), '--my': s.my.toFixed(2), '--o': s.o.toFixed(3) });
      else sv_([FX.fxa, FX.fxg], { '--px': (s.mx / 100).toFixed(3), '--py': (s.my / 100).toFixed(3), '--pd': Math.min(1, Math.hypot(s.my - 50, s.mx - 50) / 50).toFixed(3), '--po': s.o.toFixed(3) });
    } else fxPending = true;
  }
})(t0);
