const { User } = require('../model/userModel');
const Product = require('../model/productModel');
const Wishlist = require('../model/wishListModel');

const wishListPage = async (req, res) => {
    try {
        const loggedIn = req.session.user ? true : false;
        const wishListdata=await Wishlist.findOne({user:req.session.user._id}).populate('product.productId');
        if(!wishListdata){
            return res.status(400).render('wishLiat',{loggedIn,product:[]})
        }
        return res.status(200).render('wishList', { loggedIn,product:wishListdata.product })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json("Internal Server Error");
    }
}

const addToWishList = async (req, res) => {
    try {
        console.log("hi");
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
        console.log(error.message);
        return res.status(500).json("Internal Server Error");
    }
}
const deleteWishItem= async(req,res)=>{
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
        console.log(error.message);
    }
}
module.exports = {
    wishListPage,
    addToWishList,
    deleteWishItem
}