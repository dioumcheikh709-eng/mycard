/* Profil et réglages : compte, langue, thème, apparence des cartes, modérateur, confidentialité. */
import { useEffect, useState } from 'react';
import { useApp } from '../state.jsx';
import { tr, LANGS } from '../lib/i18n.js';
import { themePrice } from '../lib/shop.js';
import { IcoCamera, IcoLock } from '../components/icons.jsx';
import { isMod, modHash, MOD_HASH, bioGet, bioSupported, bioEnroll, bioVerify, BIO_KEY } from '../lib/cloud.js';
import { lsSet, lsDel } from '../lib/store.js';
import { googleLogout, googleMe } from '../lib/auth.js';
import { Screen } from '../components/ui.jsx';

export function Profile() {
  const { user, logout, lang, setLang, theme, THEMES, setTheme, canUse, setTab, setShopFocus, toast, gAcct, setGAcct, avatar, setAvatar } = useApp();
  const [mod, setMod] = useState(isMod());
  useEffect(() => { if (!gAcct) googleMe().then(a => a && setGAcct(a)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Screen id="settings" hello={tr('deck.hello', { user })} title={tr('settings.title')}>
        <div>
          <p className="group-h">{tr('settings.account')}</p>
          <div className="group">
            <div className="row" style={{ gap: 14, paddingBlock: 14 }}>
              <label className="avatar" id="set-avatar" aria-label={avatar ? tr('profile.photoChange') : tr('profile.photoAdd')}>
                {avatar ? <img src={avatar} alt={tr('profile.photo')} /> : <span aria-hidden="true">{(user || '?').trim().charAt(0).toUpperCase()}</span>}
                <span className="cam" aria-hidden="true"><IcoCamera /></span>
                <input type="file" accept="image/*" id="f-avatar" onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) toAvatar(f).then(setAvatar).catch(() => toast(tr('profile.photoBad'))); }} />
              </label>
              <div className="grow"><b style={{ font: "700 20px 'Barlow Condensed',Tajawal,sans-serif" }}>{user}</b><small>{avatar ? tr('profile.photoChange') : tr('profile.photoAdd')}</small>
                {avatar && <button type="button" className="link" id="avatar-del" style={{ padding: '4px 0' }} onClick={() => setAvatar(null)}>{tr('profile.photoRemove')}</button>}</div>
            </div>
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
          <div className="seg" id="set-theme">{THEMES.map(c => { const ok = canUse(c); return (
            <button type="button" key={c} data-t={c} className={ok ? '' : 'locked'} aria-pressed={c === theme} onClick={() => { if (ok) setTheme(c); else { toast(tr('theme.locked')); setShopFocus('themes'); setTab('shop'); } }}>
              <span className="tsw" data-t={c} aria-hidden="true" />{tr('theme.' + c)}{!ok && <span className="lock"><IcoLock />{themePrice(c)}</span>}
            </button>); })}</div>
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

/* photo de profil : carré central, 256 × 256, JPEG */
function toAvatar(file) {
  return new Promise((ok, no) => {
    const r = new FileReader(); r.onerror = no;
    r.onload = () => { const im = new Image(); im.onerror = no; im.onload = () => {
      const n = Math.min(im.width, im.height), cv = document.createElement('canvas'); cv.width = cv.height = 256;
      cv.getContext('2d').drawImage(im, (im.width - n) / 2, (im.height - n) / 2, n, n, 0, 0, 256, 256); ok(cv.toDataURL('image/jpeg', .85));
    }; im.src = r.result; };
    r.readAsDataURL(file);
  });
}
