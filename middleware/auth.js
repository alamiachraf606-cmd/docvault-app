const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_changez_moi';

// Middleware d'authentification OPTIMISÉ
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant ou invalide' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // ✅ OPTIMISATION: Stocker userId + role dans le JWT
    // Plus besoin de requête DB sur chaque requête!
    req.user = {
      _id: decoded.userId,
      role: decoded.role,
      email: decoded.email // optionnel
    };
    
    // ⚠️ Si vous avez besoin des données fraîches (ex: vérifier si user banni),
    // faites la requête DB seulement pour les routes critiques
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }
};

// Middleware d'authentification AVEC vérification DB (pour routes critiques)
const authenticateStrict = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant ou invalide' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Requête DB seulement quand nécessaire
    const user = await User.findById(decoded.userId).lean(); // .lean() = 30% plus rapide
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }
};

// Middleware d'autorisation (inchangé, mais plus rapide maintenant!)
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès interdit' });
    }

    next();
  };
};

// Vérifier la propriété du document - OPTIMISÉ
const checkOwnership = async (req, res, next) => {
  try {
    const Document = require('../models/Document');
    
    // ✅ OPTIMISATION: .select() pour ne récupérer que les champs nécessaires
    const document = await Document.findById(req.params.id)
      .select('ownerId status version title content tags');

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    // Admin peut accéder à tous les documents
    if (req.user.role === 'admin') {
      req.document = document;
      return next();
    }

    // User ne peut accéder qu'à ses propres documents
    if (document.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Accès interdit' });
    }

    req.document = document;
    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  authenticate, 
  authenticateStrict, // Pour routes critiques uniquement
  authorize, 
  checkOwnership 
};