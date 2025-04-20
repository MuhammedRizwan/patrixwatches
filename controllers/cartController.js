const Cart = require("../models/cartModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const { calculateSubtotal, calculateProductTotal } = require("../utils/cartSum");
const STATUSCODE = require("../config/statusCode");
const RESPONSE = require("../config/responseMessage");

const loadCartPage = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findById(userId);

    if (!userData) {
      return res.status(STATUSCODE.OK).redirect("/login");
    }

    const userCart = await Cart.findOne({ user: userId }).populate("items.product");
    const cart = userCart ? userCart.items : [];
    const subtotal = calculateSubtotal(cart);
    const productTotal = calculateProductTotal(cart);
    const subtotalWithShipping = subtotal;

    let outOfStockError = false;
    let maxQuantityErr = false;

    for (const cartItem of cart) {
      const product = cartItem.product;
      if (product.stock < cartItem.quantity) {
        outOfStockError = true;
        break;
      }
      if (cartItem.quantity > 2) {
        maxQuantityErr = true;
        break;
      }
    }

    res.status(STATUSCODE.OK).render("cart", {
      userData,
      productTotal,
      subtotalWithShipping,
      outOfStockError,
      maxQuantityErr,
      cart,
    });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const addTocart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const product_Id = req.body.ID;
    const { qty } = req.body;

    const product = await Product.findById(product_Id);
    if (!product) {
      return res.status(STATUSCODE.NOT_FOUND).json({ success: false, message: RESPONSE.PRODUCT_NOT_FOUND });
    }

    if (parseInt(qty, 10) > product.stock) {
      return res.status(STATUSCODE.BAD_REQUEST).render("singleProduct", {
        product,
        userId,
        insufficientStockMessage: RESPONSE.INSUFFICIENT_STOCK,
      });
    }

    let existingCart = await Cart.findOne({ user: userId });
    if (existingCart) {
      const existingProductIndex = existingCart.items.findIndex(
        (item) => item.product.toString() === product_Id.toString()
      );

      if (existingProductIndex !== -1) {
        existingCart.items[existingProductIndex].quantity += parseInt(qty, 10);
      } else {
        existingCart.items.push({ product: product_Id, quantity: parseInt(qty, 10) });
      }
      existingCart.total += parseInt(qty, 10);
      await existingCart.save();
    } else {
      existingCart = new Cart({
        user: userId,
        items: [{ product: product_Id, quantity: parseInt(qty, 10) }],
        total: parseInt(qty, 10),
      });
      await existingCart.save();
    }

    res.status(STATUSCODE.OK).redirect("/cart");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).json({ success: false, message: RESPONSE.SERVER_ERROR });
  }
};

const updateCartCount = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.query.productId;
    const newQuantity = parseInt(req.query.quantity);

    const existingCart = await Cart.findOne({ user: userId });
    if (!existingCart) {
      return res.status(STATUSCODE.NOT_FOUND).json({ success: false, error: RESPONSE.CART_NOT_FOUND });
    }

    const existingCartItem = existingCart.items.find((item) => item.product.toString() === productId);
    if (existingCartItem) {
      const product = await Product.findById(productId);
      if (newQuantity > product.stock) {
        return res.status(STATUSCODE.BAD_REQUEST).json({ success: false, error: RESPONSE.INSUFFICIENT_STOCK });
      }

      existingCartItem.quantity = newQuantity;
      existingCart.total = existingCart.items.reduce((total, item) => total + (item.quantity || 0), 0);
      await existingCart.save();
    }

    res.status(STATUSCODE.OK).json({ success: true });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).json({ success: false, error: RESPONSE.SERVER_ERROR });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.query.productId;

    const existingCart = await Cart.findOne({ user: userId });
    if (!existingCart) {
      return res.status(STATUSCODE.NOT_FOUND).json({ success: false, error: RESPONSE.CART_NOT_FOUND });
    }

    existingCart.items = existingCart.items.filter((item) => item.product.toString() !== productId);
    existingCart.total = existingCart.items.reduce((total, item) => total + (item.quantity || 0), 0);
    await existingCart.save();

    res.status(STATUSCODE.OK).json({ success: true, toaster: true });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).json({ success: false, error: RESPONSE.SERVER_ERROR });
  }
};

module.exports = {
  loadCartPage,
  addTocart,
  updateCartCount,
  removeFromCart,
};