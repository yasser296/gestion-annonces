const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const annoncesRoutes = require('./routes/annonces');
const categoriesRoutes = require('./routes/categories');
const usersRoutes = require('./routes/users'); // Nouvelle ligne
const path = require('path');

dotenv.config();

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
app.use('/api/users', usersRoutes); // Nouvelle ligne

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});