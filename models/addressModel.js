const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:  true,
    },

    houseName: {
        type: String,
    },

    street: {
        type: String,
    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    pincode: {
        type: String,
    },
    createdDate: {
        type: Date,
        default: Date.now,
    },
    is_listed: {
        type: Boolean,
        default: true
    }

})

module.exports = mongoose.model('Address', addressSchema)