const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Offer = require("../models/offerModel");

// Function to load add offer page
const loadOfferAdd = async (req, res) => {
  try {
    const admin = req.session.adminData;
    const product = await Product.find().sort({ date: -1 });
    const category = await Category.find().sort({ date: -1 });

    // Initialize an empty errors object
    const errors = {};

    // Render the addOffer template with admin data, products, categories, and errors
    res.render("addOffer", { admin, product, category, errors });
  } catch (error) {
    console.log(error.message);
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
 
    console.log(req.body);

    const existingNameOffer = await Offer.findOne({ name:name });
    const existingCategoryOffer =
      discountedCategory && (await Offer.findOne({ discountedCategory }));
    const existingProductOffer =
      discountedProduct && (await Offer.findOne({ discountedProduct }));
      if (existingNameOffer) {

        return res.render("addOffer", {
          errorMessage: "Duplicate Discount Name not allowed.",category,product
      });
       
      }
  
      if (discountedCategory && existingCategoryOffer) {
        return res.render("addOffer", {
          errorMessage: "An offer for this category already exists.",category,product
      });
      }
  
      if (discountedProduct && existingProductOffer) {
        return res.render("addOffer", {
          errorMessage: "An offer for this product already exists.",category,product
      });
      }
  
    const newOffer = new Offer({
      name: name,
      discountOn,
      discountType,
      discountValue,
      maxAmt:maxRedeemableAmt,
      startDate,
      endDate: endDate,
      discountedProduct: discountedProduct ? discountedProduct : null,
      discountedCategory: discountedCategory ? discountedCategory : null,
    });

    await newOffer.save();

    if (discountedProduct) {
      const discountedProductData = await Product.findById(discountedProduct);

      let discount = 0;
      if (discountType === "percentage") {
        discount = (discountedProductData.price * discountValue) / 100;
      } else if (discountType === "fixed Amount") {
        discount = discountValue;
      }

      await Product.updateOne(
        { _id: discountedProduct },
        {
          $set: {
            discount_price: calculateDiscountPrice(
              discountedProductData.price,
              discountType,
              discountValue
            ),
            discount,
            discountStart: startDate,
            discountEnd: endDate,
            discountStatus: true,
          },
        }
      );
    } else if (discountedCategory) {
      const categoryData = await Category.findById(discountedCategory);

      const data = await Category.updateOne(
        { _id: discountedCategory },
        {
          $set: {
            discountType,
            discountValue,
            discountStart: startDate,
            discountEnd: endDate,
            discountStatus: true,
          },
        }
      );

      const discountedProductData = await Product.find({
        category: categoryData._id,
      });
      for (const product of discountedProductData) {
        let discount = 0;
        if (discountType === "percentage") {
          discount = (product.price * discountValue) / 100;
          
        } else if (discountType === "fixed Amount") {
          discount = discountValue;
        }
        await Product.updateOne(
          { _id: product._id },
          {
            $set: {
              discount_price: calculateDiscountPrice(
                product.price,
                discountType,
                discountValue
              ),
              discount,
              discountStart: startDate,
              discountEnd: expiryDate,
              discountStatus: true,
            },
          }
        );
      }
    }

    return res.redirect("/admin/offerList");
  } catch (error) {
    console.log(error.message);
  
  }
};






function calculateDiscountPrice(price, discountType, discountValue) {
  let discountedPrice = price;

  if (discountType === "percentage") {
    discountedPrice -= (price * discountValue) / 100;
  } else if (discountType === "fixed Amount") {
    discountedPrice -= discountValue;
  }

  return discountedPrice;
}

const OfferList = async (req, res) => {
  try {
    const admin = req.session.adminData;
    const page = parseInt(req.query.page) || 1;
    let query = {};
    const limit = 7;
    const totalCount = await Offer.countDocuments(query);

    const totalPages = Math.ceil(totalCount / limit);
    if (req.query.discountOn) {
      if (req.query.discountOn === "product") {
        query.discountOn = "product";
      } else if (req.query.discountOn === "category") {
        query.discountOn = "category";
      }
    }
    const offer = await Offer.find(query)
      .populate("discountedProduct")
      .populate("discountedCategory")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ startDate: -1 });
      console.log(offer)
    res.render("offerList", {
      offer,
      admin: admin,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error.message);
  }
};

