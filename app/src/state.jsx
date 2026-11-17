/* État de l'application : joueur, bibliothèque, Card Coins, navigation, messages. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { tr, setLangCode, lang as curLang } from './lib/i18n.js';
import { TEMPLATE, PALS, clone, newId, setLook as setLookRaw, LOOK, fxOf } from './lib/cards.js';
import { session, uk, loadDeck, hydrateImages, saveCard, saveIdx, removeCardData, coins as readCoins, writeCoins, media, setStorageFullHandler, lsGet, lsSet } from './lib/store.js';
import { catImg } from './lib/cloud.js';
import { clearThumbMem } from './lib/draw.js';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const THEMES = ['blue', 'red', 'black', 'white'];
const cloneCard = c => ({ ...c, ab: { ...c.ab }, mv: (c.mv || []).map(m => ({ ...m })), rule: c.rule ? { ...c.rule } : c.rule, weak: [...(c.weak || ['G', '×2'])], pal: { ...c.pal } });
export const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* ignoré */ } };

export function AppProvider({ children }) {
  const [ver, setVer] = useState(0);
  const bump = useCallback(() => setVer(v => v + 1), []);
  const [phase, setPhase] = useState(() => lsGet('mycard-lang-chosen') === '1' ? 'login' : 'lang');
  const [user, setUser] = useState('');
  const [deck, setDeckState] = useState([]);
  const deckRef = useRef([]);
  const setDeck = useCallback(fn => { setDeckState(prev => { const next = typeof fn === 'function' ? fn(prev) : fn; deckRef.current = next; return next; }); }, []);
  const [ready, setReady] = useState(false);              /* images de la bibliothèque rechargées */
  const [coins, setCoinsState] = useState(0);
  const [tab, setTab] = useState('library');
  const [studio, setStudio] = useState(null);             /* {id, mode:'view'|'edit', isNew, snap} */
  const [pack, setPack] = useState(null);                 /* booster en cours d'ouverture */
  const [toastMsg, setToastMsg] = useState(null);
  const [alert, setAlert] = useState(null);
  const [gAcct, setGAcct] = useState(null);
  const [theme, setThemeState] = useState(() => { const v = lsGet('mycard-theme'); return THEMES.includes(v) ? v : 'blue'; });
  const toastT = useRef(0);

  const toast = useCallback(m => { setToastMsg({ m, k: Date.now() }); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToastMsg(null), 3200); }, []);
  useEffect(() => { setStorageFullHandler(() => toast(tr('toast.storageFull') !== 'toast.storageFull' ? tr('toast.storageFull') : 'Stockage plein : essaie avec des images plus petites.')); }, [toast]);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  const ask = useCallback((title, text, yes, danger) => new Promise(res => setAlert({ title, text, yes, danger, res })), []);
  const answer = useCallback(v => { setAlert(a => { if (a) a.res(v); return null; }); }, []);

  /* -------- joueur -------- */
  const login = useCallback(name => {
    session.user = name; lsSet('mycard-user', name); setUser(name);
    clearThumbMem();
    const d = loadDeck(); deckRef.current = d; setDeckState(d); setReady(false);
    hydrateImages(d).then(() => { setReady(true); setDeck(x => [...x]); });
    setCoinsState(readCoins()); setTab('library'); setStudio(null); setPhase('app');
  }, [setDeck]);
  const logout = useCallback(() => { setStudio(null); setPhase('login'); }, []);

  /* -------- Card Coins -------- */
  const setCoins = useCallback(n => { writeCoins(n); setCoinsState(readCoins()); }, []);
  const addCoins = useCallback(n => { writeCoins(readCoins() + n); setCoinsState(readCoins()); }, []);

  /* -------- cartes -------- */
  const saveTimers = useRef({});
  const queueSave = useCallback(c => { clearTimeout(saveTimers.current[c.id]); saveTimers.current[c.id] = setTimeout(() => { delete saveTimers.current[c.id]; const cur = deckRef.current.find(x => x.id === c.id); if (cur) saveCard(cur); }, 500); }, []);
  const flushSave = useCallback(id => { if (saveTimers.current[id] != null) { clearTimeout(saveTimers.current[id]); delete saveTimers.current[id]; const cur = deckRef.current.find(x => x.id === id); if (cur) saveCard(cur); } }, []);
  const updateCard = useCallback((id, fn) => {
    setDeck(prev => prev.map(c => { if (c.id !== id) return c; const n = cloneCard(c); fn(n); n.t = Date.now(); queueSave(n); return n; }));
  }, [setDeck, queueSave]);
  const newCard = useCallback(() => {
    const c = clone(TEMPLATE); c.id = newId(); c.pal = PALS[deckRef.current.length % PALS.length]; c.t = c.c = Date.now();
    setDeck(prev => { const n = [...prev, c]; saveIdx(n); return n; }); saveCard(c);
    setStudio({ id: c.id, mode: 'edit', isNew: true, intro: true, snap: JSON.stringify(c) });
  }, [setDeck]);
  const openCard = useCallback((id, mode = 'view') => {
    const c = deckRef.current.find(x => x.id === id); if (!c) return;
    setStudio({ id, mode, isNew: false, snap: mode === 'edit' ? JSON.stringify(c) : null });
  }, []);
  const startEdit = useCallback(() => { setStudio(s => s && ({ ...s, mode: 'edit', snap: JSON.stringify(deckRef.current.find(x => x.id === s.id)) })); }, []);
  const deleteCard = useCallback(id => {
    clearTimeout(saveTimers.current[id]); delete saveTimers.current[id];
    removeCardData(id); setDeck(prev => { const n = prev.filter(c => c.id !== id); saveIdx(n); return n; });
  }, [setDeck]);
  const closeStudio = useCallback(() => { setStudio(s => { if (s) flushSave(s.id); return null; }); }, [flushSave]);
  /* annule la personnalisation : carte nouvelle supprimée, sinon retour à la version d'avant */
  const cancelEdit = useCallback(() => {
    const s = studio; if (!s) return;
    if (s.isNew) deleteCard(s.id);
    else if (s.snap) { clearTimeout(saveTimers.current[s.id]); delete saveTimers.current[s.id]; const old = JSON.parse(s.snap); const cur = deckRef.current.find(x => x.id === s.id); if (cur && cur.img && old.hasImg && old.img === undefined) old.img = cur.img; setDeck(prev => prev.map(c => c.id === s.id ? old : c)); saveCard(old); }
    setStudio(null);
  }, [studio, deleteCard, setDeck]);

  /* débloque une carte universelle (booster) : nouvelle carte, ou doublon compté */
  const unlock = useCallback(async (cat, rk) => {
    const id = 'u-' + cat.id, have = deckRef.current.find(c => c.id === id);
    if (have) { const n = { ...have, dup: (have.dup || 0) + 1 }; deckRef.current = deckRef.current.map(c => c.id === id ? n : c); setDeckState(deckRef.current); saveCard(n); return { isNew: false, n: n.dup + 1 }; }
    const c = clone(cat); delete c.rarity; delete c.img; delete c.hasImg; delete c.upd;
    Object.assign(c, { id, uni: true, rar: rk, t: Date.now(), pal: c.pal || PALS[0], fx: fxOf(c.fx), k: c.k != null ? c.k : 1 }); c.c = c.t;
    const img = await catImg(cat); if (img) c.img = img;
    deckRef.current = [...deckRef.current, c]; setDeckState(deckRef.current); saveIdx(deckRef.current); saveCard(c);
    return { isNew: true, n: 1 };
  }, []);

  /* -------- réglages -------- */
  const setLang = useCallback(code => { if (setLangCode(code)) { clearThumbMem(); bump(); } }, [bump]);
  const setTheme = useCallback(code => { if (!THEMES.includes(code)) return; lsSet('mycard-theme', code); setThemeState(code); }, []);
  const setLook = useCallback((k, v) => { setLookRaw(k, v); clearThumbMem(); bump(); }, [bump]);

  const value = useMemo(() => ({
    phase, setPhase, user, deck, deckRef, ready, coins, tab, setTab, studio, setStudio, pack, setPack, toastMsg, toast, alert, ask, answer,
    gAcct, setGAcct, theme, THEMES, login, logout, setCoins, addCoins, updateCard, newCard, openCard, startEdit, deleteCard, closeStudio, cancelEdit,
    unlock, setLang, setTheme, setLook, lang: curLang, look: { ...LOOK }, media, uk, bump, ver,
  }), [ver, phase, user, deck, ready, coins, tab, studio, pack, toastMsg, toast, alert, ask, answer, gAcct, theme, login, logout, setCoins, addCoins, updateCard, newCard, openCard, startEdit, deleteCard, closeStudio, cancelEdit, unlock, setLang, setTheme, setLook, bump]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
