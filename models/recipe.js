const mongoose = require("mongoose");

mongoose.connect(process.env.mongooseConnectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const recipeSchema = new mongoose.Schema({
    id: Number,
    title: String,
    image: String,
    readyInMinutes: Number,
    nutrition: Array,
    spoonacularScore: Number,
    healthScore: Number,
    dishTypes: Array,
    diets: Array,
    cuisines: Array,
    ingredients: Array,
    instructions: String,
    sourceUrl: String
  });

module.exports = mongoose.model("Recipe", recipeSchema);
