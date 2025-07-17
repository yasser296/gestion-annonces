const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/annoncesDB');
    console.log('✅ Connecté à MongoDB');

    // Vérifier si un admin existe déjà
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Un compte admin existe déjà');
      process.exit(0);
    }

    // Créer le compte admin
    const hashedPassword = await bcrypt.hash('adminyasserpasse', 10);
    const admin = new User({
      nom: 'Administrateur',
      email: 'admin@gmail.com',
      telephone: '0600000000',
      mot_de_passe: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Compte admin créé avec succès');
    console.log('Email: admin@annonces.ma');
    console.log('Mot de passe: AdminPassword123!');
    console.log('⚠️  IMPORTANT: Changez ce mot de passe dès la première connexion!');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    mongoose.connection.close();
  }
};

createAdmin();