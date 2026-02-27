,pm# Guide de Démarrage Rapide - DocsVault

## 🚀 Installation et Configuration

### Étape 1 : Installer les dépendances

```bash
npm install

```

### Étape 2 : Configurer MongoDB

Assurez-vous que MongoDB est installé et démarré sur votre système.

**Windows** :
```bash
# Si MongoDB est installé comme service, il démarre automatiquement
# Sinon, démarrez-le manuellement :
mongod
```

**Linux/Mac** :
```bash
# Démarrer MongoDB
sudo systemctl start mongod
# ou
mongod
```

### Étape 3 : Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet avec le contenu suivant :

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/docsvault
JWT_SECRET=votre_secret_jwt_tres_securise_changez_moi_en_production
NODE_ENV=development
```

**Important** : Changez `JWT_SECRET` par une valeur aléatoire et sécurisée en production !

### Étape 4 : Démarrer le serveur

```bash
npm start
```

Ou en mode développement (avec rechargement automatique) :

```bash
npm run dev
```

Le serveur sera accessible sur : `http://localhost:3000`

## 🎯 Première utilisation

### 1. Accéder à l'interface web

Ouvrez votre navigateur et allez sur : `http://localhost:3000`

### 2. Créer un compte

- Cliquez sur "S'inscrire"
- Entrez un email et un mot de passe
- Choisissez le rôle (user ou admin)
- Cliquez sur "S'inscrire"

### 3. Se connecter

- Entrez votre email et mot de passe
- Cliquez sur "Se connecter"

### 4. Créer votre premier document

- Remplissez le formulaire (titre, contenu, tags)
- Cliquez sur "Créer le document"
- Le document sera créé avec le statut DRAFT

### 5. Tester les fonctionnalités

- **Modifier** : Cliquez sur "Modifier" pour éditer un document DRAFT
- **Publier** : Cliquez sur "Publier" pour passer de DRAFT à PUBLISHED
- **Archiver** : Cliquez sur "Archiver" pour passer à ARCHIVED
- **Historique** : Cliquez sur "Historique" pour voir l'audit trail blockchain

## 🧪 Tester l'API avec Postman ou curl

### Créer un utilisateur

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "user"
  }'
```

### Se connecter

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Réponse :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "email": "test@example.com", "role": "user" }
}
```

### Créer un document

```bash
curl -X POST http://localhost:3000/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "title": "Mon premier document",
    "content": "Contenu du document",
    "tags": ["test", "demo"]
  }'
```

### Lister les documents

```bash
curl -X GET "http://localhost:3000/documents?page=1&limit=10" \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### Modifier un document (avec If-Match)

```bash
curl -X PATCH http://localhost:3000/documents/DOCUMENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "If-Match: 1" \
  -d '{
    "title": "Titre modifié"
  }'
```

### Vérifier l'intégrité de la blockchain

```bash
curl -X GET http://localhost:3000/audit/verify \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

## 🐛 Dépannage

### Erreur : "Cannot connect to MongoDB"

**Solution** :
1. Vérifiez que MongoDB est démarré
2. Vérifiez l'URI dans `.env`
3. Testez la connexion : `mongosh` ou `mongo`

### Erreur : "Port 3000 already in use"

**Solution** :
1. Changez le PORT dans `.env`
2. Ou arrêtez le processus utilisant le port 3000

### Erreur : "Token manquant ou invalide"

**Solution** :
1. Vérifiez que vous êtes connecté
2. Vérifiez que le token est bien inclus dans le header `Authorization: Bearer <token>`
3. Le token expire après 24h, reconnectez-vous si nécessaire

### Erreur : "409 Conflict"

**Solution** :
1. Rechargez le document pour obtenir la dernière version
2. Utilisez le header `If-Match` avec la version actuelle

## 📁 Structure des fichiers générés

Après le premier démarrage, les fichiers suivants seront créés :

```
docsvault/
├── blockchain/
│   └── chain.json          # Fichier blockchain (généré automatiquement)
└── node_modules/           # Dépendances npm
```

## ✅ Vérification que tout fonctionne

1. ✅ Serveur démarre sans erreur
2. ✅ Interface web accessible sur http://localhost:3000
3. ✅ Connexion MongoDB réussie (message dans la console)
4. ✅ Création de compte fonctionne
5. ✅ Connexion fonctionne
6. ✅ Création de document fonctionne
7. ✅ Blockchain créée (dossier blockchain/ existe)

## 🎓 Prochaines étapes

1. Lisez le **README.md** pour la documentation complète
2. Consultez le **RAPPORT.md** pour les détails techniques
3. Lisez **EXPLICATION_PROFESSEUR.md** pour la présentation

---

**Bon développement ! 🚀**
