const mongoose=require('mongoose');
const mongodb=mongoose.connect('mongodb://127.0.0.1:27017/ATLANTIS')
.catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});
module.exports=mongodb