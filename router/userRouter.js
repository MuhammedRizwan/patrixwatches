const express = require('express');
const user_route = express();
const session=require('express-session');
const userController = require('../controller/userController');
const cartController = require('../controller/cartController');
const addressController=require('../controller/addressController');
const orderController=require('../controller/orderCondroller');
const productController=require('../controller/productController');
const couponController=require('../controller/couponController');
const wishlistController=require('../controller/wishListController');
const {isUser,guestUser,isLoggedUser} = require('../middleware/auth');
const errorHandler=require('../middleware/errorHandler');
user_route.set('views', './views/userView');

user_route.use(errorHandler)
user_route.use(session({
    secret: 'your-secret-key', // Change this to a long, random string
    resave: false,
    saveUninitialized: true
}));

// user route configurations
user_route.get('/',guestUser,userController.Home); // Home route  (accessible to all)
user_route.get('/login',isLoggedUser, userController.userLoginPage); // Login page accessible only if logged out
user_route.post('/login',isLoggedUser, userController.userLogin); // User login endpoint;
user_route.get('/verifyEmail',isLoggedUser,userController.verifyEmailPage);//getting verify email that email exist 
user_route.post('/verifyEmail',isLoggedUser,userController.verifyEmail);//check the email

user_route.get('/register',isLoggedUser, userController.userRegisterPage); // Register page accessible only if logged out
user_route.post('/register',isLoggedUser, userController.userRegister); // User registration endpoint
user_route.post('/verification',isLoggedUser, userController.verifyOtp); // Verify OTP accessible only if logged in
user_route.post('/resendOtp',isLoggedUser, userController.resendOtp); // Resend OTP accessible only if logged 
user_route.get('/account',isUser,guestUser,userController.account);
user_route.get('/changePassword',isUser,guestUser,userController.changePasswordPage);
user_route.post('/changepassword',isUser,guestUser,userController.changePassword);
user_route.post('/Forgetverification',userController.forgetOtpVerification);
user_route.post('/newPassword',userController.newPasswordverify);
user_route.get('/editProfile',isUser,guestUser,userController.editProfilePage);
user_route.post('/editProfile',isUser,guestUser,userController.editProfile);

//product
user_route.get('/productShop',guestUser, productController.productShop); 
user_route.get('/Shop',guestUser,productController.Shop);

//cart 
user_route.get('/cartlist', isUser,guestUser, cartController.cartPage);
user_route.post('/addcart',isUser,guestUser, cartController.addCart);
user_route.post('/qtyInc',isUser,guestUser,cartController.addQuantity);
user_route.post('/qtyDec',isUser,guestUser,cartController.subQuantity);
user_route.get('/addToCart',guestUser,cartController.addCartIcon);
user_route.delete('/delete-cartItem',isUser,guestUser,cartController.deleteCartItem);
user_route.get('/checkout',isUser,guestUser,cartController.checkOut);

//address
user_route.get('/addAddress',isUser,guestUser,addressController.addAddressPage)
user_route.post('/addAddress',isUser,guestUser,addressController.addAddress);
user_route.get('/editAddress',isUser,guestUser,addressController.loadEditAddress);
user_route.post('/editAdrdress',isUser,guestUser,addressController.editAddress);
user_route.put('/deleteAddress',isUser,guestUser,addressController.deletAddress);


// order
user_route.post('/orderComplete',isUser,guestUser,orderController.orderComplete);
user_route.get('/singleOrderDetials/:orderId',isUser,guestUser,orderController.singleOrderDetials);
user_route.get('/orderSuccesspage',isUser,guestUser,orderController.orderSuccessPage);
user_route.get('/orderDetials',isUser,guestUser,orderController.orderDetials);
user_route.put('/cancelSingleProduct',isUser,guestUser,orderController.cancelSingleProduct);
user_route.post('/razorOrderComplete',isUser,guestUser,orderController.razorOrderComplete);
user_route.put('/returnSingleProduct',isUser,guestUser,orderController.returnSingleProduct);
user_route.get('/walletTransactions',isUser,guestUser,userController.walletTransaction);
user_route.get('/Orderpayment',isUser,guestUser,orderController.PaymentOrderPage);
user_route.post('/paymentOrder',isUser,guestUser,orderController.paymentOrder);
user_route.get('/Invoice',isUser,guestUser,orderController.saveInvoice);

user_route.post('/applyCoupon',isUser,guestUser,couponController.applyCoupon);

user_route.get('/wishList',isUser,guestUser,wishlistController.wishListPage);
user_route.get('/addToWishlist',guestUser,wishlistController.addToWishList);
user_route.delete('/delete-wishitem',isUser,guestUser,wishlistController.deleteWishItem);




user_route.get('/logout',isUser,userController.userLogout); // Logout endpoint accessible only if logged in

module.exports = user_route;


