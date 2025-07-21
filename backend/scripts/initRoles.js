// backend/scripts/initRoles.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Role = require('../models/Role');

dotenv.config();

const roles = [
  {
    id: 1,
    titre: 'admin',
    description: 'Administrateur avec tous les privilèges',
    permissions: ['manage_users', 'manage_annonces', 'manage_demandes', 'manage_roles']
  },
  {
    id: 2,
    titre: 'user',
    description: 'Utilisateur standard',
    permissions: ['view_annonces', 'wishlist', 'create_demande']
  },
  {
    id: 3,
    titre: 'vendeur',
    description: 'Vendeur pouvant créer des annonces',
    permissions: ['view_annonces', 'create_annonces', 'manage_own_annonces', 'wishlist']
  }
];

const initRoles = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/annonces_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connecté à MongoDB');

    // Créer ou mettre à jour les rôles
    for (const roleData of roles) {
      const existingRole = await Role.findOne({ id: roleData.id });
      
      if (existingRole) {
        // Mettre à jour le rôle existant
        await Role.findOneAndUpdate(
          { id: roleData.id },
          roleData,
          { new: true }
        );
        console.log(`Rôle mis à jour : ${roleData.titre}`);
      } else {
        // Créer le nouveau rôle
        await Role.create(roleData);
        console.log(`Rôle créé : ${roleData.titre}`);
      }
    }

    console.log('Initialisation des rôles terminée');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des rôles:', error);
    process.exit(1);
  }
};

initRoles();