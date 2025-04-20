const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Transaction = require("../models/transactionModel");
const dateFun = require("../utils/dateData");
const STATUSCODE = require("../config/statusCode");
const RESPONSE = require("../config/responseMessage");

const listUserOrders = async (req, res) => {
  try {
    const admin = req.session.adminData;
    const page = parseInt(req.query.page) || 1;
    const pageSize = 7;
    const totalCount = await Order.countDocuments();
    const totalPages = Math.ceil(totalCount / pageSize);

    const orders = await Order.aggregate([
      { $sort: { _id: -1 } },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
      { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $lookup: { from: "addresses", localField: "address", foreignField: "_id", as: "address" } },
      { $unwind: "$address" },
      { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "items.product" } },
      { $unwind: "$items.product" },
    ]);

    res.status(STATUSCODE.OK).render("allOrder", { order: orders, currentPage: page, totalPages, admin });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const listOrderDetails = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    if (!orderId) {
      return res.status(STATUSCODE.BAD_REQUEST).send(RESPONSE.ORDER_ID_MISSING);
    }

    const order = await Order.findById(orderId)
      .populate("user")
      .populate({ path: "address", model: "Address" })
      .populate({ path: "items.product", model: "Product" });

    if (!order) {
      return res.status(STATUSCODE.NOT_FOUND).send(RESPONSE.ORDER_NOT_FOUND);
    }

    res.status(STATUSCODE.OK).render("orderDetails", { order });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const orderStatusChange = async (req, res) => {
  try {
    const orderStatus = req.query.status;
    const orderId = req.query.orderId;
    const order = await Order.findById(orderId).populate({ path: "items.product", model: "Product" });

    if (!order) {
      return res.status(STATUSCODE.NOT_FOUND).send(RESPONSE.ORDER_NOT_FOUND);
    }

    if (orderStatus === "Product Cancel") {
      const productId = req.query.productId;
      const itemToUpdate = order.items.find((item) => item.product._id.toString() === productId);
      if (itemToUpdate) {
        itemToUpdate.status = "Cancel Requested";
        await order.save();
        return res.status(STATUSCODE.OK).redirect(`/admin/orderDetails?orderId=${orderId}`);
      }
    }

    if (orderStatus === "Cancelled") {
      for (const item of order.items) {
        const product = await Product.findById(item.product._id);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
      order.paymentStatus = order.paymentMethod === "Cash On Delivery" ? "Declined" : "Refunded";
    }

    if (orderStatus === "Delivered") {
      order.deliveryDate = new Date();
      order.paymentStatus = "Payment Successful";
    }

    order.status = orderStatus;
    if (req.query.reason) {
      order.reason = req.query.reason;
    }

    await order.save();

    if (req.query.orderDetails || order.status === "Return Requested" || order.status === "Cancel Requested") {
      res.status(STATUSCODE.OK).redirect(`/admin/orderDetails?orderId=${orderId}`);
    } else {
      res.status(STATUSCODE.OK).redirect("/admin/allOrder");
    }
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const loadSalesReport = async (req, res) => {
  try {
    let query = {};

    if (req.query.startDate && req.query.endDate) {
      const adjustedEndDate = new Date(req.query.endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);
      query.orderDate = {
        $gte: new Date(req.query.startDate),
        $lte: adjustedEndDate,
      };
    } else if (req.query.status === "All") {
      query["items.status"] = "Delivered";
    } else {
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

    const orders = await Order.find(query).populate("user").sort({ orderDate: -1 });

    const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
    const totalSales = orders.length;
    const totalProductsSold = orders.reduce((acc, order) => acc + order.items.length, 0);

    res.status(STATUSCODE.OK).render("salesReport", {
      orders,
      totalRevenue,
      totalSales,
      totalProductsSold,
      req,
    });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.ERROR_FETCHING_ORDERS);
  }
};

const transactionList = async (req, res) => {
  try {
    const admin = req.session.adminData;
    const page = parseInt(req.query.page) || 1;
    let query = {};
    if (req.query.type) {
      query.type = req.query.type;
    }

    const limit = 7;
    const totalCount = await Transaction.countDocuments(query);
    const transactions = await Transaction.aggregate([
      { $match: query },
      { $sort: { date: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);

    res.status(STATUSCODE.OK).render("transactionList", {
      transactions,
      admin,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

module.exports = {
  listUserOrders,
  listOrderDetails,
  orderStatusChange,
  loadSalesReport,
  transactionList,
};