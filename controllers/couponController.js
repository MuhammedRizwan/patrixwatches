const RESPONSE = require("../config/responseMessage");
const STATUSCODE = require("../config/statusCode");
const Coupon = require("../models/couponModel");
const User = require("../models/userModel");

const loadCoupon = async (req, res) => {
  try {
    const admin = req.session.admin_id;
    res.status(STATUSCODE.OK).render("couponAdd", { admin });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const addCoupon = async (req, res) => {
  try {
    const admin = req.session.admin_id;
    let { coupon_code, discount, limit, minAmt, maxAmt, expiryDate } = req.body;
    coupon_code = coupon_code.replace(/\s/g, "");

    const existingCoupon = await Coupon.findOne({
      code: { $regex: new RegExp("^" + coupon_code, "i") },
    });

    if (existingCoupon) {
      return res.status(STATUSCODE.BAD_REQUEST).json({
        success: false,
        error: RESPONSE.COUPON_EXISTS,
      });
    }

    const newCoupon = new Coupon({
      code: coupon_code,
      discount,
      limit,
      expiry: expiryDate,
      maxAmt,
      minAmt,
    });

    await newCoupon.save();
    res.status(STATUSCODE.OK).json({
      success: true,
      message: RESPONSE.COUPON_ADDED,
    });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: RESPONSE.FAILED_TO_ADD_COUPON,
    });
  }
};

const loadCouponList = async (req, res) => {
  try {
    const admin = req.session.admin_id;
    const page = parseInt(req.query.page) || 1;
    const limit = 7;
    const totalCount = await Coupon.countDocuments();
    const coupon = await Coupon.find()
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdDate: -1 });

    res.status(STATUSCODE.OK).render("couponList", {
      coupon,
      admin,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const loadEditCoupon = async (req, res) => {
  try {
    const admin = req.session.admin_id;
    const couponId = req.query.couponId;
    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      return res.status(STATUSCODE.NOT_FOUND).send(RESPONSE.COUPON_NOT_FOUND);
    }

    const expiry = new Date(coupon.expiry).toISOString().split("T")[0];
    res.status(STATUSCODE.OK).render("couponEdit", { admin, coupon, expiry });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const editCoupon = async (req, res) => {
  try {
    const couponId = req.query.couponId;
    let { coupon_code, discount, limit, minAmt, maxAmt, expiryDate } = req.body;

    if (!coupon_code || !discount || !expiryDate) {
      return res.status(STATUSCODE.BAD_REQUEST).json({ success: false, error: RESPONSE.REQUIRED_FIELDS_MISSING });
    }

    const existingCoupon = await Coupon.findOne({
      code: { $regex: new RegExp("^" + coupon_code, "i") },
      _id: { $ne: couponId },
    });

    if (existingCoupon) {
      return res.status(STATUSCODE.BAD_REQUEST).json({ success: false, error: RESPONSE.COUPON_EXISTS });
    }

    const updateCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      {
        $set: {
          code: coupon_code,
          discount,
          limit,
          expiry: expiryDate,
          maxAmt,
          minAmt,
        },
      },
      { new: true }
    );

    if (!updateCoupon) {
      return res.status(STATUSCODE.NOT_FOUND).json({ success: false, error: RESPONSE.COUPON_NOT_FOUND });
    }

    res.status(STATUSCODE.OK).json({ success: true, message: RESPONSE.COUPON_UPDATED, data: updateCoupon });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).json({ success: false, error: RESPONSE.FAILED_TO_UPDATE_COUPON });
  }
};

const unlistCoupon = async (req, res) => {
  try {
    const id = req.query.couponId;
    const couponData = await Coupon.findById(id);

    if (!couponData) {
      return res.status(STATUSCODE.NOT_FOUND).send(RESPONSE.COUPON_NOT_FOUND);
    }

    couponData.is_listed = !couponData.is_listed;
    await couponData.save();

    res.status(STATUSCODE.OK).redirect("/admin/couponList");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const coupoonDetails = async (req, res) => {
  try {
    const admin = req.session.adminData;
    const couponId = req.query.couponId;
    const coupon = await Coupon.findById(couponId).populate("userUsed").sort({ _id: -1 });

    if (!coupon) {
      return res.status(STATUSCODE.NOT_FOUND).send(RESPONSE.COUPON_NOT_FOUND);
    }

    res.status(STATUSCODE.OK).render("couponDetails", { users: coupon.userUsed, coupon, admin });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const userCouponList = async (req, res) => {
  try {
    const currentDate = new Date();
    const userId = req.session.user_id;
    const userData = await User.findById(userId);

    if (!userData) {
      return res.status(STATUSCODE.NOT_FOUND).send(RESPONSE.SERVER_ERROR);
    }

    const coupon = await Coupon.find({
      expiry: { $gt: currentDate },
      is_listed: true,
    }).sort({ createdDate: -1 });

    res.status(STATUSCODE.OK).render("coupon", { coupon, userData });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

module.exports = {
  loadCoupon,
  addCoupon,
  loadCouponList,
  loadEditCoupon,
  editCoupon,
  unlistCoupon,
  coupoonDetails,
  userCouponList,
};