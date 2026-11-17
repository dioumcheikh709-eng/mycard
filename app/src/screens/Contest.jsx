/* Concours de la semaine : participer avec une de ses cartes, voter, résultats, validation du modérateur. */
import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../state.jsx';
import { tr } from '../lib/i18n.js';
import { RARITIES, rarName, clone, TEMPLATE, PALS } from '../lib/cards.js';
import { media, uk, session, cardImage, lsGet, lsSet, CONTEST_COINS } from '../lib/store.js';
import { cloud, weekId, weekEnd, nowD, fmtLeft, settleWeeks, isMod, demoOff } from '../lib/cloud.js';
import { thumbUrl } from '../lib/draw.js';
import { Thumb } from '../components/ui.jsx';

const votesText = n => tr(n === 1 ? 'contest.votesOne' : 'contest.votesMany', { n });
const entThumb = e => () => Promise.resolve(e.hasImg ? media.get('ent:' + e.id) : null).then(img => thumbUrl('e:' + e.id + ':' + (e.card.t || 0), e.card, img));

export function Contest() {
  const { deck, addCoins, toast, ver } = useApp();
  const [d, setD] = useState(null);
  const [pick, setPick] = useState('');
  const [rars, setRars] = useState({});
  const [busy, setBusy] = useState(false);
  const own = deck.filter(c => !c.uni);
  const load = useCallback(async () => {
    await settleWeeks();
    const wk = weekId(), [ents, votes, res, all] = await Promise.all([cloud.entries(wk), cloud.votes(wk), cloud.results(), cloud.allEntries()]);
    setD({ wk, ents, votes, res, all });
  }, []);
  useEffect(() => { load(); }, [load, ver]);
  useEffect(() => { if (!own.some(c => c.id === pick) && own.length) setPick(own[0].id); }, [own.length]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!d) return <section className="screen" id="contest"><header className="top"><div className="tt"><h1>{tr('contest.title')}</h1></div></header></section>;

  const me = uk(), mine = d.ents.find(e => e.uk === me), my = d.votes[me];
  const cnt = {}; Object.values(d.votes).forEach(id => { cnt[id] = (cnt[id] || 0) + 1; });
  const ranked = [...d.ents].sort((a, b) => (cnt[b.id] || 0) - (cnt[a.id] || 0) || a.t - b.t);
  const past = Object.keys(d.res).sort().reverse().slice(0, 6), entOf = (w, r) => (d.all[w] || []).find(x => x.id === r.entryId);
  const pend = Object.keys(d.res).filter(w => d.res[w].status === 'pending').sort();

  const submit = async () => {
    const c = deck.find(x => x.id === pick); if (!c || c.uni) return;
    const img = await cardImage(c);
    const e = { id: 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), uk: me, author: session.user, t: Date.now(), card: JSON.parse(JSON.stringify({ ...c, img: undefined, hasImg: !!img })), hasImg: !!img };
    if (img) await media.put('ent:' + e.id, img);
    const wkKey = 'mycard-ccweek:' + me, first = lsGet(wkKey) !== weekId();
    await cloud.submit(weekId(), e); if (first) { addCoins(CONTEST_COINS); lsSet(wkKey, weekId()); }
    toast(tr('contest.toastSubmitted') + (first ? ' ' + tr('shop.contestGain', { n: CONTEST_COINS }) : '')); load();
  };
  const withdraw = async () => { (await cloud.withdraw(weekId(), me)).forEach(g => media.del('ent:' + g.id)); toast(tr('contest.toastWithdrawn')); load(); };
  const vote = async id => { await cloud.vote(weekId(), me, id); load(); };
  const moderate = async (wk, ok) => {
    if (busy) return; setBusy(true);
    try {
      const r = (await cloud.results())[wk]; if (!r || r.status !== 'pending') return;
      const rarity = rars[wk] || 'rare';
      if (ok) {
        const e = (await cloud.entries(wk)).find(x => x.id === r.entryId); if (!e) return;
        const id = 'w-' + wk + '-' + e.id, c = { ...e.card, id, rarity, ill: e.author, hasImg: !!e.hasImg }; delete c.img; delete c.uni; delete c.rar;
        if (e.hasImg) { const im = await media.get('ent:' + e.id); if (im) await media.put('ext:' + id, im); else c.hasImg = false; }
        await cloud.addExtra(c);
      }
      await cloud.setResult(wk, { ...r, status: ok ? 'approved' : 'rejected', rarity: ok ? rarity : undefined });
      toast(tr(ok ? 'contest.toastApproved' : 'contest.toastRejected')); load();
    } finally { setBusy(false); }
  };
  const demo = async k => {
    if (k === 'seed') {
      const wk = weekId(), P = [['Aurora', 'Léa', 'L', 'nebula'], ['Tempête', 'Sam', 'W', 'prism'], ['Mirage', 'Noor', 'P', 'gold']];
      for (const [i, [nm, au, ty, fx]] of P.entries()) { const c = clone(TEMPLATE); Object.assign(c, { id: 'demo-' + au, name: nm, type: ty, fx, pal: PALS[i % PALS.length], hp: 150 + i * 60, t: Date.now() }); await cloud.submit(wk, { id: 'e-demo-' + au.toLowerCase(), uk: 'demo:' + au.toLowerCase(), author: 'Démo ' + au, t: Date.now() - i * 1000, card: c, hasImg: false }); }
    } else if (k === 'end') lsSet('mycard-demo-off', demoOff() + 1);
    else if (k === 'back') lsSet('mycard-demo-off', 0);
    else if (k === 'clear') { const all = await cloud.allEntries(); Object.values(all).flat().forEach(x => media.del('ent:' + x.id)); (await cloud.extras()).forEach(x => media.del('ext:' + x.id)); await cloud.clear(); }
    load();
  };

  return (
    <section className="screen" id="contest">
      <header className="top"><div className="tt"><h1>{tr('contest.title')}</h1><p className="sub" id="ct-week">{tr('contest.week', { n: +d.wk.split('-W')[1], t: fmtLeft(weekEnd() - nowD()) })}</p></div></header>
      <div className="scroll"><div className="wrap">
        <p className="demo">{tr('contest.demo')}</p>
        <div className="group pad" id="ct-mine">
          <h2 className="sec-h" style={{ marginTop: 0 }}>{tr('contest.mine')}</h2>
          {mine ? <><p className="note">{tr('contest.submitted', { name: mine.card.name })}</p><button type="button" className="btn" id="ct-withdraw" style={{ marginTop: 10 }} onClick={withdraw}>{tr('contest.withdraw')}</button></>
            : own.length ? <div className="hrow" style={{ marginTop: 6 }}><select className="inp" id="ct-pick" aria-label={tr('contest.pick')} value={pick} onChange={e => setPick(e.target.value)}>{own.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><button type="button" className="btn primary" id="ct-submit" onClick={submit}>{tr('contest.submit')}</button></div>
              : <p className="note">{tr('contest.noOwn')}</p>}
        </div>
        <h2 className="sec-h">{tr('contest.entries')}</h2>
        {!d.ents.length && <p className="note" id="ct-noent">{tr('contest.noEntries')}</p>}
        <div className="grid" id="ct-grid">
          {ranked.map((e, i) => { const n = cnt[e.id] || 0; return (
            <div className="tile ent" key={e.id}>
              <span className="tcov"><Thumb load={entThumb(e)} deps={[e.id, ver]} />{n > 0 && i < 3 && <span className="rk">{i + 1}</span>}</span>
              <b>{e.card.name}</b><small>{tr('contest.by', { a: e.author })} · {votesText(n)}</small>
              <button type="button" className={'btn sm vote' + (my === e.id ? ' primary' : '')} data-id={e.id} aria-pressed={my === e.id} disabled={e.uk === me} onClick={() => vote(e.id)}>{e.uk === me ? tr('contest.yours') : my === e.id ? tr('contest.voted') : tr('contest.vote')}</button>
            </div>); })}
        </div>
        <h2 className="sec-h">{tr('contest.results')}</h2>
        <div className="group pad" id="ct-res">
          {past.length ? past.map(w => { const r = d.res[w], e = entOf(w, r), st = r.status === 'approved' ? tr('contest.status.approved', { r: rarName(r.rarity) }) : tr('contest.status.' + r.status); return (
            <div className="res" key={w}><b>{tr('contest.weekN', { n: +w.split('-W')[1] })}</b>{e && <> · {e.card.name} {tr('contest.by', { a: e.author })} · {votesText(r.votes)}</>}<small>{st}</small></div>); })
            : <p className="note">{tr('contest.noResults')}</p>}
        </div>
        {isMod() && <>
          <h2 className="sec-h">{tr('contest.mod')}</h2>
          <div className="group pad" id="ct-mod">
            {pend.length ? pend.map(w => { const e = entOf(w, d.res[w]); if (!e) return null; return (
              <div className="mod-item" key={w}><Thumb load={entThumb(e)} deps={[e.id]} /><div><b>{e.card.name}</b> {tr('contest.by', { a: e.author })}<br /><small className="note">{tr('contest.weekN', { n: +w.split('-W')[1] })} · {votesText(d.res[w].votes)}</small>
                <div className="hrow" style={{ marginTop: 8 }}><select className="inp" aria-label={tr('contest.rarityFor')} value={rars[w] || 'rare'} onChange={ev => setRars({ ...rars, [w]: ev.target.value })}>{RARITIES.map(r => <option key={r.k} value={r.k}>{rarName(r.k)}</option>)}</select></div>
                <div className="hrow" style={{ marginTop: 8 }}><button type="button" className="btn sm primary" data-mod="ok" disabled={busy} onClick={() => moderate(w, true)}>{tr('contest.approve')}</button><button type="button" className="btn sm" data-mod="no" disabled={busy} onClick={() => moderate(w, false)}>{tr('contest.reject')}</button></div>
              </div></div>); }) : <p className="note">{tr('contest.modNone')}</p>}
          </div>
        </>}
        <details className="group pad">
          <summary className="sec-h" style={{ margin: 0, cursor: 'pointer' }}>{tr('demo.tools')}</summary>
          <div className="hrow" style={{ marginTop: 10 }}>
            <button type="button" className="btn sm" id="dm-seed" onClick={() => demo('seed')}>{tr('demo.seed')}</button>
            <button type="button" className="btn sm" id="dm-end" onClick={() => demo('end')}>{tr('demo.endWeek')}</button>
            <button type="button" className="btn sm" id="dm-back" onClick={() => demo('back')}>{tr('demo.backWeek')}</button>
            <button type="button" className="btn sm" id="dm-clear" onClick={() => demo('clear')}>{tr('demo.clear')}</button>
          </div>
        </details>
      </div></div>
    </section>
  );
}
