const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const BLOCKCHAIN_DIR = path.join(__dirname, '..', 'blockchain');
const CHAIN_FILE = path.join(BLOCKCHAIN_DIR, 'chain.json');

// S'assurer que le dossier blockchain existe
async function ensureBlockchainDir() {
  try {
    await fs.mkdir(BLOCKCHAIN_DIR, { recursive: true });
  } catch (error) {
    // Dossier existe déjà
  }
}

// Calculer le hash SHA256
function calculateHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Hash d'un document (sans _id)
function hashDocument(doc) {
  if (!doc) return null;
  
  const docCopy = { ...doc };
  delete docCopy._id;
  delete docCopy.__v;
  
  // Trier les clés pour un hash déterministe
  const sorted = Object.keys(docCopy).sort().reduce((acc, key) => {
    acc[key] = docCopy[key];
    return acc;
  }, {});
  
  return calculateHash(JSON.stringify(sorted));
}

// Créer le bloc Genesis
async function createGenesisBlock() {
  const genesisBlock = {
    index: 0,
    timestamp: new Date().toISOString(),
    prevHash: '0'.repeat(64), // 64 zéros
    hash: '',
    event: null
  };
  
  genesisBlock.hash = calculateHash(
    genesisBlock.index + 
    genesisBlock.timestamp + 
    genesisBlock.prevHash + 
    JSON.stringify(genesisBlock.event)
  );
  
  return genesisBlock;
}

// Lire la chaîne depuis le fichier
async function readChain() {
  await ensureBlockchainDir();
  
  try {
    const data = await fs.readFile(CHAIN_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Fichier n'existe pas, créer le bloc Genesis
    const genesis = await createGenesisBlock();
    const chain = [genesis];
    await writeChain(chain);
    return chain;
  }
}

// Écrire la chaîne dans le fichier (atomique)
async function writeChain(chain) {
  await ensureBlockchainDir();
  
  const tempFile = CHAIN_FILE + '.tmp';
  await fs.writeFile(tempFile, JSON.stringify(chain, null, 2), 'utf8');
  await fs.rename(tempFile, CHAIN_FILE);
}

// Ajouter un événement d'audit à la blockchain
async function addAuditEvent(eventData) {
  const chain = await readChain();
  const lastBlock = chain[chain.length - 1];
  
  const newBlock = {
    index: chain.length,
    timestamp: new Date().toISOString(),
    prevHash: lastBlock.hash,
    hash: '',
    event: eventData
  };
  
  newBlock.hash = calculateHash(
    newBlock.index + 
    newBlock.timestamp + 
    newBlock.prevHash + 
    JSON.stringify(newBlock.event)
  );
  
  chain.push(newBlock);
  await writeChain(chain);
  
  return newBlock;
}

// Vérifier l'intégrité de la chaîne
async function verifyChain() {
  const chain = await readChain();
  
  // Vérifier le bloc Genesis
  if (chain[0].index !== 0 || chain[0].prevHash !== '0'.repeat(64)) {
    return { valid: false, corruptedBlock: 0 };
  }
  
  // Vérifier chaque bloc
  for (let i = 1; i < chain.length; i++) {
    const block = chain[i];
    const prevBlock = chain[i - 1];
    
    // Vérifier prevHash
    if (block.prevHash !== prevBlock.hash) {
      return { valid: false, corruptedBlock: i };
    }
    
    // Vérifier le hash du bloc
    const calculatedHash = calculateHash(
      block.index + 
      block.timestamp + 
      block.prevHash + 
      JSON.stringify(block.event)
    );
    
    if (block.hash !== calculatedHash) {
      return { valid: false, corruptedBlock: i };
    }
  }
  
  return { valid: true, height: chain.length };
}

// Obtenir l'historique d'un document depuis la blockchain
async function getDocumentHistory(documentId) {
  const chain = await readChain();
  const history = [];
  
  for (const block of chain) {
    if (block.event && block.event.documentId === documentId.toString()) {
      history.push({
        blockIndex: block.index,
        timestamp: block.timestamp,
        action: block.event.action,
        actorId: block.event.actorId,
        beforeHash: block.event.beforeHash,
        afterHash: block.event.afterHash,
        meta: block.event.meta
      });
    }
  }
  
  return history;
}

// Obtenir les informations de la blockchain
async function getBlockchainInfo() {
  const chain = await readChain();
  const lastBlock = chain[chain.length - 1];
  
  return {
    height: chain.length,
    lastHash: lastBlock.hash,
    lastBlockIndex: lastBlock.index
  };
}

module.exports = {
  addAuditEvent,
  verifyChain,
  getDocumentHistory,
  getBlockchainInfo,
  hashDocument
};
