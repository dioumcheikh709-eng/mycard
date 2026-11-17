// Après « vite build » : copie l'appli (un seul fichier) à la racine du dépôt, là où le serveur et GitHub la servent.
import fs from 'node:fs';
const html = fs.readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const head = '<!-- Fichier généré par app/ (npm run build). Ne pas modifier à la main : le code source est dans app/src. -->\n';
fs.writeFileSync(new URL('../../index.html', import.meta.url), html.replace(/^(<!DOCTYPE html>\s*)/i, '$1' + head));
console.log('index.html publié à la racine (' + Math.round(html.length / 1024) + ' Ko)');
