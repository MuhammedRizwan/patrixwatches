const mongoose = require('mongoose');
const { User, Otp } = require('../model/userModel');
const Product = require('../model/productModel');
const Category = require('../model/categoryModel');
const Address = require('../model/addressModel');
const Order = require('../model/orderModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const otp = require('../util/genarateOtp');
const sendEmail = require('../util/sendEmail');

const securePassword = async (password) => {
    try {
        const hashPassword = await bcrypt.hash(password, 10);
        return hashPassword

    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error');
    }

}

const genarateToken = (user) => {
    return jwt.sign({ user }, process.env.SECRETKEY, { expiresIn: 2 * 60 * 60 * 1000 })
}
const Home = async (req, res) => {
    try {
        const loggedIn = req.cookies.token ? true : false;
        const categoryData = await Category.find({ is_unList: false }, { _id: 1 });
        const categoryIds = categoryData.map(category => category._id);
        const productData = await Product.find({ category_id: { $in: categoryIds },is_blocked:false });
        return res.status(200).render('Home', { product: productData, category: categoryData, loggedIn });
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error');
    }
}
const userRegisterPage = async (req, res) => {
    try {
        const loggedIn = req.cookies.token ? true : false;
        return res.render('userRegister', { loggedIn })
    } catch (error) {
        console.log(error.message)
    }
}
let tempUser;
const userRegister = async (req, res) => {
    try {
        const loggedIn = req.cookies.token ? true : false;
        const emailExist = await User.aggregate([
            {
                $match: { email: req.body.email }
            },
            {
                $limit: 1
            }
        ]);
        if (emailExist.length > 0) {
            return res.status(400).render('userRegister', { message: "Email Already Exists", loggedIn });
        }
        const { name, email, phone, password } = req.body;
        const sPassword = await securePassword(password);
        tempUser = { name, email, phone, password: sPassword };
        const clearOtp = await Otp.deleteOne({ email: email });
        await otp(req.body.email);
        const otpData = await Otp.aggregate([
            {
                $match: { email: req.body.email }
            },
            {
                $limit: 1
            }
        ]);
        const sendEmaildata = await sendEmail(req.body.name, req.body.email, otpData[0].otp);
        return res.status(200).render('verification', { loggedIn });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}
const verifyOtp = async (req, res) => {
    try {
        const loggedIn = req.cookies.token ? true : false;
        const userotp = req.body.otp;
        const { name, email, phone, password } = tempUser;
        const otpData = await Otp.aggregate([
            {
                $match: { email: email }
            }, {
                $limit: 1
            }
        ]);
        if (!otpData) {
            return res.status(400).render('verification', { message: 'OTP Is Expired', loggedIn })
        } else {
            if (userotp === otpData[0].otp) {
                const userData = new User({
                    name: name,
                    email: email,
                    phone: phone,
                    password: password,
                    is_verified: 1,
                    is_admin: 0,
                })
                const user = await userData.save()
                if (user) {
                    user.password = undefined
                    const token = genarateToken(user);
                    const options = {
                        expires: new Date(Date.now() + 60 * 60 * 1000),
                        httpOnly: true
                    }
                    return res.status(201).cookie("token", token, options).redirect('/');
                }
            } else {
                return res.status(400).render('verification', { message: 'OTP Is Not Matching', loggedIn });
            }
        }

    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error');

    }
}
const userLoginPage = async (req, res) => {
    try {
        const loggedIn = req.cookies.token ? true : false;
        return res.status(200).render('userLogin', { loggedIn });
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error');
    }
}
const userLogin = async (req, res) => {
    try {
        const loggedIn = req.cookies.token ? true : false;
        const { email, password } = req.body;
        const userData = await User.aggregate([
            { $match: { email: email } },
            { $limit: 1 }
        ]);
        if (userData.length > 0) {
            const passwordMatch = await bcrypt.compare(password, userData[0].password)
            if (passwordMatch) {
                if (userData[0].is_block === false) {
                    userData[0].password = undefined;
                    const token = genarateToken(userData);
                    const options = {
                        expires: new Date(Date.now() + 2 * 60 * 60 * 1000),
                        httpOnly: true
                    }
                    return res.status(200).cookie("token", token, options).redirect('/');
                } else {
                    return res.status(403).render('userLogin', { message: 'You are blocked', loggedIn }); // 403: Forbidden
                }
            } else {
                return res.status(401).render('userLogin', { message: 'Incorrect password', loggedIn }); // 401: Unauthorized
            }
        } else {
            return res.status(404).render('userLogin', { message: 'Incorrect email', loggedIn }); // 404: Not Found
        }
    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Internal Server Error'); // 500: Internal Server Error
    }
}
const resendOtp = async (req, res) => {
    try {
        const loggedIn = req.cookies.token ? true : false;
        const { name, email } = tempUser;
        const deleteExistOtp = await Otp.deleteOne({ email: email });
        await otp(email);
        const otpData = await Otp.aggregate([
            {
                $match: { email: email }
            }
        ])
        const sendEmaildata = await sendEmail(name, email, otpData.otp);
        return res.status(200).render('verification', { loggedIn })
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
}
const account = async (req, res) => {
    try {
        const loggedIn = req.user ? true : false;
        const userId = req.user.user[0]._id;
        const userData = await User.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(userId) }
            },
            {
                $limit: 1
            }
        ]);
        if (!userData || userData.length === 0) {
            return res.status(404).render('account', { Address: [], loggedIn, user: [], order: [] })
        }
        const addressData = await Address.aggregate([
            {
                $match: { userId: new mongoose.Types.ObjectId(userId) }
            },
            {
                $limit: 1
            }
        ]);
        const orderData = await Order.aggregate([
            {
                $match: { user: new mongoose.Types.ObjectId(userId) }
            },
            {
                $limit: 1
            }
        ])
        if (orderData.length === 0) {
            return res.status(200).render('account', { Address: addressData, loggedIn, user: userData[0], order: [] });
        } else {

            const orderProduct = await Promise.all(orderData.products.map(async (products) => {
                const productData = await Product.aggregate([
                    {
                        $match: { _id: products.product }
                    }
                ]);
                return {
                    id: orderData._id,
                    productId: products.product,
                    OrderId: orderData.id,
                    productName: productData.productName,
                    quantity: products.quantity,
                    productStatus: products.status,
                    createdOn: orderData.createdOn,
                    totalPrice: productData.salePrice * products.quantity,
                    paymentStatus: orderData.status,
                    paymentMethod: orderData.payment,
                };
            }));
            return res.status(200).render('account', { Address: addressData, loggedIn, user: userData, order: orderProduct });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json("internal Server Error");
    }
}
const userLogout = async (req, res) => {
    try {

        return res.clearCookie("token").redirect('/');
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}
const changePasswordPage = async (req, res) => {
    try {
        const loggedIn = req.user ? true : false;
        return res.status(200).render('changePassword', { loggedIn });
    } catch (error) {
        return res.status(500).jason({ success: false, error: "internal server error" })
    }
}
const changePassword = async (req, res) => {
    try {
        const loggedIn = req.user ? true : false;
        const { password, npassword } = req.body;
        const userId = req.user.user[0]._id;
        const userData = await User.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(userId) }
            },
            {
                $project: { password: 1, _id: 0 }
            }
        ]);
        if (!userData) {
            return res.status(400).json({ success: false, error: "User Not Found" });
        } else {
            const matchPassword = await bcrypt.compare(password, userData[0].password)
            if (!matchPassword) {
                return res.status(400).render('changePassword', { loggedIn, message: "current Password Doesnot Match Try Again" });
            } else {
                const sPassword = await securePassword(npassword);
                if (!sPassword) {
                    return res.status(400).json({ success: false, message: "hash password didn't work" })
                } else {
                    const updatePassword = await User.updateOne({ _id: req.user.user._id }, { $set: { password: sPassword } }, { new: true });
                    if (!updatePassword) {
                        return res.status(404).json({ success: false, error: "something went wrong" });
                    } else {
                        return res.status(200).redirect('/account');
                    }
                }
            }
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error');
    }
}

