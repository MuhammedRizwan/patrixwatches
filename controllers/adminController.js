const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const { getMonthlyDataArray, getDailyDataArray, getYearlyDataArray } = require("../utils/chartData");
const STATUSCODE = require("../config/statusCode");
const RESPONSE = require("../config/responseMessage");


const adminLogin = async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    res.status(STATUSCODE.OK).render("login");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email });

    if (!userData) {
      return res.status(STATUSCODE.NOT_FOUND).render("login", { message: RESPONSE.ADMIN_NOT_FOUND });
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (!passwordMatch) {
      return res.status(STATUSCODE.BAD_REQUEST).render("login", { message: RESPONSE.PASSWORD_INCORRECT });
    }

    if (userData.isAdmin !== 1) {
      return res.status(STATUSCODE.BAD_REQUEST).render("login", { message: RESPONSE.NOT_ADMIN });
    }

    req.session.admin_id = userData._id;
    res.status(STATUSCODE.OK).redirect("/admin/home");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).render("login", { message: RESPONSE.SERVER_ERROR });
  }
};

const fetchBestSellingProducts = async () => {
  try {
    const bestSellingProducts = await Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.product", totalOrders: { $sum: "$items.quantity" } } },
      { $sort: { totalOrders: -1 } },
      { $limit: 10 },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "productDetails" } },
      { $unwind: "$productDetails" },
      { $project: { _id: "$productDetails._id", productName: "$productDetails.name", totalOrders: 1 } },
    ]);

    return bestSellingProducts;
  } catch (error) {
    throw new Error("Error fetching best-selling products: " + error.message);
  }
};

const fetchBestSellingCategories = async () => {
  try {
    const bestSellingCategories = await Order.aggregate([
      { $unwind: "$items" },
      { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "product" } },
      { $unwind: "$product" },
      { $lookup: { from: "categories", localField: "product.category", foreignField: "_id", as: "category" } },
      { $unwind: "$category" },
      { $group: { _id: "$category._id", categoryName: { $first: "$category.name" }, totalOrders: { $sum: "$items.quantity" } } },
      { $sort: { totalOrders: -1 } },
      { $limit: 10 },
    ]);

    return bestSellingCategories;
  } catch (error) {
    throw new Error("Error fetching best-selling categories: " + error.message);
  }
};

const loadHome = async (req, res) => {
  try {
    const adminData = await User.findById(req.session.admin_id);
    if (!adminData) {
      return res.status(STATUSCODE.NOT_FOUND).redirect("/admin");
    }

    const totalRevenue = await Order.aggregate([
      { $match: { "items.status": "Delivered" } },
      { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
    ]);

    const totalUsers = await User.countDocuments({ is_blocked: false, isAdmin: 0 });
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();
    const orders = await Order.find().populate("user").limit(10).sort({ orderDate: -1 });
    const totalRevenues = orders.reduce((acc, order) => acc + order.totalAmount, 0);

    const newUsers = await User.find({ is_blocked: false, isAdmin: 0 }).sort({ date: -1 }).limit(4);
    const latestRegisteredUser = await User.findOne({ is_blocked: false, isAdmin: 0 }).sort({ date: -1 });

    if (latestRegisteredUser && !newUsers.some((user) => user._id.equals(latestRegisteredUser._id))) {
      newUsers.unshift(latestRegisteredUser);
    }

    const monthlyDataArray = await getMonthlyDataArray();
    const dailyDataArray = await getDailyDataArray();
    const yearlyDataArray = await getYearlyDataArray();
    const bestSellingProducts = await fetchBestSellingProducts();
    const bestSellingCategories = await fetchBestSellingCategories();

    const order = await Order.find();
    const user = await User.find();
    const product = await Product.find();

    res.status(STATUSCODE.OK).render("home", {
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
      product,
    });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).render("login", { message: RESPONSE.SERVER_ERROR });
  }
};

const loadUserpage = async (req, res) => {
  try {
    const adminData = await User.findById(req.session.admin_id);
    if (!adminData) {
      return res.status(STATUSCODE.NOT_FOUND).redirect("/admin");
    }

    const userData = await User.find({ isAdmin: 0 });
    res.status(STATUSCODE.OK).render("userDashboard", { users: userData, admin: adminData });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const listUser = async (req, res) => {
  try {
    const id = req.query.id;
    const userValue = await User.findById(id);
    if (!userValue) {
      return res.status(STATUSCODE.NOT_FOUND).send(RESPONSE.SERVER_ERROR);
    }

    await User.updateOne({ _id: id }, { $set: { is_blocked: !userValue.is_blocked } });

    if (userValue.is_blocked && req.session.user_id === id) {
      delete req.session.user_id;
    }

    res.status(STATUSCODE.OK).redirect("/admin/userDashboard");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const adminLogout = async (req, res) => {
  try {
    delete req.session.admin_id;
    res.status(STATUSCODE.OK).redirect("/admin");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

module.exports = {
  adminLogin,
  verifyLogin,
  loadHome,
  adminLogout,
  loadUserpage,
  listUser,
};