const { User } = require('../model/userModel');
const Product = require('../model/productModel');
const Category = require('../model/categoryModel');
const Address = require('../model/addressModel');
const Cart = require('../model/cartModel');
const Order = require('../model/orderModel');



const orderComplete = async (req, res) => {
  try {
    const {fullName,mobile,houseName,landMark,townCity,state,pincode} = req.body;
    const address={fullName,mobile,houseName,landMark,townCity,state,pincode}
    const user_id = req.user.user._id;
    const cartData = await Cart.findOne({ user_id: user_id }, { cartItems: 1, _id: 0 });
    const totalPrice = cartData.cartItems.reduce((total, item) => {
      const numericPrice = parseFloat(item.price);
      return total + numericPrice * item.quantity;
    }, 0);
    const products = await Promise.all(cartData.cartItems.map(async (item) => {
      const stockCheck = await Product.findOne({ _id: item.product_id });
      if (stockCheck.stock >= item.quantity) {
        stockCheck.stock -= item.quantity;
        return {
          product: item.product_id,
          quantity: item.quantity,
          price: item.quantity * item.price,
          status: "pending",
        };
      } else {
        return {
          product: item.product_id,
          quantity: item.quantity,
          price: item.quantity * item.price,
          status: "out of stock",
        };
      }
    }));
    if (products.status == "out of stock") {
      return res.status(400).json({ success: false, message: "product is Out of Stock" });
    } else {
    const order=new Order({
      totalPrice,
      user:user_id,
      products,
      paymentStatus:"pending",
      address
    }) 
    const orderData=await order.save();
    return res.status(200).json({success:false,message:"placed an order and goes to Payment section "})
    }   
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
const paymentPage=async(req,res)=>{
  try {
    const loggedIn = req.user? true : false;
    const orderData = await Order.find().sort({ createdOn: -1 }).limit(1);
    if(orderData){
      return res.status(200).render('PaymentPage',{orderData:orderData[0],loggedIn})
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
const PaymentSection=async(req,res)=>{
  try {
    
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const productId = req.params.productId;
    const userId = req.user.user._id;

    // Update the order status
    const result = await Order.updateOne(
      { _id: orderId, "products.product": productId },
      { $set: { "products.$.status": "canceled" } }
    );

    if (result.nModified > 0) {
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ success: false });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Internal Server Error");
  }
};

const adminOrderPage = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdOn: -1 });
    const users = await Promise.all(orders.map(async (data) => {
      const userData = await User.findOne({ _id: data.user });
      return {
        name: userData.name,
        email: userData.email
      };
    }));
    return res.status(200).render("adminOrder", {
      user: users,
      order: orders
    });
  } catch (error) {
    return res.status(500).send("Internal Server Error. Please try again later.");
  }
};


const adminOrderDetails = async (req, res) => {
  try {
    const orderId = req.query.id;
    const user_id = req.user.user._id;
    const userData = await User.findById(user_id);
    const orderData = await Order.findOne({ _id: orderId });
    if (!orderData) {
      console.error("Order not found");
      return res.status(404).send("Order not found");
    }
    const addressData = await Address.find({ userId: user_id });
    const product = await Promise.all(orderData.products.map(async (data) => {
      const productData = await Product.findOne({ _id: data.product });
      return {
        product: productData.productName,
        image: productData.image[0].filename,
        quantity: data.quantity,
        price: productData.salePrice,
        totalPrice: data.quantity * productData.salePrice
      };
    }));
    return res.render("orderDetials", {
      user: userData,
      order: orderData,
      product: product,
      address: addressData
    });
  } catch (error) {
    return res.status(500).send("Internal Server Error. Please try again later.");
  }
};
const adminCancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const updatedOrder = await Order.updateOne(
      { _id: orderId },
      { $set: { status: "Canceled" } },
      { new: true }
    );
    if (!updatedOrder) {
      return res.status(400).json({ success: false, message: "Somthing went Wroung" });
    } else {
      return res.status(200).json({ success: true, message: "order Canceled by Admin" });
    }
  } catch (error) {
    res.status(500).send("Internal Server Error. Please try again later.");
  }
};
module.exports = {
  orderComplete,
  cancelOrder,
  adminOrderPage,
  adminOrderDetails,
  adminCancelOrder,
  paymentPage,
  PaymentSection
}






