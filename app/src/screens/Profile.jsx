/* Profil et réglages : compte, langue, thème, apparence des cartes, modérateur, confidentialité. */
import { useEffect, useState } from 'react';
import { useApp } from '../state.jsx';
import { tr, LANGS } from '../lib/i18n.js';
import { TFONTS, LOOK } from '../lib/cards.js';
import { isMod, modHash, MOD_HASH, bioGet, bioSupported, bioEnroll, bioVerify, BIO_KEY } from '../lib/cloud.js';
import { lsSet, lsDel } from '../lib/store.js';
import { googleLogout, googleMe } from '../lib/auth.js';
import { Screen } from '../components/ui.jsx';

export function Profile() {
  const { user, logout, lang, setLang, theme, THEMES, setTheme, setLook, gAcct, setGAcct, ver } = useApp();
  const [mod, setMod] = useState(isMod());
  useEffect(() => { if (!gAcct) googleMe().then(a => a && setGAcct(a)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Screen id="settings" hello={tr('deck.hello', { user })} title={tr('settings.title')}>
        <div>
          <p className="group-h">{tr('settings.account')}</p>
          <div className="group">
            <div className="row"><div className="grow" id="set-loggedas">{tr('settings.loggedAs', { user })}{gAcct && <small id="set-gacct">{tr('auth.linked', { name: gAcct.name, email: gAcct.email })}</small>}</div></div>
            {gAcct && <button type="button" className="row" id="set-gout" onClick={async () => { await googleLogout(); setGAcct(null); }}>{tr('auth.signOut')}</button>}
            <button type="button" className="row" id="set-change" onClick={logout}>{tr('deck.changeUser')}</button>
          </div>
        </div>
        <div>
          <p className="group-h">{tr('settings.language')}</p>
          <div className="seg" id="set-lgrid">{LANGS.map(([code, flag, name]) => <button type="button" key={code} data-l={code} aria-pressed={code === lang} onClick={() => setLang(code)}><span className="flag" aria-hidden="true">{flag}</span>{name}</button>)}</div>
        </div>
        <div>
          <p className="group-h">{tr('settings.theme')}</p>
          <div className="seg" id="set-theme">{THEMES.map(c => <button type="button" key={c} data-t={c} aria-pressed={c === theme} onClick={() => setTheme(c)}><span className="tsw" data-t={c} aria-hidden="true" />{tr('theme.' + c)}</button>)}</div>
        </div>
        <div key={ver}>
          <p className="group-h">{tr('settings.look')}</p>
          <div className="group pad" style={{ display: 'grid', gap: 10 }}>
            <span className="note">{tr('look.shape')}</span>
            <div className="seg" id="set-shape">{['cut', 'arch'].map(v => <button type="button" key={v} data-v={v} aria-pressed={LOOK.shape === v} onClick={() => setLook('shape', v)}><i className={'shp ' + v} aria-hidden="true" /><span>{tr('look.shape.' + v)}</span></button>)}</div>
            <span className="note">{tr('look.font')}</span>
            <div className="seg" id="set-font">{Object.keys(TFONTS).map(v => <button type="button" key={v} data-v={v} aria-pressed={LOOK.font === v} onClick={() => setLook('font', v)}><span style={{ fontFamily: TFONTS[v], fontSize: 17 }}>{v[0].toUpperCase() + v.slice(1)}</span></button>)}</div>
          </div>
        </div>
        <div>
          <p className="group-h">{tr('settings.mod')}</p>
          <div className="group pad"><ModBlock mod={mod} setMod={setMod} /></div>
        </div>
        <div>
          <p className="group-h">{tr('settings.privacyTitle') !== 'settings.privacyTitle' ? tr('settings.privacyTitle') : 'Confidentialité'}</p>
          <div className="group pad"><p className="note" id="set-privacy">{tr('settings.privacy')}</p></div>
        </div>
        <div className="group pad"><p className="note" id="set-credits">{tr('settings.credits')}</p></div>
    </Screen>
  );
}

function ModBlock({ mod, setMod }) {
  const [u, setU] = useState(''), [code, setCode] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const [bio, setBio] = useState({ has: !!bioGet(), sup: false }), [bioMsg, setBioMsg] = useState('');
  const [lock, setLock] = useState({ fails: 0, until: 0 });
  useEffect(() => { bioSupported().then(sup => setBio({ has: !!bioGet(), sup })); }, [mod]);
  const on = () => { lsSet('mycard-mod', MOD_HASH); setMod(true); setErr(''); };
  const submit = async e => {
    e.preventDefault();
    if (Date.now() < lock.until) { setErr(tr('mod.wait', { s: Math.ceil((lock.until - Date.now()) / 1e3) })); return; }
    if (!(window.crypto && crypto.subtle)) { setErr(tr('mod.nocrypto')); return; }
    setBusy(true); setErr(tr('mod.busy'));
    let good = false; try { good = (await modHash(u.trim(), code)) === MOD_HASH; } catch (_) { /* ignoré */ }
    setBusy(false); setCode('');
    if (good) { setU(''); setLock({ fails: 0, until: 0 }); on(); }
    else { const f = lock.fails + 1; if (f >= 5) { setLock({ fails: 0, until: Date.now() + 6e4 }); setErr(tr('mod.wait', { s: 60 })); } else { setLock({ ...lock, fails: f }); setErr(tr('mod.bad')); } }
  };
  if (mod) return (
    <div style={{ display: 'grid', gap: 10 }} id="mod-out">
      <p className="note">{tr('mod.on')}</p>
      {!bio.has && <button type="button" className="btn" id="mod-bio-on" onClick={async () => { setBioMsg(''); if (!(await bioSupported())) { setBioMsg(tr('mod.bioNone')); return; } try { await bioEnroll(); setBioMsg(tr('mod.bioDone')); } catch (_) { setBioMsg(tr('mod.bioFail')); } setBio({ ...bio, has: !!bioGet() }); }}>{tr('mod.bioOn')}</button>}
      {bio.has && <button type="button" className="btn" id="mod-bio-off" onClick={() => { lsDel(BIO_KEY); setBioMsg(''); setBio({ ...bio, has: false }); }}>{tr('mod.bioOff')}</button>}
      {bioMsg && <p className="note">{bioMsg}</p>}
      <button type="button" className="btn" id="mod-logout" onClick={() => { lsDel('mycard-mod'); setMod(false); }}>{tr('mod.logout')}</button>
      <p className="note">{tr('settings.modNote')}</p>
    </div>
  );
  return (
    <form id="mod-in" style={{ display: 'grid', gap: 10 }} autoComplete="off" onSubmit={submit}>
      <input className="inp" id="mod-user" type="text" autoCapitalize="off" autoCorrect="off" spellCheck="false" placeholder={tr('mod.user')} aria-label={tr('mod.user')} value={u} onChange={e => setU(e.target.value)} />
      <input className="inp" id="mod-code" type="password" placeholder={tr('mod.code')} aria-label={tr('mod.code')} value={code} onChange={e => setCode(e.target.value)} />
      <button type="submit" id="mod-login" className="btn primary" disabled={busy}>{tr('mod.login')}</button>
      {bio.has && bio.sup && <button type="button" className="btn" id="mod-bio-login" onClick={async () => { setErr(''); let good = false; try { good = await bioVerify(); } catch (_) { /* ignoré */ } if (good) on(); else setErr(tr('mod.bioFail')); }}>{tr('mod.bioLogin')}</button>}
      <p className="note" id="mod-err" role="status">{err}</p>
      <p className="note">{tr('settings.modNote')}</p>
    </form>
  );
}
