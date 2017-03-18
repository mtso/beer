const mongoose = require('mongoose');

const BeerSchema = new mongoose.Schema({
  name: String,
  type: String,
  quantity: Number,
  userId: String
});

module.exports = mongoose.model('Beer', BeerSchema);
