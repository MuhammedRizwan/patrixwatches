const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    cartItems: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        quantity: {
            type: Number,
            default: 1
        },
        price: {
            type: Number,
            required: true
        }
    }],
    addedAt: {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose.model("cart", cartSchema);