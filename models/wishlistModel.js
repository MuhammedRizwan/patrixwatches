const mongoose = require("mongoose")

const wishListItemSchema = new mongoose.Schema({

    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product',
        required:true
    },
    
  

})

const wishListSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
      
    },
    items:[wishListItemSchema],

 
    date:{
        type:Date,
        default:Date.now
    }
})


module.exports = mongoose.model("Wishlist",wishListSchema)