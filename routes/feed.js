const express = require("express");
const User = require("../models/user.js");
const Recipe = require("../models/recipe.js");
const router = express.Router();


function somethingWentWrong(req, res){
  res.render("messages/message", {
    message: ["Something went wrong please try again"],
    user: req.user
  });
}

function renderFeed(feedItems, recipes, render){
  let feed = [];
  feedItems.forEach((f) => {
    feed.push({
      username: f.username,
      date: f.date,
      recipe: recipes.filter((r) => r.id == f.recipeID)[0]
    });
  });
  feed.sort((a, b) => (new Date(a.date) > new Date(b.date)) ? -1 : 1);
  render(feed);
}


router.route("/")
  .get((req, res) => {
    if(typeof(req.user) == "undefined" || req.user.admin) return res.redirect("/auth/login");
    User.findOne({
      username: req.user.username
    },
    (err, user) => {
      if(err || !user) return somethingWentWrong(req, res);
      Recipe.find({
        id: {
          $in: user.feed.map((f) => f.recipeID)
        }},
        (err, recipes) => {
          if(err || !recipes) return somethingWentWrong(req, res);
          return renderFeed(user.feed, recipes, (feed) => {
            return res.render("look/feed", {
              recipes: feed,
              user: req.user
            });
          });
        });
      })
    });


module.exports = router;
