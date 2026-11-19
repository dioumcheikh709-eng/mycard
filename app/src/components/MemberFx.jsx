/* MyCard+ : aperçu visuel des avantages (avant l'abonnement) et grande scène de passage à MyCard+ (après le paiement). */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { tr } from '../lib/i18n.js';
import { TEMPLATE, clone } from '../lib/cards.js';
import { thumbUrl } from '../lib/draw.js';
import { particles } from '../lib/packOpen.js';
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

/* Grande scène de passage à MyCard+ : la carte argent se charge d'énergie, se retourne dans un éclair et devient or,
   gerbes d'étincelles dorées, puis les avantages apparaissent un à un. onJoin est appelé au moment du retournement. */
export function MemberUpgrade({ user, onJoin, onDone }) {
  const cvRef = useRef(null), [ph, setPh] = useState(0);   /* 0 entrée · 1 charge · 2 éclair + or · 3 avantages · 4 bouton */
  useEffect(() => {
    const fx = particles(cvRef.current), q = calm(), T = q ? [0, 0, 0, 0] : [900, 1800, 2400, 3500], timers = [];
    const SILVER = [215, 222, 235], GOLD = [255, 205, 90];
    const at = (ms, f) => timers.push(setTimeout(f, ms));
    fx.start(SILVER, 25); buzz(15);
    at(T[0], () => { setPh(1); fx.rate(140); buzz([10, 30, 10, 30, 10, 30]); });
    at(T[1], () => {
      setPh(2); onJoin(); fx.start(GOLD, 70);
      const w = innerWidth, h = innerHeight;
      fx.burst(w / 2, h * .38, GOLD, 220, 520); buzz([60, 40, 160]);
      at(220, () => { fx.burst(w * .2, h * .3, GOLD, 80, 380); fx.burst(w * .8, h * .3, GOLD, 80, 380); });
      at(520, () => fx.burst(w / 2, h * .38, [255, 250, 220], 120, 420));
    });
    at(T[2], () => { setPh(3); fx.rate(14); });
    at(T[3], () => { setPh(4); fx.rate(10); });
    return () => { timers.forEach(clearTimeout); fx.stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return createPortal(
    <div className={'mup ph' + ph} id="member-up" role="dialog" aria-modal="true" aria-label="MyCard+">
      <div className="mup-rays" /><div className="mup-flash" /><canvas className="mup-fx" ref={cvRef} />
      <div className="mup-stage">
        <div className="mcard3d"><div className="mcard-in">
          <div className="mface silver"><span className="mlogo">MyCard<b>+</b></span><i className="mchip" /><span className="mname">{user}</span></div>
          <div className="mface gold"><span className="mlogo">MyCard<b>+</b></span><i className="mchip" /><span className="mname">{user}</span><span className="mtag">{tr('member.badge')}</span><i className="msheen" /></div>
        </div></div>
      </div>
      <div className="mup-text">
        <h2>{tr('member.up.title')}</h2>
        <p>{(() => { const a = String(tr('member.up.sub')).split('{name}'); return <>{a[0]}<span className="gold-name">{user}</span>{a[1] || ''}</>; })()}</p>
        <ul>
          <li style={{ '--i': 0 }}><b>{MEMBER_DROPS}</b>{tr('member.up.l1')}</li>
          <li style={{ '--i': 1 }}><b>7</b>{tr('member.up.l2')}</li>
          <li style={{ '--i': 2 }}><b>−{Math.round(MEMBER.discount * 100)}%</b>{tr('member.up.l3')}</li>
          <li style={{ '--i': 3 }}><b>{tr('fx.gold')}</b>{tr('member.up.l4')}</li>
        </ul>
        <button type="button" className="btn mup-go" id="member-up-go" onClick={onDone}>{tr('member.up.go')}</button>
      </div>
    </div>, document.body);
}
