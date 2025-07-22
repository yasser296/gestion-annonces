// backend/scripts/seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Modèles
const User = require('../models/User');
const Categorie = require('../models/Categorie');
const Annonce = require('../models/Annonce');
const Role = require('../models/Role');
const Wishlist = require('../models/Wishlist');
const DemandeVendeur = require('../models/DemandeVendeur');

// Données de seed
const rolesData = [
  { id: 1, titre: 'admin', description: 'Administrateur du système' },
  { id: 2, titre: 'user', description: 'Utilisateur standard' },
  { id: 3, titre: 'vendeur', description: 'Vendeur autorisé' }
];

const categoriesData = [
  { 
    nom: 'Voitures', 
    icone: '🚗',
    sousCategories: [
      { nom: 'Citadines', icone: '🚙' },
      { nom: 'SUV', icone: '🚐' },
      { nom: 'Berlines', icone: '🚘' },
      { nom: 'Sportives', icone: '🏎️' },
      { nom: 'Utilitaires', icone: '🚛' }
    ]
  },
  { 
    nom: 'Immobilier', 
    icone: '🏠',
    sousCategories: [
      { nom: 'Appartements', icone: '🏢' },
      { nom: 'Maisons', icone: '🏡' },
      { nom: 'Terrains', icone: '🏞️' },
      { nom: 'Bureaux', icone: '🏬' },
      { nom: 'Locaux commerciaux', icone: '🏪' }
    ]
  },
  { 
    nom: 'Électronique', 
    icone: '📱',
    sousCategories: [
      { nom: 'Smartphones', icone: '📱' },
      { nom: 'Ordinateurs', icone: '💻' },
      { nom: 'Tablettes', icone: '📋' },
      { nom: 'TV & Audio', icone: '📺' },
      { nom: 'Jeux vidéo', icone: '🎮' }
    ]
  },
  { 
    nom: 'Meubles', 
    icone: '🛋️',
    sousCategories: [
      { nom: 'Salon', icone: '🛋️' },
      { nom: 'Chambre', icone: '🛏️' },
      { nom: 'Cuisine', icone: '🍽️' },
      { nom: 'Bureau', icone: '🪑' },
      { nom: 'Jardin', icone: '🌿' }
    ]
  },
  { 
    nom: 'Vêtements', 
    icone: '👔',
    sousCategories: [
      { nom: 'Homme', icone: '👔' },
      { nom: 'Femme', icone: '👗' },
      { nom: 'Enfants', icone: '👶' },
      { nom: 'Chaussures', icone: '👟' },
      { nom: 'Accessoires', icone: '👜' }
    ]
  },
  { 
    nom: 'Services', 
    icone: '🛠️',
    sousCategories: [
      { nom: 'Bricolage', icone: '🔨' },
      { nom: 'Cours', icone: '📚' },
      { nom: 'Transport', icone: '🚚' },
      { nom: 'Événements', icone: '🎉' },
      { nom: 'Beauté', icone: '💅' }
    ]
  },
  { 
    nom: 'Sports & Loisirs', 
    icone: '⚽',
    sousCategories: [
      { nom: 'Fitness', icone: '🏋️' },
      { nom: 'Sports collectifs', icone: '⚽' },
      { nom: 'Sports individuels', icone: '🎾' },
      { nom: 'Camping', icone: '⛺' },
      { nom: 'Instruments de musique', icone: '🎸' }
    ]
  },
  { 
    nom: 'Emploi', 
    icone: '💼',
    sousCategories: [
      { nom: 'CDI', icone: '📄' },
      { nom: 'CDD', icone: '📋' },
      { nom: 'Stage', icone: '🎓' },
      { nom: 'Freelance', icone: '💻' },
      { nom: 'Temps partiel', icone: '⏰' }
    ]
  }
];

const usersData = [
  { nom: 'Admin Principal', email: 'admin@annonces.ma', telephone: '0600000001', role_id: 1, password: 'admin123' },
  { nom: 'Mohammed Alami', email: 'mohammed@email.com', telephone: '0612345678', role_id: 3, password: 'pass123' },
  { nom: 'Fatima Zahra', email: 'fatima@email.com', telephone: '0623456789', role_id: 3, password: 'pass123' },
  { nom: 'Ahmed Bennis', email: 'ahmed@email.com', telephone: '0634567890', role_id: 3, password: 'pass123' },
  { nom: 'Sara Idrissi', email: 'sara@email.com', telephone: '0645678901', role_id: 2, password: 'pass123' },
  { nom: 'Youssef Tazi', email: 'youssef@email.com', telephone: '0656789012', role_id: 3, password: 'pass123' },
  { nom: 'Laila Amrani', email: 'laila@email.com', telephone: '0667890123', role_id: 2, password: 'pass123' },
  { nom: 'Hassan Mourad', email: 'hassan@email.com', telephone: '0678901234', role_id: 3, password: 'pass123' },
  { nom: 'Khadija Sebti', email: 'khadija@email.com', telephone: '0689012345', role_id: 3, password: 'pass123' },
  { nom: 'Omar Fassi', email: 'omar@email.com', telephone: '0690123456', role_id: 2, password: 'pass123' },
  { nom: 'Salma Berrada', email: 'salma@email.com', telephone: '0601234567', role_id: 3, password: 'pass123' }
];

