/* Boutique : booster gratuit du jour, boosters à acheter, Card Coins (offres façon Brawl Stars), chances et couleurs. */
import { useEffect, useRef, useState } from 'react';
import { useApp, buzz } from '../state.jsx';
import { tr } from '../lib/i18n.js';
import { RARITIES, rarOf, rarName } from '../lib/cards.js';
import { coins as readCoins, dropReady, useDrop, resetDrop, msToMidnight, DUP_COINS, CONTEST_COINS, dropsLeft, dropLimit, FREE_DROPS, MEMBER_DROPS } from '../lib/store.js';
import { catalog, catImg } from '../lib/cloud.js';
import { SHOP, COIN_PACKS, packTotal, payments, rollPack, packLuck, luckRGB, hex2rgb, PACK_SIZE, THEME_SHOP, MEMBER, packEur } from '../lib/shop.js';
import { packHTML, setPackVars, runPack } from '../lib/packOpen.js';
import { thumbUrl } from '../lib/draw.js';
import { Sheet, Screen } from '../components/ui.jsx';
import { IcoInfo } from '../components/icons.jsx';

const eurTxt = (v, lang) => new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR' }).format(v);
const shopName = p => p.min ? tr('shop.tier', { r: rarName(p.min) }) : tr('shop.normal');
const shopDesc = p => p.min ? tr('shop.tierD', { r: rarName(p.min) }) : tr('shop.normalD');
const clock = ms => { const s = Math.max(0, Math.floor(ms / 1e3)); return [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(v => String(v).padStart(2, '0')).join(':'); };
const fmtP = (x, lang) => (x * 100).toLocaleString(lang, { maximumFractionDigits: 1 }) + ' %';

function MiniPack({ off, rgb }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) { ref.current.innerHTML = packHTML(false); setPackVars(ref.current); } }, []);
  return <div className={'pk-mini' + (off ? ' off' : '')} style={rgb ? { '--lc-rgb': rgb.join(',') } : null}><div className="pk-pack" ref={ref} /></div>;
}
function CcTile({ p, i, hl, lang, onClick, member }) {
  const bp = p.bonus ? Math.round(p.bonus / p.coins * 100) : 0;
  return (
    <button type="button" className={'cc-tile' + (hl ? ' hl' : '')} data-cc={p.id} onClick={onClick}>
      {p.tag && hl == null && <span className="cc-tag">{tr('cc.' + p.tag)}</span>}
      <span className="pile" aria-hidden="true">{[...Array(Math.min(5, i + 1))].map((_, k) => <i className="coin" key={k} />)}</span>
      <b className="cc-amt">{packTotal(p).toLocaleString(lang)}</b><small>Card Coins</small>
      <span className="cc-bonus">{bp ? tr('cc.bonus', { p: bp }) : ''}</span><span className="cc-price">{member && <s>{eurTxt(p.eur, lang)}</s>}{eurTxt(packEur(p, member), lang)}</span>
    </button>
  );
}

