const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const annoncesRoutes = require('./routes/annonces');
const sousCategoriesRoutes = require('./routes/sousCategories');
const categoriesRoutes = require('./routes/categories');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin'); 
const demandesVendeurRoutes = require('./routes/demandesVendeur');
const wishlistRoutes = require('./routes/wishlist');
const attributesRoutes = require('./routes/attributes'); // NOUVEAU
const path = require('path');

dotenv.config();
// server.js
const connectDB = require('./db/config');
connectDB(); // juste après dotenv.config()

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/annonces', annoncesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/sous-categories', sousCategoriesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/demandes-vendeur', demandesVendeurRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/attributes', attributesRoutes); // NOUVEAU

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});