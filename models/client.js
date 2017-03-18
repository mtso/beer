const mongoose = require('mongoose');

// TODO: Auto-generate client ID and secret.
// TODO: Hash the secret.
// TODO: Hash the ID?

const ClientSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  id: {
    type: String,
    required: true
  },
  secret: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Client', ClientSchema);