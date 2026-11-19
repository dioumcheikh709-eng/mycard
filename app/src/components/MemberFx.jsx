/* MyCard+ : aperçu visuel des avantages (avant l'abonnement) et scène de déblocage (après le paiement),
   dans l'esprit des passes de combat : titre énorme qui s'écrase, vague d'or, tampon « DÉBLOQUÉ ! »,
   récompenses en tuiles qui tombent une à une, confettis anguleux et secousses d'écran. */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { tr } from '../lib/i18n.js';
import { TEMPLATE, clone } from '../lib/cards.js';
import { thumbUrl } from '../lib/draw.js';
import { MEMBER, THEME_SHOP } from '../lib/shop.js';
import { FREE_DROPS, MEMBER_DROPS } from '../lib/store.js';
import { buzz } from '../state.jsx';
import { Hello } from './ui.jsx';

const calm = () => matchMedia('(prefers-reduced-motion:reduce)').matches;
const MiniPacks = ({ n, gold }) => <span className={'mpacks' + (gold ? ' gold' : '')}>{[...Array(n)].map((_, i) => <i key={i} style={{ animationDelay: (i * .06) + 's' }}>✦</i>)}</span>;

/* une carte d'exemple avec l'effet Or (miniature dessinée comme dans la bibliothèque) */
function GoldSample({ card }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let live = true; const c = clone(card || TEMPLATE); c.fx = 'gold'; c.k = 1.2; delete c.img;
    thumbUrl('member-gold:' + (c.name || '') + ':' + (c.type || ''), c, null).then(u => { if (live && u) setSrc(u); });
    return () => { live = false; };
  }, [card]);
  return src ? <img className="mgold-card" src={src} alt="" /> : <span className="mgold-card ph" />;
}

/* Aperçu des avantages, dans la fenêtre d'abonnement */
export function MemberPreview({ user, sample, eurTxt }) {
  return (
    <div className="mpv" id="member-preview">
      <section className="mpv-item">
        <h4>{tr('member.pv.boosters')}</h4>
        <div className="mpv-row"><small>{tr('member.pv.without')}</small><MiniPacks n={FREE_DROPS} /></div>
        <div className="mpv-row"><small>{tr('member.pv.with')}</small><MiniPacks n={MEMBER_DROPS} gold /></div>
      </section>
      <section className="mpv-item">
        <h4>{tr('member.pv.themes')}</h4>
        <div className="mpv-themes">{THEME_SHOP.map(t => <span key={t.k} className="tsw" data-t={t.k} title={tr('theme.' + t.k)} />)}<b className="mcheck">✓</b></div>
      </section>
      <section className="mpv-item">
        <h4>{tr('member.pv.coins')}</h4>
        <div className="mpv-price"><s>{eurTxt(4.99)}</s><b>{eurTxt(Math.round(4.99 * (1 - MEMBER.discount) * 100) / 100)}</b><span className="mpct">−{Math.round(MEMBER.discount * 100)} %</span></div>
      </section>
      <section className="mpv-item mpv-gold">
        <GoldSample card={sample} />
        <div><h4>{tr('member.pv.gold')}</h4><h4 style={{ marginTop: 10 }}>{tr('member.pv.name')}</h4><p className="mpv-name"><Hello user={user} member /></p></div>
      </section>
    </div>
  );
}

/* confettis anguleux (rectangles et triangles qui tournent et retombent) et éclats en traits à chaque impact */
function confetti(cv) {
  const g = cv.getContext('2d'); let W = 0, H = 0, D = 1, P = [], run = true, last = performance.now();
  const COL = ['#ffd23f', '#ffb000', '#fff3b0', '#ffffff', '#ff8a00', '#ffe066'];
  D = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * D; cv.height = H * D;
  function frame(t) {
    if (!run) return; requestAnimationFrame(frame);
    const dt = Math.min(.05, (t - last) / 1000); last = t; g.setTransform(D, 0, 0, D, 0, 0); g.clearRect(0, 0, W, H);
    P = P.filter(p => {
      p.l += dt; if (p.l > p.ttl || p.y > H + 40) return false;
      p.vy += p.gy * dt; p.vx *= p.drag; p.vy *= p.drag; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      const a = p.l > p.ttl - .4 ? Math.max(0, (p.ttl - p.l) / .4) : 1;
      g.save(); g.globalAlpha = a; g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c;
      if (p.k === 'spark') g.fillRect(-p.s * 2.6, -1, p.s * 5.2, 2);
      else { g.scale(1, Math.cos(p.l * 9 + p.r)); if (p.k === 'tri') { g.beginPath(); g.moveTo(0, -p.s); g.lineTo(p.s, p.s); g.lineTo(-p.s, p.s); g.fill(); } else g.fillRect(-p.s, -p.s * .55, p.s * 2, p.s * 1.1); }
      g.restore(); return true;
    });
  }
  requestAnimationFrame(frame);
  return {
    burst(x, y, n, v) {
      if (calm()) n = Math.round(n / 5);
      for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.6, s = v * (.35 + Math.random() * .8);
        P.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, gy: 950, drag: .985, r: Math.random() * 6, vr: (Math.random() - .5) * 14, s: 4 + Math.random() * 5, l: 0, ttl: 2.4 + Math.random(), c: COL[i % COL.length], k: Math.random() < .3 ? 'tri' : 'rect' }); }
    },
    sparks(x, y, n) {
      if (calm()) return;
      for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = 300 + Math.random() * 420;
        P.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, gy: 0, drag: .9, r: a, vr: 0, s: 3 + Math.random() * 4, l: 0, ttl: .4 + Math.random() * .25, c: i % 2 ? '#fff' : '#ffd23f', k: 'spark' }); }
    },
    stop() { run = false; g.clearRect(0, 0, W, H); },
  };
}

