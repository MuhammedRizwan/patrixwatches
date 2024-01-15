const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname,'../public/productImages')); // Check the destination directory
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); // Check filename generation
    }
  });
const upload=multer({storage:storage})

module.exports=upload;