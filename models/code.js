const mongoose = require('mongoose');

// TODO: Hash authorization code... somehow.

const CodeSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true
  },
  redirectUri: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  clientId: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Code', CodeSchema);