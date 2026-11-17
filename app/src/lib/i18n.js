import I18N from './i18n-data.js';

/* Textes ajoutés par la nouvelle interface (onglets « Créer » et « Profil »). */
const EXTRA = {
  fr: { 'tab.create': 'Créer', 'tab.profile': 'Profil', 'studio.gyro': 'Gyroscope', 'studio.more': 'Plus', 'deck.sortTitle': 'Trier par' },
  en: { 'tab.create': 'Create', 'tab.profile': 'Profile', 'studio.gyro': 'Gyroscope', 'studio.more': 'More', 'deck.sortTitle': 'Sort by' },
  es: { 'tab.create': 'Crear', 'tab.profile': 'Perfil', 'studio.gyro': 'Giroscopio', 'studio.more': 'Más', 'deck.sortTitle': 'Ordenar por' },
  de: { 'tab.create': 'Erstellen', 'tab.profile': 'Profil', 'studio.gyro': 'Gyroskop', 'studio.more': 'Mehr', 'deck.sortTitle': 'Sortieren nach' },
  ar: { 'tab.create': 'إنشاء', 'tab.profile': 'الملف', 'studio.gyro': 'الجيروسكوب', 'studio.more': 'المزيد', 'deck.sortTitle': 'ترتيب حسب' },
};
for (const l in EXTRA) Object.assign(I18N[l], EXTRA[l]);

export const LANGS = [['fr', '🇫🇷', 'Français'], ['en', '🇬🇧', 'English'], ['es', '🇪🇸', 'Español'], ['de', '🇩🇪', 'Deutsch'], ['ar', '🇸🇦', 'العربية']];

export let lang = 'fr';
try {
  lang = localStorage.getItem('mycard-lang') || (() => { const b = (navigator.language || 'fr').slice(0, 2); return LANGS.some(x => x[0] === b) ? b : 'fr'; })();
  if (!I18N[lang]) lang = 'fr';
} catch (e) { /* stockage indisponible */ }

export function tr(key, vars) {
  let s = (I18N[lang] && I18N[lang][key]) != null ? I18N[lang][key] : (I18N.fr[key] != null ? I18N.fr[key] : key);
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return s;
}
/* Certains textes contiennent <br> : on les découpe en lignes plutôt que d'injecter du HTML. */
export const lines = key => String(tr(key)).split(/<br\s*\/?>/i);

export function setLangCode(code) {
  if (!I18N[code]) return false;
  lang = code;
  try { localStorage.setItem('mycard-lang', code); } catch (e) { /* ignoré */ }
  document.documentElement.lang = code;
  document.documentElement.dir = I18N[code].dir || 'ltr';
  return true;
}
setLangCode(lang);
