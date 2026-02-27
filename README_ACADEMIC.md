# DocsVault : Mon Projet Étudiant

## Présentation du Projet

**Titre du Projet :** DocsVault - Système de Gestion de Documents avec Audit Blockchain  
**Auteur :** Achraf Allamy  
**École :** Université Euromed de Fès  
**Technos :** Node.js, Express.js, MongoDB, Blockchain (fait maison)  
**Date :** 31 janvier 2026

Salut ! Moi c'est Achraf, étudiant à Euromed Fès, et voici mon projet DocsVault. C'est un système que j'ai créé pour gérer des documents de manière sécurisée, avec une touche blockchain pour l'audit. C'était super intéressant à développer et j'ai appris plein de trucs !

## Table des Matières

1. [C'est quoi ce projet ?](#cest-quoi-ce-projet-)
2. [Ce qu'il fait](#ce-quil-fait)
3. [Comment l'installer](#comment-linstaller)
4. [Comment l'utiliser](#comment-lutiliser)
5. [L'API](#lapi)
6. [Comment ça marche](#comment-ça-marche)
7. [Sécurité](#sécurité)
8. [Tests](#tests)
9. [Contribuer](#contribuer)
10. [Licence](#licence)

## C'est quoi ce projet ?

DocsVault, c'est un truc que j'ai fait pour mon cours. L'idée, c'est de créer un endroit où on peut stocker des documents en toute sécurité, avec un historique immuable grâce à la blockchain. J'ai utilisé Node.js pour le backend, MongoDB pour la base de données, et j'ai ajouté une petite blockchain perso pour tracer toutes les actions.

Le but, c'était de montrer que je sais faire du full-stack, gérer la sécurité, et intégrer des concepts avancés comme la blockchain. C'était pas facile, mais j'ai réussi à faire tourner le truc !

## Ce qu'il fait

### Fonctionnalités de Base
- **Gérer des docs :** Créer, lire, modifier, supprimer des documents avec versions
- **Se connecter :** Système de login avec JWT et rôles (user/admin)
- **Cycle de vie :** Les docs passent de brouillon à publié à archivé
- **Rechercher :** Filtrer et paginer les docs
- **Audit :** Historique blockchain de tout ce qui se passe

### Sécurité
- Mots de passe hashés avec bcrypt
- Tokens JWT pour l'authentification
- Contrôle d'accès par rôles
- Verrouillage optimiste contre les conflits
- Hash SHA-256 pour l'intégrité

### Techniques
- API REST propre
- MongoDB avec Mongoose
- Blockchain maison
- Interface web simple
- Gestion d'erreurs

## Comment l'installer

### Ce qu'il faut
- Node.js (version 14+)
- MongoDB (version 4.4+)
- npm ou yarn

### Étapes
1. **Télécharger le projet**
   ```bash
   git clone <lien-du-repo>
   cd docsvault
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Config environnement**
   
   Créer un fichier `.env` :
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/docsvault
   JWT_SECRET=un_secret_super_securise
   NODE_ENV=development
   ```

4. **Lancer MongoDB**
   
   Faut que MongoDB tourne.

5. **Démarrer l'app**
   ```bash
   # Mode prod
   npm start
   
   # Mode dev (recharge auto)
   npm run dev
   ```

L'app sera sur http://localhost:3000

## Comment l'utiliser

### Interface Web
Va sur http://localhost:3000 pour :
- Créer un compte
- Te connecter
- Gérer tes docs
- Voir l'historique blockchain

### API
Utilise Postman ou curl pour tester l'API.

Exemple : Créer un doc
```bash
curl -X POST http://localhost:3000/documents \
  -H "Authorization: Bearer TON_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mon Doc",
    "content": "Contenu test",
    "tags": ["test"]
  }'
```

## L'API

### Auth
#### POST `/auth/register`
S'inscrire.

**Body :**
```json
{
  "email": "toi@example.com",
  "password": "mdpsecure",
  "role": "user"
}
```

#### POST `/auth/login`
Se connecter et avoir un token.

**Body :**
```json
{
  "email": "toi@example.com",
  "password": "mdpsecure"
}
```

### Docs
Tous les endpoints docs ont besoin de `Authorization: Bearer <token>`.

#### POST `/documents`
Créer un doc.

#### GET `/documents`
Lister les docs avec filtres.

#### GET `/documents/:id`
Voir un doc.

#### PATCH `/documents/:id`
Modifier un doc (avec `If-Match` pour la version).

#### DELETE `/documents/:id`
Supprimer un doc (avec `If-Match`).

#### GET `/documents/:id/history`
Historique blockchain du doc.

### Audit
#### GET `/audit/info`
Infos blockchain.

#### GET `/audit/verify`
Vérifier l'intégrité.

## Comment ça marche

### Composants
1. **Serveur :** Express.js qui gère les requêtes
2. **Base :** MongoDB pour stocker
3. **Auth :** JWT + bcrypt
4. **Blockchain :** Mon implémentation perso
5. **Interface :** HTML/CSS/JS statique

### Flux
1. Tu te connectes → token JWT
2. Actions sur docs → mises à jour DB
3. Chaque action → bloc blockchain
4. Historique conservé

## Sécurité

### Authentification
- Tokens JWT qui expirent en 24h
- Hash bcrypt (10 rounds)
- Gestion clés secrètes

### Autorisation
- Rôles user/admin
- Vérif propriété ressources
- Protection endpoints

### Intégrité
- Verrouillage optimiste + versions
- Hash SHA-256 blockchain
- Logs immuables

## Tests

### Tests Manuels
- Tests API avec Postman
- Tests interface navigateur
- Tests concurrence multi-users

### Cas de Test
1. Inscription/connexion
2. CRUD docs
3. Transitions états
4. Vérif blockchain
5. Gestion erreurs

### Perf
- Temps réponse
- Charge multi-users
- Opti requêtes DB

## Contribuer

C'est mon projet étudiant, mais si t'as des idées pour améliorer, dis-le ! Bugs, suggestions, ou améliorations bienvenues.

## Licence

Projet étudiant - Université Euromed de Fès. Tous droits réservés.

---

**Fait par Achraf Allamy**  
*Étudiant à Euromed Fès*  
*Janvier 2026*</content>
<parameter name="filePath">/home/achraf/js_project/README_ACADEMIC.md