const mongoose=require('mongoose');
const mongodb=mongoose.connect( process.env.MONGODB )
.catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});
module.exports=mongodb