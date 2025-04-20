const Address = require("../models/addressModel")
const User = require("../models/userModel")
const Order = require("../models/orderModel")
const Cart = require("../models/cartModel")
const Product = require('../models/productModel')
const Coupon = require('../models/couponModel')
const Razorpay = require("razorpay")
const Transaction = require("../models/transactionModel")
const {calculateProductTotal,calculateSubtotal,calculateDiscountedTotal}=require("../config/cartSum");
const Wallet = require("../models/walletModel")
const mongoose = require('mongoose')

var instance=new Razorpay({
  key_id:"rzp_test_XnSWcDHvXwMKdf",
  key_secret:"NehtVXa3MOzjSmg29peiBR9S",
})
// Load Order Details

function generateRandomNumberWithPrefix() {
  let prefix = "ODR";
  const randomNumber = Math.floor(Math.random() * 9000000000) + 1000000000;
  const result = `${prefix}${randomNumber}`;
  console.log("random orderid:-",result);
  return result;
}

const loadOrderDetails = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findById(userId);

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const pageSize = 7; // Adjust this value based on your preference

    // Count total number of orders
    const totalCount = await Order.countDocuments({
      user: new mongoose.Types.ObjectId(userId),
    });

    const orders = await Order.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'items.product',
        },
      },
      {
        $unwind: '$items.product',
      },
      {
        $sort: { _id: -1}, // Sort by createdAt in descending order
      },
      {
        $skip: (page - 1) * pageSize,
      },
      {
        $limit: pageSize,
      },
    ]);

    // Reverse the order on each page
    const reversedOrders = orders.reverse();
    
    console.log(orders);
    if (userData) {
      res.render("order", {
        userData,
        orders: reversedOrders,
        page,
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize),
      });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};





// Order History

const loadOrderHistory = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const orderId = req.params.id;
        const userData = await User.findById(userId);
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

        console.log(order); // Log the order object to check the coupon information

        const coupon = order.coupon; // Fetch coupon information from the order

        // Extract order ID from the order object without re-declaring the variable
        const extractedOrderId = order._id;

        res.render("orderDetails", { userData, order, orderId: extractedOrderId, coupon }); // Pass coupon information to the template
    } catch (error) {
        console.log(error.message);
    }
};







//Order Cancel

