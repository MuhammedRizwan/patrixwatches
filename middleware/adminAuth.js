// adminAuth.js
const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
    const token  = req.cookies.token
    if (!token) {
      res.status(403).redirect('/admin')
    }
    try {
      const decode = jwt.verify(token, process.env.SECRETKEY);
      req.user=decode
    } catch (error) {
      res.status(401).send({ message: 'Unautherized' })
    }
    return next();
  };
  
module.exports = adminAuth;
