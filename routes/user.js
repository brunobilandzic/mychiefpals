const express = require("express");
const User = require("../models/user.js");
const Recipe = require("../models/recipe.js")
const APIHandler = require("../api/handler.js");
const router = express.Router();
const crypto = require("crypto");

function somethingWentWrong(req, res){
  res.render("messages/message", {
    message: ["Something went wrong please try again"],
    user: req.user
  });
}

router.route("/")
  .get((req, res) => {
    if (!req.user) {
      res.redirect("/auth/login");
    } else {
      User.findOne({
        username: req.user.username
      }, (err, user) => {
        if (err) {
          return res.redirect("/");
        } else {
          res.render("profile/profile", {
            user: req.user
          });
        }
      })
    }
  });

router.route("/saved")
  .get((req, res) => {
    if (!req.user) {
      return res.redirect("/");
    } else {
      User.findOne({
        username: req.user.username
      }, (err, user) => {
        if (err) {
          return res.redirect("/");
        } else {
          let savedRecipes = user.saved;
          Recipe.find({
              id: {
                $in: savedRecipes
              }
            },
            (err, recipes) => {
              if (err)
                return res.redirect("/user");;
              if (recipes) {
                return res.render("look/recipes", {
                  user: req.user,
                  recipes: recipes,
                  dbview: true
                });
              }

            });

        }
      });

    }
  });

router.route("/settings")
  .get((req, res) => {
    if (typeof(req.user) == "undefined") return res.redirect("/auth/login");
    return res.render("profile/settings/settings", {
      user: req.user
    });
  })
  router.route("/private")
    .post((req, res) =>{
      if(typeof(req.user) == "undefined" || req.user.admin) return res.redirect("/auth/login");
      User.findOneAndUpdate({
        username: req.user.username
      },{
        $set:{
          private: true
        }
      },
    (err, user) => {
      if(!err && user) user.save()
    });
  });
  router.route("/public")
    .post((req, res) =>{
      if(typeof(req.user) == "undefined" || req.user.admin) return res.redirect("/auth/login");
      User.findOneAndUpdate({
        username: req.user.username
      },{
        $set:{
          private: false
        }
      },
    (err, user) => {
      if(!err && user) user.save()
    });
  });
  router.route("/delete/:auth")
    .get((req, res) => {
      if (typeof(req.user) == "undefined") return res.redirect("/auth/login");
      return res.render("profile/settings/oldpwdprompt", {
        user: req.user
      });
    })
    .post((req, res) => {
      if (typeof(req.user) == "undefined" || req.user.auth != req.params.auth) return res.redirect("/auth/login");
      if (crypto.createHmac("sha256", req.user.username + req.body.password).update(process.env.authSalt).digest("hex") != req.user.auth)
        return res.render("profile/settings/oldpwdprompt", {
          user: req.user,
          errorList: ["Wrong password please try again!"]
        });
      User.deleteOne({
        auth: req.params.auth
      }, (err) => {
        if(err) {
          console.log(err);
          return;
        }
        req.logout();
        return res.render("profile/settings/deletionsucc");
      });
    });
    router.route("/f/:username")
      .get((req, res) => {
        User.find({
          username: {
            $regex: req.params.username
          }
        }, (err, users) => {
          if(err)
            return console.log(err);
          if(!users || (users.legnth == 0) || typeof(users[0])=="undefined"){
            return res.render("messages/message",{
              message: ["No user found"],
              user: req.user
            });
          }
          else if(users.length>1){
            return res.render("profile/users", {
              users: users,
              user: req.user,
              fShowing: "Search Results",
              showLogedUser: true
            })
          } else if(users[0].private){
            return res.render("messages/message",{
              message: ["Sorry but this user has private profile"],
              user: req.user
            });
          }
          let savedRecipes = users[0].saved;
          Recipe.find({
              id: {
                $in: savedRecipes
              }
            },
            (err, recipes) => {
              if (err)
                return res.redirect("/");
              if (recipes) {
                return res.render("look/recipes", {
                  user: req.user,
                  recipes: recipes,
                  dbview: true,
                  userView: users[0]
                });
              }

            });
        })
      });
    router.route("/search")
      .post((req, res) => {
        res.redirect("/user/f/"+req.body.username);
      })

    router.route("/follow/:username")
      .post((req, res) => {
        if(!req.user){
          return res.redirect("/auth/login");
        }
        User.findOneAndUpdate({
          username: req.user.username
        }, {
          $push:{
            following: req.params.username
          }
        }, (err, user) => {
          if(err || !user) return somethingWentWrong(req, res);
          user.save();
        });
        User.findOneAndUpdate({
          username:req.params.username
        }, {
          $push:{
            followed_by: req.user.username,
            notifications: {
              username: req.user.username,
              date: new Date().toUTCString()
            }
          }
        }, (err, user) => {
          if(err || !user) return somethingWentWrong(req, res);
          user.save();
        })
      });
    router.route("/unfollow/:username")
        .post((req, res) => {
          if(!req.user){
            return res.redirect("/auth/login");
          }
          User.findOneAndUpdate({
            username: req.user.username
          }, {
            $pull:{
              following: req.params.username
            }
          }, (err, user) => {
            if(err || !user) return somethingWentWrong(req, res);
            user.save();
          });
          User.findOneAndUpdate({
            username:req.params.username
          }, {
            $pull:{
              followed_by: req.user.username
            }
          }, (err, user) => {
            if(err || !user) return somethingWentWrong(req, res);
            user.save();
          })
        });

    router.route("/notifications")
      .get((req, res) => {
        if(typeof(req.user)=="undefined" || req.user.admin) return somethingWentWrong(req, res);
        User.findOne({
          username: req.user.username
        },
        (err, user) => {
          if(err || !user) return somethingWentWrong(req, res);
          user.notifications.forEach((n) => {n.seen = true});
          user.save();
          let notifications = user.notifications.slice();
          notifications.sort((a, b) => (new Date(a.date) > new Date(b.date)) ? -1 : 1);
          return res.render("profile/notifications", {
            user:req.user,
            notifications: notifications
          });
        })
      })
module.exports = router;
