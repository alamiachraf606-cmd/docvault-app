const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// =====================
// Middlewares généraux
// =====================
app.use(express.json());
app.use(express.static('public'));

// =====================
// MongoDB URI
// =====================
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/docsvault';

// =====================
// Events MongoDB
// =====================
mongoose.connection.on('connected', () => {
  console.log('📡 MongoDB connecté et prêt');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Erreur MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB déconnecté');
});

// =====================
// Route de base
// =====================
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// =====================

// =====================
async function startServer() {
  try {
    console.log('🔄 Connexion à MongoDB...');

    await mongoose.connect(MONGODB_URI);

    console.log('✅ Connecté à MongoDB');

    
    app.use((req, res, next) => {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          error: 'MongoDB non disponible',
        });
      }
      next();
    });

    // =====================
    // 
    // =====================
    app.use('/auth', require('./routes/auth'));
    app.use('/documents', require('./routes/documents'));
    app.use('/audit', require('./routes/audit'));

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Impossible de démarrer le serveur:', err);
    process.exit(1);
  }
}

startServer();
