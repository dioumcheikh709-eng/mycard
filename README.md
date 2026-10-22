# MyCard — cartes holographiques

Application web, **un seul fichier** (`index.html`, sans installation ni compilation) pour créer,
personnaliser et collectionner des cartes holographiques, pensée pour téléphone.

> Projet non officiel. Voir [NOTICE.md](NOTICE.md) pour les attributions et [LICENSE](LICENSE) pour la licence.

## Fonctions
- **Connexion par nom d'utilisateur.** Les boutons « Se connecter avec Google / Apple » sont présents mais **pas encore branchés** (voir « À faire »).
- **Bibliothèque** (« Ma bibliothèque ») : grille de cartes avec miniatures, sauvegarde automatique, tri en 5 critères
  (ajout récent, **rareté** (les plus rares d'abord), nom A→Z, PV, type ; les cartes sans rareté, créées par le joueur, restent à la fin).
- **Affichage en grand** d'une carte (voile irisé à l'ouverture), puis **personnalisation en 6 étapes** :
  Image · Carte · Talent · Attaque · Règle · Effet.
- **19 types** avec icônes (18 types + incolore), image importée recadrable (zoom, position).
- **11 effets holographiques** (dont le **métallique**), effet à l'inclinaison au doigt ou à la souris, **gyroscope** (iPhone : autorisation demandée).
- **Export en image** (PNG 840 × 1174, bouton « Télécharger en image »).
- **Fenêtre d'export unifiée** : les boutons « Télécharger en image » et « Partager » ouvrent la même fenêtre, avec le choix entre **Image fixe** (PNG) et **Animation holo** (GIF), une vraie barre de progression pendant la génération du GIF, puis le partage natif du navigateur si disponible, sinon le téléchargement.
- **GIF animé** : un petit encodeur GIF89a écrit pour ce projet (quantification median-cut, LZW, sans dépendance ni worker) génère une boucle de 11 images montrant l'effet holo choisi en mouvement. Peut prendre plusieurs secondes sur téléphone.
- **Fluidité adaptative** : l'effet par défaut est composé de calques pré-dessinés simplement déplacés ;
  un gouverneur mesure le rythme de l'écran (120 / 90 / 60 Hz) et simplifie l'effet par paliers si besoin.

- **Recherche** dans la bibliothèque (nom, type, évolution, talent, attaques), sans tenir compte des accents ni de la casse.
- **Thèmes de couleur** (bleu, rouge, noir, blanc), au choix dans les Paramètres.
- **Concours hebdomadaire** et **booster du jour** avec une **bibliothèque universelle** (voir plus bas).
- **Barre d'onglets en bas** (Bibliothèque · Concours · Boutique), icônes dessinées en SVG (voir « Icônes »).

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
| `localStorage` | `mycard-theme`, `mycard-lang`, `mycard-mod` | thème, langue, mode modérateur (empreinte de la connexion) |
| `localStorage` | `mycard-drop:<nom>`, `mycard-wallet:<nom>` | jour du dernier booster gratuit ouvert, solde de Card Coins |
| `localStorage` / IndexedDB | `mycard-cloud:*`, `ent:<id>`, `ext:<id>` | concours (démo) : participations, votes, résultats, images |

Chaque nom d'utilisateur a sa bibliothèque propre **sur cet appareil**. Les anciennes sauvegardes (clé `mycard-deck:<nom>`) sont converties au lancement.

## Concours hebdomadaire, booster du jour et bibliothèque universelle
Accessibles par les onglets du bas : **Concours** et **Boutique**.

**Concours.** Chaque semaine (du lundi au dimanche), un joueur inscrit une de ses cartes et vote pour celle d'un autre (un seul vote par semaine, pas pour sa propre carte).
À la fin de la semaine, la carte la plus votée est désignée n°1 et attend la **validation du modérateur**. Si elle est validée, le modérateur choisit sa rareté
et elle **rejoint la bibliothèque universelle**.

**Bibliothèque universelle.** Les cartes créées par l'auteur du projet, à débloquer dans les boosters. Elles sont décrites dans **`universal-cards.js`** (même format qu'une carte de la bibliothèque, plus `rarity`).
Les cartes `exemple-…` sont des exemples à remplacer. Une carte débloquée est copiée dans la bibliothèque du joueur (non modifiable) ; un doublon est signalé.