// Function to laod offer edit page
const loadOfferEdit = async (req, res) => {
  try {
    const product = await Product.find().sort({ date: -1 });
    const category = await Category.find().sort({ date: -1 });
    const offerId = req.query.offerId;
    const admin = req.session.adminData;
    const offer = await Offer.findById(offerId)
      .populate("discountedProduct")
      .populate("discountedCategory");
    const startDate = new Date(offer.startDate).toISOString().split("T")[0];
    const endDate = new Date(offer.endDate).toISOString().split("T")[0];
    res.render("offerEdit", {
      admin,
      offer,
      product,
      category,
      startDate,
      endDate,
    });
  } catch (error) {
    console.log(error.message);
  }
};

//Function to Edit Offer

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

    const existingOffer = await Offer.findById(offerId)
      .populate('discountedProduct') // Populate the product details
      .populate('discountedCategory'); // Populate the category details

    if (!existingOffer) {
      return res.status(400).json({ success: false, error: "Offer not found" });
    }

    // Rest of your code...

    const updatedOffer = await Offer.findByIdAndUpdate(
      { _id: offerId },
      {
        $set: {
          name: offer_name,
          discountOn,
          discountType,
          discountValue,
          maxAmt:maxRedeemableAmt,
          startDate,
          endDate: expiryDate,
          discountedProduct: discountedProduct ? discountedProduct : null,
          discountedCategory: discountedCategory ? discountedCategory : null,
        },
      },
      { new: true }
    )
      .populate('discountedProduct') // Populate the updated product details
      .populate('discountedCategory'); // Populate the updated category details

    // Rest of your code...

    res.redirect("/admin/offerList");
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, error: "Failed to update offer" });
  }
};


// Function for Offer Block and UnBlock

const offerBlock = async (req, res) => {
  try {
    const id = req.query.offerId;

    const offer = await Offer.findById(id);

    console.log("Offer before update:", offer)

    offer.isActive = !offer.isActive;

    if (offer.discountedProduct) {
      const discountedProduct = await Product.findById(offer.discountedProduct);
      if (offer.isActive == false) {
        discountedProduct.discount_price = discountedProduct.price;
      } else {
        let discount = 0;
        if (offer.discountType === "percentage") {
          discount = (discountedProduct.price * offer.discountValue) / 100;
        } else if (offer.discountType === "fixed Amount") {
          discount = offer.discountValue;
        }
        discountedProduct.discount_price = calculateDiscountPrice(
          discountedProduct.price,
          offer.discountType,
          offer.discountValue
        );
      }

      if (discountedProduct) {
        discountedProduct.discountStatus = offer.isActive;
        await discountedProduct.save();
      }
    } else if (offer.discountedCategory) {
      const discountedCategory = await Category.findById(
        offer.discountedCategory
      );
      const discountedProductData = await Product.find({
        category: discountedCategory._id,
      });
      if (discountedCategory) {
        discountedCategory.discountStatus = offer.isActive;
        await discountedCategory.save();
        const discountedProducts = await Product.updateMany(
          { category: discountedCategory._id },
          { $set: { discountStatus: offer.isActive } }
        );
      }
      for (const product of discountedProductData) {
        if (offer.isActive == false) {
          product.discount_price = product.price;
        } else {
          let discount = 0;
          if (offer.discountType === "percentage") {
            discount = (product.price * offer.discountValue) / 100;
          } else if (offer.discountType === "fixed Amount") {
            discount = offer.discountValue;
          }
          product.discount_price = calculateDiscountPrice(
            product.price,
            offer.discountType,
            offer.discountValue
          );
        }
        await product.save();
      }
    }

    await offer.save();
    res.redirect("/admin/offerList");
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  loadOfferAdd,
  addOffer,
  OfferList,
  loadOfferEdit,
  editOffer,
  offerBlock
};