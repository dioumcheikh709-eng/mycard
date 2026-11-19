/* Briques d'interface : feuille du bas, alerte, message, miniature de carte, barre d'onglets. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp, buzz } from '../state.jsx';
import { tr } from '../lib/i18n.js';
import { IcoClose, IcoLibrary, IcoContest, IcoShop, IcoProfile, IcoPlus } from './icons.jsx';
import { media, uk } from '../lib/store.js';
import { thumbUrl, thumbSig } from '../lib/draw.js';
import { dropReady } from '../lib/store.js';

export function Sheet({ title, onClose, children, actions, label }) {
  const ref = useRef(null);
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k); const f = ref.current && ref.current.querySelector('button,[href],input,select,textarea');
    if (f) f.focus({ preventScroll: true });
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return createPortal(
    <div className="scrim" onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label || title} ref={ref}>
        <div className="sheet-grab" />
        <div className="sheet-h"><h3>{title}</h3>{actions}<button type="button" className="ibtn" onClick={onClose} aria-label={tr('drop.close')}><IcoClose /></button></div>
        <div className="sheet-b">{children}</div>
      </div>
    </div>, document.body);
}

export function AlertHost() {
  const { alert, answer } = useApp();
  const noRef = useRef(null);
  useEffect(() => {
    if (!alert) return;
    noRef.current && noRef.current.focus();
    const k = e => { if (e.key === 'Escape') answer(false); };
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  }, [alert, answer]);
  if (!alert) return null;
  return createPortal(
    <div className="scrim alert"><div className="box" role="alertdialog" aria-modal="true" aria-labelledby="al-t" aria-describedby="al-p">
      <h3 id="al-t">{alert.title}</h3><p id="al-p">{alert.text}</p>
      <div className="btns"><button type="button" className="btn" ref={noRef} onClick={() => answer(false)}>{tr('confirm.continue')}</button>
        <button type="button" className={'btn ' + (alert.danger ? 'danger' : 'primary')} id="al-yes" onClick={() => answer(true)}>{alert.yes}</button></div>
    </div></div>, document.body);
}

export function Toast() {
  const { toastMsg } = useApp();
  return toastMsg ? <div className="toast" role="status" key={toastMsg.k} id="toast">{toastMsg.m}</div> : null;
}

/* Miniature d'une carte de la bibliothèque : gardée dans IndexedDB tant que la carte, la forme et la langue ne changent pas. */
const deckThumbs = new Map();
export async function deckThumb(c) {
  const sig = thumbSig(), key = uk() + ':' + c.id;
  const mem = deckThumbs.get(key); if (mem && mem.t === c.t && mem.l === sig) return mem.url;
  const th = await media.get('th:' + key).catch(() => null);
  if (th && th.t === c.t && th.l === sig) { deckThumbs.set(key, th); return th.url; }
  const url = await thumbUrl('deck:' + c.id + ':' + c.t, c, c.img);
  if (url) { const v = { t: c.t, l: sig, url }; deckThumbs.set(key, v); media.put('th:' + key, v); }
  return url;
}
export function Thumb({ load, deps, alt = '' }) {
  const [src, setSrc] = useState(null);
  useEffect(() => { let live = true; Promise.resolve(load()).then(u => { if (live && u) setSrc(u); }).catch(() => {}); return () => { live = false; }; }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return src ? <img alt={alt} src={src} draggable="false" /> : <span className="ph" />;
}

export function TabBar() {
  const { tab, setTab, newCard, user, avatar } = useApp();
  const go = t => { if (t !== tab) buzz(8); setTab(t); };
  const T = ({ id, Ico, label, badge }) => (
    <button type="button" className="tab" data-tab={id} aria-current={tab === id ? 'page' : 'false'} onClick={() => go(id)}>
      <Ico /><span>{label}</span>{badge && <i className="badge dot-n" />}
    </button>
  );
  return (
    <nav className="tabbar" aria-label={tr('tab.nav')}><div className="tabbar-in">
      <T id="library" Ico={IcoLibrary} label={tr('tab.library')} />
      <T id="contest" Ico={IcoContest} label={tr('tab.contest')} />
      <button type="button" className="tab create" id="tab-create" aria-label={tr('deck.newTitle')} onClick={() => { buzz(12); newCard(); }}><span className="plus"><IcoPlus /></span><span>{tr('tab.create')}</span></button>
      <T id="shop" Ico={IcoShop} label={tr('tab.booster')} badge={!!user && dropReady()} />
      <T id="profile" Ico={avatar ? () => <img className="tav" src={avatar} alt="" /> : IcoProfile} label={tr('tab.profile')} />
    </div></nav>
  );
}

/* Écran d'onglet, comme sur iOS : le grand titre défile avec le contenu et s'efface en douceur, au rythme du doigt
   (de plus en plus transparent, légèrement réduit et ralenti). Rien ne le remplace : il disparaît vraiment. */
const scrollMem = {};   /* position de défilement de chaque écran (gardée si l'écran est reconstruit, ex. changement de thème) */
export function Screen({ id, label, hello, onHello, title, sub, actions, children }) {
  const ref = useRef(null), secRef = useRef(null), hdrRef = useRef(null);
  const paint = useCallback(y => {
    const h = hdrRef.current ? hdrRef.current.offsetHeight : 120;
    const p = Math.max(0, Math.min(1, y / h));
    if (secRef.current) secRef.current.style.setProperty('--p', p.toFixed(3));
  }, []);
  useEffect(() => { const y = scrollMem[id] || 0; if (ref.current && y) ref.current.scrollTop = y; paint(y); }, [id, paint]);
  const onScroll = useCallback(e => { const y = e.currentTarget.scrollTop; scrollMem[id] = y; paint(y); }, [id, paint]);
  return (
    <section className="screen" id={id} aria-label={label || title} ref={secRef}>
      <div className="scroll" ref={ref} onScroll={onScroll}>
        <header className="top" ref={hdrRef}>
          <div className="tt">{hello && <p className="hello" id={id === 'deck' ? 'dk-hello' : undefined} onClick={onHello}>{hello}</p>}<h1>{title}</h1>{sub && <p className="sub" id={id === 'deck' ? 'dk-count' : id === 'contest' ? 'ct-week' : undefined}>{sub}</p>}</div>
          {actions && <div className="acts">{actions}</div>}
        </header>
        <div className="wrap">{children}</div>
      </div>
    </section>
  );
}

/* « Bonjour, X » avec le nom en or brillant pour les membres MyCard+ */
export function Hello({ user, member }) {
  const parts = String(tr('deck.hello', { user: '\u0000' })).split('\u0000');
  return <>{parts[0]}<span className={member ? 'gold-name' : undefined}>{user}</span>{parts.slice(1).join('')}</>;
}
export const NameTag = ({ user, member }) => <span className={member ? 'gold-name' : undefined}>{user}</span>;
