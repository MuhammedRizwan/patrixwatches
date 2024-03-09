const mongoose=require('mongoose');

const walletSchema=new mongoose.Schema({
    user:{
        type:mongoose.Types.ObjectId,
        ref:"userDetials",
        required:true
    },
    walletBalance:{
        type:Number,
        default:0
    },
    transaction:[{
        amount: { 
            type: Number, 
            required: true 
        },
        reason: { 
            type: String,
        },
        transactionType: {
          type: String,
          required: true,
        },
        date: {
          type: String,
          default: Date.now(),
        },
    }]
},{
    timestamps:true
})

module.exports=mongoose.model("wallet",walletSchema);