**Créer les cartes de la bibliothèque universelle.**
1. Crée la carte dans l'application comme n'importe quelle carte (bouton « + », personnalisation en 6 étapes : image, texte, attaques, effet…).
2. Dans les **Paramètres → Modérateur**, saisis ton **identifiant** et ton **code** (voir ci-dessous) puis « Se connecter ».
3. Ouvre ta carte depuis la bibliothèque : sous « Personnaliser » apparaissent un sélecteur de **rareté** et le bouton **« Ajouter à la bibliothèque universelle »**.
4. Appuie dessus : la carte entre **immédiatement** dans les boosters (re-appuyer avec une autre rareté la met à jour, sans doublon). Rien à copier.
5. Pour que **tous les joueurs** la reçoivent (sans serveur, l'ajout direct n'est visible que sur cet appareil), clique sur « Copier pour le fichier » et colle la ligne **juste avant la ligne `];`** de `universal-cards.js` (chaque carte est sur sa ligne, terminée par une virgule).

**Touch ID / Face ID.** Une fois connecté (identifiant + code), « Activer Touch ID / Face ID sur cet appareil » enregistre une clé WebAuthn de l'appareil (Touch ID du Mac, Face ID de l'iPhone, Windows Hello, empreinte Android). Ensuite, « Se connecter avec Touch ID / Face ID » suffit, sans retaper le code. L'application vérifie la signature avec la clé publique gardée sur l'appareil et exige la vérification biométrique. Il faut une adresse **https** (ou `localhost`) : le fichier ouvert directement (`file://`) ou une page intégrée dans un cadre peut ne pas le proposer. Chaque appareil s'active séparément ; l'identifiant + code restent la méthode de secours.

**Identifiant et code modérateur.** Seule leur empreinte (PBKDF2-SHA256, 210 000 itérations, sel aléatoire : constantes `MOD_SALT` / `MOD_HASH` dans `index.html`) est dans le code, jamais le code lui-même ; 5 essais ratés bloquent le formulaire 60 s.
Pour en changer : calcule la nouvelle empreinte de `identifiant + "\n" + code` avec la même fonction (`modHash`) et remplace les deux constantes. C'est une protection **légère, côté navigateur** : sans serveur, elle empêche un joueur de tomber dessus par hasard, pas un attaquant déterminé (il peut modifier le code de la page chez lui — ce qui n'affecte que son propre appareil).

L'image est incluse dans l'extrait (en `data:` URL). Si elle alourdit trop le fichier (l'application prévient au-delà de 300 Ko), héberge-la et remplace la valeur de `img` par son adresse.

**Boutique et Card Coins.** L'onglet **Boutique** contient le **booster gratuit du jour** (un par jour, comme dans Brawl Stars), des **boosters à acheter avec des Card Coins** et les **offres de Card Coins** (achetables avec de l'argent réel).

| Booster | Prix (Card Coins) | Contenu |
|---|---|---|
| Normal | 100 | chances normales (de Commune à Légendaire, ≤ 1 légendaire) |
| Peu commun | 180 | aucune carte en dessous de Peu commun, jamais de légendaire |
| Rare | 450 | aucune carte en dessous de Rare, jamais de légendaire |
| Épique | 1 500 | aucune carte en dessous d'Épique, jamais de légendaire |

Les tuiles ne montrent que le nom et le prix : le détail de chaque booster, la règle « pas de booster légendaire » et les façons de gagner des Card Coins sont expliqués dans le menu **« i »**.

**Offres de Card Coins** (modèle des gemmes de Brawl Stars : plus le paquet est gros, plus le bonus est grand ; étiquettes « Populaire » et « Meilleure offre ») :

