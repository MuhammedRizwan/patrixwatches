const RESPONSE = require('../config/responseMessage')
const STATUSCODE = require('../config/statusCode')
const Wishlist = require('../models/wishlistModel')

const loadWishlist = async (req, res) => {
    try {
        const user = req.session.user_id
        const userWishlist = await Wishlist.findOne({ user }).populate("items.product")
        const userWishlistItems = userWishlist || []
        res.render("wishlist", { Wishlist: userWishlistItems, user })
    } catch (err) {
        res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR)
    }
}

const addToWishlist = async (req, res) => {
    try {
        const userId = req.session.user_id
        const productId = req.body.productId

        if (!userId || !productId) {
            return res.status(STATUSCODE.BAD_REQUEST).json({ success: false, message: RESPONSE.INVALID_IDS })
        }

        let userWishlist = await Wishlist.findOne({ user: userId })

        if (!userWishlist) {
            userWishlist = new Wishlist({
                user: userId,
                items: [{ product: productId }]
            })
        } else {
            const existingWishlistItem = userWishlist.items.find(
                item => item.product && item.product.toString() === productId
            )

            if (existingWishlistItem) {
                return res.status(STATUSCODE.BAD_REQUEST).json({ success: false, message: RESPONSE.PRODUCT_ALREADY_IN_WISHLIST })
            }
            userWishlist.items.push({ product: productId })
        }

        await userWishlist.save()
        res.status(STATUSCODE.OK).json({ success: true, message: RESPONSE.PRODUCT_ADDED })
    } catch (error) {
        res.status(STATUSCODE.INTERNAL_SERVER_ERROR).json({ success: false, message: RESPONSE.SERVER_ERROR })
    }
}

const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.session.user_id
        const productId = req.query.productId

        if (!userId) {
            return res.status(STATUSCODE.BAD_REQUEST).json({ success: false, message: RESPONSE.USER_ID_MISSING })
        }

        const userWishlist = await Wishlist.findOne({ user: userId })

        if (!userWishlist) {
            return res.status(STATUSCODE.NOT_FOUND).json({ success: false, message: RESPONSE.WISHLIST_NOT_FOUND })
        }

        userWishlist.items = userWishlist.items.filter(item => item.product.toString() !== productId)
        await userWishlist.save()

        res.status(STATUSCODE.OK).json({ success: true, message: RESPONSE.PRODUCT_REMOVED })
    } catch (error) {
        res.status(STATUSCODE.INTERNAL_SERVER_ERROR).json({ success: false, message: RESPONSE.SERVER_ERROR })
    }
}

module.exports = {
    loadWishlist,
    addToWishlist,
    removeFromWishlist
}