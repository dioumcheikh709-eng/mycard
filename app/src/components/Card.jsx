/* La carte affichée à l'écran : même structure que la version d'origine (les styles et le moteur d'effets s'y accrochent). */
import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import { tr } from '../lib/i18n.js';
import { TY, svgOf, typeName, rarKey, rarName, lookVars, LOOK, fxOf, plain } from '../lib/cards.js';
import { session } from '../lib/store.js';
import * as engine from '../lib/fxEngine.js';

const Rich = ({ text }) => plain(text).split('\n').map((l, i, a) => <span key={i}>{l}{i < a.length - 1 && <br />}</span>);
const Elem = ({ t }) => { const y = TY[t] || TY.C; return <span className="e" style={{ '--c': y.c, '--l': y.l }} dangerouslySetInnerHTML={{ __html: svgOf(t) }} />; };

export const Card = forwardRef(function Card({ c }, ref) {
  const rk = rarKey(c), ser = [c.evo, c.num ? '№ ' + c.num : ''].filter(Boolean).join(' · ');
  const style = { ...c.pal, ...lookVars(c), '--k': c.k != null ? c.k : 1 };
  return (
    <div className="card" ref={ref} data-shape={LOOK.shape} data-fx={fxOf(c.fx)} style={style}>
      <div className="cin">
        <div className="pan" />
        <div className={'art' + (c.img ? ' img' : '')}><i /><b /><em />
          {c.img && <img className="photo" alt="" src={c.img} style={{ transform: `translate(${c.px || 0}%,${c.py || 0}%) scale(${c.zoom || 1})` }} />}
        </div>
        <div className="holo" /><div className="sparkle" />
        <div className="revwrap"><div className="rev" /><div className="rev spot" /></div>
        <div className="fxa"><i /><i /><i /></div>
        <div className="ui">
          <div className="elt"><Elem t={c.type} /><span>{typeName(c.type)}</span></div>
          <div className="vit"><small>{tr('card.vit')}</small><b>{c.hp}</b></div>
          <div className="low">
            {(rk || c.special) && <div className="tags">{rk && <span className="rb">{rarName(rk)}</span>}{c.special && <span>{c.special}</span>}</div>}
            <div className="ttl"><h3 className="name">{c.name}</h3>{ser && <div className="ser">{ser}</div>}</div>
            {c.ab && c.ab.on && <div className="pow"><div className="pow-h"><span>{tr('card.power')}</span><h4>{c.ab.n}</h4></div>{c.ab.t && <p><Rich text={c.ab.t} /></p>}</div>}
            {(c.mv || []).map((m, i) => (
              <div className="atk" key={i}>
                <div className="atk-h">{m.c && <span className="chg">{[...m.c].map((t, j) => <i key={j} style={{ '--c': (TY[t] || TY.C).c }} />)}</span>}<h4>{m.n}</h4>{m.d && <><small>{tr('card.force')}</small><b>{m.d}</b></>}</div>
                {m.t && <p><Rich text={m.t} /></p>}
              </div>
            ))}
            {c.rule && (c.rule.t || c.rule.x) && <div className="note"><b>{c.rule.t}</b>{c.rule.x}</div>}
            <div className="foot"><span>{tr('card.weak', { e: typeName(c.weak[0]) + ' ' + (c.weak[1] || '') })}</span><span>{tr('card.illus', { n: c.ill || session.user })}</span></div>
          </div>
        </div>
        <div className="glare" /><div className="fxg" />
      </div>
    </div>
  );
});

/* Scène : ombre, halo, retournement (dos de carte) et branchement du moteur d'effets. */
export function CardStage({ c, flip = 'none', onFlipped }) {
  const cardRef = useRef(null), glowRef = useRef(null), shRef = useRef(null), stRef = useRef(null), flRef = useRef(null);
  useLayoutEffect(() => { engine.attach(cardRef.current, glowRef.current, shRef.current); });
  useEffect(() => () => engine.detach(), []);
  useEffect(() => { engine.setIntensity(c.k != null ? c.k : 1); }, [c.k]);
  useEffect(() => { engine.markDirty(); }, [c.fx]);
  /* animations d'entrée : 'rise' (carte neuve, montre le dos), 'flip' (retournement), 'drop' (ouverture) */
  useLayoutEffect(() => {
    const st = stRef.current, fl = flRef.current; if (!st || !fl) return;
    const still = matchMedia('(prefers-reduced-motion:reduce)').matches;
    st.classList.remove('rise', 'dropin', 'flipping', 'settle'); fl.classList.remove('flipping');
    if (flip === 'rise') { fl.classList.add('back'); void st.offsetWidth; st.classList.add('rise'); }
    else if (flip === 'flip') {
      fl.classList.remove('back');
      if (still) { onFlipped && onFlipped(); return; }
      st.classList.add('flipping'); fl.classList.add('flipping');
      const done = () => { fl.classList.remove('flipping'); st.classList.remove('flipping'); st.classList.add('settle'); onFlipped && onFlipped(); };
      fl.addEventListener('animationend', done, { once: true });
    } else if (flip === 'drop') { fl.classList.remove('back'); void st.offsetWidth; st.classList.add('dropin', 'settle'); }
    else fl.classList.remove('back');
  }, [flip]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="stage" ref={stRef}>
      <div className="shadow" ref={shRef} /><div className="glow" ref={glowRef} />
      <div className="flipper" ref={flRef}>
        <Card c={c} ref={cardRef} />
        <div className="cardback"><div className="logo">MyCard</div></div>
      </div>
    </div>
  );
}
