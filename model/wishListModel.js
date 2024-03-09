const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  product: 
  [{
    productId:{
       type: mongoose.Schema.Types.ObjectId,
      ref:"ProductDetials",
      required: true,
    }

  }
],
  user: {
    type: mongoose.Schema.Types.ObjectId, // Fix: Use mongoose.Schema.Types.ObjectId
    ref:"userDetials",
    required:true,
  },
});

module.exports = mongoose.model("Wishlist", wishlistSchema);