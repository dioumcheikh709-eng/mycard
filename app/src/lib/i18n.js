import I18N from './i18n-data.js';

/* Textes ajoutés par la nouvelle interface (onglets « Créer » et « Profil »). */
const EXTRA = {
  fr: { 'theme.violet': 'Violet', 'theme.green': 'Vert', 'theme.rainbow': 'Arc-en-ciel', 'shop.themes': 'Thèmes', 'shop.themesD': 'Change les couleurs de toute l’appli. Noir et blanc sont gratuits.', 'shop.themeFree': 'Gratuit', 'shop.themeApply': 'Appliquer', 'shop.themeActive': 'Actif', 'shop.themeBought': 'Thème {t} débloqué !', 'theme.locked': 'Ce thème se débloque dans la boutique.', 'profile.photo': 'Photo de profil', 'profile.photoAdd': 'Ajouter une photo', 'profile.photoChange': 'Changer la photo', 'profile.photoRemove': 'Retirer la photo', 'profile.photoBad': 'Cette image ne peut pas être lue.', 'deck.dense': 'Affichage serré', 'deck.denseHint': 'Astuce : touche deux fois le bouton de tri.', 'deck.denseOn': 'Affichage serré', 'deck.denseOff': 'Affichage normal', 'tab.create': 'Créer', 'tab.profile': 'Profil', 'studio.gyro': 'Gyroscope', 'studio.more': 'Plus', 'deck.sortTitle': 'Trier par' },
  en: { 'theme.violet': 'Purple', 'theme.green': 'Green', 'theme.rainbow': 'Rainbow', 'shop.themes': 'Themes', 'shop.themesD': 'Changes the colors of the whole app. Black and white are free.', 'shop.themeFree': 'Free', 'shop.themeApply': 'Apply', 'shop.themeActive': 'Active', 'shop.themeBought': '{t} theme unlocked!', 'theme.locked': 'Unlock this theme in the shop.', 'profile.photo': 'Profile photo', 'profile.photoAdd': 'Add a photo', 'profile.photoChange': 'Change photo', 'profile.photoRemove': 'Remove photo', 'profile.photoBad': 'This image can’t be read.', 'deck.dense': 'Compact view', 'deck.denseHint': 'Tip: double-tap the sort button.', 'deck.denseOn': 'Compact view', 'deck.denseOff': 'Normal view', 'tab.create': 'Create', 'tab.profile': 'Profile', 'studio.gyro': 'Gyroscope', 'studio.more': 'More', 'deck.sortTitle': 'Sort by' },
  es: { 'theme.violet': 'Violeta', 'theme.green': 'Verde', 'theme.rainbow': 'Arcoíris', 'shop.themes': 'Temas', 'shop.themesD': 'Cambia los colores de toda la app. Negro y blanco son gratis.', 'shop.themeFree': 'Gratis', 'shop.themeApply': 'Aplicar', 'shop.themeActive': 'Activo', 'shop.themeBought': '¡Tema {t} desbloqueado!', 'theme.locked': 'Este tema se desbloquea en la tienda.', 'profile.photo': 'Foto de perfil', 'profile.photoAdd': 'Añadir una foto', 'profile.photoChange': 'Cambiar la foto', 'profile.photoRemove': 'Quitar la foto', 'profile.photoBad': 'No se puede leer esta imagen.', 'deck.dense': 'Vista compacta', 'deck.denseHint': 'Consejo: toca dos veces el botón de ordenar.', 'deck.denseOn': 'Vista compacta', 'deck.denseOff': 'Vista normal', 'tab.create': 'Crear', 'tab.profile': 'Perfil', 'studio.gyro': 'Giroscopio', 'studio.more': 'Más', 'deck.sortTitle': 'Ordenar por' },
  de: { 'theme.violet': 'Violett', 'theme.green': 'Grün', 'theme.rainbow': 'Regenbogen', 'shop.themes': 'Themes', 'shop.themesD': 'Ändert die Farben der ganzen App. Schwarz und Weiß sind kostenlos.', 'shop.themeFree': 'Kostenlos', 'shop.themeApply': 'Anwenden', 'shop.themeActive': 'Aktiv', 'shop.themeBought': 'Theme {t} freigeschaltet!', 'theme.locked': 'Dieses Theme wird im Shop freigeschaltet.', 'profile.photo': 'Profilbild', 'profile.photoAdd': 'Foto hinzufügen', 'profile.photoChange': 'Foto ändern', 'profile.photoRemove': 'Foto entfernen', 'profile.photoBad': 'Dieses Bild kann nicht gelesen werden.', 'deck.dense': 'Kompakte Ansicht', 'deck.denseHint': 'Tipp: Tippe zweimal auf die Sortier-Taste.', 'deck.denseOn': 'Kompakte Ansicht', 'deck.denseOff': 'Normale Ansicht', 'tab.create': 'Erstellen', 'tab.profile': 'Profil', 'studio.gyro': 'Gyroskop', 'studio.more': 'Mehr', 'deck.sortTitle': 'Sortieren nach' },
  ar: { 'theme.violet': 'بنفسجي', 'theme.green': 'أخضر', 'theme.rainbow': 'قوس قزح', 'shop.themes': 'السمات', 'shop.themesD': 'تغيّر ألوان التطبيق كله. الأسود والأبيض مجانيان.', 'shop.themeFree': 'مجاني', 'shop.themeApply': 'تطبيق', 'shop.themeActive': 'مفعّل', 'shop.themeBought': 'تم فتح سمة {t}!', 'theme.locked': 'تُفتح هذه السمة من المتجر.', 'profile.photo': 'صورة الملف', 'profile.photoAdd': 'إضافة صورة', 'profile.photoChange': 'تغيير الصورة', 'profile.photoRemove': 'إزالة الصورة', 'profile.photoBad': 'تعذّرت قراءة هذه الصورة.', 'deck.dense': 'عرض مضغوط', 'deck.denseHint': 'نصيحة: المس زر الترتيب مرتين.', 'deck.denseOn': 'عرض مضغوط', 'deck.denseOff': 'عرض عادي', 'tab.create': 'إنشاء', 'tab.profile': 'الملف', 'studio.gyro': 'الجيروسكوب', 'studio.more': 'المزيد', 'deck.sortTitle': 'ترتيب حسب' },
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
