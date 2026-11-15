'use strict';
/* Test du serveur sans réseau ni compte Google : de fausses clés Google signent des jetons bons et mauvais.
   Lancer : node server/test.js */
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CLIENT = 'test-123.apps.googleusercontent.com';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mycard-'));
const good = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const evil = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = good.publicKey.export({ format: 'jwk' });
let certHits = 0;
const certSrv = http.createServer((q, r) => { certHits++; r.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' }); r.end(JSON.stringify({ keys: [Object.assign({ kid: 'k1', alg: 'RS256', use: 'sig' }, jwk)] })); });

const b64 = o => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
function token(over, opt = {}) {
  const now = Math.floor(Date.now() / 1000);
  const pl = Object.assign({ iss: 'https://accounts.google.com', aud: CLIENT, sub: '1100', email: 'joueur@example.com', email_verified: true, given_name: 'Camille', name: 'Camille D', picture: 'https://lh3.example/p.png', iat: now, exp: now + 3600 }, over);
  const head = b64({ alg: opt.alg || 'RS256', kid: 'k1', typ: 'JWT' });
  const data = head + '.' + b64(pl);
  if (opt.alg === 'none') return data + '.';
  const sig = crypto.sign('RSA-SHA256', Buffer.from(data), (opt.key || good).privateKey).toString('base64url');
  return data + '.' + sig;
}
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };

function call(port, method, p, body, headers = {}) {
  return new Promise((res, rej) => {
    const data = body === undefined ? null : JSON.stringify(body);
    const r = http.request({ port, method, path: p, headers: Object.assign(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}, headers) }, s => {
      let t = ''; s.on('data', c => t += c); s.on('end', () => { let j = null; try { j = JSON.parse(t); } catch (e) { /* pas du JSON */ } res({ status: s.statusCode, body: j, text: t, headers: s.headers }); });
    });
    r.on('error', rej); if (data) r.write(data); r.end();
  });
}
const login = (port, cred, headers) => call(port, 'POST', '/api/auth/google', { credential: cred }, headers);

certSrv.listen(0, '127.0.0.1', async () => {
  const certPort = certSrv.address().port;
  process.env.GOOGLE_CLIENT_ID = CLIENT;
  process.env.GOOGLE_CERTS_URL = `http://127.0.0.1:${certPort}/certs`;
  process.env.DATA_DIR = tmp;
  const { server } = require('./server.js');
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  try {
    let r = await call(port, 'GET', '/api/config');
    ok(r.status === 200 && r.body.googleClientId === CLIENT, 'config : l’ID client public est annoncé');

    r = await call(port, 'GET', '/api/me');
    ok(r.body.user === null, 'sans cookie : personne de connecté');

    r = await login(port, token());
    const ck = (r.headers['set-cookie'] || [''])[0];
    ok(r.status === 200 && r.body.user.name === 'Camille' && r.body.created === true, 'jeton valide : connexion, compte créé');
    ok(/HttpOnly/.test(ck) && /SameSite=Lax/.test(ck), 'cookie HttpOnly et SameSite=Lax');
    ok(!/Secure/.test(ck), 'cookie non Secure en HTTP local');
    const cookie = ck.split(';')[0];

    r = await call(port, 'GET', '/api/me', undefined, { Cookie: cookie });
    ok(r.body.user && r.body.user.email === 'joueur@example.com', 'avec cookie : le joueur est reconnu');

    r = await call(port, 'GET', '/api/me', undefined, { Cookie: cookie.slice(0, -3) + 'xyz' });
    ok(r.body.user === null, 'cookie falsifié : refusé');

    r = await login(port, token(), { Cookie: cookie });
    ok(r.status === 200 && r.body.created === false, 'deuxième connexion : même compte retrouvé');
    ok(certHits === 1, 'clés Google mises en cache (' + certHits + ' téléchargement)');

    ok((await login(port, token({ aud: 'autre.apps.googleusercontent.com' }))).status === 401, 'jeton destiné à une autre appli : refusé');
    ok((await login(port, token({ exp: Math.floor(Date.now() / 1000) - 600 }))).status === 401, 'jeton expiré : refusé');
    ok((await login(port, token({ iss: 'https://evil.example' }))).status === 401, 'mauvais émetteur : refusé');
    ok((await login(port, token({ email_verified: false }))).status === 401, 'e-mail non vérifié : refusé');
    ok((await login(port, token({}, { key: evil }))).status === 401, 'signature d’une autre clé : refusée');
    ok((await login(port, token({}, { alg: 'none' }))).status === 401, 'algorithme « none » : refusé');
    const t = token().split('.'); t[1] = b64({ iss: 'accounts.google.com', aud: CLIENT, sub: '9999', email: 'pirate@example.com', email_verified: true, exp: 9999999999 });
    ok((await login(port, t.join('.'))).status === 401, 'contenu modifié après signature : refusé');
    ok((await login(port, 'n’importe quoi')).status === 401 && (await login(port, 12)).status === 401 && (await login(port, undefined)).status === 401, 'jetons mal formés : refusés');

    r = await call(port, 'POST', '/api/auth/google', { credential: token() }, { Origin: 'https://evil.example' });
    ok(r.status === 403, 'origine étrangère : refusée');
    r = await call(port, 'POST', '/api/auth/google', undefined, { 'Content-Type': 'text/plain' });
    ok(r.status === 403, 'corps non JSON (formulaire d’un autre site) : refusé');
    r = await call(port, 'POST', '/api/auth/google', { credential: 'x'.repeat(40000) });
    ok(r.status === 413, 'corps trop grand : refusé');

    r = await call(port, 'POST', '/api/logout', {}, { Cookie: cookie });
    ok(r.status === 200 && /Max-Age=0/.test(r.headers['set-cookie'][0]), 'déconnexion : cookie effacé');

    r = await call(port, 'GET', '/');
    ok(r.status === 200 && /<title>/i.test(r.text), 'la page de l’appli est servie');
    ok((await call(port, 'GET', '/server/data/users.json')).status === 404 && (await call(port, 'GET', '/..%2fserver%2fserver.js')).status === 404 && (await call(port, 'GET', '/server/server.js')).status === 404, 'données et code du serveur jamais servis');

    ok(JSON.parse(fs.readFileSync(path.join(tmp, 'users.json'), 'utf8'))['1100'].name === 'Camille', 'compte enregistré dans le fichier');
    ok((fs.statSync(path.join(tmp, 'session.key')).mode & 0o077) === 0, 'secret de session lisible par le propriétaire seulement');

    let n = 0; for (let i = 0; i < 25; i++) if ((await login(port, token({ aud: 'x' }))).status === 429) n++;
    ok(n > 0, 'trop de tentatives : ralenties (429)');
  } catch (e) { console.error('FAIL', e); process.exitCode = 1; }
  server.close(); certSrv.close(); fs.rmSync(tmp, { recursive: true, force: true });
});
