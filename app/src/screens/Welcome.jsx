/* Accueil : choix de la langue (une fois), puis nom d'utilisateur ou connexion Google. */
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../state.jsx';
import { tr, lines, LANGS } from '../lib/i18n.js';
import { lsGet, lsSet } from '../lib/store.js';
import { IcoSend, IcoGoogle, IcoApple } from '../components/icons.jsx';
import { initGoogle, renderGoogleBtn, googleState } from '../lib/auth.js';

export function LangPick() {
  const { setLang, setPhase } = useApp();
  return (
    <div className="welcome screen" id="lang-pick">
      <div className="logo" role="img" aria-label="MyCard">MyCard</div>
      <h1>{tr('lang.title')}</h1>
      <p className="hi">{tr('lang.subtitle')}</p>
      <div className="seg" id="lgrid">
        {LANGS.map(([code, flag, name]) => (
          <button type="button" key={code} data-l={code} onClick={() => { setLang(code); lsSet('mycard-lang-chosen', '1'); setPhase('login'); }}>
            <span className="flag" aria-hidden="true">{flag}</span>{name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Login() {
  const { login, setGAcct, lang } = useApp();
  const [name, setName] = useState(() => lsGet('mycard-user') || '');
  const [err, setErr] = useState('');
  const [g, setG] = useState(googleState());
  const boxRef = useRef(null), ssoRef = useRef(null);
  const go = n => { const v = String(n == null ? name : n).trim(); if (!v) { setErr(tr('login.errNeedName')); return; } login(v.slice(0, 24)); };

  useEffect(() => {
    let live = true;
    initGoogle({
      onCredential: acct => { if (!live) return; setGAcct(acct); go(String(acct.name || '').slice(0, 24)); },
      onError: () => live && setErr(tr('auth.failed')),
      onSession: acct => { if (!live) return; setGAcct(acct); setName(n => n || String(acct.name || '').slice(0, 24)); setErr(tr('auth.signedAs', { name: acct.name })); },
      onChange: () => live && setG(googleState()),
      width: () => Math.max(200, Math.min(400, Math.round(ssoRef.current ? ssoRef.current.getBoundingClientRect().width : 280) || 280)),
    });
    return () => { live = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (g.gsi && boxRef.current) renderGoogleBtn(boxRef.current); }, [g.gsi, lang]);

  const signInWith = provider => {
    if (provider === 'apple' || !g.ready) { setErr(tr('login.errProviderNotReady', { provider: provider === 'apple' ? 'Apple' : 'Google' })); return; }
    if (!g.gsi) setErr(tr('auth.errGsi'));
  };
  return (
    <div className="welcome screen" id="login">
      <div className="logo" role="img" aria-label="MyCard">MyCard</div>
      <p className="hi">{tr('login.hello')}</p>
      <h1>{lines('login.title').map((l, i, a) => <span key={i}>{l}{i < a.length - 1 && <br />}</span>)}</h1>
      <form className="ask" onSubmit={e => { e.preventDefault(); go(); }}>
        <input id="u-name" type="text" maxLength={24} value={name} autoComplete="username" placeholder={tr('login.namePlaceholder')} aria-label={tr('login.nameAria')} onChange={e => { setName(e.target.value); setErr(''); }} />
        <button type="submit" id="u-go" className="send" aria-label={tr('login.continueAria')}><IcoSend /></button>
      </form>
      <div className="or" role="separator"><span>{tr('login.or')}</span></div>
      <div ref={boxRef} id="g-btn" className="g-btn" hidden={!g.gsi} />
      <button type="button" id="sso-google" ref={ssoRef} className="sso g" hidden={g.gsi} onClick={() => signInWith('google')}><IcoGoogle /><span>{tr('login.googleBtn')}</span>{!g.ready && <small>{tr('login.soon')}</small>}</button>
      <button type="button" id="sso-apple" className="sso a" onClick={() => signInWith('apple')}><IcoApple /><span>{tr('login.appleBtn')}</span><small>{tr('login.soon')}</small></button>
      <p className="err" id="u-err" role="status">{err}</p>
      <p className="note">{tr('login.uniqueNote')}</p>
    </div>
  );
}
