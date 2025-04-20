const mongoose =require("mongoose")

const user= mongoose.Schema({
  name:{
      type:String,
      required:true

  },
  email:{
      type:String,
      required:true

  },
  mobile:{
      type:Number,
      required:true

  },
  password:{
      type:String,
      required:true

  },
  isAdmin:{
      type:Number,
      default: 0,

  },


  is_blocked:{
    type:Number,
    default:1,
},
image:{
    type:String
},
token:{
    type: String,
    default: ''
},
date:{
    type: Date,
    default: Date.now,
}
})


const User = mongoose.model('User', user);

module.exports = User;