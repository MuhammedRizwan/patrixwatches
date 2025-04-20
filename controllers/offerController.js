const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Offer = require("../models/offerModel");
const STATUSCODE = require("../config/statusCode");
const RESPONSE = require("../config/responseMessage");

const loadOfferAdd = async (req, res) => {
  try {
    const admin = req.session.adminData;
    const product = await Product.find().sort({ date: -1 });
    const category = await Category.find().sort({ date: -1 });
    res.status(STATUSCODE.OK).render("addOffer", { admin, product, category, errors: {} });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const addOffer = async (req, res) => {
  try {
    const admin = req.session.admin_id;
    const category = await Category.find().sort({ date: -1 });
    const product = await Product.find().sort({ date: -1 });
    const {
      name,
      discountValue,
      discountType,
      discountOn,
      maxRedeemableAmt,
      endDate,
      startDate,
      discountedProduct,
      discountedCategory,
    } = req.body;

    const existingNameOffer = await Offer.findOne({ name });
    const existingCategoryOffer = discountedCategory && (await Offer.findOne({ discountedCategory }));
    const existingProductOffer = discountedProduct && (await Offer.findOne({ discountedProduct }));

    if (existingNameOffer) {
      return res.status(STATUSCODE.BAD_REQUEST).render("addOffer", {
        errorMessage: RESPONSE.DUPLICATE_OFFER_NAME,
        category,
        product,
      });
    }

    if (discountedCategory && existingCategoryOffer) {
      return res.status(STATUSCODE.BAD_REQUEST).render("addOffer", {
        errorMessage: RESPONSE.CATEGORY_OFFER_EXISTS,
        category,
        product,
      });
    }

    if (discountedProduct && existingProductOffer) {
      return res.status(STATUSCODE.BAD_REQUEST).render("addOffer", {
        errorMessage: RESPONSE.PRODUCT_OFFER_EXISTS,
        category,
        product,
      });
    }

    const newOffer = new Offer({
      name,
      discountOn,
      discountType,
      discountValue,
      maxAmt: maxRedeemableAmt,
      startDate,
      endDate,
      discountedProduct: discountedProduct || null,
      discountedCategory: discountedCategory || null,
    });

    await newOffer.save();

    if (discountedProduct) {
      const discountedProductData = await Product.findById(discountedProduct);
      const discount_price = calculateDiscountPrice(discountedProductData.price, discountType, discountValue);

      await Product.updateOne(
        { _id: discountedProduct },
        {
          $set: {
            discount_price,
            discount: discount_price < discountedProductData.price ? discountedProductData.price - discount_price : 0,
            discountStart: startDate,
            discountEnd: endDate,
            discountStatus: true,
          },
        }
      );
    } else if (discountedCategory) {
      const categoryData = await Category.findById(discountedCategory);
      await Category.updateOne(
        { _id: discountedCategory },
        { $set: { discountType, discountValue, discountStart: startDate, discountEnd: endDate, discountStatus: true } }
      );

      const discountedProductData = await Product.find({ category: categoryData._id });
      for (const product of discountedProductData) {
        const discount_price = calculateDiscountPrice(product.price, discountType, discountValue);
        await Product.updateOne(
          { _id: product._id },
          {
            $set: {
              discount_price,
              discount: discount_price < product.price ? product.price - discount_price : 0,
              discountStart: startDate,
              discountEnd: endDate,
              discountStatus: true,
            },
          }
        );
      }
    }

    res.status(STATUSCODE.OK).redirect("/admin/offerList");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).render("addOffer", {
      errorMessage: RESPONSE.SERVER_ERROR,
      category: await Category.find().sort({ date: -1 }),
      product: await Product.find().sort({ date: -1 }),
    });
  }
};

function calculateDiscountPrice(price, discountType, discountValue) {
  let discountedPrice = price;
  if (discountType === "percentage") {
    discountedPrice -= (price * discountValue) / 100;
  } else if (discountType === "fixed Amount") {
    discountedPrice -= discountValue;
  }
  return Math.max(discountedPrice, 0);
}

const OfferList = async (req, res) => {
  try {
    const admin = req.session.adminData;
    const page = parseInt(req.query.page) || 1;
    const limit = 7;
    let query = {};

    if (req.query.discountOn === "product") {
      query.discountOn = "product";
    } else if (req.query.discountOn === "category") {
      query.discountOn = "category";
    }

    const totalCount = await Offer.countDocuments(query);
    const offer = await Offer.find(query)
      .populate("discountedProduct")
      .populate("discountedCategory")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ startDate: -1 });

    res.status(STATUSCODE.OK).render("offerList", {
      offer,
      admin,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const loadOfferEdit = async (req, res) => {
  try {
    const product = await Product.find().sort({ date: -1 });
    const category = await Category.find().sort({ date: -1 });
    const offerId = req.query.offerId;
    const admin = req.session.adminData;
    const offer = await Offer.findById(offerId)
      .populate("discountedProduct")
      .populate("discountedCategory");

    if (!offer) {
      return res.status(STATUSCODE.NOT_FOUND).send(RESPONSE.OFFER_NOT_FOUND);
    }

    const startDate = new Date(offer.startDate).toISOString().split("T")[0];
    const endDate = new Date(offer.endDate).toISOString().split("T")[0];
    res.status(STATUSCODE.OK).render("offerEdit", {
      admin,
      offer,
      product,
      category,
      startDate,
      endDate,
    });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const editOffer = async (req, res) => {
  try {
    const offerId = req.body.offerId;
    const {
      offer_name,
      discountValue,
      discountType,
      discountOn,
      maxRedeemableAmt,
      expiryDate,
      startDate,
      discountedProduct,
      discountedCategory,
    } = req.body;

    const existingOffer = await Offer.findById(offerId);
    if (!existingOffer) {
      return res.status(STATUSCODE.NOT_FOUND).json({ success: false, error: RESPONSE.OFFER_NOT_FOUND });
    }

    const updatedOffer = await Offer.findByIdAndUpdate(
      offerId,
      {
        $set: {
          name: offer_name,
          discountOn,
          discountType,
          discountValue,
          maxAmt: maxRedeemableAmt,
          startDate,
          endDate: expiryDate,
          discountedProduct: discountedProduct || null,
          discountedCategory: discountedCategory || null,
        },
      },
      { new: true }
    );

    if (discountedProduct) {
      const discountedProductData = await Product.findById(discountedProduct);
      const discount_price = calculateDiscountPrice(discountedProductData.price, discountType, discountValue);

      await Product.updateOne(
        { _id: discountedProduct },
        {
          $set: {
            discount_price,
            discount: discount_price < discountedProductData.price ? discountedProductData.price - discount_price : 0,
            discountStart: startDate,
            discountEnd: expiryDate,
            discountStatus: true,
          },
        }
      );
    } else if (discountedCategory) {
      const categoryData = await Category.findById(discountedCategory);
      await Category.updateOne(
        { _id: discountedCategory },
        { $set: { discountType, discountValue, discountStart: startDate, discountEnd: expiryDate, discountStatus: true } }
      );

      const discountedProductData = await Product.find({ category: categoryData._id });
      for (const product of discountedProductData) {
        const discount_price = calculateDiscountPrice(product.price, discountType, discountValue);
        await Product.updateOne(
          { _id: product._id },
          {
            $set: {
              discount_price,
              discount: discount_price < product.price ? product.price - discount_price : 0,
              discountStart: startDate,
              discountEnd: expiryDate,
              discountStatus: true,
            },
          }
        );
      }
    }

    res.status(STATUSCODE.OK).redirect("/admin/offerList");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).json({ success: false, error: RESPONSE.FAILED_TO_UPDATE_OFFER });
  }
};

const offerBlock = async (req, res) => {
  try {
    const id = req.query.offerId;
    const offer = await Offer.findById(id);

    if (!offer) {
      return res.status(STATUSCODE.NOT_FOUND).send(RESPONSE.OFFER_NOT_FOUND);
    }

    offer.isActive = !offer.isActive;

    if (offer.discountedProduct) {
      const discountedProduct = await Product.findById(offer.discountedProduct);
      if (!offer.isActive) {
        discountedProduct.discount_price = discountedProduct.price;
        discountedProduct.discountStatus = false;
      } else {
        discountedProduct.discount_price = calculateDiscountPrice(
          discountedProduct.price,
          offer.discountType,
          offer.discountValue
        );
        discountedProduct.discountStatus = true;
      }
      await discountedProduct.save();
    } else if (offer.discountedCategory) {
      const discountedCategory = await Category.findById(offer.discountedCategory);
      const discountedProductData = await Product.find({ category: discountedCategory._id });

      discountedCategory.discountStatus = offer.isActive;
      await discountedCategory.save();
      await Product.updateMany({ category: discountedCategory._id }, { $set: { discountStatus: offer.isActive } });

      for (const product of discountedProductData) {
        if (!offer.isActive) {
          product.discount_price = product.price;
        } else {
          product.discount_price = calculateDiscountPrice(product.price, offer.discountType, offer.discountValue);
        }
        await product.save();
      }
    }

    await offer.save();
    res.status(STATUSCODE.OK).redirect("/admin/offerList");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

module.exports = {
  loadOfferAdd,
  addOffer,
  OfferList,
  loadOfferEdit,
  editOffer,
  offerBlock,
};