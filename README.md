# MyCard — cartes holographiques

Application web, **un seul fichier** (`index.html`, sans installation ni compilation) pour créer,
personnaliser et collectionner des cartes holographiques, pensée pour téléphone.

> Projet non officiel. Voir [NOTICE.md](NOTICE.md) pour les attributions et la licence (GPL v3).

## Fonctions
- **Connexion par nom d'utilisateur.** Les boutons « Se connecter avec Google / Apple » sont présents mais **pas encore branchés** (voir « À faire »).
- **Bibliothèque** (« Mon deck ») : grille de cartes avec miniatures, sauvegarde automatique, tri en 9 critères
  (date d'ajout, dernière modification, nom A→Z / Z→A, PV, type).
- **Affichage en grand** d'une carte (voile irisé à l'ouverture), puis **personnalisation en 6 étapes** :
  Image · Carte · Talent · Attaque · Règle · Effet.
- **19 types** avec icônes (18 types + incolore), image importée recadrable (zoom, position).
- **10 effets holographiques**, effet à l'inclinaison au doigt ou à la souris, **gyroscope** (iPhone : autorisation demandée).
- **Export en image** (PNG 840 × 1174, bouton « Télécharger en image »).
- **Fenêtre d'export unifiée** : les boutons « Télécharger en image » et « Partager » ouvrent la même fenêtre, avec le choix entre **Image fixe** (PNG) et **Animation holo** (GIF), une vraie barre de progression pendant la génération du GIF, puis le partage natif du navigateur si disponible, sinon le téléchargement.
- **GIF animé** : un petit encodeur GIF89a écrit pour ce projet (quantification median-cut, LZW, sans dépendance ni worker) génère une boucle de 11 images montrant l'effet holo choisi en mouvement. Peut prendre plusieurs secondes sur téléphone.
- **Fluidité adaptative** : l'effet par défaut est composé de calques pré-dessinés simplement déplacés ;
  un gouverneur mesure le rythme de l'écran (120 / 90 / 60 Hz) et simplifie l'effet par paliers si besoin.

## Lancer
Ouvrir `index.html` dans un navigateur, ou :

```bash
python3 -m http.server 8000   # puis http://localhost:8000
```

Hébergement : page statique, compatible **GitHub Pages** (Settings → Pages → branche `main`, dossier racine).
Le gyroscope exige HTTPS.

## Données et stockage
Tout reste **dans le navigateur** ; rien n'est envoyé à un serveur.

| Où | Clé | Contenu |
|---|---|---|
| `localStorage` | `mycard-idx:<nom>` | ordre des cartes |
| `localStorage` | `mycard-c:<nom>:<id>` | une carte (sans son image) |
| IndexedDB `mycard-media` | `img:<nom>:<id>`, `th:<nom>:<id>` | image importée, miniature |
| `localStorage` | `mycard-user`, `mycard-sort`, `mycard-q` | dernier nom, tri choisi, palier de qualité |

Chaque nom d'utilisateur a sa bibliothèque propre **sur cet appareil**. Les anciennes sauvegardes (clé `mycard-deck:<nom>`) sont converties au lancement.

## Langues
Interface en **français, anglais, espagnol, allemand et arabe** (RTL pris en charge). Après le pseudo, un écran propose de choisir la langue une seule fois ; elle reste modifiable ensuite via le bouton 🌐 (bibliothèque et fiche de carte). Le texte imprimé *sur* la carte (HP, Ability, weakness/resistance/retreat…) reste volontairement en anglais, comme une vraie carte à collectionner.

Limites connues : les chiffres de dimension du PNG peuvent s'afficher dans un ordre inhabituel en arabe (effet bidi standard, pas un bug) ; l'accord du pluriel arabe du compteur de cartes est simplifié (pas de forme duelle).

## Effets
Holo classique · Reverse à étoiles · Holo régulier · Cosmos · Reverse holo foil · V pleine illustration · Rainbow · Shiny V · Amazing Rare · VMax.

Seul le **holo classique** est entièrement composé de calques déplacés (le plus fluide).
Les autres effets sont redessinés à chaque image et sont plus lourds sur téléphone.

## Performance
- Appuyer **5 fois vite** sur « Bonjour, … » dans le deck affiche un encart : fréquence d'écran détectée, durée des images, palier.
- Paliers : 0 complet · 1 couches secondaires retirées · 2 effet une image sur deux · 3 une image sur trois.
  L'inclinaison de la carte reste toujours à la cadence de l'écran.

## À faire / limites connues
- **Connexion Google / Apple** : demande des identifiants OAuth, un serveur de vérification et une page hébergée
  sur ton propre domaine. Rattacher alors les cartes à l'identifiant du compte plutôt qu'au pseudo.
- Convertir les 8 autres effets en calques déplacés (comme le holo classique) pour viser 120 Hz.
- L'export PNG et le GIF animé, pour les effets autres que « classique » et « reverse à étoiles », sont une approximation.
- Le GIF animé n'a pas été chronométré sur un vrai téléphone (seulement en navigateur de bureau, sans accélération graphique).
- Les polices (Barlow, Barlow Condensed) viennent de `fonts.googleapis.com`.
- Pas de tests automatisés dans ce dépôt.

## Licence
GNU GPL v3 — voir [LICENSE](LICENSE) et [NOTICE.md](NOTICE.md).
