const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId, // Set the author property as an ObjectId
    ref: 'User', // Reference the User model
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  ingredients: {
    type: String,
    required: true,
  },
  instructions: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Recipe', recipeSchema);
