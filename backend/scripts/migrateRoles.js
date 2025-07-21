// backend/scripts/migrateRoles.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/annonces_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const migrateRoles = async () => {
  try {
    console.log('Début de la migration des rôles...');

    // Récupérer la collection users directement
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Mapper les anciens rôles vers les nouveaux IDs
    const roleMapping = {
      'admin': 1,
      'user': 2,
      'vendeur': 3
    };

    // Récupérer tous les utilisateurs
    const users = await usersCollection.find({}).toArray();
    
    let migratedCount = 0;
    
    for (const user of users) {
      if (user.role && !user.role_id) {
        const newRoleId = roleMapping[user.role] || 2; // Par défaut user
        
        await usersCollection.updateOne(
          { _id: user._id },
          { 
            $set: { role_id: newRoleId },
            $unset: { role: '' } // Supprimer l'ancien champ
          }
        );
        
        migratedCount++;
        console.log(`Utilisateur ${user.email} migré : ${user.role} → role_id: ${newRoleId}`);
      }
    }

    console.log(`Migration terminée. ${migratedCount} utilisateurs migrés.`);
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    process.exit(1);
  }
};

// Attendre que la connexion soit établie
mongoose.connection.on('connected', () => {
  migrateRoles();
});