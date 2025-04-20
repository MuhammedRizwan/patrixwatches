const mongoose = require('mongoose')


const transactionSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['debit', 'credit'],
        required: true
    }
})

const wallet = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    transaction: [transactionSchema],
    walletBalance: {
        type: Number,
        default: 0,
    }
})

module.exports = mongoose.model('Wallet',wallet)