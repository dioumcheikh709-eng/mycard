'use strict';
/* MyCard — serveur : connexion « Se connecter avec Google ».
   Aucune dépendance : uniquement les modules fournis avec Node (http, crypto, fs, fetch).
   Configuration par variables d'environnement (voir .env.example). */
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const PORT = +process.env.PORT || 8080;
const CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();          /* public : « …apps.googleusercontent.com » */
const CERTS_URL = process.env.GOOGLE_CERTS_URL || 'https://www.googleapis.com/oauth2/v3/certs';
const SESSION_DAYS = +process.env.SESSION_DAYS || 30;
const FORCE_SECURE = process.env.COOKIE_SECURE === '1';
const COOKIE = 'mycard_session';
const STATIC = { '/': 'index.html', '/index.html': 'index.html', '/universal-cards.js': 'universal-cards.js' };

fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });

/* ---------- secret de session : variable d'environnement, sinon fichier créé une fois (jamais dans le dépôt) ---------- */
function loadSecret() {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32) return Buffer.from(process.env.SESSION_SECRET);
  const f = path.join(DATA_DIR, 'session.key');
  try { return Buffer.from(fs.readFileSync(f, 'utf8').trim(), 'hex'); } catch (e) { /* première fois */ }
  const k = crypto.randomBytes(32);
  fs.writeFileSync(f, k.toString('hex'), { mode: 0o600 });
  return k;
}
const SECRET = loadSecret();

/* ---------- joueurs : un petit fichier JSON, écrit de façon atomique ---------- */
const USERS_FILE = path.join(DATA_DIR, 'users.json');
let users = {};
try { users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch (e) { users = {}; }
let writing = Promise.resolve();
function saveUsers() {
  writing = writing.then(() => new Promise(res => {
    const tmp = USERS_FILE + '.tmp';
    fs.writeFile(tmp, JSON.stringify(users, null, 1), { mode: 0o600 }, err => {
      if (err) { console.error('écriture users.json :', err.message); return res(); }
      fs.rename(tmp, USERS_FILE, e2 => { if (e2) console.error('renommage users.json :', e2.message); res(); });
    });
  }));
  return writing;
}

/* ---------- utilitaires ---------- */
const b64u = b => Buffer.from(b).toString('base64url');
const unb64u = s => Buffer.from(s, 'base64url');
const sign = s => crypto.createHmac('sha256', SECRET).update(s).digest('base64url');
const safeEq = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };

