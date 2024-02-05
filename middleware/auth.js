const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.cookies.token
    const decode = jwt.decode(token, process.env.SECRETKEY)
    req.user = decode.user
    if (!req.user._id) {
      return res.status(403).redirect('/login')
    }else{
      if(req.user)
    }
    return next();
  } catch (error) {
    return res.status(401).send({ message: 'Unautherized' })
  }
  
};

module.exports = auth;
