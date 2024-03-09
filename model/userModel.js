const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    is_admin: {
        type: Number,
        required: true
    },
    is_verified: {
        type: Number,
        default: 0
    },
    is_block: {
        type: Boolean,
        default: false
    },
},
    {
        timestamps: true
    })
const User = mongoose.model('userDetials', userSchema);

const otpSchema = new mongoose.Schema({
    email: {
        type: String
    },
    otp: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 30
    }
},
    {
        timestamps: true
    });
const Otp = mongoose.model('OTP', otpSchema);
module.exports = {
    User, Otp
}