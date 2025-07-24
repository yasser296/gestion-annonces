const mongoose = require('mongoose');

const annonceSchema = new mongoose.Schema({
  titre: String,
  description: String,
  prix: Number,
  categorie_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Categorie' },
  sous_categorie_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SousCategorie' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ville: String,
  marque: String,
  etat: String,
  nombre_vues: { type: Number, default: 0 },
  date_publication: { type: Date, default: Date.now },
  images: [String],
  is_active: { type: Boolean, default: true }
});

// Middleware pour supprimer les wishlists et valeurs d'attributs quand une annonce est supprimée
annonceSchema.pre('deleteOne', { document: false, query: true }, async function() {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    const Wishlist = require('./Wishlist');
    const AnnonceAttributeValue = require('./AnnonceAttributeValue');
    
    // Supprimer les wishlists
    await Wishlist.deleteMany({ annonce_id: doc._id });
    
    // Supprimer les valeurs d'attributs
    await AnnonceAttributeValue.deleteMany({ annonce_id: doc._id });
  }
});

annonceSchema.pre('findOneAndDelete', async function() {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    const Wishlist = require('./Wishlist');
    const AnnonceAttributeValue = require('./AnnonceAttributeValue');
    
    // Supprimer les wishlists
    await Wishlist.deleteMany({ annonce_id: doc._id });
    
    // Supprimer les valeurs d'attributs
    await AnnonceAttributeValue.deleteMany({ annonce_id: doc._id });
  }
});

annonceSchema.pre('deleteMany', async function() {
  const docs = await this.model.find(this.getFilter());
  if (docs.length > 0) {
    const Wishlist = require('./Wishlist');
    const AnnonceAttributeValue = require('./AnnonceAttributeValue');
    
    const annonceIds = docs.map(doc => doc._id);
    
    // Supprimer les wishlists
    await Wishlist.deleteMany({ annonce_id: { $in: annonceIds } });
    
    // Supprimer les valeurs d'attributs
    await AnnonceAttributeValue.deleteMany({ annonce_id: { $in: annonceIds } });
  }
});

// Méthode virtuelle pour récupérer les attributs de l'annonce
annonceSchema.virtual('attributes', {
  ref: 'AnnonceAttributeValue',
  localField: '_id',
  foreignField: 'annonce_id',
  populate: {
    path: 'attribute_id'
  }
});

// Activer les virtuals dans toJSON
annonceSchema.set('toJSON', { virtuals: true });
annonceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Annonce', annonceSchema);