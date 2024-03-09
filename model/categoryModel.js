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
    },
    offerId:{
        type:mongoose.Types.ObjectId,
        ref:'Offer'
    }
}, 
{
    timestamps: true
})
module.exports = mongoose.model('Category', categorySchema)