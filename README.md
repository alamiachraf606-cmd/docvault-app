# 📄 DocsVault

Système de gestion de documents avec API REST et audit blockchain

## 📋 Description

DocsVault est un système complet de gestion de documents qui combine une API REST robuste avec un mécanisme d'audit immuable inspiré de la blockchain. Le projet permet de gérer le cycle de vie des documents (brouillon → publication → archivage) tout en traçant chaque action de manière sécurisée et vérifiable.

## 🚀 Fonctionnalités

### API REST
- ✅ Authentification JWT avec rôles (user/admin)
- ✅ CRUD complet sur les documents
- ✅ Optimistic locking avec versioning
- ✅ Machine d'état stricte pour les transitions de statut
- ✅ Pagination et filtres avancés
- ✅ Contrôle d'accès basé sur les rôles

### Système Blockchain
- ✅ Audit trail immuable de toutes les actions
- ✅ Vérification d'intégrité de la chaîne
- ✅ Historique complet des documents
- ✅ Hash SHA256 pour l'intégrité des données

### Interface Web
- ✅ Interface utilisateur moderne et intuitive
- ✅ Gestion complète des documents
- ✅ Visualisation de l'historique blockchain
- ✅ Authentification intégrée

## 📦 Installation

### Prérequis
- Node.js (v14 ou supérieur)
- MongoDB (v4.4 ou supérieur)
- npm ou yarn

### Étapes d'installation

1. **Cloner ou télécharger le projet**

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**

Créez un fichier `.env` à la racine du projet :
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/docsvault
JWT_SECRET=votre_secret_jwt_tres_securise_changez_moi
NODE_ENV=development
```

4. **Démarrer MongoDB**

Assurez-vous que MongoDB est en cours d'exécution sur votre système.

5. **Lancer le serveur**
```bash
npm start
```

Pour le mode développement avec rechargement automatique :
```bash
npm run dev
```

Le serveur sera accessible sur `http://localhost:3000`

## 🔐 Comptes de test

Vous pouvez créer des comptes via l'interface web ou via l'API :

### Créer un utilisateur normal
```bash
POST /auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "role": "user"
}
```

### Créer un administrateur
```bash
POST /auth/register
{
  "email": "admin@example.com",
  "password": "admin123",
  "role": "admin"
}
```

## 📚 API Endpoints

### Authentification

