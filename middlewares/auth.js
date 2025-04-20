const User = require("../models/userModel");

const islogin=async(req,res,next)=>{
    try {
    
      const userData = await User.findOne({ _id: req.session.user_id });
  if (req.session.user_id && userData.isAdmin==0 && userData.is_blocked===1 ) {

    next()
  } else {
 
    res.redirect('/login')
  
  }


    } catch(error){
  console.log(error.message);
    }
}


const islogout=async(req,res,next)=>{
    try {
     
      const userData = await User.findOne({ _id: req.session.user_id });
        if (req.session.user_id && userData.isAdmin==0  ) {
  
            res.redirect('/login')

        } else{
       
          next()
        }
      

    } catch(error){
  console.log(error.message);
    }
}

module.exports={
    islogin,
    islogout,
    
}