const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found', success: false });
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled', success: false });
    }

    if (order.orderStatus === 'Delivered') {
      return res.status(400).json({ message: 'Cannot cancel a delivered order', success: false });
    }

    const currentDate = new Date();
    const orderDate = order.createdAt;
    const daysDifference = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));

    if (daysDifference > 10) {
      return res.status(400).json({ message: 'Cannot cancel an order placed for more than 10 days', success: false });
    }

    if (order.paymentMethod === 'Online Payment') {
      const userId = order.user
      const refundedAmount = order.totalAmount
      const userWallet = await Wallet.findOne({ user: userId });

      if (!userWallet) {
        // Create a new wallet if it doesn't exist
        const newWallet = new Wallet({
          user: userId,
          transaction: [{
            amount: refundedAmount,
            type: 'credit',
          }],
          walletBalance: refundedAmount,
        });
        await newWallet.save();
      } else {
        // Update existing wallet
        userWallet.transaction.push({
          amount: refundedAmount,
          type: 'credit',
        });
        userWallet.walletBalance += refundedAmount;
        await userWallet.save();
      }
    }
      // Add the canceled product quantities back to stock
      for (const item of order.items) {
        const productId = item.product._id;
        const quantity = item.quantity;
      
        // Retrieve the product and update its quantity
        const productData = await Product.findById(productId);
        if (productData) {
          productData.stock += quantity;
          await productData.save();
        }
      }
      
    

    order.status = 'Cancelled';
    await order.save();

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error', success: false });
  }
};


  //Checkout

  const loadCheckout = async (req, res) => {
    try {
    
      const orderId =req.query.orderId;

      if(orderId){
        console.log('afdsfadsfasdfadsf');
        console.log(orderId);
        const currentDate = new Date();
        const userId = req.session.user_id;
        const userData = await User.findById(userId);
        const addressData = await Address.find({ user: userId, is_listed: true });
        const cart =await Order.findById(orderId).populate('items.product')
        console.log('adfasdfadsfadsfadsfadsfds');
        console.log(cart);
        const validCartItems = cart.items;
        const productTotal = cart.totalAmount;
       const coupon = await Coupon.find({
          expiry: { $gt: currentDate },
          is_listed: true,
      }).sort({ createdDate: -1 });

        res.render("checkout", { userData, addressData,  cart: validCartItems, productTotal, subtotalWithShipping:productTotal, coupon, retryTotal:productTotal ,orderId:orderId });

      }else{


      
       
        const userId = req.session.user_id;
        const userData = await User.findById(userId);
        let cart = await Cart.findOne({ user: userId })
            .populate({
                path: "items.product",
                model: "Product",
            })
            .exec();

        if (!cart) {
            console.log("Cart not found");
            // Handle the case where the cart is not found. 
            // You can redirect the user, show a message, or take appropriate action.
            return res.status(404).send("Cart not found");
        }

        const cartItems = cart.items || [];

        // Filter out out-of-stock products
        const validCartItems = await filterOutStock(cartItems);

        // Update the cart with the filtered items
        cart.items = validCartItems;
        cart = await cart.save();
        const subtotal = calculateSubtotal(validCartItems);
        const productTotal = calculateProductTotal(validCartItems);
        const subtotalWithShipping = subtotal;
        const addressData = await Address.find({ user: userId, is_listed: true });
        const currentDate = new Date();
        const coupon = await Coupon.find({
            expiry: { $gt: currentDate },
            is_listed: true,
        }).sort({ createdDate: -1 });

        res.render("checkout", { userData, addressData,  cart: validCartItems, productTotal, subtotalWithShipping, coupon,retryTotal:0,orderId:'' });

      }
    } catch (error) {
        console.log(error.message);
        // Handle other errors appropriately, such as sending an error page or redirecting the user.
        res.status(500).send("Internal Server Error");
    }
};