// Générateur de données d'annonces
const generateAnnonces = (categories, users) => {
  const villes = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Kenitra', 'Tétouan'];
  const etats = ['Neuf', 'Comme neuf', 'Bon état', 'État moyen'];
  
  const annoncesTemplates = {
    'Voitures': {
      titres: ['BMW Série 3', 'Mercedes Classe A', 'Audi A4', 'Volkswagen Golf', 'Renault Clio', 'Peugeot 208', 'Toyota Corolla', 'Nissan Qashqai', 'Ford Focus', 'Hyundai i20'],
      marques: ['BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Renault', 'Peugeot', 'Toyota', 'Nissan', 'Ford', 'Hyundai'],
      prixMin: 50000,
      prixMax: 500000,
      descriptions: [
        'Voiture en excellent état, première main, carnet d\'entretien à jour.',
        'Véhicule bien entretenu, faible kilométrage, toutes options.',
        'Occasion exceptionnelle, état impeccable, garantie disponible.',
        'Voiture économique, idéale pour la ville, consommation réduite.'
      ]
    },
    'Immobilier': {
      titres: ['Appartement 2 pièces centre-ville', 'Villa moderne avec jardin', 'Studio meublé proche université', 'Duplex vue mer', 'Maison traditionnelle rénovée'],
      marques: ['', '', '', '', ''],
      prixMin: 300000,
      prixMax: 3000000,
      descriptions: [
        'Bel appartement lumineux, proche de toutes commodités.',
        'Propriété exceptionnelle dans quartier calme et sécurisé.',
        'Idéal investissement locatif, rentabilité garantie.',
        'Bien rare sur le marché, à visiter rapidement.'
      ]
    },
    'Électronique': {
      titres: ['iPhone 13 Pro', 'MacBook Pro M1', 'Samsung Galaxy S22', 'PlayStation 5', 'iPad Air', 'Dell XPS 13', 'TV Samsung 4K 55"', 'AirPods Pro', 'Nintendo Switch', 'Canon EOS R5'],
      marques: ['Apple', 'Apple', 'Samsung', 'Sony', 'Apple', 'Dell', 'Samsung', 'Apple', 'Nintendo', 'Canon'],
      prixMin: 1000,
      prixMax: 20000,
      descriptions: [
        'Produit neuf sous garantie, facture disponible.',
        'État comme neuf, très peu utilisé, avec tous les accessoires.',
        'Excellent état, fonctionne parfaitement, boîte d\'origine.',
        'Occasion à saisir, prix négociable pour achat rapide.'
      ]
    },
    'Meubles': {
      titres: ['Canapé cuir 3 places', 'Table à manger 6 personnes', 'Armoire 3 portes', 'Bureau ergonomique', 'Lit double avec matelas', 'Étagère modulable', 'Fauteuil design', 'Commode vintage'],
      marques: ['IKEA', 'Conforama', 'But', 'Atlas', 'IKEA', 'Habitat', 'Design Italia', 'Vintage'],
      prixMin: 500,
      prixMax: 5000,
      descriptions: [
        'Meuble de qualité, très bon état, à récupérer sur place.',
        'Style moderne, matériaux nobles, entretien facile.',
        'Pièce unique, idéale pour décoration intérieure.',
        'Mobilier pratique et fonctionnel, excellent rapport qualité-prix.'
      ]
    },
    'Vêtements': {
      titres: ['Veste en cuir homme', 'Robe de soirée', 'Sneakers Nike Air Max', 'Costume sur mesure', 'Sac à main Gucci', 'Montre Rolex', 'Manteau d\'hiver femme', 'Jeans Levi\'s'],
      marques: ['Zara', 'H&M', 'Nike', 'Hugo Boss', 'Gucci', 'Rolex', 'Mango', 'Levi\'s'],
      prixMin: 100,
      prixMax: 5000,
      descriptions: [
        'Article authentique, état neuf, jamais porté.',
        'Taille standard, coupe parfaite, tissu de qualité.',
        'Pièce de collection, rare sur le marché.',
        'Prix sacrifié, départ urgent, à saisir rapidement.'
      ]
    }
  };

  const annonces = [];
  const vendeurs = users.filter(u => u.role_id === 3);

  categories.forEach(categorie => {
    const template = annoncesTemplates[categorie.nom] || annoncesTemplates['Électronique'];
    
    // Générer 10-20 annonces par catégorie principale
    const nbAnnonces = Math.floor(Math.random() * 10) + 10;
    
    for (let i = 0; i < nbAnnonces; i++) {
      const titre = template.titres[Math.floor(Math.random() * template.titres.length)];
      const marque = template.marques[Math.floor(Math.random() * template.marques.length)];
      const prix = Math.floor(Math.random() * (template.prixMax - template.prixMin)) + template.prixMin;
      const description = template.descriptions[Math.floor(Math.random() * template.descriptions.length)];
      const ville = villes[Math.floor(Math.random() * villes.length)];
      const etat = etats[Math.floor(Math.random() * etats.length)];
      const vendeur = vendeurs[Math.floor(Math.random() * vendeurs.length)];
      const vues = Math.floor(Math.random() * 500);
      const isActive = Math.random() > 0.1; // 90% actives
      
      // Date aléatoire dans les 3 derniers mois
      const datePublication = new Date();
      datePublication.setDate(datePublication.getDate() - Math.floor(Math.random() * 90));

      annonces.push({
        titre: `${titre} - ${ville}`,
        description: `${description}\n\nCaractéristiques:\n- État: ${etat}\n- Localisation: ${ville}\n- Disponible immédiatement\n\nContactez-moi pour plus d'informations.`,
        prix,
        categorie_id: categorie._id,
        user_id: vendeur._id,
        ville,
        marque,
        etat,
        nombre_vues: vues,
        date_publication: datePublication,
        is_active: isActive,
        images: [`/uploads/sample-${categorie.nom.toLowerCase()}-${i}.jpg`]
      });
    }
  });

  return annonces;
};

