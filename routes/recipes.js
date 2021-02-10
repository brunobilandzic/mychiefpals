const express = require("express");
const User = require("../models/user.js");
const Recipe = require("../models/recipe.js");
const System = require("../models/system.js");
const APIHandler = require("../api/handler.js");
const router = express.Router();

const nutrients = ["Calories", "Fat", "Saturated Fat", "Carbohydrates", "Sugar", "Protein"];


function makeRecipeObject(recipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    cuisines: recipe.cuisines,
    readyInMinutes: recipe.readyInMinutes,
    nutrition: recipe.nutrition.nutrients.filter((nutrient) => nutrients.includes(nutrient.title)),
    caloricBreakDown: recipe.nutrition.caloricBreakdown,
    spoonacularScore: recipe.spoonacularScore,
    healthScore: recipe.healthScore,
    dishTypes: recipe.dishTypes,
    diets: recipe.diets,
    ingredients: recipe.extendedIngredients.map((ingredient) => {
      return {
        name: ingredient.name,
        originalString: ingredient.originalString
      }
    }),
    instructions: recipe.instructions,
    sourceUrl: recipe.sourceUrl
  }
}

function checkIfDay(t1, t2) {
  return ((t2 - t1) >= 86400000)
}

function updateCredits(username, last_update, decrement, userData) {
  System.findOne({}, (err, system) => {
      if (err) return;
      if (system) {
        if (checkIfDay(new Date(last_update).getTime(), Date.now()) && !decrement) {
          User.findOneAndUpdate({
              username: username
            }, {
              credits: system.daily_credits,
              credits_updated: new Date().toUTCString()
            },
            (err, user) => {
              if (user) {
                user.save();
                let toSend = {
                  credits: system.daily_credits,
                  credits_updated: new Date().toUTCString()
                }
                userData(toSend);
              }
            }
          );
        } else if (decrement) {
          User.findOneAndUpdate({
              username: username
            }, {
              $inc: {
                credits: -1
              }
            },
            (err, user) => {
              if (user)
                user.save();
            }
          );
        } else {
          User.findOne({
              username: username
            },
            (err, user) => {
              if (user) {
                let toSend = {
                  credits: user.credits,
                  credits_updated: user.credits_updated
                }
                userData(toSend);
              }
            }
          );
        }
      }});
  }
  router.route("/look")
    .get((req, res) => {
      if (typeof(req.user) != "undefined" && req.user.admin == false) {
        User.findOne({
            username: req.user.username
          },
          (err, user) => {
            if (!err) {
              return res.render("look/prompt", {
                user: req.user
              });
            } else {
              return res.redirect("/recipes/look");
            }
          }
        );
      } else if (typeof(req.user) == "undefined") {
        return res.redirect("/auth/login");
      } else {
        return res.redirect("/configure");
      }
    })
    .post((req, res) => {
      if (typeof(req.user) != "undefined" && req.user.admin == false) {
        User.findOne({
          username: req.user.username
        }, (err, user) => {
          if (err || !user) {
            console.log(err);
            return;
          } else if(!user.verified){
            return res.redirect("../auth/verify");
          }
           else if (user.credits > 0) {
            updateCredits(user.username, user.credits_updated, true);
            APIHandler.executeQuery(req.body, (queryResults) => {
              res.render("look/recipes", {
                user: req.user,
                recipes: queryResults,
                apiview: true
              });
            });
          } else {
            return res.render("look/credits", {
              user: req.user
            });
          }
        });
      } else if (typeof(req.user) == "undefined") {
        return res.redirect("/auth/login");
      } else {
        return res.reditect("/configure");
      }

    });

  router.route("/save/:recipeID")
    .post((req, res) => {
      rec_id = req.params.recipeID;
      Recipe.findOne({
          recipeID: rec_id
        },
        (err, recipe) => {
          if (err) return err;
          if (typeof(req.user) == "undefined" || req.user.admin) return;
          User.findOneAndUpdate({
              username: req.user.username
            }, {
              $push: {
                saved: rec_id
              }
            },
            (err, user) => {
              if (user) user.save();
              if (user.private) return;

              User.updateMany({
                username: {
                  $in: user.followed_by
                }},
                {$push: {
                  feed: {username: user.username, recipeID: rec_id, date: new Date().toUTCString()}
                }
              }, (err, users) => {

              });
            });
          if (!recipe) {
            APIHandler.addNewRecipe(req.params.recipeID, (recipe) => {
              let recipeModel = new Recipe(makeRecipeObject(recipe));
              recipeModel.save();
            });
          }
        });

    });

  router.route("/unsave/:recipeID")
    .post((req, res) => {
      if (typeof(req.user) == "undefined" || req.user.admin) return;
      User.findOneAndUpdate({
          username: req.user.username
        }, {
          $pull: {
            saved: req.params.recipeID
          }
        },
        (err, user) => {
          if (user) user.save();
        }
      );
    });

  router.route("/updatecredits")
    .post((req, res) => {
      User.findOne({
          username: req.user.username
        },
        (err, user) => {
          if (!err && user) {
            updateCredits(user.username, user.credits_updated, false, (userData) => {
              res.send(JSON.stringify(userData));
            });
          }
        }
      );

    });


  module.exports = router;
