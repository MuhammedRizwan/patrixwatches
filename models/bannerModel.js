const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  bannerType:String,
  title: String,
  image: String,
  link: String,
  subtitle: String,
  category:String,
  offer:String,
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
},  
startDate: {
  type: Date, 
  default: Date.now,
},
endDate: {
  type: Date,
  required: true,
  default: Date.now,
},
  isListed : {
    type : Boolean,
    default : true
}
  
});



module.exports = mongoose.model('Banner', bannerSchema);