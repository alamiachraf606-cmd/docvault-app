const express = require('express');
const { authenticate } = require('../middleware/auth');
const { verifyChain, getBlockchainInfo } = require('../utils/blockchain');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Obtenir les informations de la blockchain
router.get('/info', async (req, res) => {
  try {
    const info = await getBlockchainInfo();
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vérifier l'intégrité de la blockchain
router.get('/verify', async (req, res) => {
  try {
    const result = await verifyChain();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
