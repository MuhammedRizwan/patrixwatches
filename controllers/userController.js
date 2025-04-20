const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const message = require("../config/mailer");
const Wallet = require("../models/walletModel");
const Banner = require("../models/bannerModel");
const RESPONSE = require("../config/responseMessage");


const securePassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const loadRegister = async (req, res) => {
  res.render("registration");
};

const insertUser = async (req, res) => {
  const { email, mobile, name, password } = req.body;

  if (!email || !mobile || !name || !password) {
    return res.render("registration", { message: RESPONSE.ALL_FIELDS_REQUIRED });
  }

  const existEmail = await User.findOne({ email });
  const existMobile = await User.findOne({ mobile });

  if (existEmail) {
    return res.render("registration", { message: RESPONSE.EMAIL_ALREADY_REGISTERED });
  }
  if (existMobile) {
    return res.render("registration", { message: RESPONSE.MOBILE_ALREADY_REGISTERED });
  }

  req.session.userData = req.body;
  req.session.register = 1;
  req.session.email = email;

  await message.sendVerifyMail(req, email);
  res.redirect("/otp");
};

const loadOtp = async (req, res) => {
  res.render("otp");
};

const verifyOtp = async (req, res) => {
  const { userData, user_id } = req.session;
  const fullOTP = req.body.otp;

  if (!user_id) {
    if (fullOTP == req.session.otp) {
      const secure_password = await securePassword(userData.password);
      const user = new User({
        name: userData.name,
        email: userData.email,
        mobile: userData.mobile,
        password: secure_password,
        image: "",
        isAdmin: 0,
        is_blocked: 1,
      });

      const userDataSave = await user.save();
      if (userDataSave && userDataSave.isAdmin === 0) {
        req.session.user_id = userDataSave._id;
        res.redirect("/");
      } else {
        res.render("otp", { message: RESPONSE.REGISTRATION_FAILED });
      }
    } else {
      res.render("otp", { message: RESPONSE.INVALID_OTP });
    }
  } else {
    if (fullOTP.trim() == req.session.otp.trim()) {
      res.redirect("/resetPassword");
    } else {
      res.render("otp", { message: RESPONSE.INCORRECT_OTP });
    }
  }
};

const resendOTP = async (req, res) => {
  const { userData } = req.session;

  if (!userData) {
    return res.status(STATUSCODE.BAD_REQUEST).json({ message: RESPONSE.INVALID_SESSION });
  }

  delete req.session.otp;
  await message.sendVerifyMail(req, userData.email);
  res.render("otp", { message: RESPONSE.OTP_RESENT });
};

const loadShop = async (req, res) => {
  const userId = req.session.user_id;
  const userData = await User.findById(userId);
  let { search: searchQuery, category: categoryId, sort, page } = req.query;

  if (searchQuery || categoryId) {
    page = 1;
  } else {
    page = parseInt(page) || 1;
  }

  const perPage = 9;
  const query = { is_listed: true };

  if (searchQuery) {
    query.name = { $regex: new RegExp(searchQuery, "i") };
  }
  if (categoryId) {
    query.category = categoryId;
  }

  let sortOption = {};
  if (sort === "asc") {
    sortOption = { price: 1 };
  } else if (sort === "desc") {
    sortOption = { price: -1 };
  }

  const totalProducts = await Product.countDocuments(query);
  const totalPages = Math.ceil(totalProducts / perPage);
  const productData = await Product.find(query)
    .populate("category")
    .sort(sortOption)
    .skip((page - 1) * perPage)
    .limit(perPage);

  const categories = await Category.find();

  res.render("shop", {
    products: productData,
    userData,
    categories,
    currentPage: page,
    totalPages,
    sort,
    category: categoryId,
    searchQuery,
    query: req.query,
  });
};

const loadShopCategory = async (req, res) => {
  const userId = req.session.user_id;
  const userData = await User.findById(userId);
  const { categoryId, search: searchQuery, sort, page = 1 } = req.query;

  let sortOption = {};
  if (sort === "asc") {
    sortOption = { discount_price: 1 };
  } else if (sort === "desc") {
    sortOption = { discount_price: -1 };
  }

  const findQuery = categoryId ? { category: categoryId } : {};
  if (searchQuery) {
    findQuery.name = { $regex: new RegExp(searchQuery, "i") };
  }

  const totalProducts = await Product.countDocuments(findQuery);
  const categories = await Category.find();
  const itemsPerPage = 6;
  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  const options = {
    page,
    limit: itemsPerPage,
    sort: sortOption,
    populate: "category",
  };

  const paginatedProducts = await Product.paginate(findQuery, options);

  const distinctValues = await Product.aggregate([
    { $group: { _id: null, categories: { $addToSet: "$category" } } },
  ]).shift();

  const distinctCategories = { categories: distinctValues?.categories || [] };

  res.render("shop", {
    products: paginatedProducts.docs,
    userData,
    totalPages,
    currentPage: paginatedProducts.page,
    categories,
    query: findQuery,
    sort,
    categoryId,
    searchQuery,
    distinctValues: distinctCategories,
  });
};

const loadSingleShop = async (req, res) => {
  const userId = req.session.user_id;
  const userData = await User.findById(userId);
  const productId = req.params.id;
  const product = await Product.findById(productId);
  const categories = await Category.find();

  let insufficientStockMessage = null;
  const requestedQty = req.body.qty;

  if (parseInt(requestedQty, 10) > product.stock) {
    insufficientStockMessage = RESPONSE.INSUFFICIENT_STOCK;
  }

  res.render("singleProduct", { userData, product, categories, userId, insufficientStockMessage });
};

