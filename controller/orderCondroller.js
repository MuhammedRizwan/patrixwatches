const { User } = require('../model/userModel');
const Product = require('../model/productModel');
const Category = require('../model/categoryModel');
const mongoose = require('mongoose')
const Address = require('../model/addressModel');
const Cart = require('../model/cartModel');
const Order = require('../model/orderModel');
const Wallet = require('../model/walletModel');
const Coupon=require('../model/coupenModel')
const Razorpay = require('razorpay');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const easyinvoice = require('easyinvoice');
const { Readable } = require('stream');
const moment = require('moment');

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

const instance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

const orderComplete = async (req, res) => {
  try {
    const { AddressType, paymentOption, Price, coupon } = req.body;
    const user_id = req.session.user._id;
    const addressData = await Address.findOne({ userId: user_id });
    let AddressArray;
    if (AddressType == "Address 1") {
      AddressArray = addressData.address[0]
    } else {
      AddressArray = addressData.address[1]
    }
    const cartData = await Cart.findOne({ user_id: user_id }, { cartItems: 1, _id: 0 });
    if (!cartData) {
      req.session.razorOrderId = orderData._id;
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
        if (1000 <= totalPrice) {
          return res.status(400).json({ success: false, message: "cannot order above 1000" })
        } else {
          orderData.paymentMethod = paymentOption
          await orderData.save()
          const deleteCart = await Cart.deleteOne({ user_id: user_id })
          return res.status(200).json({ success: true, message: "order Placed successfully " })
        }
      } else if (paymentOption == 'wallet') {
        const walletData = await Wallet.findOne({ user: user_id });
        if (walletData.walletBalance < totalPrice) {
          return res.status(400).json({ success: false, message: "insufficient balance" })
        }
        walletData.walletBalance -= totalPrice;
        walletData.transaction.push({ amount: totalPrice, reson: "product payment", transactionType: "Debit" });
        walletData.save();
        orderData.paymentMethod = paymentOption
        orderData.paymentStatus = "Paid";
        orderData.save()
        const deleteCart = await Cart.deleteOne({ user_id: user_id })
        return res.status(200).json({ success: true, message: "order Placed successfully " })
      } else {
        return res.status(400).json({ success: false, message: "cannot order" })
      }
    }
    const totalPrice = parseInt(Price);
    const products = await Promise.all(cartData.cartItems.map(async (item) => {
      const stockCheck = await Product.findOne({ _id: item.product_id });
      if (stockCheck.stock >= item.quantity) {
        stockCheck.stock = stockCheck.stock - item.quantity;
        await stockCheck.save();
        return {
          product: item.product_id,
          quantity: item.quantity,
          price: item.price,
          status: "confirmed",
        };
      } else {
        return {
          product: item.product_id,
          quantity: item.quantity,
          price: item.price,
          status: "out of stock",
        };
      }
    }));
    if (products.status == "out of stock") {
      return res.status(400).json({ success: false, message: "product is Out of Stock" });
    } else {
      const count = await Order.countDocuments();

      const order = new Order({
        orderId: String(count),
        totalPrice, products, address: AddressArray,
        user: user_id,
        couponId: coupon,
        paymentMethod: "pending",
        paymentStatus: "pending",
        status: "pending"
      });
      const orderData = await order.save();
      const couponData =await Coupon.findOne({_id:coupon});
      couponData.users.push(user_id);
      couponData.save();
      const deleteCart = await Cart.deleteOne({ user_id: user_id })
      req.session.razorOrderId = orderData._id;
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
        if (1000 <= totalPrice) {
          return res.status(400).json({ success: false, message: "cannot order above 1000" })
        } else {
          orderData.paymentMethod = paymentOption
          await orderData.save()
          return res.status(200).json({ success: true, message: "order Placed successfully " })
        }
      } else if (paymentOption == 'wallet') {
        const walletData = await Wallet.findOne({ user: user_id });
        if (walletData.walletBalance < totalPrice) {
          return res.status(400).json({ success: false, message: "insufficient balance" })
        }
        walletData.walletBalance -= totalPrice;
        walletData.transaction.push({ amount: totalPrice, reson: "product payment", transactionType: "Debit" });
        walletData.save();
        orderData.paymentMethod = paymentOption
        orderData.paymentStatus = "Paid";
        orderData.save()
        return res.status(200).json({ success: true, message: "order Placed successfully " })
      } else {
        return res.status(400).json({ success: false, message: "cannot order" })
      }
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
const orderSuccessPage = async (req, res) => {
  try {
    const loggedIn = req.session.user ? true : false;
    const user = await User.findOne({ _id: req.session.user });
    return res.status(200).render('orderSuccess', { loggedIn, Name: user })
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
const orderDetials = async (req, res) => {
  try {
    const loggedIn = req.session.user ? true : false;
    const userId = req.session.user._id;
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
    const orderDatas = await Order.find({ user: userId, }, { address: 0 }).sort({ _id: -1 })
    const user = await User.findOne({ _id: req.session.user });
    return res.status(200).render('orderDetialsPage', { orderData: orderDatas, loggedIn, Name: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
const singleOrderDetials = async (req, res) => {
  try {
    const loggedIn = req.session.user ? true : false;
    const userId = req.session.user._id
    const userData = await User.findOne({ _id: userId })
    const orderId = req.params.orderId;
    const orderData = await Order.findOne({ _id: orderId }).populate("products.product");
    const walletData = await Wallet.findOne({ code: orderData.couponId })
    if (walletData) {

    }
    if (!orderData) {
      return res.status(400).json({ success: false, message: "no orders are found" });
    }
    const updateStatus = orderData.products.filter(item => item.status !== "canceled")
    if (updateStatus.length == 0) {
      return res.status(200).redirect('/orderDetials');
    } else {
      return res.status(200).render('orderDetials', { order: orderData, loggedIn, user: userData, address: orderData.address, product: orderData.products, Name: userData });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
const cancelSingleProduct = async (req, res) => {
  try {
    const { orderId, productId, quantity } = req.body;
    const result = await Order.updateOne(
      { _id: orderId, "products.product": productId },
      { $set: { "products.$.status": "canceled" } }
    );
    const resultData = await Order.findOne({ _id: orderId })
    if (resultData.paymentStatus == "Paid") {
      const product = resultData.products.find(item => item.product == productId)
      const productPrice = product.price
      const wallet = await Wallet.findOne({ user: resultData.user });
      wallet.walletBalance += productPrice;
      wallet.transaction.push({ amount: productPrice, reason: "cancel a product", transactionType: "credit" });
      const walletData = await wallet.save();
    }
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
    const PAGE_SIZE = 10;
    const { page } = req.query;
    const pageNumber = parseInt(page) || 1;
    const totalorders = await Order.countDocuments()
    const totalPages = Math.ceil(totalorders / PAGE_SIZE);
    const orders = await Order.find().sort({ createdOn: -1 }).skip((pageNumber - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE);;
    const users = await Promise.all(orders.map(async (data) => {
      const userData = await User.findOne({ _id: data.user });
      if (userData) {
        return {
          id: userData._id,
          name: userData.name,
          email: userData.email
        };
      } else {
        return {
          id: new mongoose.Types.ObjectId,
          name: 'Deleted User',
          email: 'deleted User Email'
        };
      }
    }));
    return res.status(200).render("adminOrder", {
      user: users,
      order: orders,
      totalPages: totalPages,
      currentPage: pageNumber
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("Internal Server Error. Please try again later.");
  }
};
const adminOrderDetails = async (req, res) => {
  try {
    const orderId = req.query.id;
    const user_id = req.query.userId;
    let userData = await User.findById(user_id);
    if (!userData) {
      userData = {
        name: "deleted user", email: "deleted user", phone: "deleted user"
      }
    }
    const orderData = await Order.findOne({ orderId: orderId });
    if (!orderData) {
      return res.status(404).send("Order not found");
    }
    const addressData = await Order.findOne({ orderId: orderId }, { _id: 0, address: 1 });
    const product = orderData.products.filter((data => data.status != "canceled"))
    const productData = await Promise.all(product.map(async item => {
      const productDetials = await Product.findOne({ _id: item.product })
      return {
        productId: item.product,
        product: productDetials.productName,
        image: productDetials.image[0].filename,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.quantity * item.price
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
const changeOrderStatus = async (req, res) => {
  try {
    const { option, orderId } = req.body;
    if (option !== 'Delivered') {
      var updatedOrder = await Order.updateOne(
        { orderId: orderId },
        { $set: { status: option } },
        { new: true }
      );
    } else {
      var updatedOrder = await Order.updateOne(
        { orderId: orderId },
        { $set: { status: option, paymentStatus: "paid" } },
        { new: true }
      );
    }
    if (!updatedOrder) {
      return res.status(400).json({ success: false, message: "Somthing went Wroung" });
    } else {
      return res.status(200).json({ success: true, message: "order status Changed by Admin" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("Internal Server Error. Please try again later.");
  }
};
const adminCancelOrder = async (req, res) => {
  try {
    const { orderId, productId, quantity } = req.body;
    const orderData = await Order.findOne({ orderId: orderId });
    if (orderData.status === 'Delivered') {
      return res.status(400).json({ success: false, message: "cannot cancel it is delivered" })
    }
    // Update the order status
    const updatedOrder = await Order.updateOne(
      { orderId: orderId, "products.product": productId },
      { $set: { "products.$.status": "canceled" } }
    );
    if (!updatedOrder) {
      return res.status(400).json({ success: false, message: "Somthing went Wroung" });
    } else {
      if (orderData.paymentStatus == "Paid") {
        const product = orderData.products.find(item => item.product == productId)
        const productPrice = product.price
        const wallet = await Wallet.findOne({ user: orderData.user });
        wallet.walletBalance += productPrice;
        wallet.transaction.push({ amount: productPrice, reason: "cancel a product", transactionType: "credit" });
        const walletData = await wallet.save();
      }
      const UpdateStock = await Product.updateOne({ _id: productId }
        , { $inc: { quantity: quantity } },
        { new: true })
      if (!UpdateStock) {
        return res.status(400).json({ success: false, message: "Somthing went Wroung on updating Stock" });
      } else {
        const statusArray = orderData.products.filter(data => data.status != 'canceled');
        if (statusArray.length == 0) {
          orderData.status = 'canceled';
          orderData.save();
          return res.status(200).json({ success: true, message: "Order successfully " })
        }
      }
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("Internal Server Error. Please try again later.");
  }
};
const razorOrderComplete = async (req, res) => {
  try {
    const paymentOption = req.body.paymentOption;
    const user_id = req.session.user._id;
    const orderId = req.session.razorOrderId;
    const orderData = await Order.findOne({ _id: orderId });
    orderData.paymentMethod = paymentOption;
    orderData.paymentStatus = "Paid";
    await orderData.save()
    if (orderData) {
      return res.status(200).json({ success: true, message: "Payment successfully completed" })
    } else {
      return res.status(400).json({ success: false, message: "something went wrong" })
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error. Please try again later.");
  }
}
const returnSingleProduct = async (req, res) => {
  try {
    const { orderId, productId, quantity } = req.body;
    const orderData = await Order.findOne({ orderId: orderId });
    const productData = orderData.products.find((item) => item.product == productId);
    const productPrice = productData.price * quantity;
    const wallet = await Wallet.findOne({ user: orderData.user });
    wallet.walletBalance += productPrice;
    wallet.transaction.push({ amount: productPrice, reason: "return a product", transactionType: "credit" });
    const walletData = await wallet.save();
    if (!walletData) {
      return res.status(400).json({ success: false, message: "cannot refund something wrong" })
    }
    const result = await Order.updateOne(
      { orderId: orderId, "products.product": productId },
      { $set: { "products.$.status": "Returned" } }
    );
    const resultData = await Order.findOne({ orderId: orderId });
    const returnedArray = resultData.products.find(item => item.status != "Returned")
    if (returnedArray.length == 0) {
      const changeAsReturn = await Order.updateOne(
        { orderId: orderId },
        { $set: { status: "Returned" } }
      );
    }
    return res.status(200).json({ success: true, message: `${productPrice} is refunded in your wallet` });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("Internal Server Error. Please try again later.");

  }
}
const PaymentOrderPage = async (req, res) => {
  try {
    const orderId = req.query.id;
    req.session.orderId = orderId;
    const loggedIn = req.session.user ? true : false;
    const orderData = await Order.findOne({ _id: orderId }).populate("products.product")
    const user = await User.findOne({ _id: req.session.user });
    return res.status(200).render('paymentOrderPage', { orderData, loggedIn, Name: user });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("Internal Server Error. Please try again later.");
  }
}
const paymentOrder = async (req, res) => {
  try {
    const { paymentOption } = req.body
    const user_id = req.session.user._id
    const count = await Order.countDocuments();
    const orderData = await Order.findOne({ _id: req.session.orderId })
    const totalPrice = orderData.totalPrice;
    req.session.razorOrderId = orderData._id
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
      if (1000 <= totalPrice) {
        return res.status(400).json({ success: false, message: "cannot order above 1000" })
      } else {
        orderData.paymentMethod = paymentOption
        await orderData.save()
        return res.status(200).json({ success: true, message: "order Placed successfully " })
      }
    } else if (paymentOption == 'wallet') {
      const walletData = await Wallet.findOne({ user: user_id });
      if (walletData.walletBalance < totalPrice) {
        return res.status(400).json({ success: false, message: "insufficient balance" })
      }
      walletData.walletBalance -= totalPrice;
      walletData.transaction.push({ amount: totalPrice, reson: "product payment", transactionType: "Debit" });
      walletData.save();
      orderData.paymentMethod = paymentOption
      orderData.paymentStatus = "Paid";
      orderData.save()
      return res.status(200).json({ success: true, message: "order Placed successfully " })
    } else {
      return res.status(400).json({ success: false, message: "cannot order" })
    }
  } catch (error) {
    console.log(error.message);
  }
}
const saleReportPage = async (req, res) => {
  try {
    const orderData = await Order.aggregate([
      {
        $match: {
          paymentStatus: "Paid",
        } // Filter delivered orders
      },
      {
        $group: {
          _id: { $year: "$createdOn" },
          orders: { $push: "$$ROOT" } // Add all details of delivered orders to an array
        }
      },
      {
        $unwind: "$orders" // Unwind the orders array
      },
      {
        $lookup: {
          from: "userdetials", // Assuming the name of the User collection is "users"
          localField: "orders.user", // Field in the orders array
          foreignField: "_id", // Field in the User collection
          as: "orders.user" // Output array field
        }
      },
      {
        $group: {
          _id: "$_id",
          orders: { $push: "$orders" } // Group orders back into an array
        }
      },
      { $sort: { "_id": -1 } }
    ]);
    if (orderData.length === 0) {
      return res.status(400).json({ success: false, message: "something went wrong" })
    }
    var option = undefined;
    return res.status(200).render('saleReportPage', { orderData: orderData[0].orders, option })
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error. Please try again later.");
  }
}
const saleReport = async (req, res) => {
  try {
    const option = req.query.option;
    if (option == 'Yearly') {
      const Year = new Date().getFullYear()
      const startDate = new Date(Year, 0, 1); // January 1st of the current year
      const endDate = new Date(Year, 11, 31, 23, 59, 59); // December 31st of the current year
      var Report = await Order.aggregate([
        {
          $match: {
            paymentStatus: "Paid",
            createdOn: {
              $gte: startDate, // Orders created on or after January 1st of the current year
              $lte: endDate // Orders created on or before December 31st of the current year
            }
          } // Filter delivered orders
        },
        {
          $group: {
            _id: { $year: "$createdOn" },
            orders: { $push: "$$ROOT" } // Add all details of delivered orders to an array
          }
        },
        {
          $unwind: "$orders" // Unwind the orders array
        },
        {
          $lookup: {
            from: "userdetials", // Assuming the name of the User collection is "users"
            localField: "orders.user", // Field in the orders array
            foreignField: "_id", // Field in the User collection
            as: "orders.user" // Output array field
          }
        },
        {
          $group: {
            _id: "$_id",
            orders: { $push: "$orders" } // Group orders back into an array
          }
        },
        { $sort: { _id: -1 } }
      ]);
    } else if (option == 'Month') {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const startDate = new Date(currentYear, currentMonth, 1); // First day of the current month
      const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      Report = await Order.aggregate([
        {
          $match: {
            paymentStatus: "Paid",
            createdOn: {
              $gte: startDate, // Orders created on or after January 1st of the current year
              $lte: endDate // Orders created on or before December 31st of the current year
            }
          } // Filter delivered orders
        },
        {
          $group: {
            _id: { year: { $year: "$createdOn" }, month: { $month: "$createdOn" } }, // Group by month
            orders: { $push: "$$ROOT" } // Add all details of delivered orders to an array
          }
        },
        {
          $unwind: "$orders" // Unwind the orders array
        },
        {
          $lookup: {
            from: "userdetials", // Assuming the name of the User collection is "users"
            localField: "orders.user", // Field in the orders array
            foreignField: "_id", // Field in the User collection
            as: "orders.user" // Output array field
          }
        },
        {
          $group: {
            _id: "$_id",
            orders: { $push: "$orders" } // Group orders back into an array
          }
        }, {
          $sort: { "_id.year": 1, "_id.month": 1 } // Sort by year and month
        }
      ]);
    } else if (option == 'Week') {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const currentDay = new Date().getDate(); // Get the current day of the month
      const currentDayOfWeek = new Date().getDay(); // Get the current day of the week (0 for Sunday, 1 for Monday, ..., 6 for Saturday)

      const startOfWeek = new Date(currentYear, currentMonth, currentDay - currentDayOfWeek); // Sunday of the current week

      // Calculate the end date for the current week
      const endOfWeek = new Date(currentYear, currentMonth, currentDay + (6 - currentDayOfWeek), 23, 59, 59); // Saturday of the current week, with time set to end of day

      // Construct the start and end dates for the current month
      const startDate = new Date(currentYear, currentMonth, 1); // First day of the current month
      const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59); // Last day of the current month, with time set to end of day

      Report = await Order.aggregate([
        {
          $match: {
            paymentStatus: "Paid",
            $or: [
              {
                createdOn: {
                  $gte: startDate, // Orders created on or after the first day of the current month
                  $lte: endDate // Orders created on or before the last day of the current month
                }
              },
              {
                createdOn: {
                  $gte: startOfWeek, // Orders created on or after the start of the current week
                  $lte: endOfWeek // Orders created on or before the end of the current week
                }
              }
            ]
          } // Filter delivered orders
        },
        {
          $group: {
            _id: { $week: "$createdOn" }, // Group by week
            orders: { $push: "$$ROOT" } // Add all details of delivered orders to an array
          }
        },
        {
          $unwind: "$orders" // Unwind the orders array
        },
        {
          $lookup: {
            from: "userdetials", // Assuming the name of the User collection is "users"
            localField: "orders.user", // Field in the orders array
            foreignField: "_id", // Field in the User collection
            as: "orders.user" // Output array field
          }
        },
        {
          $group: {
            _id: "$_id",
            orders: { $push: "$orders" } // Group orders back into an array
          }
        },
        { $sort: { "_id": 1 } }
      ]);
    }
    if (Report.length == 0) {
      return res.status(400).json({ success: true, message: "something went Wroung" })
    }
    return res.status(200).render('saleReportPage', { date: Report[0]._id, orderData: Report[0].orders, option: option })
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error. Please try again later.");
  }
}

const downloadPdf = async (req, res) => {
  try {
    // Fetch delivered orders from the database
    const option = req.query.option;
    if (option == 'Yearly') {
      const Year = new Date().getFullYear()
      const startDate = new Date(Year, 0, 1); // January 1st of the current year
      const endDate = new Date(Year, 11, 31, 23, 59, 59); // December 31st of the current year
      var deliveredOrders = await Order.aggregate([
        {
          $match: {
            paymentStatus: "Paid",
            createdOn: {
              $gte: startDate, // Orders created on or after January 1st of the current year
              $lte: endDate // Orders created on or before December 31st of the current year
            }
          } // Filter delivered orders
        },
        {
          $group: {
            _id: { $year: "$createdOn" },
            orders: { $push: "$$ROOT" } // Add all details of delivered orders to an array
          }
        },
        {
          $unwind: "$orders" // Unwind the orders array
        },
        {
          $lookup: {
            from: "userdetials", // Assuming the name of the User collection is "users"
            localField: "orders.user", // Field in the orders array
            foreignField: "_id", // Field in the User collection
            as: "orders.user" // Output array field
          }
        },
        {
          $group: {
            _id: "$_id",
            orders: { $push: "$orders" } // Group orders back into an array
          }
        },
        { $sort: { "_id": 1 } }
      ]);
    } else if (option == 'Month') {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const startDate = new Date(currentYear, currentMonth, 1); // First day of the current month
      const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      deliveredOrders = await Order.aggregate([
        {
          $match: {
            paymentStatus: "Paid",
            createdOn: {
              $gte: startDate, // Orders created on or after January 1st of the current year
              $lte: endDate // Orders created on or before December 31st of the current year
            }
          } // Filter delivered orders
        },
        {
          $group: {
            _id: { year: { $year: "$createdOn" }, month: { $month: "$createdOn" } }, // Group by month
            orders: { $push: "$$ROOT" } // Add all details of delivered orders to an array
          }
        },
        {
          $unwind: "$orders" // Unwind the orders array
        },
        {
          $lookup: {
            from: "userdetials", // Assuming the name of the User collection is "users"
            localField: "orders.user", // Field in the orders array
            foreignField: "_id", // Field in the User collection
            as: "orders.user" // Output array field
          }
        },
        {
          $group: {
            _id: "$_id",
            orders: { $push: "$orders" } // Group orders back into an array
          }
        }, {
          $sort: { "_id.year": 1, "_id.month": 1 } // Sort by year and month
        }
      ]);
    } else if (option == 'Week') {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const currentDay = new Date().getDate(); // Get the current day of the month
      const currentDayOfWeek = new Date().getDay(); // Get the current day of the week (0 for Sunday, 1 for Monday, ..., 6 for Saturday)

      const startOfWeek = new Date(currentYear, currentMonth, currentDay - currentDayOfWeek); // Sunday of the current week

      // Calculate the end date for the current week
      const endOfWeek = new Date(currentYear, currentMonth, currentDay + (6 - currentDayOfWeek), 23, 59, 59); // Saturday of the current week, with time set to end of day

      // Construct the start and end dates for the current month
      const startDate = new Date(currentYear, currentMonth, 1); // First day of the current month
      const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59); // Last day of the current month, with time set to end of day

      deliveredOrders = await Order.aggregate([
        {
          $match: {
            paymentStatus: "Paid",
            $or: [
              {
                createdOn: {
                  $gte: startDate, // Orders created on or after the first day of the current month
                  $lte: endDate // Orders created on or before the last day of the current month
                }
              },
              {
                createdOn: {
                  $gte: startOfWeek, // Orders created on or after the start of the current week
                  $lte: endOfWeek // Orders created on or before the end of the current week
                }
              }
            ]
          } // Filter delivered orders
        },
        {
          $group: {
            _id: { $week: "$createdOn" }, // Group by week
            orders: { $push: "$$ROOT" } // Add all details of delivered orders to an array
          }
        },
        {
          $unwind: "$orders" // Unwind the orders array
        },
        {
          $lookup: {
            from: "userdetials", // Assuming the name of the User collection is "users"
            localField: "orders.user", // Field in the orders array
            foreignField: "_id", // Field in the User collection
            as: "orders.user" // Output array field
          }
        },
        {
          $group: {
            _id: "$_id",
            orders: { $push: "$orders" } // Group orders back into an array
          }
        },
        { $sort: { "_id": 1 } }
      ]);
    }
    const doc = new PDFDocument();

    // Set the Content-Type header to display the PDF in the browser
    res.setHeader("Content-Type", "application/pdf");
    // Set Content-Disposition to suggest a filename
    res.setHeader("Content-Disposition", 'inline; filename="sale_report.pdf"');
    // Pipe the PDF content to the response stream
    doc.pipe(res);
    if (option == 'Week') {
      doc.text("Weekly Sale Report", { fontSize: 17, underline: true }).moveDown();
    } else if (option == 'Month') {
      doc.text("Monthly Sale Report", { fontSize: 17, underline: true }).moveDown();
    } else if (option == 'Year') {
      doc.text("Yearly Sale Report", { fontSize: 17, underline: true }).moveDown();
    }
    // Add content to the PDF (based on your sale report structure)
    doc
      .fontSize(22)
      .text("PATRIX Corp", { align: "center" })
      .text("Luxurious Watches", { align: "center" })
      .text("kochi", { align: "center" })
      .text("india", { align: "center" });

    const rowHeight = 20; // You can adjust this value based on your preference

    // Calculate the vertical position for each line of text in the row
    const yPos = doc.y + rowHeight / 2;

    // Create a table header
    doc
      .fontSize(12)
      .rect(10, doc.y, 800, rowHeight) // Set a rectangle for each row
      .text("Order ID", 20, yPos)
      .text("Date", 90, yPos)
      .text("Customer", 140, yPos)
      .text("email", 230, yPos)
      .text("Total", 340, yPos)
      .text("Status", 400, yPos)
      .text("Payment", 470, yPos);
    doc.moveDown();

    // Loop through fetched orders and products
    for (const order of deliveredOrders[0].orders) {
      // Set a fixed height for each row
      const rowHeight = 20; // You can adjust this value based on your preference

      // Calculate the vertical position for each line of text in the row
      const yPos = doc.y + rowHeight / 2;

      // Add the sale report details to the PDF table
      doc
        .fontSize(10)
        .rect(10, doc.y, 800, rowHeight) // Set a rectangle for each row
        .stroke() // Draw the rectangle
        .text(order.orderId.toString(), 15, yPos)
        .text(order.createdOn.toISOString().split("T")[0], 80, yPos)
        .text(order.user[0].name, 150, yPos)
        .text(order.user[0].email, 190, yPos)
        .text(order.totalPrice.toString(), 350, yPos)
        .text("Delivered", 400, yPos)
        .text(order.paymentMethod, 460, yPos);
      // Move to the next row
      doc.moveDown();
    }
    // Add a separator between rows


    // End the document
    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const downloadExcel = async (req, res) => {
  try {
    const option = req.query.option;
    // Fetch your sale report data from MongoDB, similar to what you're doing for the PDF download
    const orders = await fetchSaleReportData(option);

    // Create a new Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sale Report");

    // Add headers to the worksheet with Product Name
    worksheet.addRow([
      "Order ID",
      "Date",
      "Customer",
      "email",
      "Total",
      "Status",
      "Payment Method",
      "payment Status"
    ]);

    // Add data to the worksheet
    orders.forEach((order) => {

      worksheet.addRow([
        order.orderId,
        order.createdOn.toISOString().split("T")[0],
        order.user[0].name,
        order.user[0].email,
        order.totalPrice,
        order.status, // Assuming a static status for simplicity
        order.paymentMethod,
        order.paymentStatus
      ]);
    });

    // Set headers for the response
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sale_report.xlsx"
    );

    // Write the Excel workbook to the response
    await workbook.xlsx.write(res);

    // End the response
    res.end();
  } catch (error) {
    console.error("Error downloading Excel:", error);
    res.status(500).send("Internal Server Error");
  }
};

async function fetchSaleReportData(option) {
  try {
    // Fetch the orders from the MongoDB database
    if (option == 'Yearly') {
      const Year = new Date().getFullYear()
      const startDate = new Date(Year, 0, 1); // January 1st of the current year
      const endDate = new Date(Year, 11, 31, 23, 59, 59); // December 31st of the current year
      var orders = await Order.aggregate([
        {
          $match: {
            paymentStatus: "Paid",
            createdOn: {
              $gte: startDate, // Orders created on or after January 1st of the current year
              $lte: endDate // Orders created on or before December 31st of the current year
            }
          } // Filter delivered orders
        },
        {
          $group: {
            _id: { $year: "$createdOn" },
            orders: { $push: "$$ROOT" } // Add all details of delivered orders to an array
          }
        },
        {
          $unwind: "$orders" // Unwind the orders array
        },
        {
          $lookup: {
            from: "userdetials", // Assuming the name of the User collection is "users"
            localField: "orders.user", // Field in the orders array
            foreignField: "_id", // Field in the User collection
            as: "orders.user" // Output array field
          }
        },
        {
          $group: {
            _id: "$_id",
            orders: { $push: "$orders" } // Group orders back into an array
          }
        },
        { $sort: { "_id": 1 } }
      ]);
    } else if (option == 'Month') {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const startDate = new Date(currentYear, currentMonth, 1); // First day of the current month
      const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      orders = await Order.aggregate([
        {
          $match: {
            paymentStatus: "Paid",
            createdOn: {
              $gte: startDate, // Orders created on or after January 1st of the current year
              $lte: endDate // Orders created on or before December 31st of the current year
            }
          } // Filter delivered orders
        },
        {
          $group: {
            _id: { year: { $year: "$createdOn" }, month: { $month: "$createdOn" } }, // Group by month
            orders: { $push: "$$ROOT" } // Add all details of delivered orders to an array
          }
        },
        {
          $unwind: "$orders" // Unwind the orders array
        },
        {
          $lookup: {
            from: "userdetials", // Assuming the name of the User collection is "users"
            localField: "orders.user", // Field in the orders array
            foreignField: "_id", // Field in the User collection
            as: "orders.user" // Output array field
          }
        },
        {
          $group: {
            _id: "$_id",
            orders: { $push: "$orders" } // Group orders back into an array
          }
        }, {
          $sort: { "_id.year": 1, "_id.month": 1 } // Sort by year and month
        }
      ]);
    } else if (option == 'Week') {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const currentDay = new Date().getDate(); // Get the current day of the month
      const currentDayOfWeek = new Date().getDay(); // Get the current day of the week (0 for Sunday, 1 for Monday, ..., 6 for Saturday)

      const startOfWeek = new Date(currentYear, currentMonth, currentDay - currentDayOfWeek); // Sunday of the current week

      // Calculate the end date for the current week
      const endOfWeek = new Date(currentYear, currentMonth, currentDay + (6 - currentDayOfWeek), 23, 59, 59); // Saturday of the current week, with time set to end of day

      // Construct the start and end dates for the current month
      const startDate = new Date(currentYear, currentMonth, 1); // First day of the current month
      const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59); // Last day of the current month, with time set to end of day

      orders = await Order.aggregate([
        {
          $match: {
            paymentStatus: "Paid",
            $or: [
              {
                createdOn: {
                  $gte: startDate, // Orders created on or after the first day of the current month
                  $lte: endDate // Orders created on or before the last day of the current month
                }
              },
              {
                createdOn: {
                  $gte: startOfWeek, // Orders created on or after the start of the current week
                  $lte: endOfWeek // Orders created on or before the end of the current week
                }
              }
            ]
          } // Filter delivered orders
        },
        {
          $group: {
            _id: { $week: "$createdOn" }, // Group by week
            orders: { $push: "$$ROOT" } // Add all details of delivered orders to an array
          }
        },
        {
          $unwind: "$orders" // Unwind the orders array
        },
        {
          $lookup: {
            from: "userdetials", // Assuming the name of the User collection is "users"
            localField: "orders.user", // Field in the orders array
            foreignField: "_id", // Field in the User collection
            as: "orders.user" // Output array field
          }
        },
        {
          $group: {
            _id: "$_id",
            orders: { $push: "$orders" } // Group orders back into an array
          }
        },
        { $sort: { "_id": 1 } }
      ]);
    }
    return orders[0].orders;
  } catch (error) {
    console.error("Error fetching sale report data:", error);
    throw error;
  }
}

const saveInvoice = async (req, res) => {
  try {
    const orderId = req.query.id;

    // Fetch the order details with product and address information
    const order = await Order.findOne({ _id: orderId })
      .populate("products.product")
    const userId = order.user
    // Fetch user details
    const user = await User.findById(userId);
    // Extract relevant information from the order
    const invoiceData = {
      id: orderId,
      total: order.products.reduce((salePrice, i) => {
        salePrice = salePrice + (i.price * i.quantity)
      }, 0), // Assuming there's only one product in the order
      date: order.createdOn.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      paymentMethod: order.paymentMethod,
      orderStatus: order.status,
      name: order.address.fullName,
      number: order.address.mobile,
      house: order.address.houseName,
      pincode: order.address.pincode,
      town: order.address.townCity,
      state: order.address.state,
      products: order.products.map((product) => ({
        quantity: product.quantity,
        description: product.product.productName,
        price: product.price,
        "tax-rate": 0,
      })),
      sender: {
        company: "Patrix Corp",
        address: "Luxurious Watches",
        city: "kochi",
        country: "India",
      },
      client: {
        company: "Customer Address",
        name: order.address.fullName,
        house: order.address.houseName,
        zip: order.address.pincode, // Using pinCode as zip
        city: order.address.townCity,
        address: order.address.addressLine,
        // "custom1": "custom value 1",
        // "custom2": "custom value 2",
        // "custom3": "custom value 3"
      },
      information: {
        Bill: "order " + order.orderId,
        date: order.createdOn.toLocaleDateString,
      },
      "bottom-notice": "Happy shopping and visit Patrix corp  again",
    };

    // Generate PDF using easyinvoice
    const pdfResult = await easyinvoice.createInvoice({
      ...invoiceData,
      bottomNotice: "Happy shopping and visit patrix Corp again",
    });
    const pdfBuffer = Buffer.from(pdfResult.pdf, "base64");

    // Set HTTP headers for the PDF response
    res.setHeader("Content-Disposition", 'attachment; filename="invoice.pdf"');
    res.setHeader("Content-Type", "application/pdf");

    // Create a readable stream from the PDF buffer and pipe it to the response
    const pdfStream = new Readable();
    pdfStream.push(pdfBuffer);
    pdfStream.push(null);

    pdfStream.pipe(res);
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).send("Internal Server Error");
  }
};

const saleschart = async (req, res) => {
  try {
    // Get the time range (e.g., monthly, weekly, daily) from query params
    const timeRange = req.query.timeRange || 'monthly'; // Default to monthly if not provided


    // Calculate the start date based on the specified time range
    let startDate;
    if (timeRange === 'weekly') {
      startDate = moment().subtract(1, 'weeks').startOf('week').toDate();
    } else if (timeRange === 'daily') {
      startDate = moment().subtract(1, 'days').startOf('day').toDate();
    } else {
      startDate = moment().subtract(2, 'months').startOf('month').toDate();
    }

    // Aggregate orders data based on the specified time range and start date
    const salesData = await Order.aggregate([
      {
        $match: {
          $or: [
            { status: "Delivered" },
            { paymentStatus: "paid" }
          ],
          createdOn: { $gte: startDate } // Filter orders placed after the start date
        }
      },
      {
        $group: {
          _id: {
            $cond: [ // Group by month, week, or day based on the specified time range
              { $eq: [timeRange, 'weekly'] },
              { $isoWeek: "$createdOn" }, // Group by ISO week for weekly data
              { $cond: [{ $eq: [timeRange, 'daily'] }, { $dayOfMonth: "$createdOn" }, { $month: "$createdOn" }] } // Group by day for daily data, month for monthly data
            ]
          },
          totalSales: { $sum: 1 } // Count the number of orders
        }
      },
      { $sort: { "_id": 1 } } // Sort by month, week, or day
    ]);
    // Format the fetched data as needed for the frontend chart
    const labels = salesData.map(item => {
      if (timeRange === 'weekly') {
        return `Week ${item._id}`;
      } else if (timeRange === 'daily') {
        return `Day ${item._id}`;
      } else {
        return moment().month(item._id - 1).format('MMMM');
      }
    });
    const datasets = [{
      label: 'Sales',
      data: salesData.map(item => item.totalSales)
    }];

    // Send the formatted sales data as a response
    res.json({ labels, datasets });
  } catch (error) {
    console.error('Error fetching sales chart data:', error);
    res.status(500).json({ error: 'Failed to fetch sales chart data' });
  }
}



const saleChart = async (req, res) => {
  try {
    if (!req.query.interval) {
      console.error("Error: Missing interval parameter in the request");
      return res.status(400).json({ error: "Missing interval parameter" });
    }

    const interval = req.query.interval.toLowerCase();

    let dateFormat, groupByFormat;

    switch (interval) {
      case "yearly":
        dateFormat = "%Y";
        groupByFormat = { $dateToString: { format: "%Y", date: "$createdOn" } };
        break;

      case "monthly":
        dateFormat = "%m-%Y"; // Use %m for numeric month
        groupByFormat = {
          $dateToString: { format: "%m-%Y", date: "$createdOn" },
        };
        break;

      case "daily":
        dateFormat = "%Y-%m-%d";
        groupByFormat = {
          $dateToString: { format: "%Y-%m-%d", date: "$createdOn" },
        };
        break;

      default:
        console.error("Error: Invalid time interval");
        return res.status(400).json({ error: "Invalid time interval" });
    }

    const salesData = await Order.aggregate([
      {
        $group: {
          _id: groupByFormat,
          totalSales: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Map numeric months to month names
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const labels = salesData.map((item) => {
      if (interval === "monthly") {
        const [month, year] = item._id.split('-');
        return `${monthNames[parseInt(month) - 1]} ${year}`;
      }
      return item._id; // For other intervals, keep the original value
    });

    const values = salesData.map((item) => item.totalSales);

    res.json({ labels, values });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


module.exports = {
  orderComplete,
  adminOrderPage,
  adminOrderDetails,
  adminCancelOrder,
  orderSuccessPage,
  orderDetials,
  singleOrderDetials,
  changeOrderStatus,
  cancelSingleProduct,
  razorOrderComplete,
  saleReportPage,
  saleReport,
  downloadPdf,
  downloadExcel,
  saveInvoice,
  saleschart,
  returnSingleProduct,
  PaymentOrderPage,
  paymentOrder,
  saleChart
}