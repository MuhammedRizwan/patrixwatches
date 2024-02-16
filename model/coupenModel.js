const mongoose=require('mongoose');

const coupenSchema=mongoose.Schema({
    code:{
        type:String,
        required:true
    },
    discount:{
        type:String,
        required:true
    },
    minAmt:{
        type:Number,
        required:true
    },
    maxAmt:{
        type:Number,
        required:true
    },
    
})