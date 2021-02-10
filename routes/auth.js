const express = require("express");
const User = require("../models/user.js");
const passport = require("passport");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const router = express.Router();


passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

function checkIfDay(t1, t2) {
  return ((t2 - t1) >= 86400000)
}

function updateCredits(username, last_update) {
  if (checkIfDay(new Date(last_update).getTime(), Date.now())) {
    User.findOneAndUpdate({
        username: username
      }, {
        credits: 5,
        credits_updated: new Date().toUTCString()
      },
      (err, user) => {
        if (user)
          user.save();
      }
    );
  }
}

router.route("/login")
  .get((req, res) => {
    res.render("auth/login");
  })
  .post((req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    const errorList = [];
    const user = new User({
      username: username,
      password: password
    });
    User.findOne({
      username: username
    }, (err, u) => {
      if (!u) {
        errorList.push("There is no account with username " + username);
        return res.render("auth/login", {
          errorList: errorList
        });
      }
      if (u.auth != crypto.createHmac("sha256", username + password).update("salty").digest("hex")) {
        errorList.push("Wrong password, please try again.");
        return res.render("auth/login", {
          errorList: errorList
        });
      } else {
        req.login(user, (err) => {
          if (err) {
            console.log(err);
          } else {
            // updateCredits(user.username, user.credits_updated);
            passport.authenticate("local")(req, res, () => {
              res.redirect("/");
            });
          }
        });
      }
    });
  })
router.get("/log-out", (req, res) => {
  req.logout();
  res.redirect("/");
});
router.route("/singup")
  .get((req, res) => {
    res.render("auth/singup");
  })
  .post((req, res) => {
    const errorsList = [];
    const suData = req.body;
    if (suData.username != suData.username.split("").filter(x => x.match(/\w/i)).join("")) {
      errorsList.push("Username can only contain a-z, A-Z, 0-9 and _.");
    }
    if (suData.username.length < 5 || suData.username.length > 20) {
      errorsList.push("Username must contain between 5 and 20 cahracters.");
    }
    if (suData.password != suData.password2) {
      errorsList.push("Passwords have to match");
    }
    if (suData.password.length < 6) {
      errorsList.push("Password has to be at least 6 characters long.");
    }
    User.findOne({
      $or: {
        email: suData.email,
        username: suData.username
      }
    }, (err, user) => {
      if (user) {
        errorsList.push("Credentials already in use.");
        return res.render("auth/singup", {
          errorList: errorsList
        });
      }
    });
    if (errorsList.length != 0) {
      return res.render("auth/singup", {
        errorList: errorsList
      });
    }
    User.register({
      username: suData.username,
      email: suData.email,
      credits_updated: new Date().toUTCString(),
      date: new Date().toUTCString(),
      notifications: [],
      feed: [],
      following: [],
      followed_by: [],
      saved: [],
      auth: crypto.createHmac("sha256", suData.username + suData.password).update(process.env.authSalt).digest("hex")
    }, suData.password, (err, user) => {
      if (err) {
        console.log(err);
        return res.render("auth/singup", {
          errorList: ["Something went wrong, please try again."]
        });
      } else {
        passport.authenticate("local")(req, res, () => {
          return res.redirect("../auth/verify");
        });
      }

    });
  });

router.route("/verify")
  .get((req, res) => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.adminEmail,
        pass: process.env.adminEmailPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    User.findOne({
      _id: req.user._id
    }, (err, user) => {
      if (err) {
        return;
      } else {
        const hash = crypto.createHmac("sha256", req.user.auth).update(process.env.verifySecret).digest("hex");
        const url = req.protocol + "://" + req.get("host") + req.originalUrl + "/" + req.user.username + "/" + hash;
        const mailOptions = {
          from: process.env.adminEmail,
          to: user.email,
          subject: "Verify your E-Mail address",
          html: `<h1>Hey</h1>
              <p>Please Verify your E-Mail by clicking <a href="` + url + `">Here</a>.</p>`
        };
        transporter.sendMail(mailOptions, (err, info) => {
          if (err)
            return console.log(err);;
        });
      }
    });
    return res.render("auth/verify", {
      user: req.user
    });

  });

