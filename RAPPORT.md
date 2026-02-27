# Rapport Académique - DocsVault
## Système de Gestion de Documents avec API REST et Audit Blockchain

---

## Table des matières

1. [Introduction](#1-introduction)
2. [Architecture du système](#2-architecture-du-système)
3. [API REST et gestion de version](#3-api-rest-et-gestion-de-version)
4. [Machine d'état et transitions](#4-machine-détat-et-transitions)
5. [Système blockchain d'audit](#5-système-blockchain-daudit)
6. [Sécurité et contrôle d'accès](#6-sécurité-et-contrôle-daccès)
7. [Cohérence des données](#7-cohérence-des-données)
8. [Tests et validation](#8-tests-et-validation)
9. [Conclusion](#9-conclusion)

---

## 1. Introduction

### 1.1 Contexte

DocsVault est un système de gestion de documents développé dans le cadre d'un projet académique visant à maîtriser les concepts avancés du développement d'APIs REST et l'implémentation de mécanismes d'audit immuable inspirés de la blockchain.

### 1.2 Objectifs

Les objectifs principaux de ce projet sont :

- **Conception d'une API REST robuste** : Implémentation complète des opérations CRUD avec gestion avancée des ressources
- **Gestion de la concurrence** : Mise en place d'un mécanisme d'optimistic locking pour prévenir les conflits de modification
- **Machine d'état** : Implémentation d'un cycle de vie contrôlé pour les documents (brouillon → publication → archivage)
- **Audit trail immuable** : Création d'un système blockchain local pour tracer toutes les opérations de manière vérifiable
- **Sécurité** : Authentification JWT et contrôle d'accès basé sur les rôles (RBAC)

### 1.3 Technologies utilisées

- **Backend** : Node.js avec Express.js
- **Base de données** : MongoDB avec Mongoose
- **Authentification** : JWT (JSON Web Tokens) avec bcrypt pour le hachage des mots de passe
- **Blockchain** : Système de fichiers JSON avec hash SHA256
- **Frontend** : HTML5, CSS3, JavaScript vanilla

---

## 2. Architecture du système

### 2.1 Vue d'ensemble

Le système DocsVault suit une architecture en couches classique :

```
┌─────────────────┐
│  Client Web     │
│  (HTML/JS)      │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  API Express    │
│  (Routes)       │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────────┐
│ MongoDB│ │  Blockchain  │
│        │ │  (Fichiers)  │
└────────┘ └──────────────┘
```

### 2.2 Structure des données

#### Modèle Document

```javascript
{
  _id: ObjectId,
  title: String,
  content: String,
  tags: [String],
  ownerId: ObjectId (référence User),
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  version: Number (entier auto-incrémenté),
  createdAt: Date,
  updatedAt: Date
}
```

Le champ `version` est crucial pour l'optimistic locking. Il est incrémenté automatiquement à chaque modification via un hook Mongoose `pre('save')`.

#### Modèle User

```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashé avec bcrypt),
  role: "user" | "admin",
  createdAt: Date,
  updatedAt: Date
}
```

---

## 3. API REST et gestion de version

### 3.1 Optimistic Locking

L'optimistic locking est un mécanisme permettant de gérer les conflits de modification concurrente sans verrouillage pessimiste (locks) au niveau de la base de données.

#### Principe

1. Chaque document possède un champ `version` (entier)
2. Lors de la lecture, le client reçoit la version actuelle
3. Lors de la modification, le client doit envoyer le header `If-Match: <version>`
4. Le serveur compare la version reçue avec la version en base
5. Si elles correspondent, la modification est effectuée et la version est incrémentée
6. Si elles diffèrent, une erreur `409 Conflict` est retournée

#### Implémentation

```javascript
router.patch('/:id', checkOwnership, async (req, res) => {
  const ifMatch = req.headers['if-match'];
  if (!ifMatch) {
    return res.status(428).json({ error: 'Header If-Match requis' });
  }

  const expectedVersion = parseInt(ifMatch);
  if (document.version !== expectedVersion) {
    return res.status(409).json({ 
      error: 'Conflit de version',
      currentVersion: document.version
    });
  }
  
  // ... modification du document
  res.set('ETag', document.version.toString());
});
```

#### Avantages

- **Performance** : Pas de verrous bloquants
- **Scalabilité** : Fonctionne bien en environnement distribué
- **Simplicité** : Implémentation relativement simple

#### Inconvénients

- **Conflits possibles** : Nécessite une gestion des erreurs côté client
- **Retry nécessaire** : En cas de conflit, le client doit recharger et réessayer

### 3.2 Codes HTTP utilisés

| Code | Signification | Utilisation |
|------|----------------|-------------|
| 200 | OK | Requête réussie |
| 201 | Created | Document créé |
| 204 | No Content | Document supprimé |
| 400 | Bad Request | Données invalides |
| 401 | Unauthorized | Token manquant ou invalide |
| 403 | Forbidden | Accès refusé (autorisation) |
| 404 | Not Found | Document non trouvé |
| 409 | Conflict | Conflit de version ou transition invalide |
| 428 | Precondition Required | Header If-Match manquant |
| 500 | Internal Server Error | Erreur serveur |

---

## 4. Machine d'état et transitions

### 4.1 États possibles

Le système définit trois états pour un document :

- **DRAFT** : Brouillon, toutes les modifications sont autorisées
- **PUBLISHED** : Publié, le contenu est verrouillé (seuls les tags peuvent être modifiés)
- **ARCHIVED** : Archivé, document en lecture seule

### 4.2 Graphe de transitions

```
     ┌─────────┐
     │  DRAFT  │
     └────┬────┘
          │
     ┌────┴────┐
     │         │
     ▼         ▼
┌─────────┐ ┌──────────┐
│PUBLISHED│ │ ARCHIVED │
└────┬────┘ └──────────┘
     │
     ▼
┌──────────┐
│ ARCHIVED │
└──────────┘
```

### 4.3 Règles de transition

#### Transitions autorisées

1. `DRAFT` → `PUBLISHED` : Publication d'un brouillon
2. `DRAFT` → `ARCHIVED` : Archivage direct d'un brouillon
3. `PUBLISHED` → `ARCHIVED` : Archivage d'un document publié

#### Transitions interdites

- Toute autre transition retourne `409 Conflict`
- Retour en arrière impossible (pas de `PUBLISHED` → `DRAFT`)

### 4.4 Restrictions par état

#### Document PUBLISHED

Un document publié ne peut plus modifier :
- `title` : Interdit → `409 Conflict`
- `content` : Interdit → `409 Conflict`

Un document publié peut modifier :
- `tags` : Autorisé
- `status` : Transition vers `ARCHIVED` uniquement

#### Implémentation

```javascript
if (document.status === 'PUBLISHED' && 
    (content !== undefined || title !== undefined)) {
  return res.status(409).json({ 
    error: 'Le contenu et le titre ne peuvent pas être modifiés pour un document publié'
  });
}
```

---

## 5. Système blockchain d'audit

### 5.1 Concept

Le système blockchain implémenté dans DocsVault est une blockchain simplifiée utilisée uniquement pour l'audit. Contrairement aux blockchains cryptographiques complètes, elle ne gère pas de transactions financières mais trace de manière immuable toutes les opérations sur les documents.

### 5.2 Structure d'un bloc

```json
{
  "index": 1,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "prevHash": "a1b2c3d4e5f6...",
  "hash": "f6e5d4c3b2a1...",
  "event": {
    "eventId": "uuid",
    "actorId": "ObjectId",
    "action": "CREATE | UPDATE | DELETE",
    "documentId": "ObjectId",
    "timestamp": "ISO8601",
    "beforeHash": "sha256 | null",
    "afterHash": "sha256 | null",
    "meta": {
      "statusChange": {
        "from": "DRAFT",
        "to": "PUBLISHED"
      }
    }
  }
}
```

### 5.3 Calcul des hashes

#### Hash d'un document

Le hash d'un document est calculé à partir de tous ses champs sauf `_id` et `__v`, avec les clés triées alphabétiquement pour garantir un hash déterministe :

```javascript
function hashDocument(doc) {
  const docCopy = { ...doc };
  delete docCopy._id;
  delete docCopy.__v;
  
  const sorted = Object.keys(docCopy).sort().reduce((acc, key) => {
    acc[key] = docCopy[key];
    return acc;
  }, {});
  
  return crypto.createHash('sha256')
    .update(JSON.stringify(sorted))
    .digest('hex');
}
```

#### Hash d'un bloc

Le hash d'un bloc est calculé à partir de :
- `index`
- `timestamp`
- `prevHash`
- `JSON.stringify(event)`

```javascript
hash = SHA256(index + timestamp + prevHash + JSON.stringify(event))
```

### 5.4 Bloc Genesis

Le premier bloc (Genesis) est créé automatiquement :

```json
{
  "index": 0,
  "timestamp": "...",
  "prevHash": "0000...0000",  // 64 zéros
  "hash": "...",
  "event": null
}
```

### 5.5 Intégrité de la chaîne

#### Vérification

L'endpoint `/audit/verify` recalcule tous les hashes et vérifie :

1. **Cohérence des prevHash** : Chaque `prevHash` doit correspondre au `hash` du bloc précédent
2. **Validité des hashes** : Chaque hash doit correspondre au calcul SHA256

```javascript
async function verifyChain() {
  for (let i = 1; i < chain.length; i++) {
    const block = chain[i];
    const prevBlock = chain[i - 1];
    
    // Vérifier prevHash
    if (block.prevHash !== prevBlock.hash) {
      return { valid: false, corruptedBlock: i };
    }
    
    // Vérifier hash
    const calculatedHash = calculateHash(...);
    if (block.hash !== calculatedHash) {
      return { valid: false, corruptedBlock: i };
    }
  }
  return { valid: true, height: chain.length };
}
```

### 5.6 Gestion de la concurrence fichier

Pour éviter les corruptions lors d'écritures simultanées, le système utilise :

1. **Écriture atomique** : Écriture dans un fichier temporaire puis renommage
2. **Structure simple** : Un seul fichier `chain.json` contenant tous les blocs

```javascript
async function writeChain(chain) {
  const tempFile = CHAIN_FILE + '.tmp';
  await fs.writeFile(tempFile, JSON.stringify(chain, null, 2));
  await fs.rename(tempFile, CHAIN_FILE);  // Atomique
}
```

---

## 6. Sécurité et contrôle d'accès

### 6.1 Authentification JWT

#### Flux d'authentification

1. L'utilisateur s'inscrit ou se connecte via `/auth/register` ou `/auth/login`
2. Le serveur vérifie les identifiants
3. Un token JWT est généré avec les informations utilisateur
4. Le token est retourné au client
5. Le client inclut le token dans le header `Authorization: Bearer <token>`

#### Structure du token

```javascript
{
  userId: ObjectId,
  email: String,
  role: "user" | "admin",
  exp: timestamp
}
```

#### Validation

Un middleware vérifie chaque requête protégée :

```javascript
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.substring(7);
  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = await User.findById(decoded.userId);
  next();
};
```

### 6.2 Contrôle d'accès basé sur les rôles (RBAC)

#### Rôles

- **user** : Accès uniquement à ses propres documents
- **admin** : Accès à tous les documents

#### Implémentation

```javascript
const checkOwnership = async (req, res, next) => {
  const document = await Document.findById(req.params.id);
  
  if (req.user.role === 'admin') {
    req.document = document;
    return next();
  }
  
  if (document.ownerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Accès interdit' });
  }
  
  req.document = document;
  next();
};
```

### 6.3 Hachage des mots de passe

Les mots de passe sont hashés avec bcrypt (10 rounds) avant stockage :

```javascript
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
```

---

## 7. Cohérence des données

### 7.1 Problématique

Lorsqu'une opération modifie à la fois MongoDB et la blockchain, il est crucial de garantir la cohérence. Si l'écriture blockchain échoue, la modification MongoDB doit être annulée.

### 7.2 Stratégie de rollback

#### Approche choisie

En l'absence de transactions distribuées entre MongoDB et le système de fichiers, nous utilisons une stratégie de **compensation** :

1. Effectuer la modification dans MongoDB
2. Tenter l'écriture dans la blockchain
3. Si la blockchain échoue, restaurer l'état précédent dans MongoDB

#### Implémentation

```javascript
// Sauvegarder l'état avant
const beforeHash = hashDocument(document.toObject());

// Modifier le document
document.title = newTitle;
await document.save();

// Tenter l'écriture blockchain
try {
  await addAuditEvent({...});
} catch (blockchainError) {
  // Rollback: restaurer la version précédente
  await Document.findByIdAndUpdate(document._id, {
    $set: { title: oldTitle, version: document.version - 1 }
  });
  throw new Error('Erreur blockchain - rollback effectué');
}
```

#### Limitations

Cette approche n'est pas parfaitement atomique mais garantit la cohérence dans la plupart des cas. Pour une solution production, il faudrait utiliser :
- Transactions MongoDB (pour les opérations multi-documents)
- Système de files d'attente pour la blockchain
- Pattern Saga pour les transactions distribuées

---

## 8. Tests et validation

### 8.1 Tests de conflit de version

#### Scénario

1. Ouvrir deux onglets avec le même document
2. Modifier le document dans le premier onglet et sauvegarder
3. Tenter de sauvegarder dans le second onglet

#### Résultat attendu

Le second onglet doit recevoir une erreur `409 Conflict` avec le message indiquant la version actuelle.

### 8.2 Tests de transition de statut

#### Scénario 1 : Transition valide

1. Créer un document (DRAFT)
2. Publier le document (DRAFT → PUBLISHED)
3. Résultat : Succès, document en état PUBLISHED

#### Scénario 2 : Transition invalide

1. Avoir un document PUBLISHED
2. Tenter de le passer en DRAFT
3. Résultat : `409 Conflict`

#### Scénario 3 : Modification d'un document publié

1. Avoir un document PUBLISHED
2. Tenter de modifier le contenu
3. Résultat : `409 Conflict`

### 8.3 Tests d'intégrité blockchain

#### Scénario 1 : Vérification normale

1. Effectuer plusieurs opérations (création, modification, suppression)
2. Appeler `GET /audit/verify`
3. Résultat : `{ valid: true, height: N }`

#### Scénario 2 : Corruption volontaire

1. Modifier manuellement un fichier dans `blockchain/chain.json`
2. Appeler `GET /audit/verify`
3. Résultat : `{ valid: false, corruptedBlock: X }`

### 8.4 Tests de contrôle d'accès

#### Scénario 1 : User accédant à son document

1. Se connecter en tant que user
2. Accéder à son propre document
3. Résultat : Succès

#### Scénario 2 : User accédant au document d'un autre

1. Se connecter en tant que user
2. Accéder au document d'un autre user
3. Résultat : `403 Forbidden`

#### Scénario 3 : Admin accédant à tous les documents

1. Se connecter en tant que admin
2. Accéder à n'importe quel document
3. Résultat : Succès

---

## 9. Conclusion

### 9.1 Objectifs atteints

Le projet DocsVault a permis de mettre en pratique et de maîtriser :

- ✅ La conception d'APIs REST complètes et robustes
- ✅ La gestion de la concurrence avec l'optimistic locking
- ✅ L'implémentation de machines d'état avec validation stricte
- ✅ La création d'un système d'audit immuable inspiré de la blockchain
- ✅ La sécurité avec JWT et contrôle d'accès basé sur les rôles
- ✅ La gestion de la cohérence entre systèmes hétérogènes

### 9.2 Points forts

1. **Architecture claire** : Séparation des responsabilités (routes, modèles, middleware, utils)
2. **Sécurité robuste** : Authentification JWT, hachage bcrypt, contrôle d'accès
3. **Gestion de la concurrence** : Optimistic locking bien implémenté
4. **Audit complet** : Système blockchain fonctionnel avec vérification d'intégrité
5. **Interface utilisateur** : Client web moderne et intuitif

### 9.3 Améliorations possibles

1. **Transactions distribuées** : Implémentation d'un pattern Saga pour garantir l'atomicité MongoDB/Blockchain
2. **Tests automatisés** : Ajout de tests unitaires et d'intégration (Jest, Supertest)
3. **Performance** : Mise en cache (Redis) pour les requêtes fréquentes
4. **Monitoring** : Ajout de logs structurés et de métriques
5. **Documentation API** : Génération automatique avec Swagger/OpenAPI

### 9.4 Apprentissages

Ce projet a permis de comprendre en profondeur :

- Les défis de la gestion de la concurrence dans les systèmes distribués
- L'importance de l'audit trail pour la traçabilité
- Les compromis entre performance et cohérence des données
- L'architecture des blockchains et leur application pratique
- Les bonnes pratiques de sécurité dans les APIs REST

---

**Fin du rapport**

*Projet réalisé dans le cadre d'un cours académique sur les architectures web et les systèmes distribués.*
