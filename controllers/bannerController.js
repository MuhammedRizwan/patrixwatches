const RESPONSE = require("../config/responseMessage");
const STATUSCODE = require("../config/statusCode");
const Banner = require("../models/bannerModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");


const loadBannerAdd = async (req, res) => {
  try {
    const category = await Category.find();
    const product = await Product.find();
    const admin = req.session.adminData;
    res.status(STATUSCODE.OK).render("bannerAdd", { admin, category, product });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const addBanner = async (req, res) => {
  try {
    if (!req.body || !req.file) {
      return res.status(STATUSCODE.BAD_REQUEST).redirect("/admin/bannerAdd");
    }

    const {
      title,
      link,
      subtitle,
      offer,
      product,
      bannerCategory,
      fromDate,
      expiryDate,
      bannerType,
    } = req.body;

    const existingBanner = await Banner.findOne({ title });
    if (existingBanner) {
      const categories = await Category.find();
      const products = await Product.find();
      return res.status(STATUSCODE.BAD_REQUEST).render("bannerAdd", {
        errorMessage: RESPONSE.BANNER_EXISTS,
        category: categories,
        product: products,
      });
    }

    const newBanner = new Banner({
      title,
      image: req.file.filename,
      link,
      subtitle,
      offer,
      product,
      category: bannerCategory,
      startDate: fromDate,
      endDate: expiryDate,
      bannerType,
    });

    await newBanner.save();
    res.status(STATUSCODE.OK).redirect("/admin/bannerList");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).render("bannerAdd", {
      errorMessage: RESPONSE.SERVER_ERROR,
      category: await Category.find(),
      product: await Product.find(),
    });
  }
};

const bannerList = async (req, res) => {
  try {
    const admin = req.session.adminData;
    const page = parseInt(req.query.page) || 1;
    const limit = 7;
    let query = {};

    if (req.query.bannerType) {
      query.bannerType = req.query.bannerType;
    }

    const totalCount = await Banner.countDocuments(query);
    const banner = await Banner.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ startDate: -1 });

    res.status(STATUSCODE.OK).render("bannerList", {
      banner,
      admin,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const loadBannerEdit = async (req, res) => {
  try {
    const bannerId = req.query.bannerId;
    const banner = await Banner.findById(bannerId).populate("product");
    if (!banner) {
      return res.status(STATUSCODE.NOT_FOUND).send(RESPONSE.BANNER_NOT_FOUND);
    }

    const category = await Category.find();
    const product = await Product.find();
    const admin = req.session.adminData;
    const startDate = new Date(banner.startDate).toISOString().split("T")[0];
    const endDate = new Date(banner.endDate).toISOString().split("T")[0];

    res.status(STATUSCODE.OK).render("bannerEdit", {
      banner,
      product,
      category,
      admin,
      startDate,
      endDate,
    });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const bannerEdit = async (req, res) => {
  try {
    const bannerId = req.body.bannerId;
    const bannerData = await Banner.findById(bannerId);
    if (!bannerData) {
      return res.status(STATUSCODE.NOT_FOUND).json({ success: false, error: RESPONSE.BANNER_NOT_FOUND });
    }

    const updateData = {
      title: req.body.title || bannerData.title,
      bannerType: req.body.bannerType || bannerData.bannerType,
      link: req.body.link || bannerData.link,
      subtitle: req.body.subtitle || bannerData.subtitle,
      offer: req.body.offer || bannerData.offer,
      category: req.body.category || bannerData.category,
      product: req.body.product || bannerData.product,
      startDate: req.body.startDate || bannerData.startDate,
      endDate: req.body.endDate || bannerData.endDate,
      ...(req.file && { image: req.file.filename }),
    };

    await Banner.findByIdAndUpdate(bannerId, { $set: updateData });
    res.status(STATUSCODE.OK).redirect("/admin/bannerList");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).json({ success: false, error: RESPONSE.SERVER_ERROR });
  }
};

const blockBanner = async (req, res) => {
  try {
    const id = req.query.bannerId;
    const bannerData = await Banner.findById(id);
    if (!bannerData) {
      return res.status(STATUSCODE.NOT_FOUND).send(RESPONSE.BANNER_NOT_FOUND);
    }

    bannerData.isListed = !bannerData.isListed;
    await bannerData.save();

    res.status(STATUSCODE.OK).redirect("/admin/bannerList");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

module.exports = {
  loadBannerAdd,
  addBanner,
  bannerList,
  loadBannerEdit,
  bannerEdit,
  blockBanner,
};