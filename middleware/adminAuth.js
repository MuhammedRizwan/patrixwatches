// adminAuth.js
const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
    const token  = req.cookies.token
    if (!token) {
      return res.status(403).redirect('/admin')
    }
    try {
      const decode = jwt.verify(token, process.env.SECRETKEY);
      req.user=decode
    } catch (error) {
      return res.status(401).redirect('/admin')
    }
    return next();
  };
  
module.exports = adminAuth;
