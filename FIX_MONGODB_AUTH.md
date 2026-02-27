# 🔧 Fix MongoDB Atlas Authentication Error

## ❌ Erreur actuelle
```
bad auth : authentication failed
```

Cela signifie que le nom d'utilisateur ou le mot de passe est incorrect dans MongoDB Atlas.

## ✅ Solution : Vérifier/Créer un utilisateur dans MongoDB Atlas

### Option 1 : Vérifier l'utilisateur existant

1. **Connectez-vous à MongoDB Atlas** : https://cloud.mongodb.com/
2. Allez dans **Security** → **Database Access**
3. Trouvez l'utilisateur `Achraf`
4. Cliquez sur **Edit** ou **...** → **Edit User**
5. Vérifiez :
   - Le nom d'utilisateur est exactement : `Achraf`
   - Le mot de passe est exactement : `<Achraf@12>`
   - Les permissions sont : **Atlas admin** ou **Read and write to any database**

### Option 2 : Créer un nouvel utilisateur (RECOMMANDÉ)

1. **Connectez-vous à MongoDB Atlas** : https://cloud.mongodb.com/
2. Allez dans **Security** → **Database Access**
3. Cliquez sur **Add New Database User**
4. Choisissez **Password** comme méthode d'authentification
5. **Nom d'utilisateur** : `docsvault_user` (ou un autre nom simple)
6. **Mot de passe** : Créez un mot de passe **SANS caractères spéciaux** comme `@`, `<`, `>`
   - ✅ Bon : `Docsvault123` ou `MyPassword2024`
   - ❌ Éviter : `<Achraf@12>` (caractères spéciaux)
7. **Permissions** : Choisissez **Atlas admin** ou **Read and write to any database**
8. Cliquez sur **Add User**

### Option 3 : Réinitialiser le mot de passe

1. Allez dans **Security** → **Database Access**
2. Trouvez l'utilisateur `Achraf`
3. Cliquez sur **Edit** ou **...** → **Edit User**
4. Cliquez sur **Edit Password**
5. Entrez un nouveau mot de passe **SANS caractères spéciaux**
6. Cliquez sur **Update User**

## 📝 Mettre à jour votre .env

Après avoir créé/vérifié l'utilisateur, mettez à jour votre `.env` :

### Si le mot de passe est simple (sans caractères spéciaux) :

```env
MONGODB_URI=mongodb+srv://docsvault_user:Docsvault123@cluster0.sxtlcfl.mongodb.net/docsvault?retryWrites=true&w=majority
```

### Si le mot de passe contient des caractères spéciaux :

Vous devez URL-encoder le mot de passe :
- `@` → `%40`
- `<` → `%3C`
- `>` → `%3E`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`
- `=` → `%3D`
- `?` → `%3F`
- `/` → `%2F`
- ` ` (espace) → `%20`

**Exemple** : Si votre mot de passe est `My@Pass#123`, la chaîne devient :
```env
MONGODB_URI=mongodb+srv://docsvault_user:My%40Pass%23123@cluster0.sxtlcfl.mongodb.net/docsvault?retryWrites=true&w=majority
```

## 🧪 Tester la connexion

1. Redémarrez votre serveur :
   ```bash
   npm start
   ```

2. Vous devriez voir :
   ```
   ✅ Connecté à MongoDB
   ```

## 🔍 Vérifier l'accès réseau

Assurez-vous que votre IP est autorisée :

1. Allez dans **Security** → **Network Access**
2. Vérifiez qu'il y a une entrée avec votre IP ou **0.0.0.0/0** (Allow Access from Anywhere)
3. Si rien n'est configuré, cliquez sur **Add IP Address** → **Allow Access from Anywhere**

## 💡 Recommandation

**Utilisez un mot de passe simple sans caractères spéciaux** pour éviter les problèmes d'encodage :
- ✅ `Docsvault2024`
- ✅ `MySecurePassword123`
- ❌ Éviter : `<Achraf@12>`, `Pass#123`, etc.

---

**Après avoir corrigé les credentials, redémarrez votre serveur et vous devriez être connecté !** 🎉