function makeSession(sub) {
  const body = b64u(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400 }));
  return body + '.' + sign(body);
}
function readSession(tok) {
  if (typeof tok !== 'string') return null;
  const [body, mac] = tok.split('.');
  if (!body || !mac || !safeEq(mac, sign(body))) return null;
  try { const p = JSON.parse(unb64u(body).toString()); return p.exp > Date.now() / 1000 && users[p.sub] ? p : null; } catch (e) { return null; }
}
function parseCookies(h) {
  const o = {};
  (h || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
  return o;
}
const isSecure = req => FORCE_SECURE || req.headers['x-forwarded-proto'] === 'https';
function cookieHeader(req, value, maxAge) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}` + (isSecure(req) ? '; Secure' : '');
}

/* ---------- vérification du jeton Google (RS256, clés publiques de Google) ---------- */
let certs = { keys: {}, until: 0, tried: 0 };
async function googleKey(kid) {
  const now = Date.now();
  if (certs.keys[kid] && now < certs.until) return certs.keys[kid];
  if (now - certs.tried < 10000 && !certs.keys[kid]) return null;       /* pas plus d'un rechargement toutes les 10 s */
  certs.tried = now;
  const r = await fetch(CERTS_URL, { signal: AbortSignal.timeout(5000) });
  if (!r.ok) throw new Error('clés Google indisponibles (' + r.status + ')');
  const age = /max-age=(\d+)/.exec(r.headers.get('cache-control') || '');
  const j = await r.json();
  const keys = {};
  for (const k of j.keys || []) if (k.kid && k.kty === 'RSA') keys[k.kid] = crypto.createPublicKey({ key: k, format: 'jwk' });
  certs = { keys, until: now + (age ? +age[1] * 1000 : 3600000), tried: now };
  return keys[kid] || null;
}
async function verifyGoogleToken(token) {
  if (typeof token !== 'string' || token.length > 4096) throw new Error('jeton absent ou trop long');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('jeton mal formé');
  let head, payload;
  try { head = JSON.parse(unb64u(parts[0]).toString()); payload = JSON.parse(unb64u(parts[1]).toString()); } catch (e) { throw new Error('jeton illisible'); }
  if (head.alg !== 'RS256') throw new Error('algorithme refusé');
  const key = await googleKey(head.kid);
  if (!key) throw new Error('clé inconnue');
  const ok = crypto.verify('RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]), key, unb64u(parts[2]));
  if (!ok) throw new Error('signature invalide');
  const now = Date.now() / 1000;
  if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') throw new Error('émetteur inattendu');
  if (payload.aud !== CLIENT_ID) throw new Error('jeton destiné à une autre application');
  if (!(payload.exp > now - 30)) throw new Error('jeton expiré');
  if (payload.iat && payload.iat > now + 300) throw new Error('jeton daté du futur');
  if (!payload.sub || typeof payload.sub !== 'string') throw new Error('identifiant absent');
  if (payload.email_verified !== true && payload.email_verified !== 'true') throw new Error('e-mail non vérifié');
  return payload;
}

/* ---------- limitation simple : tentatives de connexion par adresse ---------- */
const hits = new Map();
function tooMany(ip) {
  const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < 60000);
  a.push(now); hits.set(ip, a);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < 60000)) hits.delete(k);
  return a.length > 20;
}

/* ---------- HTTP ---------- */
const publicUser = u => ({ id: u.id, name: u.name, picture: u.picture || '', email: u.email });
function send(res, code, obj, headers) {
  const body = JSON.stringify(obj);
  res.writeHead(code, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }, headers));
  res.end(body);
}
function readJson(req, limit = 16384) {
  return new Promise((ok, ko) => {
    let n = 0, big = false; const chunks = [];
    req.on('data', c => { n += c.length; if (big) return; if (n > limit) { big = true; chunks.length = 0; ko(Object.assign(new Error('corps trop grand'), { code: 413 })); } else chunks.push(c); });
    req.on('end', () => { if (big) return; try { ok(JSON.parse(Buffer.concat(chunks).toString() || '{}')); } catch (e) { ko(Object.assign(new Error('JSON invalide'), { code: 400 })); } });
    req.on('error', ko);
  });
}
/* Requêtes qui modifient quelque chose : JSON obligatoire + origine identique (protège contre les formulaires venus d'autres sites). */
function sameOriginJson(req) {
  if (!/^application\/json/i.test(req.headers['content-type'] || '')) return false;
  const o = req.headers.origin;
  if (!o) return true;
  try { return new URL(o).host === req.headers.host; } catch (e) { return false; }
}
const sessionOf = req => readSession(parseCookies(req.headers.cookie)[COOKIE]);

async function handle(req, res) {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  if (p.startsWith('/api/')) {
    if (p === '/api/config' && req.method === 'GET') return send(res, 200, { googleClientId: CLIENT_ID || null });
    if (p === '/api/me' && req.method === 'GET') {
      const s = sessionOf(req);
      return send(res, 200, { user: s ? publicUser(users[s.sub]) : null });
    }
    if (p === '/api/auth/google' && req.method === 'POST') {
      if (!CLIENT_ID) return send(res, 503, { error: 'Connexion Google non configurée sur ce serveur.' });
      if (!sameOriginJson(req)) return send(res, 403, { error: 'Requête refusée.' });
      if (tooMany(req.socket.remoteAddress)) return send(res, 429, { error: 'Trop de tentatives, réessaie dans une minute.' });
      let body;
      try { body = await readJson(req); } catch (e) { return send(res, e.code || 400, { error: e.message }, { Connection: 'close' }); }
      let g;
      try { g = await verifyGoogleToken(body.credential); }
      catch (e) { console.warn('jeton refusé :', e.message); return send(res, 401, { error: 'Jeton Google refusé.' }); }
      const now = new Date().toISOString();
      const prev = users[g.sub];
      const name = String(g.given_name || g.name || (g.email || '').split('@')[0] || 'Joueur').slice(0, 24);
      users[g.sub] = { id: g.sub, name: prev ? prev.name : name, email: g.email || '', picture: /^https:\/\//.test(g.picture || '') ? g.picture : '', created: prev ? prev.created : now, last: now };
      await saveUsers();
      return send(res, 200, { user: publicUser(users[g.sub]), created: !prev }, { 'Set-Cookie': cookieHeader(req, makeSession(g.sub), SESSION_DAYS * 86400) });
    }
    if (p === '/api/logout' && req.method === 'POST') {
      if (!sameOriginJson(req)) return send(res, 403, { error: 'Requête refusée.' });
      return send(res, 200, { ok: true }, { 'Set-Cookie': cookieHeader(req, '', 0) });
    }
    return send(res, 404, { error: 'Introuvable.' });
  }
  /* fichiers de l'appli : liste fermée, rien d'autre n'est servi */
  const f = STATIC[p];
  if (f && (req.method === 'GET' || req.method === 'HEAD')) {
    fs.readFile(path.join(ROOT, f), (err, buf) => {
      if (err) { res.writeHead(404); return res.end('Introuvable'); }
      res.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : buf);
    });
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Introuvable');
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(e => { console.error(e); if (!res.headersSent) send(res, 500, { error: 'Erreur du serveur.' }); else res.end(); });
});
server.requestTimeout = 15000;
if (require.main === module) {
  server.listen(PORT, () => console.log(`MyCard sur http://localhost:${PORT} — connexion Google ${CLIENT_ID ? 'activée' : 'NON configurée (GOOGLE_CLIENT_ID manquant)'}`));
}
module.exports = { server, verifyGoogleToken };
