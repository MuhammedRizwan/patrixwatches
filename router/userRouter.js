const express = require('express');
const user_route = express();
const userController = require('../controller/userController');
const cartController = require('../controller/cartController');
const addressController=require('../controller/addressController');
const orderController=require('../controller/orderCondroller');
const productController=require('../controller/productController')
const auth = require('../middleware/auth');
user_route.set('views', './views/userView');



// user route configurations
user_route.get('/', userController.Home); // Home route  (accessible to all)
user_route.get('/login', userController.userLoginPage); // Login page accessible only if logged out
user_route.post('/login', userController.userLogin); // User login endpoint;
user_route.get('/verifyEmail',userController.verifyEmailPage);//getting verify email that email exist 
user_route.post('/verifyEmail',userController.verifyEmail);//check the email

user_route.get('/register', userController.userRegisterPage); // Register page accessible only if logged out
user_route.post('/register', userController.userRegister); // User registration endpoint
user_route.post('/verification', userController.verifyOtp); // Verify OTP accessible only if logged in
user_route.post('/resendOtp', userController.resendOtp); // Resend OTP accessible only if logged 
user_route.get('/account',auth,userController.account);
user_route.get('/changePassword',auth,userController.changePasswordPage);
user_route.post('/changepassword',auth,userController.changePassword);
user_route.post('/Forgetverification',userController.forgetOtpVerification);
user_route.post('/newPassword',userController.newPasswordverify);

//product
user_route.get('/productShop', productController.productShop); 
user_route.get('/Shop',productController.Shop);

//cart 
user_route.get('/cartlist', auth, cartController.cartPage);
user_route.post('/addcart',auth, cartController.addCart);
user_route.post('/qtyInc',auth,cartController.addQuantity);
user_route.post('/qtyDec',auth,cartController.subQuantity);
user_route.get('/addToCart',auth,cartController.addCartIcon);
user_route.delete('/delete-cartItem',auth,cartController.deleteCartItem);
user_route.get('/checkout',auth,cartController.checkOut);

//address
user_route.get('/addAddress',auth,addressController.addAddressPage)
user_route.post('/addAddress',auth,addressController.addAddress);
user_route.get('/editAddress',auth,addressController.loadEditAddress);
user_route.post('/editAdrdress',auth,addressController.editAddress);
user_route.delete('/deleteAddress',auth,addressController.deletAddress);


// order
user_route.post('/orderComplete',auth,orderController.orderComplete);
user_route.get('/cancelOrder/:orderId/:productId',auth,orderController.cancelOrder);
user_route.get('/payment',auth,orderController.paymentPage);
user_route.post('/paymentSection',auth,orderController.PaymentSection);

user_route.get('/logout', auth, userController.userLogout); // Logout endpoint accessible only if logged in

module.exports = user_route;


