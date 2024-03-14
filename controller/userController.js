const mongoose = require('mongoose');
const { User, Otp } = require('../model/userModel');
const Product = require('../model/productModel');
const Category = require('../model/categoryModel');
const Address = require('../model/addressModel');
const Order = require('../model/orderModel');
const Wallet = require('../model/walletModel');
const argon = require('argon2');
const otp = require('../util/genarateOtp');
const sendEmail = require('../util/sendEmail');
const securePassword = async (password) => {
    try {
        const hashPassword = await argon.hash(password, 10);
        return hashPassword

    } catch (error) {
        console.log(error.message);
    }

}

// const genarateToken = (user) => {
//     return jwt.sign({ user }, process.env.SECRETKEY, { expiresIn: 2 * 60 * 60 * 1000 })
// }
const Home = async (req, res,next) => {
    try {
        const loggedIn = req.session.user ? true : false;
        const userData=await User.findOne({_id:req.session.user});
        const categoryData = await Category.find({ is_unList: false });
        const categoryIds = categoryData.map(category => category._id);
        const productData = await Product.find({ category_id: { $in: categoryIds }, is_blocked: false }).limit(8);
        const Home=true;
        return res.status(200).render('Home', { product: productData, category: categoryData, loggedIn,Name:userData,Home });
    } catch (error) {
        next(error.message);
    }
}
const userRegisterPage = async (req, res,next) => {
    try {
        const loggedIn = req.session.user ? true: false;
        return res.render('userRegister', { loggedIn })
    } catch (error) {
        next(error.message);
    }
}
const userRegister = async (req, res,next) => {
    try {
        const loggedIn = req.session.user ? true : false;
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
        req.session.tempUser = { name, email, phone, password: sPassword };
        const clearOtp = await Otp.deleteOne({ email: email });
        await otp(email);
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
        next(error.message);
    }
}
const verifyOtp = async (req, res,next) => {
    try {
        const loggedIn = req.session.user ? true : false;
        const userotp = req.body.otp;
        const { name, email, phone, password } = req.session.tempUser;
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
                    req.session.LoggedUser = true
                    req.session.user = user
                    const newWallet = new Wallet({
                        user: user._id
                    })
                    const saveWallet = await newWallet.save();
                    // const token = genarateToken(user);
                    // const options = {
                    //     expires: new Date(Date.now() + 60 * 60 * 1000),
                    //     httpOnly: true
                    // }
                    // return res.status(201).cookie("token", token, options).redirect('/');
                    return res.status(201).redirect('/');
                }
            } else {
                return res.status(400).render('verification', { message: 'OTP Is Not Matching', loggedIn });
            }
        }

    } catch (error) {
        next(error.message);
    }
}
const userLoginPage = async (req, res,next) => {
    try {
        const loggedIn = req.session.user ? true : false;
        return res.status(200).render('userLogin', { loggedIn });
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error');
    }
}
const userLogin = async (req, res,next) => {
    try {
        const loggedIn = req.session.user ? true : false;
        const { email, password } = req.body;
        const userData = await User.aggregate([
            { $match: { email: email } },
            { $limit: 1 }
        ]);
        if (userData.length > 0) {
            const passwordMatch = await argon.verify(password, userData[0].password)
            if (passwordMatch) {
                if (userData[0].is_block === false) {
                    userData[0].password = undefined;
                    const userDatas = userData[0]
                    req.session.LoggedUser = true;
                    req.session.user = userDatas;
                    // const token = genarateToken(userDatas);
                    // const options = {
                    //     expires: new Date(Date.now() + 2 * 60 * 60 * 1000),
                    //     httpOnly: true
                    // }
                    // return res.status(200).cookie("token", token, options).redirect('/');
                    return res.status(200).redirect('/');
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
        next(error.message);
    }
}
const resendOtp = async (req, res,next) => {
    try {
        const loggedIn = req.session.user_id ? true : false;
        const { name, email } = req.session.tempUser;
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
const account = async (req, res,next) => {
    try {
        const loggedIn = req.session.user ? true : false;
        const userId = req.session.user._id;
        const userData = await User.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(userId) }
            },
            {
                $limit: 1
            }
        ]);
        const user=await User.findOne({_id:req.session.user});
        const walletData = await Wallet.findOne({ user: userId })
        if (userData.length === 0) {
            return res.status(404).render('account', { Address: [], loggedIn,Name:user, user: [], wallet: walletData })
        }
        const addressData = await Address.aggregate([
            {
                $match: { userId: new mongoose.Types.ObjectId(userId) }
            },
            {
                $limit: 1
            }
        ]);
        if (addressData == 0) {
            return res.status(200).render('account', { Address: [], loggedIn, user: userData[0],Name:user, wallet: walletData });
        }

        return res.status(200).render('account', { Address: addressData[0].address, loggedIn, Name:user,user: userData[0], wallet: walletData });

    } catch (error) {
        next(error.message);
    }
}
const userLogout = async (req, res,next) => {
    try {
        req.session.LoggedUser = false
        req.session.user = undefined;
        return res.status(200).redirect('/');
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}
const changePasswordPage = async (req, res,next) => {
    try {
        const loggedIn = req.session.user ? true : false;
        const user=await User.findOne({_id:req.session.user});
        return res.status(200).render('changePassword', { loggedIn ,Name:user});
    } catch (error) {
        next(error.message);
    }
}
const changePassword = async (req, res,next) => {
    try {
        const loggedIn = req.session.user ? true : false;
        const { password, npassword } = req.body;
        const userId = req.session.user._id;
        const userData = await User.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(userId) }
            },
            {
                $project: { password: 1, _id: 0 }
            }
        ]);
        const user=await User.findOne({_id:req.session.user});
        if (!userData) {
            return res.status(400).json({ success: false, error: "User Not Found" });
        } else {
            const matchPassword = await bcrypt.compare(password, userData[0].password)
            if (!matchPassword) {
                return res.status(400).render('changePassword', { loggedIn ,Name:user, message: "current Password Doesnot Match Try Again" });
            } else {
                const sPassword = await securePassword(npassword);
                if (!sPassword) {
                    return res.status(400).json({ success: false, message: "hash password didn't work" })
                } else {
                    const updatePassword = await User.updateOne({ _id: req.session.user._id }, { $set: { password: sPassword } }, { new: true });
                    if (!updatePassword) {
                        return res.status(404).json({ success: false, error: "something went wrong" });
                    } else {
                        return res.status(200).redirect('/account');
                    }
                }
            }
        }
    } catch (error) {
        next(error.message);
    }
}