const TILES = [
  { k: 'boost', big: () => '×' + MEMBER_DROPS, label: 'member.t1' },
  { k: 'themes', big: () => '7', label: 'member.t2' },
  { k: 'coins', big: () => '−' + Math.round(MEMBER.discount * 100) + '%', label: 'member.t3' },
  { k: 'gold', big: () => tr('fx.gold'), label: 'member.t4' },
  { k: 'name', big: () => 'Aa', label: 'member.t5' },
];

/* Scène de déblocage MyCard+. onJoin est appelé quand le titre passe à l'or. */
export function MemberUpgrade({ user, onJoin, onDone }) {
  const shakeRef = useRef(null), cvRef = useRef(null), tilesRef = useRef(null);
  const [ph, setPh] = useState(0), [tiles, setTiles] = useState(0);
  useEffect(() => {
    const fx = confetti(cvRef.current), q = calm(), timers = [], at = (ms, f) => timers.push(setTimeout(f, q ? 0 : ms));
    const shake = big => { const r = shakeRef.current; if (!r || q) return; r.classList.remove('shake', 'shake2'); void r.offsetWidth; r.classList.add(big ? 'shake2' : 'shake'); };
    const W = () => innerWidth, H = () => innerHeight;
    at(60, () => setPh(1));                                                        /* bandes diagonales */
    at(380, () => setPh(2));                                                       /* le titre s'écrase, en argent */
    at(640, () => { shake(false); buzz(30); fx.sparks(W() / 2, H() * .26, 26); });
    at(1250, () => setPh(3));                                                      /* vague d'or dans le titre */
    at(1620, () => { onJoin(); shake(true); buzz([50, 30, 120]); fx.burst(W() / 2, H() * .28, 170, 950); fx.burst(W() * .12, H() * .36, 60, 720); fx.burst(W() * .88, H() * .36, 60, 720); });
    at(1850, () => setPh(4));                                                      /* tampon « DÉBLOQUÉ ! » */
    at(2050, () => { shake(false); buzz(25); });
    TILES.forEach((_, i) => at(2450 + i * 190, () => {
      setTiles(i + 1); buzz(12);
      const el = tilesRef.current && tilesRef.current.children[i];
      if (el) at(260, () => { const r = el.getBoundingClientRect(); fx.sparks(r.left + r.width / 2, r.top + r.height / 2, 14); });
    }));
    at(2450 + TILES.length * 190 + 350, () => setPh(5));                           /* bouton */
    return () => { timers.forEach(clearTimeout); fx.stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return createPortal(
    <div className={'bp ph' + ph} id="member-up" role="dialog" aria-modal="true" aria-label="MyCard+">
      {/* la secousse s'applique à ce conteneur, que React ne réécrit jamais (sinon le fondu d'entrée se rejouerait) */}
      <div className="bp-in" ref={shakeRef}>
      <div className="bp-bg" /><div className="bp-stripes" /><div className="bp-flash" /><canvas className="bp-fx" ref={cvRef} />
      <div className="bp-head">
        <h2 className="bp-title" aria-label="MyCard+"><span className="t-silver">MYCARD+</span><span className="t-gold" aria-hidden="true">MYCARD+</span></h2>
        <div className="bp-stamp">{tr('member.up.unlocked')}</div>
        <p className="bp-sub">{(() => { const a = String(tr('member.up.sub')).split('{name}'); return <>{a[0]}<span className="gold-name">{user}</span>{a[1] || ''}</>; })()}</p>
      </div>
      <div className="bp-tiles" ref={tilesRef}>
        {TILES.map((t, i) => (
          <div key={t.k} className={'bp-tile t-' + t.k + (i < tiles ? ' in' : '')}>
            <div className="bp-tile-art">
              {t.k === 'boost' && <span className="bp-ico-packs"><i /><i /><i /></span>}
              {t.k === 'themes' && <span className="bp-ico-themes">{THEME_SHOP.map(x => <i key={x.k} className="tsw" data-t={x.k} />)}</span>}
              {t.k === 'coins' && <i className="coin bp-ico-coin" />}
              {t.k === 'gold' && <span className="bp-ico-card" />}
              <b className={t.k === 'name' ? 'gold-name' : undefined}>{t.big()}</b>
            </div>
            <span className="bp-tile-label">{tr(t.label)}</span>
          </div>
        ))}
      </div>
      <button type="button" className="bp-go" id="member-up-go" onClick={onDone}><span>{tr('member.up.go')}</span></button>
      </div>
    </div>, document.body);
}
