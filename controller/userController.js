require("dotenv").config({ path: ".env" });
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
        const productData = await Product.find({}).limit(8);
        const categoryData = await Category.find({ is_unList: { $ne: true } });
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
        const emailExist = await User.findOne({ email: req.body.email });
        if (!emailExist) {
            const sPassword = await securePassword(req.body.password);
            tempUser = {
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                password: sPassword,
            }
            const options = {
                expires: new Date(Date.now() + 60 * 1000),
                httpOnly: true
            }
            await otp(req.body.email);
            const otpData = await Otp.findOne({ email: req.body.email });
            const sendEmaildata = await sendEmail(req.body.name, req.body.email, otpData.otp);
            return res.status(200).render('verification', { loggedIn });
        } else {
            res.status(400).render('userRegister', { message: "Email Already Exists", loggedIn })
        }
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
        const otpData = await Otp.findOne({ email: email });
        if (!otpData) {
            return res.status(400).render('verification', { message: 'OTP Is Expired', loggedIn })
        } else {
            if (userotp === otpData.otp) {
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
                        expires: new Date(Date.now() + 2 * 60 * 60 * 1000),
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
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({ email: email })
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password)
            if (passwordMatch) {
                if (userData.is_block === false) {
                    userData.password = undefined;
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
        const otpData = await Otp.findOne({ email: email });
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
        const userId = req.user.user._id;
        const addressData = await Address.find({ userId: userId });
        const userData = await User.findOne({ _id: userId });
        const orderData = await Order.findOne({ user: userId });
        if (orderData == null) {
            return res.status(200).render('account', { Address: addressData, loggedIn, user: userData, order: [] });
        }
        const orderProduct = await Promise.all(orderData.products.map(async (products) => {
            const productData = await Product.findOne({ _id: products.product });
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
        const oldPassword = req.body.password;
        const newPassword = req.body.npassword;
        console.log(req.body);
        const userData = await User.findOne({ _id: req.user.user._id }, { password: 1, _id: 0 });

        if (!userData) {
            return res.status(400).json({ success: false, error: "User Not Found" });
        } else {
            const matchPassword = await bcrypt.compare(oldPassword, userData.password);
            if (!matchPassword) {
                return res.status(400).render('changePassword', { loggedIn, message: "current Password Doesnot Match Try Again" });
            } else {
                const sPassword = await securePassword(newPassword);
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
        const userData = await User.findOne({ email: email });
        await otp(email);
        const otpData = await Otp.findOne({ email: email });
        const sendEmaildata = await sendEmail(userData.name, email, otpData.otp);
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
        const otpData = await Otp.findOne({ email: emailOtpverify });
        if (!otpData) {
            return res.status(400).render('forgetOtpVerification', { message: 'OTP Is Expired ', loggedIn })
        } else {
            if (userotp === otpData.otp) {
                return res.status(200).render('newPassword', { loggedIn });
            } else {
                return res.status(400).render('forgetOtpVerification', { message: 'OTP Is Expired ', loggedIn })
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
            const updatePassword = await User.updateOne({ email:emailOtpverify}, { $set: { password: sPassword } }, { new: true });
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
