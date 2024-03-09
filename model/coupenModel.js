const mongoose = require('mongoose');
const { array } = require('../config/multer');

const couponSchema = mongoose.Schema({
    code: {
        type: String,
        required: true
    },
    discount: {
        type: String,
        required: true
    },
    minAmt: {
        type: Number,
        required: true
    },
    maxDiscAmt: {
        type: Number,
        required: true
    },
    users: {
        type:Array,
        ref:'userDetials'
    },
    is_list: {
        type: Boolean,
        default: false
    },
    ExpiryDate:{
        type:Date,
        required:true
    }
},
    {
        timestamps: true
    }
);
module.exports = mongoose.model("Coupon", couponSchema)