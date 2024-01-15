const express = require('express');
const admin_route = express();
const adminController = require('../controller/adminController');
const productController = require('../controller/productController');
const categoryController = require('../controller/categoryController');
const orderController=require('../controller/orderCondroller')
const adminAuth = require('../middleware/adminAuth');
const upload = require('../config/multer')

admin_route.set('views', './views/adminView');
//  admin route configurations with session control
admin_route.get('/',adminController.adminLoginPage); // Admin login page accessible only if logged out
admin_route.post('/log', adminController.adminLogin); // Admin login endpoint
admin_route.get('/home', adminAuth, adminController.Dashboard); // Admin dashboard accessible only if logged in
admin_route.get('/user', adminAuth, adminController.userList); // User list accessible only if logged in
admin_route.get('/logout', adminAuth, adminController.Logout); // Logout endpoint accessible only if logged in

// Other admin routes - you can apply session control as needed
// admin_route.get('/new-user', isAdminLoggedIn, adminController.newUserPage);
// admin_route.post('/new-user', upload.single('image'), isAdminLoggedIn, adminController.newUser);
// admin_route.get('/edit-user', isAdminLoggedIn, adminController.editUserPage);
// admin_route.post('/edit-user', isAdminLoggedIn, adminController.editUser);
admin_route.delete('/delete/:userId', adminAuth, adminController.deleteUser);
admin_route.put('/block-user', adminAuth, adminController.blockUser);
admin_route.put('/Unblock-user', adminAuth, adminController.unblockUser);

// Product-related admin routes
admin_route.get('/productList', adminAuth, productController.productListLoad);
admin_route.get('/addproduct', adminAuth, productController.addProductPage);
admin_route.post('/addproduct', upload.array("files", 6), productController.addProduct);
admin_route.get('/editProduct', adminAuth, productController.editProductPage);
admin_route.post('/editProduct', upload.array("files", 4), productController.editProduct);
admin_route.delete('/deleteproduct/:productId', adminAuth, productController.deleteProduct);
admin_route.delete('/deleteImg/:productImg/:productId', adminAuth, productController.deleteProductImage);


admin_route.get('/categoryList', adminAuth, categoryController.category);
admin_route.put('/List-category', adminAuth, categoryController.listCategory);
admin_route.put('/UnList-category', adminAuth, categoryController.unListCategory);
admin_route.get('/addCategory', adminAuth, categoryController.addCategoryPage);
admin_route.post('/addCategory', categoryController.addCategory);
admin_route.get('/edit', adminAuth, categoryController.editCategoryPage);
admin_route.post('/edit', categoryController.editCategory);
admin_route.get('/delete', adminAuth, categoryController.deleteCategory);

admin_route.get('/orderPage',adminAuth,orderController.adminOrderPage);
admin_route.get('/orderDetials',adminAuth,orderController.adminOrderDetails);
admin_route.get('/cancelOrder/:orderId/:productId',adminAuth,orderController.cancelOrder);

module.exports = admin_route;