const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// === 1. MODELES ===
const userSchema = new mongoose.Schema({
  nom: String,
  email: String,
  telephone: String,
  mot_de_passe: String,
  role: { type: String, default: "user" },
  date_inscription: { type: Date, default: Date.now }
});
const annonceSchema = new mongoose.Schema({
  titre: String,
  description: String,
  prix: Number,
  categorie_id: mongoose.Schema.Types.ObjectId,
  user_id: mongoose.Schema.Types.ObjectId,
  ville: String,
  marque: String,
  etat: String,
  nombre_vues: Number,
  date_publication: { type: Date, default: Date.now },
  images: [String],
  is_active: Boolean
});
const User = mongoose.model('User', userSchema);
const Annonce = mongoose.model('Annonce', annonceSchema);

// === 2. CONNEXION ===
mongoose.connect('mongodb://127.0.0.1:27017/annoncesDB')
  .then(async () => {
    console.log('✅ Connecté à MongoDB');

    // 3. Créer des users (role = user)
    const usersData = [
      { nom: 'Sarah Benali', email: 'sarah.benali@gmail.com', telephone: '0601111111', mot_de_passe: await bcrypt.hash('userpass1', 10) },
      { nom: 'Mehdi Loukili', email: 'mehdi.loukili@gmail.com', telephone: '0602222222', mot_de_passe: await bcrypt.hash('userpass2', 10) },
      { nom: 'Omar Azizi', email: 'omar.azizi@gmail.com', telephone: '0603333333', mot_de_passe: await bcrypt.hash('userpass3', 10) },
      { nom: 'Amina Chafi', email: 'amina.chafi@gmail.com', telephone: '0604444444', mot_de_passe: await bcrypt.hash('userpass4', 10) }
    ];
    await User.deleteMany({ role: "user" }); // pour repartir propre si tu relances
    const users = await User.insertMany(usersData);
    console.log(`✅ ${users.length} utilisateurs insérés`);

    // 4. Récupère une liste de categories déjà présentes dans ta DB
    const categories = [
      // Mets ici les ObjectId de tes vraies catégories (copie/colle ceux de ta base !)
      // Exemple : new mongoose.Types.ObjectId("6877d7b32e9a636f2b9f2aa2")
      { _id: new mongoose.Types.ObjectId("6877d7b32e9a636f2b9f2aa2"), nom: "Appartements" },
      { _id: new mongoose.Types.ObjectId("6877d7b32e9a636f2b9f2aa3"), nom: "Voitures" },
      { _id: new mongoose.Types.ObjectId("6877d7b32e9a636f2b9f2aa4"), nom: "Électronique" },
      { _id: new mongoose.Types.ObjectId("6877d7b32e9a636f2b9f2aa5"), nom: "Meubles" },
      { _id: new mongoose.Types.ObjectId("6877d7b32e9a636f2b9f2aa6"), nom: "Vêtements" }
    ];

    // 5. Créer des annonces
    const annoncesData = [
      {
        titre: "Appartement centre ville",
        description: "Bel appartement à vendre, bien situé, lumineux.",
        prix: 1100000,
        categorie_id: categories[0]._id,
        user_id: users[0]._id,
        ville: "Rabat",
        marque: "",
        etat: "Neuf",
        nombre_vues: 3,
        images: [],
        is_active: true
      },
      {
        titre: "Peugeot 208 essence",
        description: "Voiture très propre, faible kilométrage.",
        prix: 98000,
        categorie_id: categories[1]._id,
        user_id: users[1]._id,
        ville: "Casablanca",
        marque: "Peugeot",
        etat: "Occasion",
        nombre_vues: 8,
        images: [],
        is_active: true
      },
      {
        titre: "Canapé 3 places",
        description: "Meuble en bon état, confortable.",
        prix: 1800,
        categorie_id: categories[3]._id,
        user_id: users[2]._id,
        ville: "Salé",
        marque: "Ikea",
        etat: "Bon état",
        nombre_vues: 0,
        images: [],
        is_active: false
      },
      {
        titre: "PC Portable Dell Inspiron",
        description: "PC Dell récent, 8Go RAM, SSD.",
        prix: 5000,
        categorie_id: categories[2]._id,
        user_id: users[0]._id,
        ville: "Fès",
        marque: "Dell",
        etat: "Neuf",
        nombre_vues: 4,
        images: [],
        is_active: true
      },
      {
        titre: "Chemise Zara homme",
        description: "Chemise neuve, jamais portée.",
        prix: 180,
        categorie_id: categories[4]._id,
        user_id: users[3]._id,
        ville: "Rabat",
        marque: "Zara",
        etat: "Neuf",
        nombre_vues: 2,
        images: [],
        is_active: true
      }
    ];
    await Annonce.deleteMany({}); // nettoie pour éviter les doublons si tu rejoues le script
    const annonces = await Annonce.insertMany(annoncesData);
    console.log(`✅ ${annonces.length} annonces insérées`);

    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur connexion ou insertion :', err);
    process.exit(1);
  });
