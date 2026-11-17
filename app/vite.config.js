import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import fs from 'node:fs';
import path from 'node:path';

/* universal-cards.js reste un fichier à part, à la racine du dépôt : les modérateurs y collent les nouvelles cartes
   sans avoir à reconstruire l'appli. En développement, on le sert depuis la racine. */
const universalCards = () => ({
  name: 'mycard-universal-cards',
  generateBundle() {        /* copié aussi dans dist/ : les applis iOS et Android l'embarquent */
    this.emitFile({ type: 'asset', fileName: 'universal-cards.js', source: fs.readFileSync(path.resolve(__dirname, '../universal-cards.js'), 'utf8') });
  },
  configureServer(server) {
    server.middlewares.use('/universal-cards.js', (req, res) => {
      res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      res.end(fs.readFileSync(path.resolve(__dirname, '../universal-cards.js')));
    });
  },
});

export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile(), universalCards()],
  build: { target: 'es2020', assetsInlineLimit: 100000000, cssCodeSplit: false },
});
