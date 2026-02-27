const express = require('express');
const Document = require('../models/Document');
const { authenticate, checkOwnership } = require('../middleware/auth');
const { addAuditEvent, hashDocument, getDocumentHistory } = require('../utils/blockchain');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Créer un document
router.post('/', async (req, res) => {
  try {
    const { title, content, tags = [] } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Titre et contenu requis' });
    }

    const document = new Document({
      title,
      content,
      tags,
      ownerId: req.user._id,
      status: 'DRAFT'
    });

    await document.save();
    const docObj = document.toObject();

    // Ajouter l'événement d'audit dans la blockchain
    try {
      await addAuditEvent({
        eventId: require('crypto').randomUUID(),
        actorId: req.user._id.toString(),
        action: 'CREATE',
        documentId: document._id.toString(),
        timestamp: new Date().toISOString(),
        beforeHash: null,
        afterHash: hashDocument(docObj),
        meta: {}
      });
    } catch (blockchainError) {
      // Si la blockchain échoue, supprimer le document (rollback)
      await Document.findByIdAndDelete(document._id);
      throw new Error('Erreur lors de l\'écriture dans la blockchain');
    }

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lister les documents avec pagination et filtres
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const tag = req.query.tag;
    const q = req.query.q;

    const query = {};

    // Filtre par propriétaire (sauf admin)
    if (req.user.role !== 'admin') {
      query.ownerId = req.user._id;
    }

    // Filtre par statut
    if (status) {
      query.status = status;
    }

    // Filtre par tag
    if (tag) {
      query.tags = tag;
    }

    // Recherche textuelle
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const documents = await Document.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Document.countDocuments(query);

    res.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir un document par ID
router.get('/:id', checkOwnership, (req, res) => {
  res.json(req.document);
});

// Mettre à jour un document
router.patch('/:id', checkOwnership, async (req, res) => {
  try {
    const document = req.document;
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

    // Vérifier les transitions de statut
    const { status, content, title, tags } = req.body;
    
    if (status) {
      const validTransitions = {
        'DRAFT': ['PUBLISHED', 'ARCHIVED'],
        'PUBLISHED': ['ARCHIVED'],
        'ARCHIVED': []
      };

      if (!validTransitions[document.status]?.includes(status)) {
        return res.status(409).json({ 
          error: 'Transition de statut invalide',
          currentStatus: document.status,
          requestedStatus: status
        });
      }
    }

    // Si le document est PUBLISHED, on ne peut pas modifier le contenu
    if (document.status === 'PUBLISHED' && (content !== undefined || title !== undefined)) {
      return res.status(409).json({ 
        error: 'Le contenu et le titre ne peuvent pas être modifiés pour un document publié'
      });
    }

    // Sauvegarder l'état avant modification
    const beforeHash = hashDocument(document.toObject());
    const oldTitle = document.title;
    const oldContent = document.content;
    const oldTags = [...document.tags];
    const oldStatus = document.status;
    const oldVersion = document.version;

    // Appliquer les modifications
    if (title !== undefined) document.title = title;
    if (content !== undefined) document.content = content;
    if (tags !== undefined) document.tags = tags;
    if (status !== undefined) document.status = status;

    await document.save();
    const afterHash = hashDocument(document.toObject());

    // Déterminer le type d'action
    let action = 'UPDATE';
    const meta = {};
    
    if (status !== undefined && status !== oldStatus) {
      meta.statusChange = { from: oldStatus, to: status };
    }

    // Ajouter l'événement d'audit dans la blockchain
    try {
      await addAuditEvent({
        eventId: require('crypto').randomUUID(),
        actorId: req.user._id.toString(),
        action,
        documentId: document._id.toString(),
        timestamp: new Date().toISOString(),
        beforeHash,
        afterHash,
        meta
      });
    } catch (blockchainError) {
      // Rollback: restaurer l'état précédent
      await Document.findByIdAndUpdate(document._id, {
        $set: {
          title: oldTitle,
          content: oldContent,
          tags: oldTags,
          status: oldStatus,
          version: oldVersion
        }
      });
      throw new Error('Erreur lors de l\'écriture dans la blockchain');
    }

    res.set('ETag', document.version.toString());
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un document
router.delete('/:id', checkOwnership, async (req, res) => {
  try {
    const document = req.document;
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

    const beforeHash = hashDocument(document.toObject());

    // Ajouter l'événement d'audit AVANT la suppression
    try {
      await addAuditEvent({
        eventId: require('crypto').randomUUID(),
        actorId: req.user._id.toString(),
        action: 'DELETE',
        documentId: document._id.toString(),
        timestamp: new Date().toISOString(),
        beforeHash,
        afterHash: null,
        meta: {}
      });
    } catch (blockchainError) {
      throw new Error('Erreur lors de l\'écriture dans la blockchain');
    }

    // Supprimer le document
    await Document.findByIdAndDelete(document._id);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir l'historique d'un document depuis la blockchain
router.get('/:id/history', checkOwnership, async (req, res) => {
  try {
    const history = await getDocumentHistory(req.params.id);
    res.json({ documentId: req.params.id, history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
