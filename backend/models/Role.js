// backend/models/Role.js
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  titre: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String
  },
  permissions: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour optimiser les recherches
roleSchema.index({ id: 1 });
roleSchema.index({ titre: 1 });

module.exports = mongoose.model('Role', roleSchema);