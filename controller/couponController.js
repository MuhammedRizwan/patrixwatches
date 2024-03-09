const Coupon = require('../model/coupenModel');
const User = require('../model/userModel');

const addcouponPage = async (req, res) => {
    try {
        return res.render('addCoupon')
    } catch (error) {
        console.log(error.message);
        return res.sres.tatus(500).json({ success: false, message: "Internal Server Error" });
    }
}
const addCoupon = async (req, res) => {
    try {
        const { code, discount, minAmt, maxDiscAmt, expiryDate} = req.body;
        console.log(req.body);
        const ExistingCoupon = await Coupon.findOne({ code: code });
        if (ExistingCoupon) {
            return res.res.status(400).render("addCoupon", { message: "already existing code" });
        }
        const newCoupen = new Coupon({
            code, discount, minAmt, maxDiscAmt,ExpiryDate:new Date(expiryDate)
        })
        const couponData = await newCoupen.save()
        return res.status(200).redirect("/admin/couponList")
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}
const viewCoupon = async (req, res) => {
    try {
        const couponData = await Coupon.find({});
        if (!couponData) {
            return res.status(400).json({ success: false, message: "something went wrong" })
        }
        return res.status(200).render("CouponList", { couponData })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}
const listnUnlistCoupon = async (req, res) => {
    try {
        const { couponId, Action } = req.body;
        let couponData;
        if (Action == "Unlist") {
            couponData = await Coupon.findByIdAndUpdate(couponId, { is_list: true });
        } else {
            couponData = await Coupon.findByIdAndUpdate(couponId, { is_list: false });
        }
        if (!couponData) {
            return res.status(404).send('coupon  not updated'); // Respond with a 404 status if product is not found
        } else {
            return res.status(200).json({ success: true, message: 'coupon list successfully' });
        }
    } catch (error) {
        res.res.status(500).json.save({ success: false, message: 'Internal Server Error', error });
    }
};
const applyCoupon = async (req, res) => {
    try {
        console.log(req.body);
        const { code,total } = req.body;
        const userId=req.session.user._id;
        const couponData=await Coupon.findOne({code:code,is_list:false});
        if(!couponData){
            return res.status(400).json({success:false,message:"coupon not exist"});
        }
        if(couponData.ExpiryDate){
            const currentDate=new Date();
            const expiryDate=new Date(couponData.ExpiryDate);
            if(currentDate>expiryDate){
                return res.status(4000).json({success:false,message:"coupon Expired"})
            }
        }
        const couponUsed=couponData.users.find((user)=>user==userId);
        if(couponUsed){
            return res.status(400).json({success:false,message:"user Already used"});
        }
        couponData.users.push(userId);
        couponData.save();
        if(total<couponData.minAmt){
            return res.status(400).json({success:false,message:`valid for above ${couponData.minAmt}`});
        }
        let discountAmount=total*couponData.discount/100;
        if(discountAmount>couponData.maxDiscAmt){
            discountAmount=couponData.maxDiscAmt
        }
        const totalPrice=total-discountAmount;
        
        return res.status(200).json({success:true,totalPrice,discountAmount});
    } catch (error) {
        console.log(error);
        return res.status(500).json.json({ success: false, message: "Internal Server Error" })
    }
}
module.exports = {
    viewCoupon,
    addcouponPage,
    addCoupon,
    listnUnlistCoupon,
    applyCoupon
}