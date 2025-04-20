const { ObjectId } = require('mongodb');
const  mongoose = require('mongoose');

const Product  =  new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required: true,
    },
    image:{
        type:Array,
        require:true
      },
    category:{
        type: ObjectId,
        ref:'Category',
        required: true,
    },
    price:{
        type:Number,
        required:true
    },
    discount_price:{
        type:Number,
        required:true
    },
    ProductAddDate:{
        type: Date,
        default: Date.now,
    },
    stock:{
        type:Number,
        required:true
    },
    date:{
        type: Date,
        default: Date.now,
    },
    is_listed:{
        type:Boolean,
        default:true
    },
    discountStatus:{
        type:Boolean,
        default:false
      },
      discount:Number,
      discountStart:Date,
      discountEnd:Date,
    });




module.exports = mongoose.model('Product', Product)