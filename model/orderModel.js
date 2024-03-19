const mongoose = require("mongoose");

// Declare the Schema of the Mongo model
const oderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true
  },
  totalPrice: {
    required: false,
    type: Number,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userDetials", // Reference to the Address model
    required: true,
  },
  createdOn: {
    required: true,
    type: Date,
    default: Date.now,
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductDetials",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        required: true,
      },
    },
  ],
  paymentMethod: {
    required: true,
    type: String,
  },
  paymentStatus: {
    required: true,
    type: String
  },
  status: {
    required: true,
    type: String
  },
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:"Coupon"
  },
  address: {
    addressType: {
      type: String,
    },
    fullName: {
      type: String,
      required: true
    },
    mobile: {
      type: Number,
      required: true
    },
    houseName: {
      type: String,
      required: true
    },
    landMark: {
      type: String,
      required: true
    },
    townCity: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: Number,
      required: true
    }
  },
  couponId: {
    type: String
  }
},
  {
    timestamps: true
  });

//Export the model
module.exports = mongoose.model("Order", oderSchema);