/* Stockage sur l'appareil : mêmes clés que la version d'origine, pour que chaque joueur retrouve ses cartes.
   - localStorage : une clé par carte (sans l'image) + l'index de la bibliothèque, le portefeuille, le booster du jour ;
   - IndexedDB (« mycard-media ») : images des cartes et miniatures. */
import { modernize, typeName, rarIdx, rarName } from './cards.js';

export const session = { user: '' };
export const uk = () => session.user.toLowerCase();

/* -------- images et miniatures (IndexedDB, avec repli en mémoire) -------- */
export const media = (() => {
  const mem = new Map(); let dbp = null, bad = false;
  const open = () => dbp || (dbp = new Promise((ok, no) => {
    try { const r = indexedDB.open('mycard-media', 1); r.onupgradeneeded = () => r.result.createObjectStore('m'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }
    catch (e) { no(e); }
  }));
  const run = async (mode, fn) => { const d = await open(); return new Promise((ok, no) => { const t = d.transaction('m', mode), q = fn(t.objectStore('m')); t.oncomplete = () => ok(q && q.result); t.onerror = t.onabort = () => no(t.error); }); };
  const g = (fn, mf) => async (...a) => {
    if (!bad) {
      try { return await fn(...a); }
      catch (e) { try { await open(); } catch (_) { bad = true; } if (!bad) { console.warn('MyCard : stockage refusé', e && e.name); return mf(...a); } }
    }
    return mf(...a);
  };
  return {
    get: g(k => run('readonly', o => o.get(k)), k => mem.get(k)),
    put: g((k, v) => run('readwrite', o => o.put(v, k)), (k, v) => { mem.set(k, v); }),
    del: g(k => run('readwrite', o => o.delete(k)), k => { mem.delete(k); }),
  };
})();

let onFull = () => {};
export const setStorageFullHandler = fn => { onFull = fn; };
export const lsGet = (k, d = null) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
export const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { onFull(); return false; } };
export const lsDel = k => { try { localStorage.removeItem(k); } catch (e) { /* ignoré */ } };

/* -------- bibliothèque -------- */
const idxKey = () => 'mycard-idx:' + uk(), cKey = id => 'mycard-c:' + uk() + ':' + id;
const imgSaved = {};
export function saveIdx(deck) { lsSet(idxKey(), JSON.stringify(deck.map(c => c.id))); }
export function saveCard(c) {                                   /* n'écrit que cette carte ; l'image seulement si elle a changé */
  const { img, ...rest } = c, pending = img === undefined && c.hasImg;
  rest.hasImg = pending ? true : !!img; rest.m2 = 1;
  lsSet(cKey(c.id), JSON.stringify(rest));
  if (!pending && img !== imgSaved[c.id]) { imgSaved[c.id] = img; if (img) media.put('img:' + uk() + ':' + c.id, img); else media.del('img:' + uk() + ':' + c.id); }
}
export function removeCardData(id) {
  delete imgSaved[id]; lsDel(cKey(id));
  media.del('img:' + uk() + ':' + id); media.del('th:' + uk() + ':' + id);
}
export function loadDeck() {
  let deck = [];
  for (const k in imgSaved) delete imgSaved[k];
  try {
    const oldKey = 'mycard-deck:' + uk(), old = localStorage.getItem(oldKey);
    if (old && !localStorage.getItem(idxKey())) {                /* ancien format (tout dans une clé) : migration */
      deck = JSON.parse(old); deck.forEach(saveCard); saveIdx(deck);
      if (localStorage.getItem(idxKey()) && deck.every(c => localStorage.getItem(cKey(c.id)))) localStorage.removeItem(oldKey);
    } else JSON.parse(localStorage.getItem(idxKey()) || '[]').forEach(id => { const j = localStorage.getItem(cKey(id)); if (j) deck.push(JSON.parse(j)); });
  } catch (e) { deck = []; }
  return deck.map(modernize);
}
/* recharge les images depuis IndexedDB */
export async function hydrateImages(deck) {
  const u = uk();
  await Promise.all(deck.map(async c => {
    if (c.hasImg && c.img === undefined) { const v = await media.get('img:' + u + ':' + c.id); if (v) { c.img = v; imgSaved[c.id] = v; } else c.hasImg = false; }
  })).catch(() => {});
  return deck;
}
export const cardImage = async c => c.img || (c.hasImg ? await media.get('img:' + uk() + ':' + c.id) : null);