const filterOutStock = async (cartItems) => {
    const filteredCartItems = [];

    for (const cartItem of cartItems) {
        const product = await Product.findById(cartItem.product._id);

        if (product && product.stock > 0) {
            filteredCartItems.push(cartItem);
        }
    }

    return filteredCartItems;
};



  //checkoutPost
  const checkOutPost = async (req, res) => {
    try {
        const id = req.query.orderId;
        console.log("orderId: " + id);
        console.log('jdjdjdjdjdjdjdjjddjjdjdj');
        if (id) {
          console.log('indiseeeeee');
            const updatedOrder = await Order.findByIdAndUpdate(id, { status: 'success' }, { new: true });
            console.log('Updated Order:');
            console.log(updatedOrder);
        } else {
            console.log('No orderId provided');
            const userId = req.session.user_id;
            const { address, paymentMethod, couponCode, paymentStatus } = req.body;
            const user = await User.findById(userId);
            const orderId = generateRandomNumberWithPrefix();
            const cart = await Cart.findOne({ user: userId })
                .populate({
                    path: "items.product",
                    model: "Product",
                })
                .populate("user");

            if (!user || !cart) {
                return res.status(500).json({ success: false, error: "User or cart not found." });
            }

            if (!address) {
                return res.status(400).json({ error: "Billing address not selected" });
            }

            const cartItems = cart.items || [];
            for (const cartItem of cartItems) {
                const product = cartItem.product;

                await Product.findByIdAndUpdate(product._id, {
                    $inc: { stock: -cartItem.quantity }
                });
                await product.save();
            }

            let totalAmount = cartItems.reduce((acc, item) => {
                if (item.product.stock > 0) {
                    const productPrice = item.product.discount_price && item.product.discountStatus &&
                        new Date(item.product.discountStart) <= new Date() &&
                        new Date(item.product.discountEnd) >= new Date()
                        ? item.product.discount_price
                        : item.product.price;

                    return acc + (productPrice * item.quantity || 0);
                }
                return acc;
            }, 0);

            if (couponCode) {
                totalAmount = await applyCoup(couponCode, totalAmount, userId);
            }

            let order;
            if (paymentMethod === "Wallet") {
                const walletData = await Wallet.findOne({ user: userId });

                if (!walletData) {
                    return res.status(500).json({ success: false, error: "Wallet not found for the user." });
                }

                if (totalAmount <= walletData.walletBalance) {
                    walletData.walletBalance -= totalAmount;
                    walletData.transaction.push({
                        type: "debit",
                        amount: totalAmount,
                    });

                    await walletData.save();

                    order = new Order({
                        user: userId,
                        orderId,
                        address: address,
                        orderDate: new Date(),
                        deliveryDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
                        totalAmount: totalAmount,
                        coupon: couponCode,
                        paymentMethod: paymentMethod,
                        items: cartItems.map((cartItem) => ({
                            product: cartItem.product._id,
                            quantity: cartItem.quantity,
                            size: cartItem.size,
                            price: cartItem.product.discountPrice && cartItem.product.discountStatus &&
                                new Date(cartItem.product.discountStart) <= new Date() &&
                                new Date(cartItem.product.discountEnd) >= new Date()
                                ? cartItem.product.discountPrice
                                : cartItem.product.price,
                            status: "Confirmed",
                            paymentStatus: "success",
                        })),
                    });

                } else {
                    return res.status(500).json({ success: false, error: "Insufficient balance in wallet." });
                }
            } else if (paymentMethod === "onlinePayment") {
                // Simulate online payment processing (replace this with your actual payment processing logic)
                order = new Order({
                    user: userId,
                    orderId,
                    address: address,
                    coupon: couponCode,
                    orderDate: new Date(),
                    deliveryDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
                    totalAmount: req.body.amount,
                    paymentMethod: "Online Payment",
                    status: paymentStatus ? paymentStatus : "pending",
                    items: cartItems.map((cartItem) => ({
                        product: cartItem.product._id,
                        quantity: cartItem.quantity,
                        size: cartItem.size,
                        price: cartItem.product.discount_Price && cartItem.product.discountStatus &&
                            new Date(cartItem.product.discountStart) <= new Date() &&
                            new Date(cartItem.product.discountEnd) >= new Date()
                            ? cartItem.product.discount_Price
                            : cartItem.product.price,
                        status: "Confirmed",
                        paymentStatus: "success",
                    })),
                });
            } else if (paymentMethod === "CashOnDelivery") {
                order = new Order({
                    user: userId,
                    orderId,
                    address: address,
                    orderDate: new Date(),
                    deliveryDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
                    totalAmount: totalAmount,
                    paymentMethod: paymentMethod,
                    coupon: couponCode,
                    items: cartItems.map((cartItem) => ({
                        product: cartItem.product._id,
                        quantity: cartItem.quantity,
                        size: cartItem.size,
                        price: cartItem.product.discount_price || cartItem.product.price,
                        status: "Confirmed",
                        paymentStatus: "Pending",
                    })),
                });
            } else {
                // Payment failed, update the order status to "Payment Pending"
                order = new Order({
                    user: userId,
                    orderId,
                    address: address,
                    orderDate: new Date(),
                    deliveryDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
                    totalAmount: req.body.amount,
                    coupon: couponCode,
                    paymentMethod: paymentMethod,
                    items: cartItems.map((cartItem) => ({
                        product: cartItem.product._id,
                        quantity: cartItem.quantity,
                        size: cartItem.size,
                        price: cartItem.product.discountPrice && cartItem.product.discountStatus &&
                            new Date(cartItem.product.discountStart) <= new Date() &&
                            new Date(cartItem.product.discountEnd) >= new Date()
                            ? cartItem.product.discountPrice
                            : cartItem.product.price,
                        status: "Payment Pending",
                        paymentStatus: "failed",
                    })),
                });
            }

            await order.save();

            // Clearing items and resetting totalAmount
            cart.items = [];
            cart.totalAmount = 0;

            await cart.save(); // Save the updated cart
          }
            return res.json({
                success: true,
                message: "Order placed successfully.",
            });
       
    } catch (error) {
        console.error(error);
        return res.status(400).json({ error: "Invalid payment method or an error occurred while placing the order." });
    }
};




