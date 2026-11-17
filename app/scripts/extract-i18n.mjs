// Extrait le dictionnaire I18N de l'ancienne version (legacy/index.html) vers src/lib/i18n-data.js.
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../../legacy/index.html', import.meta.url), 'utf8');
const a = src.indexOf('const I18N={'), b = src.indexOf('\n};', a) + 3;
const I18N = new Function(src.slice(a, b) + '\nreturn I18N;')();
fs.writeFileSync(new URL('../src/lib/i18n-data.js', import.meta.url),
  '/* Textes de l’interface en 5 langues (extraits de la version d’origine). */\nexport default ' + JSON.stringify(I18N, null, 0).replace(/},"/g, '},\n"') + ';\n');
console.log(Object.keys(I18N).map(k => k + ':' + Object.keys(I18N[k]).length).join(' '));