export function Shop() {
  const { coins, setCoins, addCoins, unlock, setPack, pack, toast, lang, ver, theme, setTheme, canUse, buyTheme, shopFocus, setShopFocus, member, memberTs, joinMember, endMember } = useApp();
  const [mem, setMem] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [cat, setCat] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [cc, setCc] = useState(null);         /* {mode:'short'|'confirm', p, want} */
  const [info, setInfo] = useState(false);
  const ccRef = useRef(null), themesRef = useRef(null), busy = useRef(false);
  useEffect(() => { if (shopFocus === 'themes') { setShopFocus(null); setTimeout(() => themesRef.current && themesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120); } }, [shopFocus, setShopFocus]);
  const getTheme = k => { const r = buyTheme(k); if (r === 'short') setCc({ mode: 'short', want: { theme: k, price: THEME_SHOP.find(t => t.k === k).price } }); else if (r === 'ok') toast(tr('shop.themeBought', { t: tr('theme.' + k) })); };
  useEffect(() => { catalog().then(setCat); }, [ver]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const ready = dropReady(), empty = cat && !cat.length;

  async function openBooster(kind) {
    const prod = SHOP.find(p => p.k === kind);
    if (busy.current || pack) return;
    if (!prod) { if (!dropReady()) return; }
    else if (readCoins() < prod.price) { setCc({ mode: 'short', want: prod }); return; }
    const c = await catalog(); if (!c.length) return;
    busy.current = true;
    const cards = rollPack(c, prod && prod.min);
    if (prod) setCoins(readCoins() - prod.price); else useDrop();      /* débité / consommé dès le tirage */
    const res = []; for (const x of cards) res.push(await unlock(x, x.rarity));
    const gain = cards.reduce((a, x, i) => a + (res[i].isNew ? 0 : DUP_COINS[x.rarity] || 0), 0); if (gain) addCoins(gain);   /* les doublons deviennent des pièces */
    const urls = cards.map(x => catImg(x).then(img => thumbUrl('cat:' + x.id + ':' + (x.upd || 0), x, img)));
    const luck = packLuck(cards);
    busy.current = false;
    setPack({ cards, res, urls, luck, rgb: luckRGB(luck), gain });
  }
  async function buy(p) {
    let ok = false; try { ok = await payments.buy(p); } catch (e) { /* refusé */ }
    if (!ok) { toast(tr('cc.failed')); return; }
    addCoins(packTotal(p)); const want = cc && cc.want; setCc(null); toast(tr('cc.bought', { n: packTotal(p).toLocaleString(lang) }));
    if (want && readCoins() >= want.price) { if (want.theme) getTheme(want.theme); else openBooster(want.k); }
  }
  const shortPicks = want => { const need = want.price - readCoins(), idx = COIN_PACKS.findIndex(p => packTotal(p) >= need), first = idx < 0 ? COIN_PACKS.length - 1 : idx; return { need, picks: COIN_PACKS.slice(first, first + 2) }; };

  return (
    <Screen id="shop" title={tr('shop.title')} actions={<>
          <button type="button" className="coins" id="shop-coins" aria-label={tr('cc.plus')} onClick={() => ccRef.current && ccRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })}><i className="coin" /><b id="coin-n" role="status">{coins.toLocaleString(lang)}</b><span className="coins-plus" aria-hidden="true">+</span></button>
          <button type="button" className="ibtn" id="bst-info" aria-label={tr('info.btn')} onClick={() => setInfo(true)}><IcoInfo /></button>
        </>}>
        <p className="demo">{tr('shop.demo')}</p>
        <div className={'member-card' + (member ? ' on' : '') + (upgrading ? ' upgrading' : '')} id="member">
          <i className="mgold" aria-hidden="true" /><i className="mshine" aria-hidden="true" />{upgrading && <span className="msparks" aria-hidden="true">{[...Array(14)].map((_, k) => <i key={k} style={{ '--a': (k * 360 / 14) + 'deg', '--d': (k % 3) * .06 + 's' }} />)}</span>}
          <div className="mh"><span className="mlogo">MyCard<b>+</b></span>{member && <span className="mbadge">{tr('member.badge')}</span>}</div>
          <ul>
            <li>{tr('member.b1', { n: MEMBER_DROPS, f: FREE_DROPS })}</li>
            <li>{tr('member.b2')}</li>
            <li>{tr('member.b3', { p: Math.round(MEMBER.discount * 100) })}</li>
          </ul>
          {member ? <><p className="msub">{tr('member.active', { d: new Date(memberTs).toLocaleDateString(lang) })}</p>
              <p className="msub" style={{ opacity: .75 }}>{tr('member.manageHint')}</p></>
            : <button type="button" className="btn primary block" id="member-join" onClick={() => setMem(true)}>{tr('member.join')} · {tr('member.price', { p: eurTxt(MEMBER.eur, lang) })}</button>}
        </div>
        <div className="free">
          <MiniPack off={!ready || empty} />
          <div className="txt"><span className="shop-badge">{tr('shop.dailyN', { n: dropLimit() })}</span><h2>{tr('shop.dailyName')}</h2>
            <p id="bst-msg" role="status">{empty ? tr('drop.empty') : ready ? tr('drop.left', { n: dropsLeft(), t: dropLimit() }) : tr('drop.wait', { t: clock(msToMidnight()) })}</p>
            <button type="button" className="btn primary" id="bst-open" disabled={!ready || !cat || empty || !!pack} onClick={() => openBooster('daily')}>{tr('drop.open')}</button>
          </div>
        </div>
        <h2 className="sec-h">{tr('shop.packs')}</h2>
        <div className="shop-grid" id="shop-grid">
          {SHOP.map(p => { const rgb = p.min ? hex2rgb(rarOf(p.min).c) : [140, 170, 255]; return (
            <article className="shop-tile" key={p.k} style={{ '--lc-rgb': rgb.join(',') }}>
              <MiniPack rgb={rgb} />
              <h3>{shopName(p)}</h3>
              <button type="button" className={'btn primary shop-buy' + (coins < p.price ? ' poor' : '')} data-buy={p.k} aria-label={tr('shop.buy', { n: p.price })} disabled={!cat || empty || !!pack} onClick={() => openBooster(p.k)}><i className="coin" />{p.price}</button>
            </article>); })}
        </div>
        <h2 className="sec-h" id="themes-section" ref={themesRef}>{tr('shop.themes')}</h2>
        <p className="note" style={{ marginTop: -6 }}>{tr('shop.themesD')}</p>
        <div className="theme-grid" id="theme-grid">
          {THEME_SHOP.map(t => { const own = canUse(t.k), on = theme === t.k; return (
            <article className="theme-tile" key={t.k} data-theme-k={t.k}>
              <div className="theme-prev" data-t={t.k} aria-hidden="true"><i /><i /><b /></div>
              <h3>{tr('theme.' + t.k)}</h3>
              {on ? <button type="button" className="btn sm on" disabled>{tr('shop.themeActive')}</button>
                : own ? <button type="button" className="btn sm" data-apply={t.k} onClick={() => setTheme(t.k)}>{!t.price ? tr('shop.themeFree') : member ? tr('member.included') : tr('shop.themeApply')}</button>
                : <button type="button" className={'btn sm primary shop-buy' + (coins < t.price ? ' poor' : '')} data-theme-buy={t.k} aria-label={tr('shop.buy', { n: t.price })} onClick={() => getTheme(t.k)}><i className="coin" />{t.price}</button>}
            </article>); })}
        </div>
        <h2 className="sec-h" id="cc-section" ref={ccRef}>{tr('cc.store')}</h2>
        <div className="cc-grid" id="cc-grid">{COIN_PACKS.map((p, i) => <CcTile key={p.id} p={p} i={i} lang={lang} member={member} onClick={() => setCc({ mode: 'confirm', p })} />)}</div>
        <p className="demo">{tr('cc.demoNote')}</p>
        <details className="group pad">
          <summary className="sec-h" style={{ margin: 0, cursor: 'pointer' }}>{tr('demo.tools')}</summary>
          <div className="hrow" style={{ marginTop: 10 }}>
            <button type="button" className="btn sm" id="dm-drop" onClick={() => { resetDrop(); setNow(Date.now()); }}>{tr('demo.resetDrop')}</button>
            <button type="button" className="btn sm" id="dm-coins" onClick={() => addCoins(500)}>{tr('demo.addCoins')}</button>
          </div>
        </details>

      {cc && cc.mode === 'short' && (() => { const { need, picks } = shortPicks(cc.want); return (
        <Sheet title={tr('cc.shortT')} onClose={() => setCc(null)}>
          <p className="cc-msg">{tr('cc.short', { n: need.toLocaleString(lang) })}</p>
          <div className="cc-offers">{picks.map((p, k) => <CcTile key={p.id} p={p} i={COIN_PACKS.indexOf(p)} hl={k === 0} lang={lang} member={member} onClick={() => setCc({ mode: 'confirm', p, want: cc.want })} />)}</div>
          <button type="button" className="btn" id="cc-all" onClick={() => { setCc(null); setTimeout(() => ccRef.current && ccRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }}>{tr('cc.all')}</button>
        </Sheet>); })()}
      {cc && cc.mode === 'confirm' && (
        <Sheet title={tr('cc.confirmT')} onClose={() => setCc(null)}>
          <div className="cc-offers"><CcTile p={cc.p} i={COIN_PACKS.indexOf(cc.p)} hl={false} lang={lang} member={member} /></div>
          <p className="cc-msg">{tr('cc.confirmQ', { n: packTotal(cc.p).toLocaleString(lang), p: eurTxt(packEur(cc.p, member), lang) })}{cc.want ? ' ' + tr('cc.then') : ''}</p>
          <p className="note">{tr('cc.demoNote')}</p>
          <div className="two"><button type="button" className="btn primary" id="cc-pay" onClick={() => buy(cc.p)}>{tr('cc.pay', { p: eurTxt(packEur(cc.p, member), lang) })}</button><button type="button" className="btn" id="cc-cancel" onClick={() => setCc(null)}>{tr('cc.cancel')}</button></div>
        </Sheet>
      )}
      {info && <InfoSheet onClose={() => setInfo(false)} />}
      {mem && (
        <Sheet title="MyCard+" onClose={() => setMem(false)}>
          <p className="cc-msg">{tr('member.confirm', { p: eurTxt(MEMBER.eur, lang) })}</p>
          <ul className="shop-info"><li>{tr('member.b1', { n: MEMBER_DROPS, f: FREE_DROPS })}</li><li>{tr('member.b2')}</li><li>{tr('member.b3', { p: Math.round(MEMBER.discount * 100) })}</li></ul>
          <p className="note">{tr('member.demo')}</p>
          <div className="two"><button type="button" className="btn primary" id="member-pay" onClick={async () => { let ok = false; try { ok = await payments.subscribe(); } catch (e) { /* refusé */ } if (!ok) { toast(tr('cc.failed')); return; } setMem(false); setUpgrading(true); buzz([20, 40, 20, 40, 120]); document.getElementById('member') && document.getElementById('member').scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(() => { joinMember(); toast(tr('member.joined')); }, 700); setTimeout(() => setUpgrading(false), 2600); }}>{tr('member.join')}</button>
            <button type="button" className="btn" onClick={() => setMem(false)}>{tr('cc.cancel')}</button></div>
        </Sheet>
      )}
    </Screen>
  );
}

