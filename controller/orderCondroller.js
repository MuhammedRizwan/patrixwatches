const { User } = require('../model/userModel');
const Product = require('../model/productModel');
const Category = require('../model/categoryModel');
const Address = require('../model/addressModel');
const Cart = require('../model/cartModel');
const Order = require('../model/orderModel');
const Razorpay = require('razorpay');

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

const instance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

const orderComplete = async (req, res) => {
  try {
    const { requestData, paymentOption } = req.body;
    const { fullName, mobile, houseName, landMark, townCity, state, pincode } = requestData
    const address = { fullName, mobile, houseName, landMark, townCity, state, pincode }
    const user_id = req.user.user._id;
    const addressData = await Address.findOne({ userId: user_id });
    if (!addressData) {
      const addNewAddress = new Address({
        userId: user_id, fullName, mobile, houseName, landMark, townCity, state, pincode
      })
      const add = await addNewAddress.save();
    }
    const cartData = await Cart.findOne({ user_id: user_id }, { cartItems: 1, _id: 0 });
    const totalPrice = cartData.cartItems.reduce((total, item) => {
      const numericPrice = parseFloat(item.price);
      return total + numericPrice * item.quantity;
    }, 0);
    const products = await Promise.all(cartData.cartItems.map(async (item) => {
      const stockCheck = await Product.findOne({ _id: item.product_id });
      if (stockCheck.stock >= item.quantity) {
        stockCheck.stock = stockCheck.stock - item.quantity;
        return {
          product: item.product_id,
          quantity: item.quantity,
          price: item.quantity * item.price,
          status: "confirmed",
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
      const count = await Order.countDocuments();
      req.session.paymentRazor = { totalPrice, products, address, count };
      if (paymentOption == "RazorPay") {
        var options = {
          amount: totalPrice * 100,  // amount in the smallest currency unit
          currency: "INR",
          receipt: String(count)
        };
        instance.orders.create(options, function (err, order) {
          return res.status(200).json({ orderId: order.id, amount: order.amount });
        });
      } else if (paymentOption == 'CashOnDelivery') {
        const deleteCart = await Cart.deleteOne({ user_id: user_id })
        const order = new Order({
          orderId: String(count),
          totalPrice, products, address,
          user: user_id,
          paymentMethod: "CashOnDelivery",
          paymentStatus: "pending",
          status: "pending"
        });
        const orderData = await order.save();
        if (!orderData) {
          return res.status(400).json({ success: false, message: "cannot place order something went Wrong" })
        } else {
          return res.status(200).json({ success: true, message: "order Placed successfully " })
        }
      } else {
        return res.status(400).json({ success: false, message: "cannot order" })
      }
    }
  } catch (error) {
    console.error();
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
const orderSuccessPage = async (req, res) => {
  try {
    const loggedIn = req.user ? true : false;
    return res.status(200).render('orderSuccess', { loggedIn })
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
const orderDetials = async (req, res) => {
  try {
    const loggedIn = req.user ? true : false;
    const userId = req.user.user._id;
    const orderData = await Order.find({ user: userId, }, { _id: 0, address: 0 })
    if (!orderData) {
      return res.status(500).json({ success: false, message: "no orders are found" });
    }
    const confirmedProducts = orderData.map(order => {
      return {
        data: order.products.filter(product => product.status != "canceled"),
        orderId: order.orderId
      }
    });
    const updateStatus = confirmedProducts.forEach(async item => {
      if (item.data.length == 0) {
        const updateData = await Order.updateOne({ orderId: item.orderId }, { $set: { status: "canceled" } })
      }
    })
    const orderDatas = await Order.find({ user: userId, }, { _id: 0, address: 0 })
    return res.status(200).render('orderDetialsPage', { orderData: orderDatas, loggedIn });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

const singleOrderDetials = async (req, res) => {
  try {
    const loggedIn = req.user ? true : false;
    const orderId = req.params.orderId;
    const orderData = await Order.findOne({ orderId: orderId }, { _id: 0, address: 0 });
    if (!orderData) {
      return res.status(500).json({ success: false, message: "no orders are found" });
    }
    const Datas = await Promise.all(orderData.products.map(async (item) => {
      const productData = await Product.findOne({ _id: item.product });
      return {
        orderId: orderData.orderId,
        productName: productData.productName,
        productId: item.product,
        quantity: item.quantity,
        price: item.quantity * item.price,
        status: item.status,
        image: productData.image,
        createdOn: orderData.createdOn,
      };
    })
    )
    const updateStatus = orderData.products.filter(item => item.status !== "canceled")
    if (updateStatus.length == 0) {
      return res.status(200).redirect('/orderDetials');
    } else {
      return res.status(200).render('orderDetials', { Datas, loggedIn });
    }

  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

const cancelSingleProduct = async (req, res) => {
  try {
    const { orderId, productId, quantity } = req.body;
    // Update the order status
    const result = await Order.updateOne(
      { orderId: orderId, "products.product": productId },
      { $set: { "products.$.status": "canceled" } }
    );

    if (result) {
      const UpdateStock = await Product.updateOne({ _id: productId }, { $inc: { stock: quantity } })
      if (!UpdateStock) {
        return res.status(404).json({ succes: false, message: "Stock is Not Updated" })
      }
      return res.status(200).json({ success: true, message: "OrderCanceled Successfully" });
    } else {
      return res.status(400).json({ success: false, message: "Order Didn't Canceled" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

const adminOrderPage = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdOn: -1 });
    const users = await Promise.all(orders.map(async (data) => {
      const userData = await User.findOne({ _id: data.user });
      return {
        id: userData._id,
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
    const user_id = req.query.userId;
    const userData = await User.findById(user_id);
    const orderData = await Order.findOne({ orderId: orderId });
    if (!orderData) {
      console.error("Order not found");
      return res.status(404).send("Order not found");
    }
    const addressData = await Order.findOne({ orderId: orderId }, { _id: 0, address: 1 });
    const product = orderData.products.filter((data => data.status != "canceled"))
    const productData = await Promise.all(product.map(async item => {
      const productDetials = await Product.findOne({ _id: item.product })
      return {
        product: productDetials.productName,
        image: productDetials.image[0].filename,
        quantity: item.quantity,
        price: productDetials.salePrice,
        totalPrice: item.quantity * productDetials.salePrice
      };
    }));
    return res.render("orderDetials", {
      user: userData,
      order: orderData,
      product: productData,
      address: addressData.address
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error. Please try again later.");
  }
};
const adminCancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const updatedOrder = await Order.updateOne(
      { _id: orderId },
      { $set: { status: "canceled" } },
      { new: true }
    );
    if (!updatedOrder) {
      return res.status(400).json({ success: false, message: "Somthing went Wroung" });
    } else {
      return res.status(200).json({ success: true, message: "order Canceled by Admin" });
    }
  } catch (error) {
    return res.status(500).send("Internal Server Error. Please try again later.");
  }
};
const razorOrderComplete = async (req, res) => {
  try {
    console.log("hi");
    const paymentOption = req.body.paymentOption;
    const user_id = req.user.user._id;
    const { totalPrice, products, address, count } = req.session.paymentRazor;
    const deleteCart = await Cart.deleteOne({ user_id: user_id })
    const order = new Order({
      orderId: String(count),
      totalPrice, products, address,
      user: user_id,
      paymentMethod: paymentOption,
      paymentStatus: "Paid",
      status: "pending"
    });
    const OrderData = await order.save()
    return res.status(200).json({ success: true, message: "Payment successfully completed" })
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error. Please try again later.");
  }
}
const saleReportPage = async (req, res) => {
  try {
    const orderData = await Order.find({ paymentStatus: "Paid" });
    if (!orderData) {
      return res.status(400).json({ success: false, message: "something went wrong" })
    }
    console.log(orderData[0].address);
    return res.status(200).render('saleReportPage',{orderData})
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error. Please try again later.");
  }
}
module.exports = {
  orderComplete,
  adminOrderPage,
  adminOrderDetails,
  adminCancelOrder,
  orderSuccessPage,
  orderDetials,
  singleOrderDetials,
  cancelSingleProduct,
  razorOrderComplete,
  saleReportPage
}






