const mongoose = require("mongoose")

const Category = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
   
    is_listed:{
        type:Boolean,
        default:true
    },

    categoryAddDate:{
        type:Date,
        default: Date.now,
    },
});
module.exports = mongoose.model("Category",Category)
