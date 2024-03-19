const express = require('express');
const admin_route = express();
const adminController = require('../controller/adminController');
const productController = require('../controller/productController');
const categoryController = require('../controller/categoryController');
const orderController = require('../controller/orderCondroller');
const couponController=require('../controller/couponController');
const offerController=require('../controller/offerController');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../config/multer');

admin_route.set('views', './views/adminView');

admin_route.use(session({
    secret: 'your-secret-key', // Change this to a long, random string
    resave: false,
    saveUninitialized: true
}));
//  admin route configurations with session control
admin_route.get('/', adminController.adminLoginPage); // Admin login page accessible only if logged out
admin_route.post('/log', adminController.adminLogin); // Admin login endpoint
admin_route.get('/home', adminAuth, adminController.Dashboard); // Admin dashboard accessible only if logged in
admin_route.get('/user', adminAuth, adminController.userList); // User list accessible only if logged in
admin_route.get('/logout', adminAuth, adminController.Logout); // Logout endpoint accessible only if logged in
admin_route.put('/Block-user', adminAuth, adminController.blockUser);
admin_route.put('/Unblock-user', adminAuth, adminController.unblockUser);

// Product-related admin routes
admin_route.get('/productList', adminAuth, productController.productListLoad);
admin_route.get('/addproduct', adminAuth, productController.addProductPage);
admin_route.post('/addproduct', upload.array("files", 6), productController.addProduct);
admin_route.get('/editProduct', adminAuth, productController.editProductPage);
admin_route.post('/editProduct', upload.array("files", 4), productController.editProduct);
admin_route.delete('/deleteImg/:productImg/:productId', adminAuth, productController.deleteProductImage);
admin_route.put('/Block-product/:productId', adminAuth, productController.blockProduct);
admin_route.put('/Unblock-product/:productId', adminAuth, productController.unBlockProduct);

//category
admin_route.get('/categoryList', adminAuth, categoryController.category);
admin_route.put('/List-category', adminAuth, categoryController.listCategory);
admin_route.put('/UnList-category', adminAuth, categoryController.unListCategory);
admin_route.get('/addCategory', adminAuth, categoryController.addCategoryPage);
admin_route.post('/addCategory', categoryController.addCategory);
admin_route.get('/edit', adminAuth, categoryController.editCategoryPage);
admin_route.post('/edit', categoryController.editCategory);


admin_route.get('/orderPage', adminAuth, orderController.adminOrderPage);
admin_route.get('/orderDetials', adminAuth, orderController.adminOrderDetails);
admin_route.get('/saveInvoice',adminAuth,orderController.saveInvoice)
admin_route.put('/changeOrderStatus',adminAuth,orderController.changeOrderStatus);
admin_route.put('/cancelOrder',adminAuth,orderController.adminCancelOrder)
admin_route.get('/saleReport',adminAuth,orderController.saleReportPage);
admin_route.get('/selectedReport',adminAuth,orderController.saleReport);
admin_route.get('/downloadPdf',orderController.downloadPdf);
admin_route.get('/downloadExel',orderController.downloadExcel);
admin_route.get('/sales-chart',orderController.saleschart);
admin_route.get('/sales-data',orderController.saleChart);



admin_route.get('/offerList',adminAuth,offerController.offerList);
admin_route.get('/addOffer',adminAuth,offerController.addOfferPage);
admin_route.get('/findData',adminAuth,offerController.findData);
admin_route.post('/addOffer',adminAuth,offerController.addOffer);
admin_route.put('/List-offer',adminAuth,offerController.listOffer);
admin_route.put('/unList-offer',adminAuth,offerController.unListOffer);


admin_route.get('/couponList',adminAuth,couponController.viewCoupon);
admin_route.get('/addCoupon',adminAuth,couponController.addcouponPage);
admin_route.post('/addCoupon',adminAuth,couponController.addCoupon);
admin_route.put('/listCoupon',adminAuth,couponController.listnUnlistCoupon);



module.exports = admin_route;