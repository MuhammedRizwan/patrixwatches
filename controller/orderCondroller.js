const User = require('../model/userModel');
const Product = require('../model/productModel');
const Category = require('../model/categoryModel');
const Address = require('../model/addressModel');
const Cart=require('../model/cartModel');
const Order=require('../model/orderModel')
const orderComplete = async (req, res) => {
    try {
        console.log(req.body)
      const { paymentOption, addressId, totalAmount } = req.body;
  
      req.user.OrderData= { paymentOption, addressId };
  
      const user_id = req.user.user._id;  
      const cartData = await Cart.findOne({ user_id: user_id }, { cartItems: 1, _id: 0 });
      const totalPrice =cartData.cartItems.reduce((total, item) => {
        const numericPrice = parseFloat(item.price);
        return isNaN(numericPrice) ? total : total + numericPrice * item.quantity;
      }, 0);
      const products = cartData.cartItems.map((item) => ({
        product: item.product_id,
        quantity: item.quantity,
        price: item.quantity * item.price,
        status: "confirmed",
      }));
      if(paymentOption==='cod'){
        const order = new Order({
            id:Math.floor(1000 + Math.random() * 9000),
            user: user_id,
            products,
            payment:paymentOption,
            address: addressId,
            totalPrice:totalPrice,
            status: "pending",
          });
          const orderData=await order.save();
          return res.status(200).json({success:true,message:"order Placed successfully"});
      }
      else{
        return res.status(400).json({success:false,message:"change payment Option in to Cash On Delivery "});
      }
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };

  

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
        res.status(200).json({success:true});
    } else {
       res.status(400).json({success:false});
    }
    } catch (error) {
      console.error(error.message);
      return res.status(500).send("Internal Server Error");
    }
  };

  const adminOrderPage= async (req, res) => {
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
            user:users,
            order:orders
          });
        } catch (error) {
          return res.status(500).send("Internal Server Error. Please try again later.");
        }
      };

    
  const adminOrderDetails = async (req, res) => {
    try {
      const orderId = req.query.id;
      const user_id = req.user.user._id;
      
      //const categoryData = await Category.find({ is_active: false });
      const userData = await User.findById(user_id);
      // Populate the products field with the details from the Products collection
      const orderData = await Order.findOne({ _id: orderId });
      // Check if orderData is null or undefined before accessing its properties
      if (!orderData) {
        console.error("Order not found");
        return res.status(404).send("Order not found");
      }
      const addressData=await Address.find({userId:user_id,addressType:"BillingAddress"});
      console.log(addressData);
      // Iterate over the products array to access the populated "product" field
        const product = await Promise.all(orderData.products.map(async (data) => {
          const productData = await Product.findOne({ _id: data.product });
          return {
              product: productData.productName,
              image: productData.image[0].filename,
              quantity: data.quantity, // Assuming you want the quantity from the orderData
              price: productData.salePrice,
              totalPrice: data.quantity * productData.salePrice
          };
      }));
      
    console.log(product);
      return res.render("orderDetials", {
        user: userData,
        order: orderData.toObject(),
        product: product,
        address:addressData
      });
    } catch (error) {
      return res.status(500).send("Internal Server Error. Please try again later.");
    }
  };

module.exports={
    orderComplete ,
    cancelOrder,
    adminOrderPage,
    adminOrderDetails
}
  
  


  
//   const adminCancelOrder = async (req, res) => {
//     try {
//       const orderId = req.params.orderId;
//       const pId = req.params.pId;
  
//       const updatedOrder = await Order.updateOne(
//         { _id: orderId, "products.product": pId },
//         { $set: { "products.$[elem].status": "Cancelled" } },
//         { arrayFilters: [{ "elem.product": pId }] }
//       );
  
//       if (updatedOrder) {
//         res.status(200).redirect(/admin/order-details?id=${orderId});
//       }
//     } catch (error) {
//       res.status(500).send("Internal Server Error. Please try again later.");
//     }
//   };
