# Serveur MyCard — connexion Google

Premier élément du backend. Sans dépendance : il suffit de Node 18 ou plus.

## Lancer
```bash
cd server
GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com" node server.js
# puis ouvrir http://localhost:8080
```
Le serveur sert aussi l'appli (`index.html`), pour que le cookie de session reste sur le même site.
Sans `GOOGLE_CLIENT_ID`, l'appli fonctionne comme avant et le bouton Google reste « bientôt ».
Toutes les variables sont décrites dans `.env.example`.

## Côté Google Cloud
Application Web · origines JavaScript autorisées : `http://localhost:8080` (et plus tard ton vrai domaine en HTTPS).
Seul l'**ID client** est utilisé. Le « code secret client » n'est pas nécessaire et ne doit jamais être mis dans le dépôt.

## Comment ça marche
1. L'appli appelle `GET /api/config` : si le serveur annonce un ID client, elle charge le bouton officiel de Google.
2. Le joueur choisit son compte ; Google remet à la page un jeton signé.
3. La page l'envoie à `POST /api/auth/google`. Le serveur vérifie la signature (clés publiques de Google), l'émetteur, l'ID client, l'expiration et l'e-mail vérifié.
4. Si tout est bon, le serveur crée ou retrouve le joueur (`data/users.json`) et pose un cookie de session signé (HttpOnly, SameSite=Lax, Secure en HTTPS).
5. `GET /api/me` renvoie le joueur de la session ; `POST /api/logout` efface le cookie.

## Sécurité
- Jeton refusé si : mauvaise signature, algorithme autre que RS256, autre application, expiré, e-mail non vérifié.
- Requêtes d'écriture : JSON obligatoire et origine identique (contre les formulaires d'autres sites) ; corps limité à 16 Ko ; 20 tentatives par minute et par adresse.
- Seuls `index.html` et `universal-cards.js` sont servis ; `data/` n'est jamais accessible.
- `data/` (comptes, secret de session) est exclu du dépôt. En production : HTTPS (`COOKIE_SECURE=1`), sauvegardes de `data/`, un `SESSION_SECRET` fixe.

## Tester
`node server/test.js` : faux serveur Google + jetons bons et mauvais (aucun compte ni réseau nécessaires).

## Prochaines étapes du backend
Synchroniser bibliothèque et Card Coins avec le compte, puis concours et boutique côté serveur.