| Paquet | Card Coins | dont offerts | Prix |
|---|---|---|---|
| 1 | 100 | – | 0,99 € |
| 2 | 330 | +10 % | 2,99 € |
| 3 | 600 | +20 % | 4,99 € |
| 4 | 1 300 | +30 % | 9,99 € |
| 5 | 2 800 | +40 % | 19,99 € |
| 6 | 7 500 | +50 % | 49,99 € |

Quand le solde ne suffit pas pour un booster, une fenêtre propose directement l'offre la plus petite qui couvre le manque (et la suivante) ; après paiement, l'achat du booster se poursuit. Tout achat demande une confirmation. Les offres, prix et bonus sont dans `COIN_PACKS` (`index.html`).
**Le paiement est simulé** : `payments.buy` (objet à remplacer) ne débite personne en mode démo. Pour de vrais paiements il faudra le serveur (Stripe, App Store, Google Play) qui vérifie le paiement et crédite le solde ; le solde actuel est sur l'appareil (modifiable par le joueur). Attention aussi aux règles des boutiques d'applications et à la loi sur les boosters aléatoires payants (certains pays les encadrent ou les interdisent) : les chances sont affichées dans le « i ».

On commence avec 300 Card Coins. On en gagne avec les **doublons** (Commune 5 · Peu commune 12 · Rare 30 · Épique 80 · Légendaire 200) et **50 Card Coins** à la première inscription de la semaine au concours (`SHOP`, `DUP_COINS`, `CONTEST_COINS`, `START_COINS`). Les « Outils démo » permettent d'ajouter 500 Card Coins.

**Booster du jour.** Un booster par jour (il se recharge à minuit, heure locale), de **5 cartes avec au plus 1 légendaire**.
Chaque carte est tirée selon sa rareté ; dès qu'une légendaire sort, les cartes suivantes du booster ne peuvent plus l'être. Une carte n'apparaît pas deux fois dans le même booster tant que sa rareté a assez de cartes.

