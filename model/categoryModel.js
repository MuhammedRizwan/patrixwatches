const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true
    },
    discription: {
        type: String,
        default: ''
    },
    is_unList: {
        type: Boolean,
        default: false
    }
})
module.exports = mongoose.model('Category', categorySchema)