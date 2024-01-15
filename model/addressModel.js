const mongoose=require('mongoose');

const addressSchema=mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    fullName:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    houseName:{
        type:String,
        required:true
    },
    landMark:{
        type:String,
        required:true
    },
    townCity:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    pincode:{
        type:Number,
        required:true
    },
    addressType:{
        type:String,
        required:true
    }
});

module.exports=mongoose.model('address',addressSchema);

