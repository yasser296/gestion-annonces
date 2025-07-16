const express = require('express');
const pool = require('../db/config');
const authenticateToken = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configuration Multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Obtenir toutes les annonces avec filtres
router.get('/', async (req, res) => {
  try {
    const { categorie, ville, min_prix, max_prix, recherche } = req.query;
    let query = `
      SELECT a.*, c.nom as categorie_nom, u.nom as user_nom, u.telephone, u.email
      FROM annonces a
      JOIN categories c ON a.categorie_id = c.id
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (categorie && !isNaN(parseInt(categorie))) {
      query += ` AND a.categorie_id = $${paramIndex}`;
      params.push(categorie);
      paramIndex++;
    }


    if (ville && ville.trim() !== '') {
      query += ` AND LOWER(a.ville) LIKE LOWER($${paramIndex})`;
      params.push(`%${ville}%`);
      paramIndex++;
    }

    if (min_prix && !isNaN(parseFloat(min_prix))) {
      query += ` AND a.prix >= $${paramIndex}`;
      params.push(min_prix);
      paramIndex++;
    }

    if (max_prix && !isNaN(parseFloat(max_prix))) {
      query += ` AND a.prix <= $${paramIndex}`;
      params.push(max_prix);
      paramIndex++;
    }

    if (recherche && recherche.trim() !== '') {
      query += ` AND (LOWER(a.titre) LIKE LOWER($${paramIndex}) OR LOWER(a.description) LIKE LOWER($${paramIndex}))`;
      params.push(`%${recherche}%`);
      paramIndex++;
    }

    query += ' ORDER BY a.date_publication DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir une annonce par ID et incrémenter les vues
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Incrémenter le nombre de vues
    // await pool.query(
    //   'UPDATE annonces SET nombre_vues = nombre_vues + 1 WHERE id = $1',
    //   [id]
    // );
    
    // Récupérer l'annonce avec les détails
    const result = await pool.query(`
      SELECT a.*, c.nom as categorie_nom, u.nom as user_nom, u.telephone, u.email
      FROM annonces a
      JOIN categories c ON a.categorie_id = c.id
      JOIN users u ON a.user_id = u.id
      WHERE a.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Incrémenter les vues d'une annonce
router.patch('/:id/vues', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      'UPDATE annonces SET nombre_vues = nombre_vues + 1 WHERE id = $1',
      [id]
    );
    res.status(200).json({ message: 'Vues incrémentées' });
  } catch (error) {
    console.error('Erreur incrémentation vues :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


// Créer une nouvelle annonce (authentification requise)
router.post('/', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const { titre, description, prix, categorie_id, ville, marque, etat } = req.body;
    const user_id = req.user.id;
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    
    const result = await pool.query(
      `INSERT INTO annonces (titre, description, prix, categorie_id, user_id, ville, marque, etat, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [titre, description, prix, categorie_id, user_id, ville, marque, etat, images]
    );
    
    res.status(201).json({
      message: 'Annonce créée avec succès',
      annonce: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir les annonces d'un utilisateur
router.get('/user/mes-annonces', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    
    const result = await pool.query(`
      SELECT a.*, c.nom as categorie_nom
      FROM annonces a
      JOIN categories c ON a.categorie_id = c.id
      WHERE a.user_id = $1
      ORDER BY a.date_publication DESC
    `, [user_id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const check = await pool.query('SELECT * FROM annonces WHERE id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    await pool.query('DELETE FROM annonces WHERE id = $1', [id]);
    res.json({ message: 'Annonce supprimée avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.put('/:id', authenticateToken, upload.array('images', 5), async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { titre, description, prix, ville, marque, etat, categorie_id, existingImages } = req.body;

  try {
    const check = await pool.query('SELECT * FROM annonces WHERE id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Gérer les images
    let finalImages = [];
    
    // Conserver les images existantes
    if (existingImages) {
      const parsedExistingImages = JSON.parse(existingImages);
      finalImages = [...parsedExistingImages];
    }
    
    // Ajouter les nouvelles images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      finalImages = [...finalImages, ...newImages];
    }

    await pool.query(`
      UPDATE annonces SET
        titre = $1,
        description = $2,
        prix = $3,
        ville = $4,
        marque = $5,
        etat = $6,
        categorie_id = $7,
        images = $8
      WHERE id = $9
    `, [titre, description, prix, ville, marque, etat, categorie_id, finalImages, id]);

    res.json({ message: 'Annonce mise à jour avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT a.*, c.nom as categorie_nom
      FROM annonces a
      JOIN categories c ON a.categorie_id = c.id
      WHERE a.user_id = $1
      ORDER BY a.date_publication DESC
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});



module.exports = router;