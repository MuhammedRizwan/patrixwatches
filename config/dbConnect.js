const mongoose = require('mongoose');

// Connect to MongoDB

const dbConnection = async ()=>{
  try{
    await mongoose.connect(process.env.MONGO_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        })
        console.log('Connected to MongoDB');
  }catch(err){
      console.error('MongoDB   connection error:', err);
}
}
module.exports=dbConnection

