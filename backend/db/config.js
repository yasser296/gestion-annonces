const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/annonces_DB', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connecté');
  } catch (err) {
    console.error('❌ Erreur connexion MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
