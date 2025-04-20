const mongoose = require("mongoose")

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    discount: {
        type: Number,
        required: true
    },
    limit: {
        type: Number,
        required: true
    },
    expiry: {
        type: Date,
        required: true
    },
    minAmt: {
        type: Number,
        required: true
    },
    maxAmt: {
        type: Number,
        required: true
    },
    userUsed: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    is_listed: {
        type: Boolean,
        default: true,
    },
    createdDate: {
        type: Date,
        default: Date.now
    }
})



module.exports = mongoose.model('Coupon', couponSchema)
