// const jwt = require('jsonwebtoken');
const { User } = require('../model/userModel');
// const auth = (req, res, next) => {
//   try {
//     const token = req.cookies.token
//     const decode = jwt.decode(token, process.env.SECRETKEY)
//     req.user = decode.user
//     if(!req.user._id){
//       return res.redirect('/login')
//     }else{
//       if(req.user.is_block==true){
//         return res.redirect('/logout')
//       }
//       return next();
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(401).send({ message: 'Unautherized' })
//   }
// };

// module.exports = auth;

const isUser = async (req, res, next) => {
  try {
    if (req.session.user) {
      return next();
    }
    else {
      return res.redirect('/login');
    }
  } catch (error) {
   next(error.message)
  }
}
const isLoggedUser=async (req, res, next) => {
  try {
    if (req.session.LoggedUser) {
      return res.redirect('/');
    }
    else {
       next();
    
    }
  } catch (error) {
    next(error.message)
  }
}
const guestUser = async (req, res, next) => {
  try {
    if (req.session.user) {
      const userData = await User.findOne({ _id: req.session.user._id, is_block: false })
      if (!userData) {
        return res.redirect('/logout')
      } else {
        return next()
      }
    } else {
      return next()
    }
  } catch (error) {
    next(error.message)
  }
}
module.exports = {
  isUser, guestUser,isLoggedUser
}