//apply Cpipon


  const applycoupon = async (req, res) => {
    try {
      const { couponCode } = req.body;
      const userId = req.session.user_id;
      const coupon = await Coupon.findOne({ code: couponCode });
  
      let errorMessage;
  
      if (!coupon) {
        errorMessage = "Coupon not found";
        return res.json({ errorMessage });
      }
  
      const currentDate = new Date();
  
      if (coupon.expiry && currentDate > coupon.expiry) {
        errorMessage = "Coupon Expired";
        return res.json({ errorMessage });
      }
  
  
      if (coupon.userUsed.length >= coupon.limit) {
        errorMessage = "Coupon limit Reached";
        return res.json({ errorMessage });
      }
  
      if (coupon.userUsed.includes(userId)) {
        errorMessage = "You already used this coupon";
        return res.json({ errorMessage });
      }
  
      const cart = await Cart.findOne({ user: userId })
        .populate({
          path: "items.product",
          model: "Product",
        })
        .exec();
  
  
      const cartItems = cart.items || [];
      const orderTotal = calculateSubtotal(cartItems);
  
      if (coupon.minAmt>orderTotal) {
        errorMessage = "The amount is less than minimum  amount";
        return res.json({ errorMessage });
      }
  
      let discountedTotal = 0;
  
  
    
        discountedTotal = calculateDiscountedTotal(orderTotal, coupon.discount);
    
      if (coupon.maxAmt<discountedTotal) {
        errorMessage = "The Discount cant be applied. It is beyond maximum  amount";
        return res.json({ errorMessage });
      }
  
      res.status(200).json({ success: true,discountedTotal, message: "return sucessfully" });
      
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ errorMessage: "Internal Server Error" });
    }
  };
   
   // Apply coupon Function
   async function applyCoup(couponCode, discountedTotal, userId) {
     const coupon = await Coupon.findOne({ code: couponCode });
     if (!coupon) {
       return discountedTotal;
     }
     const currentDate = new Date();
     if (currentDate > coupon.expiry) {
       return discountedTotal;
     }
     if (coupon.userUsed.length >= coupon.limit) {
       return discountedTotal;
     }
   
     if (coupon.userUsed.includes(userId)) {
       return discountedTotal;
     }
   
       discountedTotal = calculateDiscountedTotal(
         discountedTotal,
         coupon.discount
       );
     
     coupon.limit--;
     coupon.userUsed.push(userId);
     await coupon.save();
     return discountedTotal;
   };
   
