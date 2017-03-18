const mongoose = require('mongoose');

// TODO: Implement a strong hashing scheme for the access token.
// This can be done (according to Scott) just like the user passwords.

const TokenSchema = new mongoose.Schema({
  value: {
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

module.exports = mongoose.model('Token', TokenSchema);