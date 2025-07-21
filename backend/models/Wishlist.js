const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  annonce_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Annonce',
    required: true
  },
  date_ajout: {
    type: Date,
    default: Date.now
  }
});

// Index unique pour éviter les doublons
wishlistSchema.index({ user_id: 1, annonce_id: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);