const loadLogin = async (req, res) => {
  res.render("login", { message: "" });
};

const verifyLogin = async (req, res) => {
  const { email, password } = req.body;
  const userData = await User.findOne({ email });

  if (!userData) {
    return res.render("login", { message: RESPONSE.USER_NOT_FOUND });
  }

  if (userData.is_blocked === 0) {
    return res.render("login", { message: RESPONSE.ACCOUNT_BLOCKED });
  }

  const passwordMatch = await bcrypt.compare(password, userData.password);

  if (!passwordMatch) {
    return res.render("login", { message: RESPONSE.INCORRECT_PASSWORD });
  }

  if (userData.is_verified === 0) {
    return res.render("login", { message: RESPONSE.VERIFY_EMAIL });
  }

  req.session.user_id = userData._id;
  res.redirect("/home");
};

const loadForgetpassword = async (req, res) => {
  res.render("forget");
};

const forgotPasswordOTP = async (req, res) => {
  const emaildata = req.body.email;
  const userExist = await User.findOne({ email: emaildata });

  if (!userExist) {
    return res.render("forget", { error: RESPONSE.USER_NOT_FOUND, User: null });
  }

  req.session.userData = userExist;
  req.session.user_id = userExist._id;
  await message.sendVerifyMail(req, userExist.email);
  res.render("otp");
};

const resetPassword = async (req, res) => {
  const user_id = req.session.user_id;
  const password = req.body.password;
  const secure_password = await securePassword(password);

  const updatedData = await User.findOneAndUpdate(
    { _id: user_id },
    { $set: { password: secure_password } },
    { new: true }
  );

  if (updatedData) {
    res.redirect("/login");
  }
};

const loadResetPassword = async (req, res) => {
  if (req.session.user_id) {
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    res.render("resetPassword", { User: user });
  } else {
    res.redirect("/forget");
  }
};

const getBestSellingProducts = async () => {
  return await Product.find({ is_listed: true })
    .sort({ salesCount: -1 })
    .limit(3);
};

const loadHome = async (req, res) => {
  const userId = req.session.user_id;
  const userData = await User.findById(userId);
  const productData = await Product.find({ is_listed: true });
  const categories = await Category.find();
  const banners = await Banner.find({ isListed: true }).populate("product");
  const bestSellingProducts = await getBestSellingProducts();

  res.render("home", {
    products: productData,
    User: userData,
    categories,
    banners,
    bestSellingProducts,
  });
};

const loadProfile = async (req, res) => {
  const userId = req.session.user_id;
  const userData = await User.findById(userId);

  if (userData) {
    res.render("userProfile", { userData });
  } else {
    res.redirect("/login");
  }
};

const userEdit = async (req, res) => {
  const id = req.body.user_id;
  const { name, mobile } = req.body;

  const updateData = await User.findByIdAndUpdate(
    { _id: id },
    {
      $set: {
        name,
        mobile,
        ...(req.file && { image: req.file.filename }),
      },
    }
  );

  const userData = await User.findById(id);
  res.render("userProfile", { userData });
};

const userLogout = async (req, res) => {
  req.session.destroy();
  res.redirect("/login");
};

const loadWallet = async (req, res) => {
  const userId = req.session.user_id;
  const userData = await User.findById(userId);

  if (!userData) {
    return res.render("login", { userData: null });
  }

  const walletData = await Wallet.findOne({ user: userId });
  res.render("wallet", { userData, wallet: walletData || [] });
};

const filterProducts = async (req, res) => {
  const { minPrice, maxPrice } = req.body;

  if (!minPrice || !maxPrice) {
    return res.status(STATUSCODE.BAD_REQUEST).json({ error: RESPONSE.PRICE_RANGE_REQUIRED });
  }

  const products = await Product.find({
    price: { $gte: minPrice, $lte: maxPrice },
    is_listed: true,
  });

  const categories = await Category.find();
  const distinctValues = await Product.aggregate([
    { $group: { _id: null, categories: { $addToSet: "$category" } } },
  ]).shift();

  const distinctCategories = { categories: distinctValues?.categories || [] };
  const userId = req.session.user_id;
  const userData = await User.findById(userId);

  res.render("shop", {
    products,
    userData,
    categories,
    distinctValues: distinctCategories,
  });
};

const loadAbout = async (req, res) => {
  const userId = req.session.user_id;
  const userData = await User.findById(userId);
  res.render("about", { userData });
};

const loadContact = async (req, res) => {
  const userId = req.session.user_id;
  const userData = await User.findById(userId);
  res.render("contact", { userData });
};

const errorPage = async (req, res) => {
  res.status(STATUSCODE.NOT_FOUND).render("404");
};

module.exports = {
  loadLogin,
  insertUser,
  loadRegister,
  loadHome,
  userLogout,
  loadOtp,
  verifyOtp,
  verifyLogin,
  resendOTP,
  loadShop,
  loadSingleShop,
  loadForgetpassword,
  forgotPasswordOTP,
  resetPassword,
  loadResetPassword,
  loadProfile,
  userEdit,
  loadShopCategory,
  loadWallet,
  filterProducts,
  loadAbout,
  loadContact,
  errorPage,
};