#### POST `/auth/register`
Inscription d'un nouvel utilisateur
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "user"
}
```

#### POST `/auth/login`
Connexion et obtention d'un token JWT
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Documents

Toutes les routes `/documents/*` nécessitent le header :
```
Authorization: Bearer <token>
```

#### POST `/documents`
Créer un nouveau document (status = DRAFT)
```json
{
  "title": "Mon document",
  "content": "Contenu du document",
  "tags": ["urgent", "important"]
}
```

#### GET `/documents`
Liste paginée avec filtres
- `?page=1&limit=10` - Pagination
- `?status=DRAFT` - Filtrer par statut
- `?tag=urgent` - Filtrer par tag
- `?q=recherche` - Recherche textuelle

#### GET `/documents/:id`
Obtenir un document par ID

#### PATCH `/documents/:id`
Mettre à jour un document
**Requiert le header `If-Match: <version>`**
```json
{
  "title": "Titre modifié",
  "content": "Nouveau contenu",
  "tags": ["nouveau", "tag"]
}
```

#### DELETE `/documents/:id`
Supprimer un document
**Requiert le header `If-Match: <version>`**

#### GET `/documents/:id/history`
Obtenir l'historique complet d'un document depuis la blockchain

### Audit

#### GET `/audit/info`
Obtenir les informations de la blockchain (height, lastHash)

#### GET `/audit/verify`
Vérifier l'intégrité de la chaîne blockchain

## 🔒 Règles de sécurité et validation

### Optimistic Locking
- Chaque document possède un champ `version` (entier)
- Les requêtes `PATCH` et `DELETE` exigent le header `If-Match: <version>`
- Si la version ne correspond pas → `409 Conflict`
- La réponse inclut `ETag: <new_version>`

### Machine d'État
Transitions autorisées :
- `DRAFT` → `PUBLISHED`
- `DRAFT` → `ARCHIVED`
- `PUBLISHED` → `ARCHIVED`

Transitions interdites → `409 Conflict`

### Restrictions de modification
- Un document `PUBLISHED` ne peut plus modifier `content` ou `title` (seulement `tags`)
- Tentative de modification → `409 Conflict`

### Contrôle d'accès
- **User** : Accès uniquement à ses propres documents
- **Admin** : Accès à tous les documents
- Accès non autorisé → `403 Forbidden`

## ⛓️ Système Blockchain

### Structure d'un bloc
```json
{
  "index": 0,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "prevHash": "0000...0000",
  "hash": "sha256",
  "event": {
    "eventId": "uuid",
    "actorId": "ObjectId",
    "action": "CREATE | UPDATE | DELETE",
    "documentId": "ObjectId",
    "timestamp": "ISO8601",
    "beforeHash": "sha256 | null",
    "afterHash": "sha256 | null",
    "meta": {}
  }
}
```

### Caractéristiques
- **Append-only** : Les blocs ne peuvent pas être modifiés
- **Hash en chaîne** : Chaque bloc contient le hash du bloc précédent
- **Intégrité vérifiable** : Endpoint `/audit/verify` pour valider la chaîne
- **Cohérence MongoDB** : Rollback automatique si l'écriture blockchain échoue

## 📁 Structure du projet

```
docsvault/
├── server.js              # Point d'entrée du serveur
├── models/
│   ├── User.js           # Modèle utilisateur
│   └── Document.js       # Modèle document
├── routes/
│   ├── auth.js           # Routes d'authentification
│   ├── documents.js      # Routes documents
│   └── audit.js          # Routes audit
├── middleware/
│   └── auth.js           # Middleware d'authentification/autorisation
├── utils/
│   └── blockchain.js     # Utilitaires blockchain
├── public/
│   └── index.html        # Interface web
├── blockchain/           # Dossier des fichiers blockchain (généré automatiquement)
├── package.json
└── README.md
```

## 🧪 Tests

### Test de conflit de version
1. Charger un document (noter la version)
2. Modifier le document dans deux onglets différents
3. Sauvegarder dans le premier onglet
4. Tenter de sauvegarder dans le second → doit retourner `409 Conflict`

### Test de transition de statut
1. Créer un document (DRAFT)
2. Publier le document (DRAFT → PUBLISHED)
3. Tenter de modifier le contenu → doit retourner `409 Conflict`
4. Archiver le document (PUBLISHED → ARCHIVED)

### Test d'intégrité blockchain
1. Effectuer plusieurs opérations sur des documents
2. Appeler `GET /audit/verify`
3. Vérifier que `valid: true`
4. (Optionnel) Modifier manuellement un fichier dans `blockchain/`
5. Réappeler `/audit/verify` → doit détecter la corruption

## 🐛 Dépannage

### Erreur de connexion MongoDB
- Vérifier que MongoDB est démarré
- Vérifier l'URI dans `.env`
- Vérifier les permissions de connexion

### Erreur 409 Conflict
- Vérifier que le header `If-Match` contient la version actuelle
- Recharger le document pour obtenir la dernière version

### Erreur blockchain
- Vérifier les permissions d'écriture dans le dossier `blockchain/`
- Vérifier l'espace disque disponible

## 📝 Notes importantes

- Les fichiers blockchain sont stockés dans le dossier `blockchain/`
- Le bloc Genesis est créé automatiquement au premier démarrage
- Les tokens JWT expirent après 24 heures
- Les mots de passe sont hashés avec bcrypt (10 rounds)

## 👨‍💻 Développement

### Mode développement
```bash
npm run dev
```

Utilise `nodemon` pour le rechargement automatique lors des modifications.

## 📄 Licence

ISC

## 👤 Auteur

Projet académique - DocsVault

---

**🚀 Bon développement avec DocsVault !**
