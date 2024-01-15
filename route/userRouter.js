const express = require('express');
const user_route = express();
const userController = require('../controller/userController');
const cartController = require('../controller/cartController');
const addressController=require('../controller/addressController')
const orderController=require('../controller/orderCondroller')
const auth = require('../middleware/auth');
user_route.set('views', './views/userView');



// user route configurations
user_route.get('/', userController.Home); // Home route  (accessible to all)
user_route.get('/login', userController.userLoginPage); // Login page accessible only if logged out
user_route.post('/login', userController.userLogin); // User login endpoint
user_route.get('/register', userController.userRegisterPage); // Register page accessible only if logged out
user_route.post('/register', userController.userRegister); // User registration endpoint
user_route.post('/verification', userController.verifyOtp); // Verify OTP accessible only if logged in
user_route.post('/resendOtp', userController.resendOtp); // Resend OTP accessible only if logged in
user_route.get('/productShop', userController.productShop); // Product shop (accessible to all)
user_route.get('/account',auth,userController.account);
user_route.get('/changePassword',auth,userController.changePasswordPage);
user_route.post('/changepassword',auth,userController.changePassword)



user_route.get('/cartlist', auth, cartController.cartPage);
user_route.post('/addcart',auth, cartController.addCart);
user_route.post('/qtyInc',auth,cartController.addQuantity);
user_route.post('/qtyDec',auth,cartController.subQuantity);
user_route.get('/addToCart',auth,cartController.addCartIcon);
user_route.delete('/delete-cartItem',auth,cartController.deleteCartItem);
user_route.get('/checkout',auth,cartController.checkOut);

user_route.get('/addAddress',auth,addressController.addAddressPage)
user_route.post('/addAddress',auth,addressController.addAddress);
user_route.get('/editAddress',auth,addressController.loadEditAddress);
user_route.post('/editAdrdress',auth,addressController.editAddress);
user_route.delete('/deleteAddress',auth,addressController.deletAddress);

user_route.post('/orderComplete',auth,orderController.orderComplete);
user_route.get('/cancelOrder/:orderId/:productId',auth,orderController.cancelOrder);


user_route.get('/logout', auth, userController.userLogout); // Logout endpoint accessible only if logged in

module.exports = user_route;


