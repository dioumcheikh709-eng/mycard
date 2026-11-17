/* Studio : la carte en grand (inclinaison, gyroscope, effets) + consultation ou personnalisation par étapes.
   La page ne défile jamais : la carte s'adapte à la place disponible, le panneau des réglages défile seul. */
import { useEffect, useRef, useState } from 'react';
import { useApp, buzz } from '../state.jsx';
import { tr, lines } from '../lib/i18n.js';
import { TY, FRAMES, FX_LIST, cssLin, svgOf, typeName, plain, toStored, rarName, RARITIES, fxOf } from '../lib/cards.js';
import { media, uk, session, cardImage } from '../lib/store.js';
import { cloud, isMod, catalog } from '../lib/cloud.js';
import { pngBlob, gifBlob } from '../lib/gif.js';
import * as engine from '../lib/fxEngine.js';
import { CardStage } from '../components/Card.jsx';
import { Sheet } from '../components/ui.jsx';
import { IcoClose, IcoShare, IcoDownload, IcoGyro, IcoEdit, IcoTrash, IcoImage, IcoCamera, IcoSparkle } from '../components/icons.jsx';

const STEPS = ['image', 'card', 'ability', 'attack', 'rule', 'effect'];
let framed = false; try { framed = self !== top; } catch (e) { framed = true; }
const baseName = c => String(c.name || '').normalize('NFC').replace(/[^\p{L}\p{N}-]+/gu, '_').replace(/^_+|_+$/g, '') || 'MyCard';
async function saveBlob(b, name) {
  const d = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
  if (d) { try { await d.save({ filename: name, data: b }); } catch (e) { if (e && e.code !== 'declined') throw e; } return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
}
const slug = s => String(s || 'carte').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'carte';

export function Studio() {
  const { studio, setStudio, deck, updateCard, closeStudio, cancelEdit, startEdit, deleteCard, ask, toast } = useApp();
  const c = studio && deck.find(x => x.id === studio.id);
  const [step, setStep] = useState(0);
  const [intro, setIntro] = useState(!!(studio && studio.intro));
  const [flip, setFlip] = useState(studio && studio.intro ? 'rise' : 'drop');
  const [hint, setHint] = useState(tr('stage.hintDefault'));
  const [gyro, setGyroUi] = useState(engine.gyroState());
  const [exp, setExp] = useState(null);                 /* 'download' | 'share' */
  const [shareReady, setShareReady] = useState(null);
  const [uniOpen, setUniOpen] = useState(false);
  const msgUntil = useRef(0), stepsRef = useRef(null);
  const editing = studio && studio.mode === 'edit';
  const xmsg = m => { setHint(m); msgUntil.current = performance.now() + 6000; };

  /* gyroscope : actif d'office sur Android, à demander sur iPhone */
  useEffect(() => engine.subscribe(() => setGyroUi(engine.gyroState())), []);
  useEffect(() => {
    let last = 0;
    engine.onGyro((b, g) => { const n = performance.now(); if (n - last > 250 && n > msgUntil.current) { last = n; setHint(tr('gyro.sensorActive', { b: b.toFixed(0), g: g.toFixed(0) })); } });
    if (engine.touchy && !engine.needsAsk) toggleGyro(true);
    return () => { engine.onGyro(null); engine.setGyro(false); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const explain = () => { let m = tr('gyro.noMotion'); if (!window.isSecureContext) m += tr('gyro.httpsNeeded'); else if (framed) m += tr('gyro.framed'); else m += engine.needsAsk ? tr('gyro.reload') : tr('gyro.checkSettings'); setHint(m); };
  async function toggleGyro(on) {
    const r = await engine.setGyro(on);
    if (r === 'denied') setHint(tr('gyro.permissionDenied')); else if (r === 'error') explain();
    else if (r === 'on') { setHint(tr('gyro.tiltNow')); setTimeout(() => { const s = engine.gyroState(); if (s.wanted && !s.on) explain(); }, 1800); }
    else setHint(tr('stage.hintDefault'));
  }
  useEffect(() => { if (stepsRef.current) { const b = stepsRef.current.children[step]; if (b) b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); } }, [step]);
  useEffect(() => { if (studio && !c) setStudio(null); }, [studio, c, setStudio]);
  if (!studio || !c) return null;

  const set = fn => updateCard(c.id, fn);
  const back = async () => {
    if (!editing) { closeStudio(); return; }
    const yes = await ask(tr('confirm.cancelTitle'), studio.isNew ? tr('confirm.cancelNewText') : tr('confirm.cancelEditText'), studio.isNew ? tr('confirm.cancelNewYes') : tr('confirm.cancelEditYes'));
    if (yes) cancelEdit();
  };
  const done = () => { closeStudio(); toast(tr('toast.saved')); };
  const del = async () => { if (await ask(tr('panel.deleteCard'), tr('panel.confirmDelete'), tr('panel.deleteCard'), true)) { deleteCard(c.id); setStudio(null); toast(tr('toast.deleted')); } };

  /* -------- export -------- */
  async function deliver(blob, name, type, title, intent) {
    if (intent === 'share') {
      const f = new File([blob], name, { type });
      if (navigator.canShare && navigator.canShare({ files: [f] })) {
        try { await navigator.share({ files: [f], title }); return; }
        catch (e) { if (e.name === 'AbortError') return; if (e.name === 'NotAllowedError') { setShareReady({ f, title }); xmsg(tr('export.shareTap')); return; } }
      }
      xmsg(tr('export.shareUnavailable'));
    }
    try { await saveBlob(blob, name); } catch (e) { xmsg(tr('export.dlError', { err: e.code || '?' })); }
  }

  return (
    <div className={'studio' + (editing ? ' editing' : ' viewing')} id="studio">
      <header className="studio-top">
        <button type="button" className="ibtn" id="e-back" onClick={back} aria-label={editing ? tr('confirm.cancelTitle') : tr('drop.close')}><IcoClose /></button>
        <div className="ttl">{c.name || 'MyCard'}</div>
        {!editing && <>
          <button type="button" className="ibtn" id="sh" onClick={() => setExp('share')} aria-label={tr('stage.share')}><IcoShare /></button>
          <button type="button" className="ibtn" id="dl" onClick={() => setExp('download')} aria-label={tr('stage.download')}><IcoDownload /></button>
        </>}
        {editing && <button type="button" className="ibtn" id="e-del" onClick={del} aria-label={tr('panel.deleteCard')}><IcoTrash /></button>}
      </header>
      <div className="stage-area"><CardStage c={c} flip={flip} /></div>
      <p className="studio-hint" id="hint" role="status">{hint}</p>
      {!editing && (
        <div className="viewbar">
          {!c.uni && <button type="button" className="btn primary" id="v-edit" onClick={() => { setStep(0); startEdit(); }}><IcoEdit />{tr('stage.personalize')}</button>}
          {engine.touchy && <button type="button" className="btn" id="gyro" aria-pressed={gyro.wanted} onClick={() => toggleGyro(!gyro.wanted)}><IcoGyro />{gyro.wanted ? tr('stage.gyroActive') : tr('stage.gyroActivate')}</button>}
          {shareReady && <button type="button" className="btn primary" id="sh-ready" onClick={async () => { const s = shareReady; setShareReady(null); try { await navigator.share({ files: [s.f], title: s.title }); } catch (e) { if (e.name !== 'AbortError') { xmsg(tr('export.shareUnavailable')); await saveBlob(s.f, s.f.name); } } }}>{tr('export.shareNow')}</button>}
          {isMod() && !c.uni && <button type="button" className="btn" id="v-uni-open" onClick={() => setUniOpen(true)}>{tr('uni.add')}</button>}
          {!c.uni && <button type="button" className="btn icon" id="v-del" onClick={del} aria-label={tr('panel.deleteCard')}><IcoTrash /></button>}
        </div>
      )}
      {editing && !intro && (
        <section className="dock" id="panel" aria-label={tr('stage.personalize')}>
          <nav className="steps" id="steps" ref={stepsRef} aria-label={tr('panel.stepsAria')}>
            {STEPS.map((s, i) => <button type="button" key={s} className="chip" aria-pressed={i === step} onClick={() => setStep(i)}>{i + 1}. {tr('panel.step.' + s)}</button>)}
          </nav>
          <div className="dock-body" key={step}><StepBody step={STEPS[step]} c={c} set={set} toast={toast} /></div>
          <div className="dock-nav">
            <button type="button" className="btn" id="s-prev" disabled={step === 0} onClick={() => setStep(step - 1)}>{tr('panel.prev')}</button>
            <button type="button" className="btn primary" id="s-next" onClick={() => step === STEPS.length - 1 ? done() : setStep(step + 1)}>{step === STEPS.length - 1 ? tr('panel.done') : tr('panel.next')}</button>
          </div>
        </section>
      )}
      {intro && (
        <div className="intro" id="intro">
          <h2>{lines('intro.title').map((l, i, a) => <span key={i}>{l}{i < a.length - 1 && <br />}</span>)}</h2>
          <button type="button" id="lesgo" className="btn primary" onClick={() => { setIntro(false); setFlip('flip'); buzz(15); }}>{tr('intro.go')}</button>
        </div>
      )}
      {exp && <ExportSheet c={c} intent={exp} onClose={() => setExp(null)} deliver={deliver} xmsg={xmsg} />}
      {uniOpen && <UniSheet c={c} onClose={() => setUniOpen(false)} toast={toast} />}
    </div>
  );
}

/* -------- les étapes de personnalisation -------- */
const TypeOpts = ({ none }) => <>{none && <option value="">—</option>}{Object.keys(TY).map(k => <option key={k} value={k}>{typeName(k)}</option>)}</>;
function StepBody({ step, c, set, toast }) {
  const m0 = c.mv[0] || { n: '', d: '', t: '', c: '' };
  const recenter = d => { d.zoom = 1; d.px = 0; d.py = 0; };
  if (step === 'image') {
    const onFile = e => {
      const f = e.target.files[0]; if (!f) return; const input = e.target;
      const bad = () => { toast(tr('panel.image.bad')); input.value = ''; };
      const r = new FileReader(); r.onerror = bad;
      r.onload = () => {
        const im = new Image(); im.onerror = bad;
        im.onload = () => {
          const kk = Math.min(1, 1600 / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * kk); cv.height = Math.round(im.height * kk);
          const g = cv.getContext('2d'); g.drawImage(im, 0, 0, cv.width, cv.height);
          let alpha = false; if (/png|webp|gif/i.test(f.type)) { const d = g.getImageData(0, 0, cv.width, cv.height).data; for (let i = 3; i < d.length; i += 16) if (d[i] < 250) { alpha = true; break; } }
          const url = alpha ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', .9);
          set(d => { d.img = url; d.hasImg = true; recenter(d); }); input.value = '';
        };
        im.src = r.result;
      };
      r.readAsDataURL(f);
    };
    return <>
      <label className="upload"><IcoImage /><span>{tr('panel.image.choose')}</span><input type="file" id="f-img" accept="image/*" onChange={onFile} /></label>
      {c.img && <>
        <label className="field"><span>{tr('panel.image.zoom')}</span><input type="range" id="f-zoom" min="1" max="3" step="0.01" value={c.zoom || 1} onChange={e => set(d => { d.zoom = +e.target.value; })} /></label>
        <div className="two">
          <label className="field"><span>{tr('panel.image.posH')}</span><input type="range" id="f-x" min="-50" max="50" step="1" value={c.px || 0} onChange={e => set(d => { d.px = +e.target.value; })} /></label>
          <label className="field"><span>{tr('panel.image.posV')}</span><input type="range" id="f-y" min="-50" max="50" step="1" value={c.py || 0} onChange={e => set(d => { d.py = +e.target.value; })} /></label>
        </div>
        <div className="two"><button type="button" className="btn" id="f-center" onClick={() => set(recenter)}>{tr('panel.image.recenter')}</button><button type="button" className="btn" id="f-reset" onClick={() => set(d => { d.img = null; d.hasImg = false; recenter(d); })}>{tr('panel.image.remove')}</button></div>
      </>}
    </>;
  }
  if (step === 'card') return <>
    <label className="field"><span>{tr('panel.card.name')}</span><input className="inp" type="text" id="f-name" maxLength={12} value={c.name} onChange={e => set(d => { d.name = e.target.value; })} /></label>
    <div className="two">
      <label className="field"><span>{tr('panel.card.hp')}</span><input className="inp" type="text" id="f-hp" inputMode="numeric" maxLength={4} value={c.hp} onChange={e => set(d => { d.hp = e.target.value; })} /></label>
      <label className="field"><span>{tr('panel.card.special')}</span><input className="inp" type="text" id="f-special" maxLength={16} value={c.special || ''} onChange={e => set(d => { d.special = e.target.value; })} /></label>
    </div>
    <label className="field"><span>{tr('panel.card.evo')}</span><input className="inp" type="text" id="f-evo" maxLength={30} value={c.evo || ''} onChange={e => set(d => { d.evo = e.target.value; })} /></label>
    <div className="field"><span>{tr('panel.card.type')}</span>
      <div className="tgrid" id="tgrid">{Object.entries(TY).map(([k, v]) => <button type="button" key={k} data-k={k} aria-pressed={k === c.type} title={typeName(k)} onClick={() => set(d => { d.type = k; })}><span className="dot" style={{ '--c': v.c, '--l': v.l }} dangerouslySetInnerHTML={{ __html: svgOf(k) }} /><small>{typeName(k)}</small></button>)}</div>
    </div>
    {!c.uni && <div className="field"><span>{tr('panel.card.frame')}</span>
      <div className="seg" id="frgrid">{Object.keys(FRAMES).map(v => <button type="button" key={v} data-v={v} aria-pressed={v === (FRAMES[c.frame] ? c.frame : 'night')} onClick={() => set(d => { d.frame = v; })}><i className="fsw" style={{ background: cssLin(FRAMES[v]) }} aria-hidden="true" />{tr('look.frame.' + v)}</button>)}</div>
      <small className="note">{tr('look.note')}</small>
    </div>}
  </>;
  if (step === 'ability') return <>
    <div className="row" style={{ padding: 0, minHeight: 44 }}><span className="grow">{tr('panel.ability.show')}</span><button type="button" role="switch" className="toggle" id="f-ab-on" aria-checked={!!c.ab.on} aria-label={tr('panel.ability.show')} onClick={() => set(d => { d.ab.on = !d.ab.on; })} /></div>
    <label className="field"><span>{tr('panel.ability.name')}</span><input className="inp" type="text" id="f-ab-n" maxLength={22} value={c.ab.n} onChange={e => set(d => { d.ab.n = e.target.value; })} /></label>
    <label className="field"><span>{tr('panel.ability.text')}</span><textarea className="inp" id="f-ab-t" maxLength={260} value={plain(c.ab.t)} onChange={e => set(d => { d.ab.t = toStored(e.target.value); })} /></label>
  </>;
  if (step === 'attack') {
    const cs = [...(m0.c || '')];
    return <>
      <div className="two">
        <label className="field"><span>{tr('panel.attack.name')}</span><input className="inp" type="text" id="f-atk" maxLength={22} value={m0.n} onChange={e => set(d => { d.mv[0].n = e.target.value; })} /></label>
        <label className="field"><span>{tr('panel.attack.damage')}</span><input className="inp" type="text" id="f-dmg" maxLength={5} value={m0.d} onChange={e => set(d => { d.mv[0].d = e.target.value; })} /></label>
      </div>
      <label className="field"><span>{tr('panel.attack.text')}</span><textarea className="inp" id="f-atkt" maxLength={260} value={plain(m0.t || '')} onChange={e => set(d => { d.mv[0].t = toStored(e.target.value); })} /></label>
      <div className="field"><span>{tr('panel.attack.energies')}</span>
        <div className="mini-energies" id="f-en">{[0, 1, 2, 3].map(i => <select key={i} className="inp" value={cs[i] || ''} aria-label={tr('panel.attack.energies') + ' ' + (i + 1)} onChange={e => set(d => { const a = [...(d.mv[0].c || '')]; a[i] = e.target.value; d.mv[0].c = [0, 1, 2, 3].map(j => a[j] || '').join(''); })}><TypeOpts none /></select>)}</div>
      </div>
      <label className="field"><span>{tr('panel.attack.weakness')}</span><select className="inp" id="f-weak" value={c.weak[0]} onChange={e => set(d => { d.weak[0] = e.target.value; })}><TypeOpts /></select></label>
    </>;
  }
  if (step === 'rule') return <>
    <label className="field"><span>{tr('panel.rule.title')}</span><input className="inp" type="text" id="f-rt" maxLength={20} value={c.rule ? c.rule.t : ''} onChange={e => set(d => { d.rule = { ...(d.rule || { x: '' }), t: e.target.value }; })} /></label>
    <label className="field"><span>{tr('panel.rule.text')}</span><textarea className="inp" id="f-rx" maxLength={140} value={c.rule ? c.rule.x : ''} onChange={e => set(d => { d.rule = { ...(d.rule || { t: '' }), x: e.target.value }; })} /></label>
  </>;
  const k = c.k != null ? c.k : 1, fx = fxOf(c.fx);
  return <>
    <div className="field"><span>{tr('panel.effect.label')}</span>
      <div className="fxgrid" id="fxgrid">{FX_LIST.map(v => <button type="button" key={v} data-v={v} aria-pressed={v === fx} onClick={() => set(d => { d.fx = v; })}>{tr('fx.' + v)}</button>)}</div>
    </div>
    <label className="field"><span>{tr('panel.effect.intensity')} <output id="kv">{Math.round(k * 100)}%</output></span><input type="range" id="f-k" min="0" max="2" step="0.05" value={k} onChange={e => set(d => { d.k = +e.target.value; })} /></label>
  </>;
}

/* -------- export : image fixe (PNG) ou animation holo (GIF) -------- */
function ExportSheet({ c, intent, onClose, deliver, xmsg }) {
  const [busy, setBusy] = useState(null);
  const run = async kind => {
    const img = await cardImage(c), card = { ...c, img: img || undefined };
    if (kind === 'png') { onClose(); try { await deliver(await pngBlob(card), baseName(c) + '.png', 'image/png', c.name || 'MyCard', intent); } catch (e) { xmsg(tr('export.errImg')); } return; }
    setBusy({ pct: 0, txt: tr('export.generating', { pct: 0 }) });
    try {
      const blob = await gifBlob(card, (i, n) => setBusy(i == null ? { pct: 100, txt: tr('export.finalizing') } : { pct: Math.round(i / n * 100), txt: tr('export.generating', { pct: Math.round(i / n * 100) }) }));
      onClose(); await deliver(blob, baseName(c) + '.gif', 'image/gif', (c.name || 'MyCard') + ' (Holo)', intent);
    } catch (e) { xmsg(tr('export.errGif')); onClose(); }
  };
  return (
    <Sheet title={intent === 'share' ? tr('export.shareTitle') : tr('export.downloadTitle')} onClose={busy ? () => {} : onClose}>
      <p className="note">{intent === 'share' ? tr('export.shareDesc') : tr('export.downloadDesc')}</p>
      <div className="exp-opts">
        <button type="button" id="exp-opt-png" className="exp-opt" disabled={!!busy} onClick={() => run('png')}><span className="exp-ico"><IcoCamera /></span><strong>{tr('export.pngTitle')}</strong><small>{lines('export.pngDesc').map((l, i) => <span key={i}>{l}<br /></span>)}</small></button>
        <button type="button" id="exp-opt-gif" className="exp-opt hi" disabled={!!busy} onClick={() => run('gif')}><span className="exp-ico"><IcoSparkle /></span><strong>{tr('export.gifTitle')}</strong><small>{lines('export.gifDesc').map((l, i) => <span key={i}>{l}<br /></span>)}</small></button>
      </div>
      {busy && <div id="exp-prog"><div className="prog"><i style={{ width: busy.pct + '%' }} /></div><p className="note" style={{ textAlign: 'center', marginTop: 8 }}>{busy.txt}</p></div>}
    </Sheet>
  );
}

/* -------- modérateur : ajouter la carte à la bibliothèque universelle (sur cet appareil) ou la copier pour le fichier -------- */
function UniSheet({ c, onClose, toast }) {
  const [rar, setRar] = useState(() => { try { return localStorage.getItem('mycard-uni-rar') || 'rare'; } catch (e) { return 'rare'; } });
  const [snippet, setSnippet] = useState('');
  const [copied, setCopied] = useState(false);
  const add = async () => {
    try { localStorage.setItem('mycard-uni-rar', rar); } catch (e) { /* ignoré */ }
    const img = await cardImage(c), id = 'x-' + c.id, existed = (await cloud.extras()).some(x => x.id === id);
    const o = JSON.parse(JSON.stringify({ ...c, img: undefined }));['t', 'c', 'dup', 'uni', 'rar', 'hasImg', 'id'].forEach(k => delete o[k]);
    Object.assign(o, { id, rarity: rar, hasImg: !!img, upd: Date.now(), ill: c.ill || session.user });
    if (img) await media.put('ext:' + id, img); else await media.del('ext:' + id);
    await cloud.addExtra(o); toast(tr(existed ? 'uni.updated' : 'uni.added', { r: rarName(rar) })); onClose();
  };
  const makeSnippet = async () => {
    const img = await cardImage(c), ids = new Set((await catalog()).map(x => x.id)); let id = slug(c.name), n = 2; while (ids.has(id)) id = slug(c.name) + '-' + n++;
    const o = JSON.parse(JSON.stringify({ ...c, img: undefined }));['t', 'c', 'dup', 'uni', 'rar', 'hasImg', 'id'].forEach(k => delete o[k]);
    const out = { id, rarity: rar, ...o }; if (img) out.img = img; setSnippet('  ' + JSON.stringify(out) + ','); setCopied(false);
  };
  return (
    <Sheet title={tr('uni.title')} onClose={onClose}>
      <label className="field"><span>{tr('uni.rarity')}</span><select className="inp" id="v-uni-rar" value={rar} onChange={e => { setRar(e.target.value); setSnippet(''); }}>{RARITIES.map(r => <option key={r.k} value={r.k}>{rarName(r.k)}</option>)}</select></label>
      <button type="button" className="btn primary block" id="v-uni" onClick={add}>{tr('uni.add')}</button>
      <button type="button" className="btn block" id="v-uni-file" onClick={makeSnippet}>{tr('uni.fileBtn')}</button>
      {snippet && <>
        <textarea className="mono" readOnly value={snippet} spellCheck="false" />
        <p className="note">{tr('uni.size', { n: Math.round(snippet.length / 1024 * 10) / 10 })} · {tr('uni.help')}</p>
        <button type="button" className="btn" onClick={async () => { try { await navigator.clipboard.writeText(snippet); setCopied(true); } catch (e) { setCopied(false); } }}>{copied ? tr('uni.copied') : tr('uni.copy')}</button>
      </>}
    </Sheet>
  );
}
