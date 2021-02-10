require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("express-session");
const crypto = require("crypto");
const nodemailer = require('nodemailer');
const User = require("./models/user.js");

const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.text({
  type: "text/plain"
}));
app.use(session({
  secret: "Jeremy is black and white.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", require("./routes/auth"));
app.use("/recipes", require("./routes/recipes"));
app.use("/user", require("./routes/user"));
app.use("/admin", require("./routes/admin"));
app.use("/feed", require("./routes/feed"));
app.use("/users",  require("./routes/users"));

app.get("/",(req, res) => {
  if(req.user){
    return res.redirect("feed");
  } else {
    return res.redirect("auth/login");
  }
  res.render("home");
});


app.get("/search", (req, res) => {
  return res.render("profile/search", {
    user: req.user
  });
});
app.listen(process.env.PORT || 3000, ()=> {
  console.log("listening...");
})