const verifyEmailPage = async (req, res) => {
    try {
        const loggedIn = req.user ? true : false;
        return res.status(200).render('email-verified', { loggedIn })
    } catch (error) {
        return res.status(500).send('Internal Server Error');
    }
}
let emailOtpverify;
const verifyEmail = async (req, res) => {
    try {
        const loggedIn = req.user ? true : false;
        const { email } = req.body;
        emailOtpverify = email;
        const userData = await User.aggregate([{
            $match: { email: email }
        },
        {
            $limit: 1
        }
        ])
        await otp(email);
        const otpData = await Otp.aggregate([
            {
                $match: { email: email }
            },
            {
                $limit: 1
            }
        ])
        const sendEmaildata = await sendEmail(userData[0].name, email, otpData[0].otp);
        if (!userData) {
            return res.status(404).render('email-verified', { message: "User not found " });
        } else {
            return res.status(200).render("forgetOtpVerification", { loggedIn });
        }
    } catch (error) {
        return res.status(500).send('Internal Server Error');
    }
}
const forgetOtpVerification = async (req, res) => {
    try {
        const loggedIn = req.user ? true : false;
        const userotp = req.body.otp;
        const otpData = await Otp.aggregate([
            {
                $match: { email: emailOtpverify }
            }
        ])
        if (!otpData) {
            return res.status(400).render('forgetOtpVerification', { message: 'OTP Is Expired ', loggedIn })
        } else {
            if (userotp === otpData[0].otp) {
                return res.status(200).render('newPassword', { loggedIn });
            } else {
                return res.status(400).render('forgetOtpVerification', { message: 'incorrect OTP', loggedIn })
            }
        }
    } catch (error) {
        return res.status(500).send('Internal Server Error');
    }
}
const newPasswordverify = async (req, res) => {
    try {
        const newPassword = req.body.npassword;
        const sPassword = await securePassword(newPassword);

        if (!sPassword) {
            return res.status(400).json({ success: false, message: "hash password didn't work" })
        } else {
            const updatePassword = await User.updateOne({ email: emailOtpverify }, { $set: { password: sPassword } }, { new: true });
            if (!updatePassword) {
                return res.status(404).json({ success: false, error: "something went wrong" });
            } else {
                return res.status(200).redirect('/login');
            }
        }
    } catch (error) {
        return res.status(500).send('Internal Server Error');
    }
}
module.exports = {
    Home,
    userLoginPage,
    userLogin,
    userRegisterPage,
    userRegister,
    verifyOtp,
    resendOtp,
    userLogout,
    account,
    changePasswordPage,
    changePassword,
    verifyEmailPage,
    verifyEmail,
    forgetOtpVerification,
    newPasswordverify,
}