// Fonction principale de seed
const seedDatabase = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/annoncesDB', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connecté à MongoDB');

    // Nettoyer la base de données
    console.log('🧹 Nettoyage de la base de données...');
    await Promise.all([
      User.deleteMany({}),
      Categorie.deleteMany({}),
      Annonce.deleteMany({}),
      Role.deleteMany({}),
      Wishlist.deleteMany({}),
      DemandeVendeur.deleteMany({})
    ]);

    // Créer les rôles
    console.log('👥 Création des rôles...');
    await Role.insertMany(rolesData);

    // Créer les catégories
    console.log('📁 Création des catégories...');
    const categories = await Categorie.insertMany(
      categoriesData.map(cat => ({ nom: cat.nom, icone: cat.icone }))
    );

    // Créer les utilisateurs
    console.log('👤 Création des utilisateurs...');
    const hashedUsers = await Promise.all(
      usersData.map(async user => ({
        ...user,
        mot_de_passe: await bcrypt.hash(user.password, 10)
      }))
    );
    const users = await User.insertMany(hashedUsers);

    // Créer les annonces
    console.log('📝 Création des annonces...');
    const annonces = generateAnnonces(categories, users);
    const createdAnnonces = await Annonce.insertMany(annonces);

    // Créer quelques wishlists
    console.log('❤️ Création de wishlists...');
    const wishlistData = [];
    const regularUsers = users.filter(u => u.role_id === 2);
    
    regularUsers.forEach(user => {
      // Chaque utilisateur ajoute 3-5 annonces à sa wishlist
      const nbWishlist = Math.floor(Math.random() * 3) + 3;
      const randomAnnonces = [...createdAnnonces].sort(() => 0.5 - Math.random()).slice(0, nbWishlist);
      
      randomAnnonces.forEach(annonce => {
        wishlistData.push({
          user_id: user._id,
          annonce_id: annonce._id
        });
      });
    });
    
    await Wishlist.insertMany(wishlistData);

    // Créer quelques demandes vendeur
    console.log('📋 Création de demandes vendeur...');
    const demandesData = [
      {
        user_id: users.find(u => u.email === 'sara@email.com')._id,
        statut: 'en_attente',
        message_demande: 'Je souhaite vendre mes articles de mode vintage.'
      },
      {
        user_id: users.find(u => u.email === 'laila@email.com')._id,
        statut: 'acceptee',
        message_demande: 'J\'ai une boutique de décoration et je veux élargir ma clientèle.',
        message_admin: 'Demande acceptée. Bienvenue parmi nos vendeurs !',
        date_traitement: new Date()
      }
    ];
    await DemandeVendeur.insertMany(demandesData);

    // Résumé
    console.log('\n✅ Base de données initialisée avec succès !');
    console.log(`📊 Résumé:`);
    console.log(`   - ${rolesData.length} rôles créés`);
    console.log(`   - ${categories.length} catégories créées`);
    console.log(`   - ${users.length} utilisateurs créés`);
    console.log(`   - ${createdAnnonces.length} annonces créées`);
    console.log(`   - ${wishlistData.length} éléments en wishlist`);
    console.log(`   - ${demandesData.length} demandes vendeur`);
    
    console.log('\n🔐 Comptes de test:');
    console.log('   Admin: admin@annonces.ma / admin123');
    console.log('   Vendeur: mohammed@email.com / pass123');
    console.log('   User: sara@email.com / pass123');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connexion fermée');
  }
};

// Exécuter le seed
seedDatabase();