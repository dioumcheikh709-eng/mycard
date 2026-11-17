/* Connexion Google : active seulement si le serveur MyCard répond et annonce un ID client (sinon le bouton reste « bientôt »).
   Le jeton remis par Google est vérifié par le serveur (server/server.js), qui ouvre une session par cookie. */
import { lang } from './i18n.js';

const st = { ready: false, gsi: false, clientId: null, started: null };
let handlers = {};
export const googleState = () => ({ ready: st.ready, gsi: st.gsi });
const jpost = (url, body) => fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });

async function onCredential(resp) {
  try {
    const r = await jpost('/api/auth/google', { credential: resp && resp.credential });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j || !j.user) { handlers.onError && handlers.onError(); return; }
    handlers.onCredential && handlers.onCredential(j.user);
  } catch (e) { handlers.onError && handlers.onError(); }
}
function loadGsi() {
  return new Promise((ok, ko) => {
    if (window.google && google.accounts && google.accounts.id) return ok();
    const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = ok; s.onerror = () => ko(new Error('gsi')); document.head.appendChild(s);
  });
}
export function initGoogle(h) {
  handlers = h;
  if (st.started) { st.started.then(() => { h.onChange && h.onChange(); }); return st.started; }
  st.started = (async () => {
    if (!/^https?:$/.test(location.protocol)) return;                              /* ouvert comme simple fichier : pas de serveur */
    let cfg;
    try { const r = await fetch('/api/config', { credentials: 'same-origin' }); if (!r.ok) return; cfg = await r.json(); } catch (e) { return; }
    if (!cfg || typeof cfg.googleClientId !== 'string' || !/^[\w.-]+\.apps\.googleusercontent\.com$/.test(cfg.googleClientId)) return;
    st.ready = true; st.clientId = cfg.googleClientId; handlers.onChange && handlers.onChange();
    try { const r = await fetch('/api/me', { credentials: 'same-origin' }); const j = await r.json(); if (j && j.user) handlers.onSession && handlers.onSession(j.user); } catch (e) { /* ignoré */ }
    try { await loadGsi(); } catch (e) { return; }                                   /* hors ligne : le bouton « Google » reste affiché avec son message */
    google.accounts.id.initialize({ client_id: st.clientId, callback: onCredential, auto_select: false, cancel_on_tap_outside: true });
    st.gsi = true; handlers.onChange && handlers.onChange();
  })();
  return st.started;
}
export function renderGoogleBtn(box) {
  if (!st.gsi || !window.google || !google.accounts) return;
  box.innerHTML = '';
  const w = handlers.width ? handlers.width() : 280;
  try { google.accounts.id.renderButton(box, { type: 'standard', theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', width: w, locale: lang }); } catch (e) { /* ignoré */ }
}
export async function googleLogout() {
  meP = null;
  try { await jpost('/api/logout'); } catch (e) { /* ignoré */ }
  try { if (window.google && google.accounts) google.accounts.id.disableAutoSelect(); } catch (e) { /* ignoré */ }
}
let meP = null;   /* une seule demande par session (l'écran Profil peut être reconstruit, ex. changement de thème) */
export function googleMe() {
  if (!/^https?:$/.test(location.protocol)) return Promise.resolve(null);
  return meP || (meP = fetch('/api/me', { credentials: 'same-origin' }).then(r => r.ok ? r.json() : null).then(j => j && j.user || null).catch(() => null));
}
