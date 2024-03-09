const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  image: [{
    filename: String,
  }],
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String, // Correct the typo in the field name
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  Date: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Banner", bannerSchema);