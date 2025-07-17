// updateUsersRole.js
const mongoose = require('mongoose');
const User = require('../models/User'); // adapte le chemin si besoin

async function updateRoles() {
  await mongoose.connect('mongodb://127.0.0.1:27017/annoncesDB');
  // Mets 'utilisateur' par défaut
  await User.updateMany({ role: { $exists: false } }, { $set: { role: 'utilisateur' } });
  console.log('Rôles ajoutés aux comptes sans rôle');
  mongoose.connection.close();
}

updateRoles();