/* chances, tableau et couleurs */
export function InfoSheet({ onClose }) {
  const { lang } = useApp();
  const [cat, setCat] = useState([]);
  useEffect(() => { catalog().then(setCat); }, []);
  const n = {}; cat.forEach(c => { n[c.rarity] = (n[c.rarity] || 0) + 1; });
  const tot = RARITIES.filter(r => n[r.k]).reduce((a, r) => a + r.w, 0), pc = r => n[r.k] && tot ? r.w / tot : 0;
  return (
    <Sheet title={tr('info.title')} onClose={onClose}>
      <h4>{tr('info.how')}</h4><ul><li>{tr('info.h1')}</li><li>{tr('info.h2')}</li><li>{tr('info.h3')}</li><li>{tr('info.h4')}</li></ul>
      <h4>{tr('info.table')}</h4>
      <table className="odds"><thead><tr><th>{tr('info.colRar')}</th><th>{tr('info.colCards')}</th><th>{tr('info.colOdds')}</th><th>{tr('info.colPack')}</th></tr></thead>
        <tbody>{RARITIES.map((r, i) => { const q = RARITIES.reduce((a, x, j) => a + (j >= i ? pc(x) : 0), 0); return (
          <tr key={r.k} style={{ '--rc': r.c }}><td><span className="rar">{rarName(r.k)}</span></td><td>{n[r.k] || '—'}</td><td>{n[r.k] ? fmtP(pc(r), lang) : '—'}</td><td>{n[r.k] ? fmtP(1 - Math.pow(1 - q, PACK_SIZE), lang) : '—'}</td></tr>); })}</tbody></table>
      <dl><dt>{tr('info.colRar')}</dt><dd>{tr('info.dRar')}</dd><dt>{tr('info.colCards')}</dt><dd>{tr('info.dCards')}</dd><dt>{tr('info.colOdds')}</dt><dd>{tr('info.dOdds')}</dd><dt>{tr('info.colPack')}</dt><dd>{tr('info.dPack')}</dd></dl>
      <p>{tr('info.noCards')}</p>
      <h4>{tr('info.shopT')}</h4><p>{tr('info.shopP')}</p>
      <ul className="shop-info">{SHOP.map(p => <li key={p.k}><b>{shopName(p)}</b> <span className="pr"><i className="coin" />{p.price}</span><br />{shopDesc(p)}</li>)}</ul>
      <p>{tr('shop.noLegend')}</p>
      <h4>{tr('info.earnT')}</h4><p>{tr('shop.earn', { d: RARITIES.map(r => rarName(r.k) + ' ' + DUP_COINS[r.k]).join(' · '), c: CONTEST_COINS })}</p>
      <h4>{tr('info.colors')}</h4><p>{tr('info.c1')}</p><p>{tr('info.c2')}</p>
      <div className="lk-bar" style={{ background: `linear-gradient(90deg,${RARITIES.map(r => r.c).join(',')})` }} />
      <ul className="lk-list">{RARITIES.map((r, i) => <li key={r.k}><i style={{ '--c': r.c }} /><span>{tr('info.lk' + i)}</span></li>)}</ul>
    </Sheet>
  );
}

