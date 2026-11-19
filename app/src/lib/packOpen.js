/* Ouverture d'un booster (plein écran) : invocation, six façons de déchirer le pack, quatre façons de sortir une carte,
   étincelles et éclairs aux couleurs de la chance. Code d'animation repris de la version d'origine, sans React. */
import { tr } from './i18n.js';
import { rarOf, rarName, rarIdx, esc } from './cards.js';
import { hex2rgb, flashOf } from './shop.js';

const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
const wait = ms => new Promise(r => setTimeout(r, calm ? 0 : ms));
const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* ignoré */ } };
const pickOf = (list, not) => { const l = list.filter(x => x !== not); return l[Math.floor(Math.random() * l.length)]; };
const DUR = ms => calm ? 1 : ms, an = (el, kf, o) => el.animate(kf, { fill: 'forwards', ...o }), rnd = (a, b) => a + Math.random() * (b - a);

/* ---- le pack : un seul dessin, copié sur deux calques découpés le long de la déchirure ---- */
const NOISE = (() => { try { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), d = g.createImageData(128, 128); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); return c.toDataURL(); } catch (e) { return ''; } })();
const CREASE = 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 180" preserveAspectRatio="none"><g fill="none" stroke-linecap="round"><g stroke="#fff" stroke-opacity=".55" stroke-width=".6"><path d="M4 12L30 30M96 14L70 34M6 168L28 150M95 166L72 148M12 60Q30 66 50 58M88 112Q66 106 48 116M20 96L42 88M80 70L58 80"/></g><g stroke="#000" stroke-opacity=".5" stroke-width=".7"><path d="M5 14L31 32M95 16L69 36M7 166L29 148M94 164L71 146M12 62Q30 68 50 60M88 114Q66 108 48 118M20 98L42 90M80 72L58 82"/></g></g></svg>') + '")';
document.documentElement.style.setProperty('--noise', NOISE ? 'url(' + NOISE + ')' : 'none'); document.documentElement.style.setProperty('--crease', CREASE);
const ZZ = [...Array(17)].map((_, i) => [i / 16 * 100, 15 + (i % 2 ? 1.1 : -1.1)]), zp = p => p[0].toFixed(2) + '% ' + p[1].toFixed(2) + '%', poly = pts => 'polygon(' + pts.map(zp).join(',') + ')';
const OV = .35, CLIP_TOP = poly([[0, 0], [100, 0], ...[...ZZ].reverse()]), CLIP_MAIN = poly([...ZZ.map(p => [p[0], p[1] - OV]), [100, 100], [0, 100]]);
const SLASH = { top: poly([[0, 0], [100, 0], [100, 6], [0, 22]]), main: poly([[0, 22 - OV], [100, 6 - OV], [100, 100], [0, 100]]), pts: [[0, 22], [100, 6]] };
const ART_CLIP = (() => {
  const T = 36, pin = t => 1.3 * (1 - Math.sin(Math.PI * t)), q = n => n.toFixed(2), p = [];
  for (let i = 0; i <= T; i++) p.push(q(pin(0) + (100 - 2 * pin(0)) * i / T) + '% ' + (i % 2 ? '0.9%' : '0%'));
  for (let k = 1; k <= 10; k++) p.push(q(100 - pin(k / 10)) + '% ' + q(k * 10) + '%');
  for (let i = T; i >= 0; i--) p.push(q(pin(1) + (100 - 2 * pin(1)) * i / T) + '% ' + (i % 2 ? '99.1%' : '100%'));
  for (let k = 9; k >= 1; k--) p.push(q(pin(k / 10)) + '% ' + q(k * 10) + '%');
  return 'polygon(' + p.join(',') + ')';
})();
export const packArt = '<div class="pk-art"><div class="pk-fan"><i></i><i></i><i></i><b>✦</b></div><div class="pk-logo">MyCard</div><div class="pk-sub">BOOSTER</div><div class="pk-five">5 CARDS</div><i class="pk-foil"></i><i class="pk-noise"></i><i class="pk-crease"></i><i class="pk-vol"></i><i class="pk-spec"></i><i class="pk-crimp"></i><i class="pk-crimp b"></i></div>';
export const packHTML = split => split ? `<div class="pk-shaker"><div class="pk-layer main">${packArt}</div><div class="pk-layer top">${packArt}</div><i class="pk-burst"></i></div>` : `<div class="pk-layer">${packArt}</div>`;
export const setPackVars = (el, top, main) => { el.style.setProperty('--art-clip', ART_CLIP); el.style.setProperty('--clip-top', top || CLIP_TOP); el.style.setProperty('--clip-main', main || CLIP_MAIN); };

