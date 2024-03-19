const Offer = require('../model/offerModel');
const Category = require('../model/categoryModel');
const Product = require('../model/productModel')

const offerList = async (req, res, next) => {
    try {
        const offerData = await Offer.find().populate("product").populate('category').sort({ _id: -1 });
        return res.status(200).render('offerList', { offerData })
    } catch (error) {
        next(error.message)
    }
}
const addOfferPage = async (req, res, next) => {
    try {
        return res.status(200).render("addOffer");
    } catch (error) {
        next(error.message)
    }
}
const findData = async (req, res, next) => {
    try {
        const option = req.query.option;
        if (option == "category") {
            const categoryData = await Category.find();
            const Data = categoryData.map((item) => {
                return {
                    _id: item._id, name: item.categoryName
                }
            })
            return res.status(200).json({ success: true, Data });
        } else if (option == "product") {
            const productData = await Product.find();
            const Data = productData.map((item) => {
                return {
                    _id: item._id, name: item.productName
                }
            })
            return res.status(200).json({ success: true, Data });
        }
    } catch (error) {
        next(error.message)
    }
}
const addOffer = async (req, res, next) => {
    try {

        const { select, Id, discountPercent, maxDiscountAmount, expiryDate } = req.body
        let category, product;
        if (select == 'category') {
            category = Id;
            product = null;
        } else {
            product = Id;
            category = null
        }
        const newOffer = new Offer({
            product, category, discountPercent, maxDiscountAmount, ExpiryDate: new Date(expiryDate)
        });
        const offerData = await newOffer.save();
        if (offerData.product == null) {
            const productData = await Product.find({ category_id: offerData.category })
            productData.forEach(async (element) => {
                let discount = element.orginalPrice * offerData.discountPercent / 100;
                if (discount > offerData.maxDiscountAmount) {
                    discount = offerData.maxDiscountAmount
                }
                element.salePrice -= discount
                await element.save()
            })
        } else {
            const productData = await Product.findOne({ _id: offerData.product });
            let discount = productData.orginalPrice * offerData.discountPercent / 100;
            if (discount > offerData.maxDiscountAmount) {
                discount = offerData.maxDiscountAmount
            }
            productData.salePrice -= discount;
            productData.save()
        }
        if (select == 'category') {
            const updateCategory = await Category.updateOne({ _id: category }, { $set: { offerId: offerData._id } })
        } else {
            const updateProduct = await Product.updateOne({ _id: product }, { $set: { offerId: offerData._id } })
        }
        return res.status(200).redirect('admin/offerList');
    } catch (error) {
        next(error.message)

    }
}
const listOffer = async (req, res, next) => {
    try {
        const { offerId } = req.body;
        const offerData = await Offer.findByIdAndUpdate(offerId, { is_UnList: false });
        if (offerData.category != null) {
            const productData = await Product.find({ category_id: offerData.category })
            productData.forEach(async (element) => {
                let discount = element.orginalPrice * offerData.discountPercent / 100;
                if (discount > offerData.maxDiscountAmount) {
                    discount = offerData.maxDiscountAmount
                }
                element.salePrice -= discount
                await element.save()
            })
        } else {
            const productData = await Product.findOne({ _id: offerData.product });
            let discount = element.orginalPrice * offerData.discountPercent / 100;
            if (discount > offerData.maxDiscountAmount) {
                discount = offerData.maxDiscountAmount
            }
            productData.salePrice -= discount;
            productData.save()
        }
        if (!offerData) {
            return res.status(404).send('category  not updated'); // Respond with a 404 status if product is not found
        } else {
            return res.status(200).json({ success: true, message: 'offer listed successfully' });
        }
    } catch (error) {
        next(error.message)
    }
};
const unListOffer = async (req, res, next) => {
    try {
        const { offerId } = req.body;
        const offerData = await Offer.findByIdAndUpdate(offerId, { $set: { is_UnList: true } });
        if (offerData.category != null) {
            const productData = await Product.find({ category_id: offerData.category })
            productData.forEach(async (element) => {
                element.salePrice = element.orginalPrice;
                await element.save()
            })
        } else {
            const productData = await Product.findOne({ _id: offerData.product });
            productData.salePrice = productData.orginalPrice;
            productData.save()
        }
        if (!offerData) {
            return res.status(404).send('offer  not updated'); // Respond with a 404 status if product is not found
        } else {
            return res.status(200).json({ success: true, message: 'offer unlisted successfully' });
        }

    } catch (error) {
        next(error.message)
    }
};


module.exports = {
    offerList,
    addOfferPage,
    addOffer,
    findData,
    listOffer,
    unListOffer
}