const verifyEmailPage = async (req, res,next) => {
    try {
        const loggedIn = req.session.user ? true : false;
        return res.status(200).render('email-verified', { loggedIn })
    } catch (error) {
        next(error.message);
    }
}
let emailOtpverify;
const verifyEmail = async (req, res,next) => {
    try {
        const loggedIn = req.session.user ? true : false;
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
        next(error.message);
    }
}
const forgetOtpVerification = async (req, res,next) => {
    try {
        const loggedIn = req.session.user ? true : false;
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
        next(error.message);
    }
}
const newPasswordverify = async (req, res,next) => {
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
        next(error.message);
    }
}
const editProfilePage = async (req, res,next) => {
    try {
        const loggedIn = req.session.user ? true : false;
        const userData = await User.findOne({ _id: req.session.user._id })
        return res.status(200).render('editProfile', { loggedIn, userData,Name:userData });

    } catch (error) {
        next(error.message);
    }
}
const editProfile = async (req, res,next) => {
    try {
        const userId = req.session.user._id;
        const { name, phone } = req.body;
        const userData = await User.updateOne(
            { _id: userId },
            {
                $set: {
                    name, phone
                },
            }
        );
        return res.status(200).redirect('/account')
    } catch (error) {
        next(error.message);

    }
}
const walletTransaction = async (req, res,next) => {
    try {
        const loggedIn = req.session.user ? true : false;
        const userId = req.session.user._id;
        const walletData = await Wallet.findOne({ user: userId })
        const user=await User.findOne({_id:req.session.user});
        return res.status(200).render("transactionList", { loggedIn, wallet: walletData ,Name:user});
    } catch (error) {
        next(error.message);
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
    editProfilePage,
    editProfile,
    walletTransaction
}
