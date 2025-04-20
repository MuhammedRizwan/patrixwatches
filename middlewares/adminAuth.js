const User = require("../models/userModel");

const islogin = async (req, res, next) => {
  try {

    const adminData = await User.findOne({ _id: req.session.admin_id });

    if (req.session.admin_id && adminData.isAdmin == 1 ) {
      next();
    } else {
      res.redirect("/admin"); 
    }
  } catch (error) {
    console.log(error.message);
  }
};

const islogout = async (req, res, next) => {
  try {
   
    const adminData = await User.findOne({ _id: req.session.admin_id });

  
    if (req.session.admin_id && adminData.isAdmin == 1) {
      res.redirect("/admin/adminHome");
    } else {
      next();
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  islogin,
  islogout,
};