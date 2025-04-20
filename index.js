require("dotenv").config();
const path=require('path')
const express=require('express')
const userRoute=require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute');
const dbConnection = require('./config/dbConnect')
const session=require('express-session')
const app=express()
const port=process.env.PORT||3000

app.use(express.json());
app.use(express.urlencoded({extended:true}))


dbConnection();
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve the static folder
app.use(express.static(path.join(__dirname,'public')))
app.use(express.static(path.join(__dirname,'public/user-assets')))

app.use(express.static(path.join(__dirname,'public/admin-assets')))


app.use((req,res,next)=>{
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    next()
  })
  // Create a simple route 
  app.use('/',userRoute)
  app.use('/admin',adminRoute)


  app.use((req, res, next) => {
    res.status(404).render("404Error", { userData: null });
});


  app.listen(port, function () {
    console.log(`Server is running at http://localhost:${port}/`);
  });