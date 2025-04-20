const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      
      cb(null, 'public/admin-assets/imgs/category');
    },
    filename: function (req, file, cb) {
      const fileName = Date.now() + path.extname(file.originalname);
      cb(null, fileName);
    }
  });

  

  const storeproductIMG = multer.diskStorage({
    destination: function (req, file, cb) {
      
      cb(null, 'public/admin-assets/imgs/productIMG');
    },
    filename: function (req, file, cb) {
      const fileName = Date.now() + path.extname(file.originalname);
      cb(null, fileName);
    }
  });
  const storeUser = multer.diskStorage({
    destination: function (req, file, cb) {
      
      cb(null, 'public/user-assets/imgs/user');
    },
    filename: function (req, file, cb) {
      const fileName = Date.now() + path.extname(file.originalname);
      cb(null, fileName);
    }
  });


  // multer for Banner images
  const bannerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null,  "public/admin-assets/bannerImg");
    },
    filename: (req, file, cb) => {
      const name = Date.now() + "-" + file.originalname;
      cb(null, name);
    },
  });


// Configurations for multer instances
const uploadCategory = multer({ storage: storage });
const uploadUser = multer({ storage: storeUser });
const uploadProduct = multer({ storage: storeproductIMG });
const bannerUpload = multer({ storage: bannerStorage });



  

  module.exports = {
    uploadCategory: uploadCategory,
    uploadUser: uploadUser,
    uploadProduct: uploadProduct,
    bannerUpload: bannerUpload,
  };