/* -------- tri et recherche -------- */
export const SORTS = ['added', 'rarD', 'az', 'pvd', 'type'];
const nmOf = c => String(c.name || ''), coll = (a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base', numeric: true });
const createdOf = c => { if (c.c) return c.c; const m = /^c([0-9a-z]{7,9})[0-9a-z]{3}$/.exec(String(c.id || '')); if (m) { const v = parseInt(m[1], 36); if (v > 1e12 && v < 4e12) return v; } return c.t || 0; };
const rarRank = c => c.uni ? rarIdx(c.rar) : -1;
const CMP = {
  added: (a, b) => createdOf(b) - createdOf(a), az: (a, b) => coll(nmOf(a), nmOf(b)), rarD: (a, b) => rarRank(b) - rarRank(a),
  pvd: (a, b) => (parseInt(b.hp) || 0) - (parseInt(a.hp) || 0), type: (a, b) => coll(typeName(a.type), typeName(b.type)),
};
export const sortDeck = (deck, key) => [...deck].sort((a, b) => (CMP[key] || CMP.added)(a, b) || coll(nmOf(a), nmOf(b)) || b.t - a.t);
export const normQ = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export const hayOf = c => [c.name, typeName(c.type), c.evo, c.special, c.hp, c.ab && c.ab.n, ...(c.mv || []).map(m => m.n), c.uni ? rarName(c.rar) : ''].filter(Boolean).join(' ');

/* -------- Card Coins et booster du jour (sur l'appareil en mode démo) -------- */
export const START_COINS = 300, CONTEST_COINS = 50, DUP_COINS = { common: 5, uncommon: 12, rare: 30, epic: 80, legendary: 200 };
const walletKey = () => 'mycard-wallet:' + uk();
export function coins() { try { const v = localStorage.getItem(walletKey()); if (v === null) { localStorage.setItem(walletKey(), START_COINS); return START_COINS; } return Math.max(0, +v || 0); } catch (e) { return 0; } }
export function writeCoins(n) { lsSet(walletKey(), Math.max(0, Math.round(n))); }
export const dayKey = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
const dropKey = () => 'mycard-drop:' + uk();
/* MyCard+ (abonnement) : date de fin enregistrée par joueur (mode démo : sur l'appareil) */
const memberKey = () => 'mycard-member:' + uk();
export const memberUntil = () => +(lsGet(memberKey()) || 0) || 0;
export const isMemberNow = () => memberUntil() > Date.now();
export const setMemberUntil = ts => { if (ts) lsSet(memberKey(), String(ts)); else lsDel(memberKey()); };
/* boosters gratuits : 3 par jour, 9 avec MyCard+ */
export const FREE_DROPS = 3, MEMBER_DROPS = 9;
export const dropLimit = () => isMemberNow() ? MEMBER_DROPS : FREE_DROPS;
export function dropsUsed() {
  const v = lsGet(dropKey()); if (!v) return 0;
  if (v === dayKey()) return 1;                                  /* ancien format : un booster pris aujourd'hui */
  try { const o = JSON.parse(v); return o && o.d === dayKey() ? Math.max(0, +o.n || 0) : 0; } catch (e) { return 0; }
}
export const dropsLeft = () => Math.max(0, dropLimit() - dropsUsed());
export const dropReady = () => dropsLeft() > 0;
export const useDrop = () => lsSet(dropKey(), JSON.stringify({ d: dayKey(), n: dropsUsed() + 1 }));
export const resetDrop = () => lsDel(dropKey());
export const msToMidnight = () => { const d = new Date(); d.setHours(24, 0, 0, 0); return d - new Date(); };
