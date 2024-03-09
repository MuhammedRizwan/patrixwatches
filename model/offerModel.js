const mongoose=require("mongoose")

const offerSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "ProductDetials",
    },
    category: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Category",
    },
    discountPercent: {
        type: Number,
        required: true
    },
    maxDiscountAmount: {
        type: Number,
        required: true
    },
    Date:{
        type:Date,
        default:Date.now()
    },
    is_UnList:{
        type:Boolean,
        default:false
    },
    ExpiryDate:{
        type:Date,
        required:true
    }

}, {
    timestamps: true
})


module.exports = mongoose.model("Offer", offerSchema)