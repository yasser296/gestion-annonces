const express = require('express');
const authenticateToken = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const Annonce = require('../models/Annonce');

const router = express.Router();

// Multer pour upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });



// Obtenir annonces avec filtres
router.get('/', async (req, res) => {
  const filters = { is_active: req.query.show_inactive === 'true' ? { $in: [true, false] } : true };
  if (req.query.categorie) filters.categorie_id = req.query.categorie;
  if (req.query.ville) filters.ville = new RegExp(req.query.ville, 'i');
  if (req.query.min_prix) filters.prix = { ...filters.prix, $gte: req.query.min_prix };
  if (req.query.max_prix) filters.prix = { ...filters.prix, $lte: req.query.max_prix };
  if (req.query.recherche) {
    filters.$or = [
      { titre: new RegExp(req.query.recherche, 'i') },
      { description: new RegExp(req.query.recherche, 'i') }
    ];
  }

  try {
    const annonces = await Annonce.find(filters)
      .populate('categorie_id')
      .populate('user_id')
      .sort({ date_publication: -1 });
    res.json(annonces);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir annonce par ID
router.get('/:id', async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id)
      .populate('categorie_id')
      .populate('user_id');

    if (!annonce) return res.status(404).json({ message: 'Annonce non trouvée' });

    res.json(annonce);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Incrémenter les vues d'une annonce
router.patch('/:id/vues', async (req, res) => {
  try {
    const annonce = await Annonce.findByIdAndUpdate(
      req.params.id,
      { $inc: { nombre_vues: 1 } },
      { new: true }
    );

    if (!annonce) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }

    res.json({ message: 'Nombre de vues incrémenté', nombre_vues: annonce.nombre_vues });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


// Créer une nouvelle annonce (authentification requise)
router.post('/', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
    const annonce = new Annonce({ ...req.body, user_id: req.user.id, images });

    await annonce.save();
    res.status(201).json({ message: 'Annonce créée', annonce });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir les annonces d'un utilisateur
router.get('/user/mes-annonces', authenticateToken, async (req, res) => {
  try {
    const annonces = await Annonce.find({ user_id: req.user.id })
      .populate('categorie_id')
      .sort({ date_publication: -1 });

    res.json(annonces);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const annonce = await Annonce.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });

    if (!annonce) {
      return res.status(403).json({ message: 'Accès refusé ou annonce inexistante' });
    }

    res.json({ message: 'Annonce supprimée avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.put('/:id', authenticateToken, upload.array('images', 5), async (req, res) => {
  const { titre, description, prix, ville, marque, etat, categorie_id, existingImages } = req.body;

  try {
    const annonce = await Annonce.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!annonce) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    let finalImages = [];

    if (existingImages) {
      finalImages = JSON.parse(existingImages);
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      finalImages = finalImages.concat(newImages);
    }

    annonce.titre = titre;
    annonce.description = description;
    annonce.prix = prix;
    annonce.ville = ville;
    annonce.marque = marque;
    annonce.etat = etat;
    annonce.categorie_id = categorie_id;
    annonce.images = finalImages;

    await annonce.save();

    res.json({ message: 'Annonce mise à jour avec succès', annonce });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const annonces = await Annonce.find({ user_id: req.params.userId, is_active: true })
      .populate('categorie_id')
      .sort({ date_publication: -1 });

    res.json(annonces);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Activer/Désactiver une annonce
router.patch('/:id/toggle-status', authenticateToken, async (req, res) => {
  try {
    const annonce = await Annonce.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!annonce) return res.status(403).json({ message: '' });

    annonce.is_active = !annonce.is_active;
    await annonce.save();
    res.json({ message: 'Statut mis à jour', is_active: annonce.is_active });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});



module.exports = router;