/* Bibliothèque : grand titre qui se range au défilement, grille de cartes, tri dans une feuille du bas.
   Double appui sur le bouton de tri : affichage serré (plus de cartes à l'écran). */
import { useMemo, useRef, useState } from 'react';
import { useApp, buzz } from '../state.jsx';
import { tr } from '../lib/i18n.js';
import { typeName, rarName, rarOf } from '../lib/cards.js';
import { SORTS, sortDeck, normQ, hayOf, lsGet, lsSet } from '../lib/store.js';
import { Sheet, Thumb, deckThumb, Screen } from '../components/ui.jsx';
import { IcoSearch, IcoSort, IcoPlus } from '../components/icons.jsx';
import { gov } from '../lib/fxEngine.js';

export function Library({ onPerf }) {
  const { deck, user, newCard, openCard, ready, ver, toast } = useApp();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState(() => { const v = lsGet('mycard-sort'); return SORTS.includes(v) ? v : 'added'; });
  const [sortOpen, setSortOpen] = useState(false);
  const [dense, setDense] = useState(() => lsGet('mycard-dense') === '1');
  const [veil, setVeil] = useState(null);
  const taps = useRef([]), tapT = useRef(0), lastTap = useRef(0);
  const shown = useMemo(() => { const s = sortDeck(deck, sort), nq = normQ(q); return nq ? s.filter(c => normQ(hayOf(c)).includes(nq)) : s; }, [deck, sort, q, ver]);
  const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const open = c => { if (veil) return; setVeil(c.id); setTimeout(() => { setVeil(null); openCard(c.id, 'view'); }, calm ? 0 : 650); };
  const hello = () => { const n = performance.now(); taps.current = taps.current.filter(x => n - x < 2000); taps.current.push(n); if (taps.current.length >= 5) { taps.current = []; onPerf(); } };
  const setDensity = v => { setDense(v); lsSet('mycard-dense', v ? '1' : '0'); buzz(10); };
  /* un appui : menu de tri (après un court délai) ; deux appuis rapprochés : change d'affichage */
  const onSortTap = () => {
    const n = Date.now();
    if (n - lastTap.current < 320) { clearTimeout(tapT.current); lastTap.current = 0; const v = !dense; setDensity(v); toast(tr(v ? 'deck.denseOn' : 'deck.denseOff')); return; }
    lastTap.current = n; tapT.current = setTimeout(() => { lastTap.current = 0; setSortOpen(true); }, 280);
  };
  const count = (q ? shown.length + ' / ' : '') + deck.length + ' ' + (deck.length > 1 ? tr('deck.cardsMany') : tr('deck.cardsOne'));
  return (
    <Screen id="deck" label={tr('deck.title')} hello={tr('deck.hello', { user })} onHello={hello} title={tr('deck.title')} sub={count}
      actions={<button type="button" className={'ibtn' + (dense ? ' dense-on' : '')} id="dk-sort" aria-label={tr('deck.sortAria')} aria-haspopup="dialog" onClick={onSortTap}><IcoSort /></button>}>
      <label className="search"><IcoSearch /><input id="dk-q" type="search" enterKeyHint="search" autoComplete="off" value={q} placeholder={tr('deck.searchPh')} aria-label={tr('deck.searchAria')} onChange={e => setQ(e.target.value)} /></label>
      <div className={'grid' + (dense ? ' dense' : '')} id="dk-grid">
        {!deck.length && <button type="button" className="tile new" data-act="new" onClick={newCard}><span className="tcov"><IcoPlus /></span><b>{tr('deck.newTitle')}</b><small>{tr('deck.newDesc')}</small></button>}
        {shown.map(c => (
          <button type="button" key={c.id} className={'tile' + (veil === c.id ? ' veil' : '')} data-id={c.id} style={c.uni ? { '--rc': rarOf(c.rar).c } : null} onClick={() => open(c)}>
            <span className="tcov">{ready || !c.hasImg ? <Thumb load={() => deckThumb(c)} deps={[c.id, c.t, ver, ready]} alt="" /> : <span className="ph" />}</span>
            <b>{c.name}</b><small>{typeName(c.type)} · {c.hp} {tr('panel.card.hp')}{c.uni ? ' · ' + rarName(c.rar) : ''}</small>
          </button>
        ))}
      </div>
      {!deck.length && <div className="empty" id="dk-empty"><p>{tr('deck.empty')}</p></div>}
      {q && deck.length > 0 && !shown.length && <div className="empty" id="dk-nores"><p>{tr('deck.noResults')}</p></div>}
      {sortOpen && (
        <Sheet title={tr('deck.sortTitle')} onClose={() => setSortOpen(false)}>
          <div className="menu" role="menu" id="dk-menu">
            {SORTS.map(k => <button type="button" key={k} role="menuitemradio" aria-checked={k === sort} data-k={k} onClick={() => { setSort(k); lsSet('mycard-sort', k); setSortOpen(false); }}>{tr('deck.sort.' + k)}</button>)}
          </div>
          <div className="row" style={{ padding: '4px 6px' }}><span className="grow">{tr('deck.dense')}<small>{tr('deck.denseHint')}</small></span>
            <button type="button" role="switch" className="toggle" id="dk-dense" aria-checked={dense} aria-label={tr('deck.dense')} onClick={() => setDensity(!dense)} /></div>
        </Sheet>
      )}
    </Screen>
  );
}
export const perfText = s => tr('perf.live', { hz: s.hz, fps: s.fps, got: s.got, tier: s.tier }) + (s.stride > 1 ? tr('perf.stride', { n: s.stride }) : '') + (s.saver ? tr('perf.saver') : '');
export { gov };
