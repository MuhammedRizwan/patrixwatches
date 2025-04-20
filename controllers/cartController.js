const Cart = require('../models/cartModel')
const User = require('../models/userModel')
const Product = require('../models/productModel')
const { calculateProductTotal, calculateSubtotal } = require('../config/cartSum')


const loadCartPage = async (req, res) => {
  try {
    const userId = req.session.user_id
    const userData = await User.findById(userId)
    if (userData) {
      const userCart = await Cart.findOne({ user: userId })
        .populate("items.product")
          console.log(userCart);
      if (userData) {
        const cart = userCart ? userCart.items : []
        const subtotal = calculateSubtotal(cart)

        const productTotal = calculateProductTotal(cart)
        const subtotalWithShipping = subtotal

        let outOfStockError = false

        if (cart.length > 0) {
          for (const cartItem of cart) {
            const product = cartItem.product

            if (product.quantity < cartItem.quantity) {
              outOfStockError = true
              break
            }
          }
        }
        let maxQuantityErr = false
        if (cart.length > 0) {
          for (const cartItem of cart) {
            const product = cartItem.product

            if (cartItem.quantity > 2) {
              maxQuantityErr = true
              break
            }
          }
        }
        res.render("cart", {
          userData,
          productTotal,
          subtotalWithShipping,
          outOfStockError,
          maxQuantityErr,
          cart
        })

      } else {
        res.render("cart", { userData, cart: null })
      }

    } else {
      res.redirect('/login')
    }
  } catch (error) {
    console.error("Error loading cart:", error)
    res.status(500).send("Error loading cart")
  }
}


const addTocart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const product_Id = req.body.ID;

    const { qty } = req.body;


    const product = await Product.findById(product_Id);

    if (!product) {
        return res.status(404).json({ success: false, message: "Product not found." });
    }

    // Check if the requested quantity is greater than the available stock
    if (parseInt(qty, 10) > product.stock) {
      const insufficientStockMessage = "Insufficient stock.";
      return res.render('singleProduct', {  product,  userId, insufficientStockMessage });
  }
  
    const existingCart = await Cart.findOne({ user: userId });

    let newCart = {};
    if (existingCart) {
      const existingProductIndex = existingCart.items.findIndex(item => item.product.toString() === product_Id.toString());

      if (existingProductIndex !== -1) {
        existingCart.items[existingProductIndex].quantity += parseInt(qty, 10);
      } else {
        existingCart.items.push({ product: product_Id, quantity: parseInt(qty, 10) });
      }
      existingCart.total += parseInt(qty, 10);
      await existingCart.save();

      return res.redirect('/cart');
    } else {
      newCart = new Cart({
        user: userId,
        items: [{ product: product_Id, quantity: parseInt(qty) }],
        total: parseInt(qty, 10),
      });

      await newCart.save();
      return res.redirect('/cart');
    }

  } catch (error) {
    console.error("Error adding product to cart:", error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};



const updateCartCount = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.query.productId;
    const newQuantity = parseInt(req.query.quantity);

    const existingCart = await Cart.findOne({ user: userId });
    if (existingCart) {
      const existingCartItem = existingCart.items.find(
        (item) => item.product.toString() === productId
      );

      if (existingCartItem) {
        const product = await Product.findById(productId);
        if (newQuantity > product.stock) {
          return res.json({ success: false, error: "Insufficient stock." });
        }

        existingCartItem.quantity = newQuantity;
        existingCart.total = existingCart.items.reduce(
          (total, item) => total + (item.quantity || 0), // Ensure the item.quantity is defined
          0
        );

        await existingCart.save();
      }

      res.json({ success: true });
    } else {
      res.json({ success: false, error: "Cart not found" });
    }
  } catch (error) {
    console.error("Error updating cart:", error);
    res.json({ success: false, error: "Internal server error" });
  }
};








const removeFromCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.query.productId;

    const existingCart = await Cart.findOne({ user: userId });
    if (existingCart) {
      const updatedItems = existingCart.items.filter(
        (item) => item.product.toString() !== productId
      );

      existingCart.items = updatedItems;
      existingCart.total = updatedItems.reduce(
        (total, item) => total + (item.quantity || 0),
        0
      );

      await existingCart.save();

      res.json({ success: true, toaster: true });
    } else {
      res.json({ success: false, error: "Cart not found" });
    }
  } catch (error) {
    console.error("Error removing cart item:", error);
    res.json({ success: false, error: "Internal server error" });
  }
};










module.exports = {
  loadCartPage,
  addTocart,
  updateCartCount,
  removeFromCart,



}
