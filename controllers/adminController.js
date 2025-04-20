const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const Order = require("../models/orderModel")
const Product = require("../models/productModel")
const Category = require("../models/categoryModel")
const session = require("express-session");


const {
  getMonthlyDataArray,
  getDailyDataArray,
  getYearlyDataArray,
} = require("../config/chartData");


//admin Login//
const adminLogin = async (req, res) => {
  try {
    res.set("cache-Control", "no-store");
    res.render("login");
  }  catch (error) {
     console.log(error.message);
  }
};


//  adminVerify
const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });
    console.log(userData);

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.isAdmin === 1) {

          req.session.admin_id = userData._id;
          res.redirect("/admin/home");
          
        } else { 
          res.render("login", { message: "Admin not Found" });
        }
      } else {
        res.render("login", { message: "Password is incorrect" });
      }
    } else {
      res.render("login", { message: "Admin not found" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const fetchBestSellingProducts = async () => {
  try {
    const bestSellingProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalOrders: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalOrders: -1 } },
      { $limit: 10 }, // Limit to the top 10
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      { $unwind: '$productDetails' },
      {
        $project: {
          _id: '$productDetails._id',
          productName: '$productDetails.name',
          totalOrders: 1,
        },
      },
    ]);

    return bestSellingProducts;
  } catch (error) {
    console.error('Error fetching best-selling products:', error.message);
    throw error;
  }
};


const fetchBestSellingCategories = async () => {
  try {
    const bestSellingCategories = await Order.aggregate([
      { $unwind: '$items' },

      { $lookup: { 
        from: 'products', 
        localField: 'items.product', 
        foreignField: '_id', 
        as: 'product' } },
      { $unwind: '$product' },

      { $lookup: {
         from: 'categories', 
         localField: 'product.category', 
         foreignField: '_id',
          as: 'category' 
        } 
      },
      { $unwind: '$category' },

      { $group: { 
        _id: '$category._id',
         categoryName: { $first: '$category.name' }, 
         totalOrders: { $sum: '$items.quantity' }
         }
      },
      { $sort: { totalOrders: -1 } },
      { $limit: 10 }
    ]);

    return bestSellingCategories;
  } catch (error) {
    console.error('Error fetching best-selling categories:', error.message);
    throw error;
  }
};


const loadHome = async (req, res) => {
  try {
    const adminData = await User.findById(req.session.admin_id);

    const totalRevenue = await Order.aggregate([
      { $match: { "items.status": "Delivered" } },
      { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
    ]);

    const totalUsers = await User.countDocuments({ is_blocked: 1 });
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();
    const orders = await Order.find().populate("user").limit(10).sort({ orderDate: -1 });
    
    const totalRevenues = orders.reduce((acc, order) => acc + order.totalAmount, 0);

    // Get the last 4 registered users
    const newUsers = await User.find({ is_blocked: 1, isAdmin: 0 })
      .sort({ date: -1 })
      .limit(4);

    // Include the latest registered user, even if no recent registrations
    const latestRegisteredUser = await User.findOne({ is_blocked: 1, isAdmin: 0 })
      .sort({ date: -1 });

    if (latestRegisteredUser) {
      newUsers.unshift(latestRegisteredUser); // Add the latest registered user to the beginning of the array
    }

    // Get monthly data
    const monthlyDataArray = await getMonthlyDataArray();

    // Get daily data
    const dailyDataArray = await getDailyDataArray();

    // Get yearly data
    const yearlyDataArray = await getYearlyDataArray();

    const bestSellingProducts = await fetchBestSellingProducts();
    const bestSellingCategories = await fetchBestSellingCategories();

   
    const order = await Order.find({}); 
    const user = await User.find({}); // Fetch a recent or specific user
    const product = await Product.find({}); // Fetch a featured or specific product


    res.render("home", {
      admin: adminData,
      totalRevenues,
      totalOrders,
      totalCategories,
      totalProducts,
      totalUsers,
      newUsers,
      orders,
      monthlyMonths: monthlyDataArray.map((item) => item.month),
      monthlyOrderCounts: monthlyDataArray.map((item) => item.count),
      dailyDays: dailyDataArray.map((item) => item.day),
      dailyOrderCounts: dailyDataArray.map((item) => item.count),
      yearlyYears: yearlyDataArray.map((item) => item.year),
      yearlyOrderCounts: yearlyDataArray.map((item) => item.count),
      bestSellingProducts,
      bestSellingCategories,
      order,
      user,
      product
    });
  } catch (error) {
    console.log(error.message);
    // Handle errors appropriately
  }
};



      

const loadUserpage=async (req,res)=>{
  try{
    const adminData=await User.findById(req.session.admin_id);
    const userData=await User.find({
      isAdmin:0
    });
    res.render('userDashboard',{users:userData,admin:adminData});

  }catch(error){
    console.error(error.message);
    res.status(500).send("Internal Server Error: " + error.message);
  }
};





const listUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Current page, default is 1
    const pageSize = 10; // Number of items per page
    const skip = (page - 1) * pageSize;

    const id = req.query.id;
    const Uservalue = await User.findById(id);

    if (Uservalue.is_blocked) {
      await User.updateOne(
        { _id: id },
        {
          $set: {
            is_blocked: 0,
          },
        }
      );
      if (req.session.user_id) delete req.session.user_id;
    } else {
      await User.updateOne(
        { _id: id },
        {
          $set: {
            is_blocked: 1,
          },
        }
      );
    }

    // Fetch paginated user data
    const paginatedUserData = await User.find({})
      .skip(skip)
      .limit(pageSize);

    res.redirect("/admin/userDashboard");
    
  } catch (error) {
    console.log(error.message);
  }
};



const adminLogout = async (req, res) => {
  try {

  
    delete req.session.admin_id;
 
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  
  }
};

module.exports = {
  adminLogin ,
  verifyLogin,
  loadHome,
  adminLogout,
  loadUserpage,
  listUser
};