| Rareté | Chance par carte |
|---|---|
| Commune | 60 % |
| Peu commune | 25 % |
| Rare | 10 % |
| Épique | 4 % |
| Légendaire | 1 % (≈ 4,9 % d'avoir une légendaire dans un booster) |

Les pourcentages se règlent dans `index.html` (`const RARITIES`). Une rareté qui n'a aucune carte est retirée du tirage et ses chances sont redistribuées ; le tableau « Tes chances » affiche les chances réelles.

*Les chances* : le petit bouton **i** (sur l'écran du booster et pendant l'invocation) ouvre une fenêtre qui explique le tableau (rareté, nombre de cartes, chance par carte, chance par booster)
et la couleur du pack.

*L'ouverture* : le bouton « Invoquer le booster » fait apparaître le pack dans un portail de lumière (façon invocation). Le pack ressemble à un vrai booster : emballage métallisé scellé aux deux bouts
(soudures dentelées), plis, grain, relief, et un reflet qui suit le doigt. On **tape pour l'ouvrir** : le haut se déchire de l'une des **6 façons** tirées au hasard, jamais deux fois de suite
(bande arrachée, bande qui tombe, lamelles qui se soulèvent une à une, éclats, volets qui s'ouvrent, coupure en diagonale). Ensuite **chaque appui sort une carte, de la moins rare à la plus rare**,
de l'une des **4 façons** tirées au hasard (sortie du pack, retournement, chute avec impact, rotation), avec un éclat de la couleur de sa rareté (secousse d'écran pour les épiques et les légendaires).
Un récapitulatif des 5 cartes termine l'ouverture ; « Tout révéler » permet de le sauter.

**La couleur de l'invocation ne change pas les chances : elle les révèle.** Le booster est tiré avant l'animation ; sa couleur dit ce qu'il contient : gris (que des communes), vert, bleu, violet, puis or dès qu'il contient une légendaire.
La meilleure carte compte le plus, les autres font glisser la couleur un peu plus loin. Les cartes sont ajoutées à la bibliothèque dès le tirage, même si on ferme l'animation avant la fin.

**Mode démo (état actuel).** Il n'y a pas de serveur : participations, votes, résultats et validations sont stockés dans le navigateur (`mycard-cloud:*`), donc **rien n'est partagé entre joueurs ni entre appareils**.
Tout passe par un seul objet `cloud` dans `index.html` : pour un vrai concours en ligne, il suffit de le remplacer par un client serveur (mêmes méthodes). Côté serveur, il faudra aussi faire le tirage du booster,
désigner le n°1 de la semaine et gérer le rôle de modérateur (aujourd'hui une connexion identifiant + code vérifiée dans le navigateur). Des « Outils démo » permettent d'ajouter des participants fictifs,
de simuler la fin de la semaine et de réactiver le booster.

## Icônes
Les icônes (onglets du bas, engrenage des Paramètres, fenêtre d'export) sont **dessinées en SVG** dans `index.html` (objet `ICONS`), sans emoji. Pour utiliser vos propres images,
renseigner `ICON_ASSETS` (par exemple `ICON_ASSETS.library='assets/icons/library.png'`) : l'image remplace alors le dessin. Noms disponibles : `library`, `contest`, `shop`, `gear`, `camera`, `sparkle`.

## Paramètres
Accessible depuis la bibliothèque (icône ⚙️) : pseudo actuel avec bouton pour en changer, langue, **thème de couleur**, connexion **modérateur**, **politique de confidentialité** et **crédits** (chacun dans un volet repliable), traduits dans les 5 langues.

## Langues
Interface en **français, anglais, espagnol, allemand et arabe** (RTL pris en charge). Après le pseudo, un écran propose de choisir la langue une seule fois ; elle reste modifiable ensuite via le bouton 🌐 (bibliothèque et fiche de carte). Le texte imprimé *sur* la carte (HP, Ability, weakness/resistance/retreat…) reste volontairement en anglais, comme une vraie carte à collectionner.

Limites connues : les chiffres de dimension du PNG peuvent s'afficher dans un ordre inhabituel en arabe (effet bidi standard, pas un bug) ; l'accord du pluriel arabe du compteur de cartes est simplifié (pas de forme duelle).

## Effets
Holo classique · Cadre étoilé · Prisme · Nébuleuse · Mosaïque · Aurore boréale · Opale · Paillettes · Ondes · Métallique (acier brossé) · Or.

Tous les effets sont écrits pour MyCard. Le **holo classique** et le **cadre étoilé** sont des calques pré-dessinés simplement déplacés (le plus fluide).
Les neuf autres sont des « calques de lumière » en CSS (`.fxa` : trois calques sous les textes, `.fxg` : le reflet au-dessus), pilotés par
quatre variables posées à chaque image : `--px` / `--py` (position de la lumière), `--pd` (distance au centre), `--po` (intensité du geste).
Les cartes enregistrées avec les anciens effets (holo régulier, cosmos, etc.) passent automatiquement au nouvel effet le plus proche (`FX_OLD`).

## Performance
- Appuyer **5 fois vite** sur « Bonjour, … » dans la bibliothèque affiche un encart : fréquence d'écran détectée, durée des images, palier.
- Paliers : 0 complet · 1 couches secondaires retirées · 2 effet une image sur deux · 3 une image sur trois.
  L'inclinaison de la carte reste toujours à la cadence de l'écran.

## À faire / limites connues
- **Connexion Google / Apple** : demande des identifiants OAuth, un serveur de vérification et une page hébergée
  sur ton propre domaine. Rattacher alors les cartes à l'identifiant du compte plutôt qu'au pseudo.
- Convertir les 9 effets « calques de lumière » en calques déplacés (comme le holo classique) pour viser 120 Hz sur les téléphones lents.
- L'export PNG et le GIF animé, pour les effets autres que « classique » et « reverse à étoiles », sont une approximation.
- Le GIF animé n'a pas été chronométré sur un vrai téléphone (seulement en navigateur de bureau, sans accélération graphique).
- Les polices (Barlow, Barlow Condensed) viennent de `fonts.googleapis.com`.
- Pas de tests automatisés dans ce dépôt.

## Licence
Tous droits réservés — voir [LICENSE](LICENSE) et [NOTICE.md](NOTICE.md). Les versions antérieures, dans l'historique git, contenaient du code sous GPL v3 (voir NOTICE.md).