// Razor Pay     
const razorpayOrder = async (req, res) => {
  try {
      const userId = req.session.user_id;
      const { address, paymentMethod, couponCode, totalAfterCouponElement,retryTotal } = req.body;

      const user = await User.findById(userId);

      const cart = await Cart.findOne({ user: userId })
          .populate({
              path: "items.product",
              model: "Product",
          })
          .populate("user");

      if (!user || !cart) {
          return res.status(500).json({ success: false, error: "User or cart not found." });
      }

      if (!address) {
          return res.status(400).json({ error: "Billing address not selected" });
      }

      const cartItems = cart.items || [];
      let totalAmount = 0;

      totalAmount = cartItems.reduce((acc, item) => {
        // Check if item.product is truthy before accessing its properties
        const productPrice = item.product && item.product.discount_price;
    
        // Only add to the accumulator if productPrice is a valid number
        if (typeof productPrice === 'number') {
            acc += productPrice * item.quantity;
        } else {
            // Handle the case where item.product or discount_price is null or not a valid number
            console.error("Invalid cart item:", item);
            // Optionally, remove the invalid item from the cartItems array
            const indexOfInvalidItem = cartItems.indexOf(item);
            cartItems.splice(indexOfInvalidItem, 1);
        }
    
        return acc;
    }, 0);
    
    console.log(`total amount: ${totalAmount}`);
    
      if (couponCode) {
          totalAmount = await applyCoup(couponCode, totalAmount, userId);
      }

      const options = {
          amount: retryTotal>1 ?retryTotal*100 : totalAmount * 100, // Ensure it's at least 100 (or adjust based on the minimum requirement)
          currency: "INR",
          receipt: `order_${Date.now()}`,
          payment_capture: 1,
      };

      console.log("Razorpay Amount:", options.amount);

      instance.orders.create(options, async (err, razorpayOrder) => {
          if (err) {
              console.error("Error creating Razorpay order:", err);
              return res.status(400).json({ success: false, error: "Payment Failed", user });
          } else {
              res.status(201).json({
                  success: true,
                  message: "Order placed successfully.",
                  order: razorpayOrder,
                  
              });
          }
      });
  } catch (error) {
      console.error("An error occurred while placing the order: ", error);
      return res.status(400).json({ success: false, error: "Payment Failed" });
  }
};

  

const userReturn = async(req,res)=>{
  try{
    const orderId = req.query.orderId;
    const order = await Order.findById(orderId).populate({
      path: "items.product",
      model: "Product",
    });
    console.log(orderId)
    order.status = 'Return Requested';
    if (req.query.reason) {
      order.reason = req.query.reason;
    }
    order.save()
    res.redirect(`/orderDetails/${orderId}`);

  }catch(error){
    console.log(error.message)
  }
}

//Return

const returnOrder = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const reason = req.query.reason;

    const order = await Order.findOne({ _id: orderId })
      .populate("user")
      .populate({
        path: "items.product",
        model: "Product",
      });

    if (!order) {
      return res.status(404).send("Order not found");
    }

    const user = order.user;
    let userWallet = await Wallet.findOne({ user: user._id });

    // Create a new wallet if it doesn't exist for the user
    if (!userWallet) {
      userWallet = new Wallet({
        user: user._id,
        walletBalance: 0, // Set an initial wallet balance if needed
        transaction: [], // Set an initial empty array for transactions
      });
    }

    const refundedAmount = order.totalAmount;

    // Create a new transaction for the wallet refund
    const transactionCredit = new Transaction({
      user: user._id,
      amount: refundedAmount,
      type: "credit",
      paymentMethod: order.paymentMethod,
      orderId: order._id,
      description: `Refunded to wallet for returned order`,
    });

    await transactionCredit.save();

    // Update the user's wallet balance
    userWallet.transaction.push({
      amount: refundedAmount,
      type: 'credit',
    });

    // Update the wallet balance
    userWallet.walletBalance += refundedAmount;

    // Save the changes to the database
    await userWallet.save();

    // Add the returned product quantities back to stock
    for (const item of order.items) {
      const productId = item.product._id;
      const orderedQuantity = item.quantity;
      const product = await Product.findById(productId);

      if (product) {
        product.stock += orderedQuantity;
        await product.save();
      }
    }

    order.status = "Return Successful";
    order.paymentStatus = "Refunded";
    await order.save();

    res.redirect(`/admin/orderDetails?orderId=${orderId}`);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: 'Internal server error', success: false });
  }
};




 
module.exports ={
    loadOrderDetails,
    loadOrderHistory,
    cancelOrder,
    loadCheckout,
    checkOutPost,
    applycoupon,
    razorpayOrder,
    returnOrder,
    userReturn,
    
}