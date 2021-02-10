const express = require("express");
const System = require("../models/system.js");
const User = require("../models/user.js");
const router = express.Router();



router.route("/conf")
  .get((req, res) => {
    System.findOne({

      },
      (err, sys) => {
        if (err) return res.redirect("/auth/login");
        return res.render("admin/system", {
          sys: sys,
          user: req.user
        })
      })
  })

router.route("/conf/credits")
  .get((req, res) => {
    if (typeof(req.user) == "undefined" || !req.user.admin) return res.redirect("/auth/login");
    System.findOne({

      },
      (err, sys) => {
        if (err) return res.redirect("/auth/login");
        return res.render("admin/creditsprompt", {
          sys: sys,
          user: req.user
        });
      })
  })
  .post((req, res) => {
    if (typeof(req.user) == "undefined" || !req.user.admin) return res.redirect("/auth/login");
    System.findOneAndUpdate({

    },{
      daily_credits: req.body.credits
    }, (err, sys) => {
      if (sys) {
        sys.save();
        User.updateMany({

        },{
          credits: req.body.credits,
          credits_updated: new Date().toUTCString()
        },
        (err, users) => {
          return;
        });
        return res.redirect("/admin/conf");
      }
      return res.render("admin/creditsprompt", {
        sys: sys,
        user: req.user,
        errorList: ["Something went wrong, please try again."]
      });
    })
  })


module.exports = router;
