const express = require("express");
const User = require("../models/user.js");
const router = express.Router();

function somethingWentWrong(req, res){
  res.render("messages/message", {
    message: ["Something went wrong please try again"],
    user: req.user
  });
}

router.get("/", (req, res) => {
  User.find(
    {admin: false},
    (err, users) => {
    users.sort((a, b) => (new Date(a.date) > new Date(b.date)) ? -1 : 1);
    res.render("profile/users",{
      user: req.user,
      users: users
    })
  });
});


router.get("/followers", (req, res) => {
  if(typeof(req.user) == "undefined" || req.user.admin) return res.redirect("/auth/login");
  User.findOne(
    {username: req.user.username},
    (err, user) => {
    if(err || !user) return somethingWentWrong(req, res);
    User.find({
      username: {
        $in: user.followed_by
      }
    },
    (err, users) => {
      if(err || !users) return somethingWentWrong(req, res);
      return res.render("profile/users",{
        user: req.user,
        users: users,
        fShowing: "Followers",
        showLogedUser:true
      });
    });
  });
});
router.get("/following", (req, res) => {
  if(typeof(req.user) == "undefined" || req.user.admin) return res.redirect("/auth/login");
  User.findOne(
    {username: req.user.username},
    (err, user) => {
    if(err || !user) return somethingWentWrong(req, res);
    User.find({
      username: {
        $in: user.following
      }
    },
    (err, users) => {
      if(err || !users) return somethingWentWrong(req, res);
      return res.render("profile/users",{
        user: req.user,
        users: users,
        fShowing: "Following",
        showLogedUser:true
      });
    });
  });
});
router.get("/following/:username", (req, res) => {
  if(typeof(req.user) == "undefined" || req.user.admin) return res.redirect("/auth/login");
  User.findOne(
    {username: req.params.username},
    (err, user) => {
    if(err || !user) return somethingWentWrong(req, res);
    User.find({
      username: {
        $in: user.following
      }
    },
    (err, users) => {
      if(err || !users) return somethingWentWrong(req, res);
      return res.render("profile/users",{
        user: req.user,
        users: users,
        fShowing: user.username + " is Following",
        showLogedUser:true
      });
    });
  });
});
router.get("/followers/:username", (req, res) => {
  if(typeof(req.user) == "undefined" || req.user.admin) return res.redirect("/auth/login");
  User.findOne(
    {username: req.params.username},
    (err, user) => {
    if(err || !user) return somethingWentWrong(req, res);
    User.find({
      username: {
        $in: user.followed_by
      }
    },
    (err, users) => {
      if(err || !users) return somethingWentWrong(req, res);
      return res.render("profile/users",{
        user: req.user,
        users: users,
        fShowing: user.username + "'s Followers",
        showLogedUser:true
      });
    });
  });
});


module.exports = router;
