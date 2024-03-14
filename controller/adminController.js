const { User } = require('../model/userModel');
const Order=require('../model/orderModel');
const Product=require('../model/productModel');
const Category=require('../model/categoryModel');
const argon=require('argon2')
const jwt = require('jsonwebtoken');
// const { default: products } = require('razorpay/dist/types/products');

const genarateToken = (user) => {

    return jwt.sign({ user }, process.env.SECRETKEY, { expiresIn: '2h' })
}
const adminLoginPage = async (req, res,next) => {
    try {
        return res.status(200).render('adminLogin');
    } catch (error) {
    next(error.message)
    }
}

const adminLogin = async (req, res,next) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const adminData = await User.aggregate([
            {
                $match: { email: email }
            },
            {
                $limit: 1
            }
        ])
        if (adminData.length > 0) {
            const matchPassword = await argon.verify(password, adminData[0].password);
            if (matchPassword) {
                if (adminData[0].is_admin === 0) {
                    return res.status(404).render('adminLogin', { message: "your are not a admin" })
                } else {
                    const token = genarateToken(adminData[0]);
                    const options = {
                        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                        httpOnly: true
                    }
                    return res.status(200).cookie("token", token, options).redirect('/admin/home');
                }
            }
            else {
                return res.status(404).render('adminLogin', { message: "invalid password" })
            }
        } else {
            return res.status(404).render('adminLogin', { message: "invalid Email" })
        }

    } catch (error) {
        next(error.message)
    }
}
const Dashboard = async (req, res,next) => {
    try {
        const userData = await User.find({ is_admin: 0 });
        const countOrders=await Order.countDocuments()
        const countProduct=await Product.countDocuments()
        const countCategory=await Category.countDocuments()
        const total=await Order.find({paymentStatus:"Paid"})
        let totalRevenue=[];
        const totalPrice=total.forEach(element => {
            totalRevenue.push(element.totalPrice);
        });
        return res.status(200).render('adminDashboard', { users: userData ,countOrders,countProduct,countCategory,totalRevenue});
    } catch (error) {
        next(error.message)
    }
}
const userList = async (req, res,next) => {
    try {
        const PAGE_SIZE = 10;
        const { user, page } = req.query;
        const pageNumber = parseInt(page) || 1;
    
            const totalUsers = await User.countDocuments({ name: { $regex: user || '', $options: 'i' }, is_admin: 0 });
            const totalPages = Math.ceil(totalUsers / PAGE_SIZE);
    
            const users = await User.find({ name: { $regex: user || '', $options: 'i' }, is_admin: 0 })
                .skip((pageNumber - 1) * PAGE_SIZE)
                .limit(PAGE_SIZE);
            return res.status(200).render('user', { users: users, totalPages: totalPages, currentPage: pageNumber });
    } catch (error) {
        next(error.message)
    }
}
const Logout = async (req, res,next) => {
    try {
        return res.clearCookie("token").redirect('/admin');
    } catch (error) {
        next(error.message)
    }
}
const blockUser = async (req, res,next) => {
    try {
        const userId = req.body.userId; // Assuming you send the user ID in the request body
        const userData = await User.findByIdAndUpdate(userId, { is_block: true });
        if (!userData) {
            return res.status(404).json({ error: true, message: "somthing error occured" }); // Inform if the user was not found
        } else {
            return res.status(200).json({ success: true, message: 'User blocked successfully',userData });
        }
    } catch (error) {
        next(error.message)
    }
};

const unblockUser = async (req, res,next) => {
    try {
        const userId = req.body.userId;
        const userData = await User.findByIdAndUpdate(userId, { is_block: false });
        if (!userData) {
            return res.status(404).send('User not found');
        } else {
            return res.status(200).json({ success: true, message: 'User Unblocked successfully', userData});
        }

    } catch (error) {
        next(error.message)
    }
};

const userSearch=async(req,res,next)=>{
    try {
        console.log(req.query);
        const { user } = req.query;
        const users = await User.find({ name: { $regex: user, $options: 'i' },is_admin:0 });
        console.log(users);
        res.status(200).json(users);
    } catch (error) {
        next(error.message)

    }
}
module.exports = {
    adminLoginPage,
    adminLogin,
    Dashboard,
    userList,
    Logout,
    blockUser,
    unblockUser,
    userSearch
}