/* l'invocation plein écran (au-dessus de tout) */
export function PackOpening() {
  const { pack, setPack, setTab } = useApp();
  const ref = useRef(null), run = useRef(null);
  const [stage, setStage] = useState('summon');
  const [info, setInfo] = useState(false);
  const infoRef = useRef(false); infoRef.current = info;
  useEffect(() => {
    if (!pack || !ref.current) return;
    run.current = runPack(ref.current, pack, { onStage: setStage, blocked: () => infoRef.current });
    const k = e => { if (infoRef.current) return; if (e.key === 'Escape') close(); else if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('button')) { e.preventDefault(); run.current && run.current.advance(); } };
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('keydown', k); run.current && run.current.stop(); };
  }, [pack]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!pack) return null;
  const close = () => { if (run.current) run.current.stop(); setTimeout(() => setPack(null), 400); };
  return (
    <div className="pk" id="pk" ref={ref} role="dialog" aria-modal="true" aria-label={tr('drop.pack')} tabIndex={-1}>
      <div className="pk-rays" /><div className="pk-flash" /><canvas className="pk-fx" />
      {stage === 'ready' || stage === 'torn' ? <button type="button" className="pk-skip" id="pk-skip" onClick={() => run.current && run.current.skip()}>{tr('drop.skip')}</button> : null}
      <button type="button" className="pk-info" aria-label={tr('info.btn')} onClick={() => setInfo(true)}>i</button>
      <button type="button" className="pk-close" id="pk-close" aria-label={tr('drop.close')} onClick={close}>✕</button>
      <div className="pk-world"><div className="pk-tilt"><div className="pk-bob"><div className="pk-stage">
        <div className="pk-portal" /><div className="pk-beam" /><i className="pk-spill" />
        <div className="pk-cardwrap" /><div className="pk-pack" id="pk-pack" />
      </div></div></div></div>
      <div className="pk-rar"><span className="rar" /><span className="pk-count" /></div>
      <div className="pk-row" />
      <p className="pk-hint" id="pk-hint" role="status" />
      <div className="pk-final" id="pk-final" hidden={stage !== 'final'}>
        <h2>{tr('drop.pack')}</h2><div className="pk-fin-grid" /><p className="pk-fin-msg" />
        <div className="pk-fin-btns"><button type="button" className="btn primary" id="pk-see" onClick={() => { close(); setTab('library'); }}>{tr('drop.see')}</button><button type="button" className="btn" id="pk-done" onClick={close}>{tr('drop.close')}</button></div>
      </div>
      {info && <InfoSheet onClose={() => setInfo(false)} />}
    </div>
  );
}
