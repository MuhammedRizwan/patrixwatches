const mongoose = require('mongoose')

const cartItemSchema = new mongoose.Schema({
    product:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Product',
        required: true
    },
    quantity:{
        type: Number,
        required: true,
        min: 1
    }
})

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required: true
    },
    items: [cartItemSchema],
    total: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
    }
})


module.exports = mongoose.model('Cart',  cartSchema)