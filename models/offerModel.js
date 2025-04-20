const mongoose = require("mongoose");

const offerSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  discountOn: {
    type: String,
    enum: ['category', 'product'], // Example enum values
    required: true,
  },
  discountType: {
    type: String,
    enum: ["percentage", "fixed Amount"],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
  },
  maxAmt: {
    type: Number,
    default: 0,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  discountedProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  discountedCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
});


module.exports = mongoose.model("Offer", offerSchema);