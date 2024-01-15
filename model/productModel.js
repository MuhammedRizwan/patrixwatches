const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    discription: {
        type: String,
        default: ""
    },
    category_id: {
        type: String,
        ref: 'Category',
    },
    orginalPrice: {
        type: Number,
        required: true
    },
    salePrice: {
        type: Number,
        required: true
    },
    createdOn: {
        type: Date,
        default: Date.now
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        max: 500
    },
    reviews: {
        type: Boolean,
        default: 0
    },
    image: [{
        filename: String,
    }]
})

module.exports = mongoose.model("ProductDetials", productSchema);

