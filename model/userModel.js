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
    }
})
module.exports = mongoose.model('userDetials', userSchema);

const otpSchema = new mongoose.Schema({
    email:{
        type:String
    },
    otp:{
        type:String
    },
    createdAt:{
        type:Date,
        default:Date.now,
        expires:60*5
    }
    
})
module.exports = mongoose.model('OTP',otpSchema)