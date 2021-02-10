const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
//or use proccess.env.mongoConnectionString for cloud DB
mongoose.connect(process.env.mongooseConnectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});
const feedSchema = new mongoose.Schema({
  username: String,
  recipeID: Number,
  date: String
});
const notificationSchema = new mongoose.Schema({
  username: String,
  date: String,
  seen: {type: Boolean, default: false}
})
const userSchema = new mongoose.Schema({
  admin: {type: Boolean, default: false},
  private: {type: Boolean, default: false},
	username: String,
  feed: [feedSchema],
	email: String,
  auth: String,
  notifications: [notificationSchema],
  credits_updated: String,
  credits: {type: Number, default: 5},
  saved: Array,
	following: Array,
	followed_by: Array,
  verified: {type: Boolean, default: false},
  date: String
});
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
