const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.cookies.token
  if (!token) {
    return res.status(403).redirect('/login')
  }

  try {
    const decode = jwt.decode(token, process.env.SECRETKEY)
    req.user = decode
  } catch (error) {
    res.status(401).send({ message: 'Unautherized' })
  }
  return next();
};

module.exports = auth;
