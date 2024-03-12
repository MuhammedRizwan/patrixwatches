const { User } = require('../model/userModel');
const Product = require('../model/productModel');
const Wishlist = require('../model/wishListModel');

const wishListPage = async (req, res, next) => {
    try {
        const loggedIn = req.session.user ? true : false;
        const user=await User.findOne({_id:req.session.user});
        const wishListdata=await Wishlist.findOne({user:req.session.user._id}).populate('product.productId');
        if(!wishListdata){
            return res.status(400).render('wishList',{loggedIn,product:[],Name:user})
        }
        return res.status(200).render('wishList', { loggedIn,product:wishListdata.product ,Name:user})
    } catch (error) {
       next(error.message)
    }
}

const addToWishList = async (req, res, next) => {
    try {
        const productId = req.query.id;
        if(!req.session.user){
            return res.status(400).json({success:false,message:"please Login or Sign Up "});
        }
        const userId = req.session.user._id;
        const existinguser = await Wishlist.findOne({ user: userId });
        if (existinguser) {
            const productExist = existinguser.product.find(data => data.productId == productId);
            if (productExist) {
                return res.status(400).json({ success: false, message: "Product Already Exist in Whishlist" });
            }
            existinguser.product.push({ productId: productId });
            await existinguser.save();
            return res.status(200).json({ success: true, message: "product Added  to Wishlist" });

        }
        const newWish = new Wishlist({
            product: [{ productId: productId }], user: userId
        })
        const WishListData = await newWish.save()
        if (!WishListData) {
            return res.status(400).json({ success: false, message: "cannot Add to Wishlist " });
        }
        return res.status(200).json({ success: true, message: "product Added to Wishlist" });
    } catch (error) {
        next(error.message)
    }
}
const deleteWishItem= async(req,res, next)=>{
    try {
        const productId=req.query.id;
        const userId=req.session.user._id;
        const updatedWislist = await Wishlist.findOneAndUpdate(
            { user: userId},
            { $pull: { product: { productId: productId } } },
            { new: true }
        );
        if(updatedWislist){
            return res.status(200).json({success:true,message:"Wish Product Deleted "})
        }
        return res.status(400).json({success:false,message:"Cannot Deleted Wish Product"})

    } catch (error) {
        next(error.message)
    }
}
module.exports = {
    wishListPage,
    addToWishList,
    deleteWishItem
}