/* effets de lumière : étincelles en spirale (invocation) et gerbes (déchirure, révélations) */
function particles(cv) {
  const g = cv.getContext('2d'); let W = 0, H = 0, D = 1, P = [], run = false, rgb = [255, 255, 255], amb = 0, last = 0, acc = 0;
  const size = () => { D = Math.min(2, window.devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = Math.round(W * D); cv.height = Math.round(H * D); };
  function frame(t) {
    if (!run) return; requestAnimationFrame(frame);
    const dt = Math.min(.05, (t - last) / 1e3 || .016); last = t; g.setTransform(D, 0, 0, D, 0, 0); g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
    acc += amb * dt; while (acc >= 1 && P.length < 500) { acc--; P.push({ s: 1, a: Math.random() * 6.283, r: 30 + Math.random() * 120, x: W / 2, y: H * .56 + Math.random() * H * .1, vy: -(70 + Math.random() * 150), w: (Math.random() < .5 ? -1 : 1) * (1.2 + Math.random() * 2), l: 0, ttl: 1.8 + Math.random() * 1.4, z: 1 + Math.random() * 2.2 }); }
    P = P.filter(p => {
      p.l += dt; if (p.l >= p.ttl) return false; const k = p.l / p.ttl; let x, y;
      if (p.s) { p.a += p.w * dt; p.y += p.vy * dt; x = W / 2 + Math.cos(p.a) * p.r * (1 - k * .35); y = p.y; }
      else { p.vy += p.gy * dt; p.x += p.vx * dt; p.y += p.vy * dt; x = p.x; y = p.y; }
      const al = p.s ? Math.sin(Math.PI * k) * .9 : (1 - k) * (1 - k);
      g.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${al * .25})`; g.beginPath(); g.arc(x, y, p.z * 4, 0, 6.283); g.fill();
      g.fillStyle = `rgba(255,255,255,${al * .9})`; g.beginPath(); g.arc(x, y, p.z * 1.1, 0, 6.283); g.fill(); return true;
    });
  }
  return {
    start(c, rate) { rgb = c; amb = calm ? rate * .15 : rate; P = []; acc = 0; size(); if (!run) { run = true; last = performance.now(); requestAnimationFrame(frame); } },
    rate(r) { amb = calm ? r * .15 : r; },
    burst(x, y, c, n, v) { if (calm) n = Math.round(n / 6); for (let i = 0; i < n && P.length < 600; i++) { const a = Math.random() * 6.283, s = (.35 + Math.random()) * v; P.push({ s: 0, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - v * .25, gy: 260, l: 0, ttl: .7 + Math.random() * .9, z: 1 + Math.random() * 2.4 }); } if (c) rgb = c; },
    stop() { run = false; P = []; g.clearRect(0, 0, W, H); },
  };
}

const TEAR_KINDS = ['strip', 'fall', 'unzip', 'shatter', 'split', 'slash']; let lastTear = '';
const REVEAL_KINDS = ['rise', 'flip', 'slam', 'spin']; let lastRev = '';
const TX = (y, s, ry, rz) => `translate(-50%,${y}%) scale(${s}) rotateY(${ry || 0}deg) rotateZ(${rz || 0}deg)`;
const REVEALS = {
  rise: { dur: 900, at: .88, z: .5, kf: [{ transform: TX(-50, .45) }, { transform: TX(-92, .5), offset: .5 }, { transform: TX(-58, 1) }] },
  flip: { dur: 1200, at: .9, z: .4, kf: [{ transform: TX(-50, .45, 180) }, { transform: TX(-92, .5, 180), offset: .4 }, { transform: TX(-72, .85, 90), offset: .72 }, { transform: TX(-58, 1, 0) }] },
  slam: { dur: 800, at: .55, z: 0, kf: [{ transform: TX(-300, 1.7, 0, -10) }, { transform: TX(-58, 1), offset: .55 }, { transform: TX(-52, .95), offset: .72 }, { transform: TX(-58, 1) }] },
  spin: { dur: 1050, at: .9, z: .42, kf: [{ transform: TX(-50, .45, 0) }, { transform: TX(-92, .5, 360), offset: .42 }, { transform: TX(-58, 1, 720) }] },
};

/* Lance l'ouverture dans `root` (structure rendue par PackOpening.jsx). data : {cards,res,urls,luck,rgb,gain}. */
export function runPack(root, data, opts) {
  const $ = s => root.querySelector(s);
  const fx = particles($('.pk-fx'));
  const pk = { on: true, stage: 'summon', idx: 0, cur: null, until: Date.now() + 1e9, tear: '', ...data };
  const pack = $('.pk-stage .pk-pack');
  const pkFlash = (col, o) => { const f = $('.pk-flash'); f.style.setProperty('--fc', col); f.style.setProperty('--fo', o); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); };
  const pkCenter = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const pkAt = (px, py) => { const r = pack.getBoundingClientRect(); return [r.left + r.width * px / 100, r.top + r.height * py / 100]; };
  const pkHint = k => { $('.pk-hint').textContent = k ? tr(k) : ''; };
  const shake = () => { const w = $('.pk-world'); w.classList.remove('shake'); void w.offsetWidth; w.classList.add('shake'); };
  const piece = (pts, origin) => { const d = document.createElement('div'); d.className = 'pk-layer'; d.innerHTML = packArt; d.style.clipPath = poly(pts); d.style.transformOrigin = origin || '50% 15%'; return d; };
  const PRELUDE = {
    shake: sh => an(sh, [{ transform: 'none' }, { transform: 'translate(-5px,2px) rotate(-3deg)' }, { transform: 'translate(6px,-2px) rotate(3deg)' }, { transform: 'translate(-6px,3px) rotate(-4deg)' }, { transform: 'translate(6px,-3px) rotate(4deg)' }, { transform: 'translate(-3px,1px) rotate(-1.5deg)' }, { transform: 'none' }], { duration: DUR(420), easing: 'linear' }).finished,
    pull: sh => an(sh, [{ transform: 'none' }, { transform: 'translateY(9px) scale(.965)', offset: .55 }, { transform: 'translateY(-6px) scale(1.03)' }], { duration: DUR(420), easing: 'ease-in-out' }).finished,
    swell: sh => an(sh, [{ transform: 'none', filter: 'brightness(1)' }, { transform: 'scale(1.07)', filter: 'brightness(1.7)', offset: .8 }, { transform: 'scale(1.1)', filter: 'brightness(2.5)' }], { duration: DUR(520), easing: 'ease-in' }).finished,
    slash: async sh => {
      const s = document.createElement('i'); s.className = 'pk-slash'; s.style.transform = 'rotate(-16deg) scaleX(0)'; sh.append(s);
      await an(s, [{ transform: 'rotate(-16deg) scaleX(0)', opacity: 1 }, { transform: 'rotate(-16deg) scaleX(1)', opacity: 1, offset: .7 }, { transform: 'rotate(-16deg) scaleX(1)', opacity: 0 }], { duration: DUR(300), easing: 'ease-out' }).finished; s.remove();
    },
  };
  const TEARS = {
    strip: { pre: 'shake', run(top) { an(top, [{ transform: 'none', opacity: 1 }, { transform: 'rotate(-9deg) translate(2%,-3%)', opacity: 1, offset: .28 }, { transform: 'translate(78%,-250%) rotate(-48deg)', opacity: 0 }], { duration: DUR(760), easing: 'cubic-bezier(.5,0,.8,.5)' }); return 650; } },
    fall: { pre: 'pull', run(top) { top.style.transformOrigin = '0% 15%'; an(top, [{ transform: 'none', offset: 0 }, { transform: 'rotate(-26deg) translateY(-5%)', offset: .28 }, { transform: 'rotate(-100deg) translate(2%,-8%)', offset: .55 }, { transform: 'rotate(-178deg) translate(-8%,300%)', opacity: 1, offset: .9 }, { transform: 'rotate(-205deg) translate(-10%,420%)', opacity: 0, offset: 1 }], { duration: DUR(1150), easing: 'ease-in' }); return 850; } },
    unzip: { pre: 'shake', run(top, sh) {
      top.style.visibility = 'hidden';
      for (let k = 0; k < 8; k++) {
        const x0 = ZZ[2 * k][0], pts = [[x0, 0], [ZZ[2 * k + 2][0], 0], ZZ[2 * k + 2], ZZ[2 * k + 1], ZZ[2 * k]], p = piece(pts, x0 + '% 15%'); sh.append(p);
        an(p, [{ transform: 'none', opacity: 1 }, { transform: 'rotate(-38deg) translate(0,-16%)', opacity: 1, offset: .45 }, { transform: 'rotate(-88deg) translate(6%,-60%)', opacity: 0 }], { duration: DUR(560), delay: DUR(k * 80), easing: 'cubic-bezier(.4,0,.9,.6)' });
        setTimeout(() => { if (pk.on) { const [x, y] = pkAt(x0 + 6, 15); fx.burst(x, y, pk.rgb, 16, 260); } }, calm ? 0 : k * 80);
      }
      return 8 * 80 + 500;
    } },
    shatter: { pre: 'swell', run(top, sh) {
      top.style.visibility = 'hidden';
      for (let i = 0; i < 16; i++) {
        const p = piece([[ZZ[i][0], 0], [ZZ[i + 1][0], 0], ZZ[i + 1], ZZ[i]], ((ZZ[i][0] + ZZ[i + 1][0]) / 2) + '% 8%'), dx = (((ZZ[i][0] + ZZ[i + 1][0]) / 2) - 50) * 5 + rnd(-40, 40), dy = -rnd(120, 300), r = rnd(-540, 540); sh.append(p);
        an(p, [{ transform: 'none', opacity: 1 }, { transform: `translate(${dx * .7}px,${dy}px) rotate(${r * .6}deg)`, opacity: 1, offset: .5 }, { transform: `translate(${dx}px,${dy + 520}px) rotate(${r}deg)`, opacity: 0 }], { duration: DUR(rnd(850, 1200)), easing: 'cubic-bezier(.2,.6,.4,1)' });
      }
      return 700;
    } },
    split: { pre: 'swell', run(top, sh) {
      top.style.visibility = 'hidden';
      const L = piece([[0, 0], [50, 0], ...ZZ.slice(0, 9).reverse()], '0% 15%'), R = piece([[50, 0], [100, 0], ...ZZ.slice(8).reverse()], '100% 15%'); sh.append(L, R);
      an(L, [{ transform: 'none', opacity: 1 }, { transform: 'rotate(-64deg)', opacity: 1, offset: .5 }, { transform: 'rotate(-100deg) translate(-14%,-20%)', opacity: 0 }], { duration: DUR(900), easing: 'cubic-bezier(.3,1.3,.5,1)' });
      an(R, [{ transform: 'none', opacity: 1 }, { transform: 'rotate(64deg)', opacity: 1, offset: .5 }, { transform: 'rotate(100deg) translate(14%,-20%)', opacity: 0 }], { duration: DUR(900), easing: 'cubic-bezier(.3,1.3,.5,1)' }); return 800;
    } },
    slash: { pre: 'slash', cut: SLASH, run(top) { top.style.transformOrigin = '50% 14%'; an(top, [{ transform: 'none', opacity: 1 }, { transform: 'translate(40%,-12%) rotate(-3deg)', opacity: 1, offset: .3 }, { transform: 'translate(125%,-22%) rotate(-10deg)', opacity: 1, offset: .6 }, { transform: 'translate(170%,300%) rotate(28deg)', opacity: 0 }], { duration: DUR(1000), easing: 'ease-in' }); return 750; } },
  };

  async function summon() {
    root.style.setProperty('--lc-rgb', pk.rgb.join(',')); root.style.setProperty('--lc', `rgb(${pk.rgb.join(',')})`); root.style.setProperty('--cy', '15%');
    pack.className = 'pk-pack'; pack.innerHTML = packHTML(true); setPackVars(pack);
    void root.offsetWidth; root.classList.add('on'); root.focus({ preventScroll: true });
    fx.start(pk.rgb, 30 + 120 * pk.luck);
    await wait(2000); if (!pk.on) return;
    const r = pack.getBoundingClientRect(); pkFlash(`rgb(${pk.rgb})`, .3); fx.burst(r.left + r.width / 2, r.bottom, pk.rgb, 70, 340); buzz(20);   /* l'impact quand le pack se pose */
    await wait(300); if (!pk.on) return;
    pk.stage = 'ready'; pk.until = 0; pkHint('drop.tapOpen'); opts.onStage && opts.onStage('ready');
  }
  async function tear() {
    pk.stage = 'torn'; pk.until = Date.now() + 1500;
    const kind = pickOf(TEAR_KINDS, lastTear), T = TEARS[kind]; lastTear = kind; pk.tear = kind;
    const sh = $('.pk-shaker'), top = sh.querySelector('.pk-layer.top'), cut = T.cut || { top: CLIP_TOP, main: CLIP_MAIN, pts: ZZ };
    setPackVars(pack, cut.top, cut.main); root.style.setProperty('--cy', kind === 'slash' ? '14%' : '15%'); sh.querySelector('.pk-burst').style.transform = kind === 'slash' ? 'rotate(-16deg)' : '';
    pkHint(''); buzz([15, 30, 15]);
    await PRELUDE[T.pre](sh); if (!pk.on) return; sh.getAnimations().forEach(a => a.cancel());
    sh.insertAdjacentHTML('beforeend', `<svg class="pk-edge" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${cut.pts.map(p => p[0].toFixed(2) + ',' + p[1].toFixed(2)).join(' ')}" fill="none" stroke="#fff" stroke-width="1.3" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`);
    const edge = sh.querySelector('.pk-edge');
    pack.classList.add('torn'); const dur = T.run(top, sh); requestAnimationFrame(() => edge.classList.add('go'));
    an($('.pk-spill'), [{ opacity: 0 }, { opacity: .95, offset: .3 }, { opacity: .4 }], { duration: DUR(1100) });
    const [x, y] = pkAt(50, kind === 'slash' ? 14 : 15);
    pkFlash(`rgb(${pk.rgb})`, .35 + .4 * pk.luck); fx.burst(x, y, pk.rgb, 70 + Math.round(120 * pk.luck), kind === 'shatter' ? 520 : 380); fx.rate(20 + 60 * pk.luck); buzz([40]);
    if (kind === 'shatter' || kind === 'split') shake();
    pk.until = Date.now() + Math.min(dur, 700);
    await wait(dur); if (pk.on && pk.stage === 'torn' && !pk.cur) pkHint('drop.tapNext');
    setTimeout(() => sh.querySelectorAll('.pk-layer:not(.main):not(.top)').forEach(e => e.remove()), calm ? 0 : 1500);
  }
  function leave(el) {
    const im = document.createElement('img'); im.src = el.querySelector('img').src; im.alt = ''; im.style.setProperty('--rc', el.style.getPropertyValue('--rc')); $('.pk-row').append(im);
    el.getAnimations().forEach(a => a.cancel()); el.classList.remove('front'); el.classList.add('leave'); setTimeout(() => el.remove(), 520);
  }
  async function next() {
    if (pk.idx >= pk.cards.length) return final();
    const i = pk.idx++, c = pk.cards[i], r = pk.res[i], ri = rarIdx(c.rarity), col = rarOf(c.rarity).c, leg = c.rarity === 'legendary';
    const kind = pickOf(REVEAL_KINDS, lastRev); lastRev = kind; const R = REVEALS[kind];
    pk.until = Date.now() + Math.max(600, R.dur * .7) + (leg ? 500 : 0);
    const url = await pk.urls[i]; if (!pk.on) return;
    if (pk.cur) leave(pk.cur);
    const el = document.createElement('div'); el.className = 'pk-card' + (leg ? ' legend' : ''); el.style.setProperty('--rc', col);
    el.innerHTML = `<img alt="${esc(c.name)}" src="${url}"><div class="bk"><b>MyCard</b></div><span class="pk-tag">${r.isNew ? tr('drop.new') : tr('drop.dup', { n: r.n })}</span>`;
    $('.pk-cardwrap').append(el); pk.cur = el; pack.classList.add('spent'); pkHint(i < pk.cards.length - 1 ? 'drop.tapNext' : 'drop.tapEnd');
    const dur = DUR(R.dur); el.style.zIndex = R.z === 0 ? 6 : 1; if (R.z) setTimeout(() => { if (pk.cur === el) el.style.zIndex = 6; }, dur * R.z);
    const a = el.animate(R.kf, { duration: dur, easing: 'cubic-bezier(.3,.8,.4,1)', fill: 'forwards' }); a.onfinish = () => { el.classList.add('front'); el.style.zIndex = ''; a.cancel(); };
    await wait(R.dur * R.at); if (!pk.on || pk.cur !== el) return;
    const [cx, cy] = pkCenter(el);
    pkFlash(col, flashOf(ri)); fx.burst(cx, cy, hex2rgb(col), 20 + ri * 30 + (leg ? 160 : 0), 300 + ri * 90); buzz(leg ? [30, 40, 30, 40, 160] : ri >= 3 ? [40, 30, 60] : [20]);
    if (ri >= 3 || kind === 'slam') shake();
    if (leg) root.classList.add('legend');
    const rar = $('.pk-rar'); rar.style.setProperty('--rc', col); rar.classList.remove('go', 'legend'); $('.pk-rar .rar').textContent = rarName(c.rarity); $('.pk-count').textContent = tr('drop.cardNo', { i: i + 1, n: pk.cards.length });
    void rar.offsetWidth; rar.classList.add('go'); if (leg) rar.classList.add('legend');
  }
  function final() {
    pk.stage = 'final'; pk.until = Date.now() + 1e9; if (pk.cur) { leave(pk.cur); pk.cur = null; }
    pkHint(''); opts.onStage && opts.onStage('final'); $('.pk-rar').classList.remove('go'); $('.pk-row').innerHTML = ''; pack.classList.add('spent');
    if (pk.cards.some(c => c.rarity === 'legendary')) fx.burst(innerWidth / 2, innerHeight * .45, pk.rgb, 90, 360);
  }
  const onDown = e => { if (e.target.closest('button')) return; advance(); };
  const onMove = e => { if (!pk.on || calm) return; const x = e.clientX / innerWidth, y = e.clientY / innerHeight; root.style.setProperty('--rx', ((.5 - y) * 14).toFixed(1) + 'deg'); root.style.setProperty('--ry', ((x - .5) * 18).toFixed(1) + 'deg'); root.style.setProperty('--sx', (x * 100).toFixed(0)); };
  function advance() { if (!pk.on || Date.now() < pk.until || (opts.blocked && opts.blocked())) return; if (pk.stage === 'ready') tear(); else if (pk.stage === 'torn') next(); }
  root.addEventListener('pointerdown', onDown); root.addEventListener('pointermove', onMove);
  summon();
  return {
    advance, skip() { if (pk.on && pk.stage !== 'final') final(); }, get stage() { return pk.stage; },
    stop() { pk.on = false; fx.stop(); root.removeEventListener('pointerdown', onDown); root.removeEventListener('pointermove', onMove); root.classList.remove('on', 'legend'); },
  };
}