router.get("/verify/:username/:hash", (req, res) => {
  const errorList = [];
  User.findOne({
    username: req.params.username
  }, (err, user) => {
    if (err)
      errorList.push("Verification went wrong, please sing up again in order to repeat it.");
    else if (crypto.createHmac("sha256", user.auth).update(process.env.verifySecret).digest("hex") != req.params.hash) {
      User.deleteOne({
        _id: user._id
      });
      errorList.push("Verification went wrong, please sing up again in order to repeat it.");
    }
    if (errorList.length != 0) {
      return res.render("auth/singup", {
        errorList: errorList
      });
    }
    user.verified = true;
    user.save();
    res.redirect("/");
  });
});
router.route("/pwd/:auth")
  .get((req, res) => {
    if (typeof(req.user) == "undefined" || req.user.auth != req.params.auth) return res.redirect("/auth/login");
    return res.render("auth/resetpwd/oldpwdprompt", {
      user: req.user
    });
  })
  .post((req, res) => {
    if (crypto.createHmac("sha256", req.user.username + req.body.password).update(process.env.authSalt).digest("hex") != req.user.auth)
      return res.render("auth/resetpwd/oldpwdprompt", {
        user: req.user,
        errorList: ["Wrong password please try again!"]
      });
    return res.redirect("/auth/resetpwd/"+ req.user.username + "/" + crypto.createHmac("sha256", req.user.auth).update(process.env.verifySecret).digest("hex"))
  });

router.route("/resetpwd")
  .get((req, res) => {
    return res.render("auth/resetpwd/usernameprompt");
  })
  .post((req, res) => {
    errorList = [];
    User.findOne({
        username: req.body.username
      },
      (err, user) => {
        if (!err && user) {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.adminEmail,
              pass: process.env.adminEmailPass
            },
            tls: {
              rejectUnauthorized: false
            }
          });
          const hash = crypto.createHmac("sha256", user.auth).update(process.env.verifySecret).digest("hex");
          const url = req.protocol + "://" + req.get("host") + req.originalUrl + "/" + user.username + "/" + hash;
          const mailOptions = {
            from: process.env.adminEmail,
            to: user.email,
            subject: 'Password Reset',
            html: `<h1>Password Reset</h1>
              <p>Reset your password by clicking <a href="` + url + `">Here</a>.</p>`
          };
          transporter.sendMail(mailOptions, (err, info) => {
            if (err){
              console.log(err);
              errorList.push("Something went wrong with sending an email with password reset link. Please contact us.");
              return res.render("auth/resetpwd/usernameprompt", {
                errorList:errorList
              });
            }
          });
          if(errorList.length==0)
            return res.render("auth/resetpwd/demandsent", {
              user: {
                email: user.email
              }
            });
        } else {
          errorList.push("Cant find user with that username.");
          return res.render("auth/resetpwd/usernameprompt", {
            errorList:errorList
          });
        }
      }
    );

  });
router.get("/resetpwd/:username/:hash", (req, res) => {
  User.findOne({
    username: req.params.username
  }, (err, user) => {
    if (!err && user) {
      if (crypto.createHmac("sha256", user.auth).update(process.env.verifySecret).digest("hex") != req.params.hash) {
        return res.send("<h3>Something went wrong. Please try reseting your password again or contact us at " + process.env.adminEmail + ".</h3>");
      }
      return res.render("auth/resetpwd/newpwdprompt", {
        username: req.params.username,
        user: req.user
      });

    }
  })
});

router.post("/resetpwd/:username", (req, res) => {
  const data = req.body;
  const errorsList = [];
  if (data.password != data.password2) {
    errorsList.push("Passwords have to match");
  }
  if (data.password.length < 6) {
    errorsList.push("Password has to be at least 6 characters long.");
  }
  if (errorsList.length != 0) {
    return res.render("auth/resetpwd/newpwdprompt", {
      username: req.params.username,
      errorList: errorsList,
      user: req.user
    });
  }
  User.findOne({
      username: req.params.username
    },
    (err, user) => {
      if (!err && user) {
        user.setPassword(data.password, (err, user) => {
          if (err)
            return console.log(err);
          else {
            user.auth = crypto.createHmac("sha256", user.username + data.password).update(process.env.authSalt).digest("hex")
            user.save();
            return res.render("auth/resetpwd/success");
          }
        });
      } else {
        return res.send("<h3>Something went wrong. Please try reseting your password again or contact us at " + process.env.adminEmail + ".</h3>");
      }
    });
});


module.exports = router;
