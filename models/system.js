const mongoose = require("mongoose");

mongoose.connect(process.env.mongooseConnectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const systemSchema = new mongoose.Schema({
    daily_credits: {type: Number, default: 5}
  });

module.exports = mongoose.model("System", systemSchema);
