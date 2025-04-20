const Order = require("../models/orderModel")
const Address = require("../models/addressModel")
const User = require("../models/userModel")
const Cart = require("../models/cartModel")
const Product = require("../models/productModel")
const dateFun = require("../config/dateData")








const listUserOrders = async (req, res) => {
  try {
    const admin = req.session.adminData;

    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided

    const pageSize = 7; // Adjust this value based on your preference

    const totalCount = await Order.countDocuments();

    const totalPages = Math.ceil(totalCount / pageSize);

    const pipeline = [
      {
        $sort: { _id: -1 }, // Sort in descending order based on createdAt field
      },
      {
        $skip: (page - 1) * pageSize,
      },
      {
        $limit: pageSize,
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $lookup: {
          from: "addresses",
          localField: "address",
          foreignField: "_id",
          as: "address",
        },
      },
      {
        $unwind: "$address",
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "items.product",
        },
      },
      {
        $unwind: "$items.product",
      },
    ];

    const orders = await Order.aggregate(pipeline);

    res.render("allOrder", { order: orders, currentPage: page, totalPages });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};






const listOrderDetails = async (req, res) => {
  try {
      const orderId = req.query.orderId;
      if (!orderId) {
          // Handle the case where orderId is not provided in the query parameters.
          return res.status(400).send('Order ID is missing.');
      }

      const order = await Order.findById(orderId)
          .populate("user")
          .populate({
              path: "address",
              model: "Address",
          })
          .populate({
              path: "items.product",
              model: "Product",
          });

      if (!order) {
          // Handle the case where the order with the given ID is not found.
          return res.status(404).send('Order not found.');
      }
      // Render the template with async: true option
      res.render("orderDetails", { order });
  } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
  }
};



const orderStatusChange = async (req, res) => {
  try {
    const OrderStatus = req.query.status;
    const orderId = req.query.orderId;
    const order = await Order.findById(orderId).populate({
      path: "items.product",
      model: "Product",
    });
   

    if (!order) {
      return res.status(404).send("Order not found");
    }

    if (OrderStatus === 'Product Cancel') {
      const productId = req.query.productId;
      const itemToUpdate = order.items.find(item => item.product._id.toString() === productId);
      if (itemToUpdate) {
        itemToUpdate.status = "Cancel Requested";
        await order.save();
        return res.redirect(`/admin/orderDetails?orderId=${orderId}`);
      }
    }
    if (OrderStatus == "Cancelled") {
      for (const item of order.items) {
        const productId = item.product._id;
        const orderedQuantity = item.quantity;
        const product = await Product.findById(productId);
        if (order.paymentMethod == "Cash On Delivery") {
          order.paymentStatus = "Declined";
        } else {
          order.paymentStatus == "Refunded";
        }
        if (product) {
          product.quantity += orderedQuantity;
          await product.save();
        }
      }
    }
    
    
    if (order && OrderStatus === "Delivered") {
      order.deliveryDate = new Date();
      order.paymentStatus = "Payment Successful";
    }

    order.status = OrderStatus;
    if (req.query.reason) {
      order.reason = req.query.reason;
    }

    await order.save();

    if (req.query.orderDetails) {
      res.redirect(`/admin/orderDetails?orderId=${orderId}`);
    } else if (
      order.status == "Return Requested" ||
      order.status == "Cancel Requested"
    ) {
      res.redirect(`/admin/orderDetails?orderId=${orderId}`);
    } else {
      res.redirect("/admin/allOrder");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};




const loadSalesReport = async (req, res) => {
  try {
    let query = {};

    if (req.query.startDate && req.query.endDate) {
      // Adjust the end date to include the entire day
      const adjustedEndDate = new Date(req.query.endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);
      
      query.orderDate = {
        $gte: new Date(req.query.startDate),
        $lte: adjustedEndDate,
      };
    } else if (req.query.status === "All") {
      query["items.status"] = "Delivered";
    } else {
      // Handle other status options (Daily, Weekly, Monthly, Yearly, Custom)
      if (req.query.status === "Daily") {
        query.orderDate = dateFun.getDailyDateRange();
      } else if (req.query.status === "Weekly") {
        query.orderDate = dateFun.getWeeklyDateRange();
      } else if (req.query.status === "Monthly") {
        query.orderDate = dateFun.getMonthlyDateRange();
      } else if (req.query.status === "Yearly") {
        query.orderDate = dateFun.getYearlyDateRange();
      }
    }

    const orders = await Order.find(query)
      .populate("user")
      // ... rest of your population logic
      .sort({ orderDate: -1 });

    // Calculate total revenue
    const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);

    // Calculate total sales count
    const totalSales = orders.length;

    // Calculate total products sold
    const totalProductsSold = orders.reduce((acc, order) => acc + order.items.length, 0);

    res.render("salesReport", {
      orders,
      totalRevenue,
      totalSales,
      totalProductsSold,
      req,
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).send("Error fetching orders");
  }
};






  
// Transaction List Admin

const transactionList = async (req, res) => {
  try {
    const admin = req.session.adminData;
    const page = parseInt(req.query.page) || 1;
    let query = {};
    if (req.query.type) {
      if (req.query.type === "debit") {
        query.type = "debit";
      } else if (req.query.type === "credit") {
        query.type = "credit";
      }
    }
    const limit = 7;
    const totalCount = await Transaction.countDocuments(query);

    const totalPages = Math.ceil(totalCount / limit);

    const transactions = await Transaction.aggregate([
      { $match: query },
      { $sort: { date: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);
    res.render("transactionList", {
      transactions,
      admin,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error.message);
  }
};


module.exports = {
    listUserOrders,
    listOrderDetails,
    orderStatusChange,
    loadSalesReport,
    transactionList
    
  


}

