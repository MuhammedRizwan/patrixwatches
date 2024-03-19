const Product = require('../model/productModel');
const Category = require('../model/categoryModel');
const {User}=require('../model/userModel')
const productListLoad = async (req, res,next) => {
    try {
        const PAGE_PRODUCT = 12;
        const { product, page ,category} = req.query;
        const pageNumber = parseInt(page) || 1;
        const categoryData = await Category.find()
        let query = {
            productName: { $regex: product || '', $options: 'i' }
        };
        if (category) {
            query.category_id = category;
        }
        const totalProduct = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProduct / PAGE_PRODUCT);
        const Products = await Product.find(query)
            .skip((pageNumber - 1) * PAGE_PRODUCT)
            .limit(PAGE_PRODUCT).sort({_id:-1});
        if (!Products) {
            return res.status(400).send("Product Not Found")
        } else {
            return res.status(200).render('productList', { product: Products, totalPages, currentPage: pageNumber, categoryData });
        }
    } catch (error) {
        next(error.message)
    }
}
const addProductPage = async (req, res,next) => {
    try {
        const categoryData = await Category.find({});
        if (!categoryData) {
            return res.status(400).send("Category Not Found")
        } else {
            return res.status(200).render('addproduct', { cat: categoryData });
        }
    } catch (error) {
        next(error.message)
    }

}
const addProduct = async (req, res,next) => {
    try {
        const categoryId = await Category.findOne({ categoryName: req.body.select });
        if (!categoryId) {
            return res.status(404).send('Category not found'); // Respond with a 404 status if category is not found
        } else {
            const { productName, brandName, discription, orginalPrice, salePrice, stock } = req.body
            const newProduct = new Product({
                productName, brand: brandName, discription, category_id: categoryId._id, orginalPrice, salePrice, image: req.files, stock
            })
            const productData = await newProduct.save();
            if (!productData) {
                return res.status(404).send('Product not found'); // Respond with a 404 status if product is not found
            } else {
                return res.status(200).redirect('/admin/addproduct');
            }
        }
    } catch (error) {
        next(error.message)
    }
}
const editProductPage = async (req, res,next) => {
    try {
        const id = req.query.id;
        const productData = await Product.findById({ _id: id });
        if (!productData) {
            return res.status(404).send('Product not found'); // Respond with a 404 status if product is not found
        } else {
            const categoryData = await Category.find({});
            if (!categoryData) {
                return res.status(404).send('Category not found');
            } else {
                return res.status(200).render('editProduct', { product: productData, cat: categoryData })
            }
        }
    } catch (error) {
        next(error.message)
    }
}
const editProduct = async (req, res,next) => {
    try {
        const { id, productName, brandName, discription, orginalPrice, salePrice, stock } = req.body
        const editProductDta = await Product.findByIdAndUpdate({ _id: id }, {
            $set: { productName, brand: brandName, discription, orginalPrice, salePrice, stock }
        });
        const addImage = await Product.findByIdAndUpdate({ _id: id }, { $push: { image: req.files } })
        return res.status(200).redirect('/admin/productList');
    } catch (error) {
        next(error.message)
    }
}
const deleteProductImage = async (req, res,next) => {
    try {
        const productId = req.params.productId;
        const productImg = req.params.productImg;
        const productData = await Product.updateOne({ _id: productId }, { $pull: { image: { filename: productImg } } })
        if (!productData) {
            return res.status(404).send('ProductData not updated'); // Respond with a 404 status if product is not found
        } else {
            return res.status(200).json({ success: true, message: "product Image were deleted" });
        }
    } catch (error) {
        next(error.message)
    }
}
const blockProduct = async (req, res,next) => {
    try {
        const id = req.params.productId;
        const productData = await Product.updateOne({ _id: id },
            {
                $set: {
                    is_blocked: true
                }
            });
        if (!productData) {
            return res.status(400).json({ success: false, message: "product not updated" });
        } else {
            return res.status(200).json({ success: true, message: "product updated" });
        }
    } catch (error) {
        next(error.message)
    }
}
const unBlockProduct = async (req, res,next) => {
    try {
        const id = req.params.productId;
        const productData = await Product.updateOne({ _id: id },
            {
                $set: {
                    is_blocked: false
                }
            });
        if (!productData) {
            return res.status(400).json({ success: false, message: "product not updated" });
        } else {
            return res.status(200).json({ success: true, message: "product updated" });
        }
    } catch (error) {
        next(error.message)
    }
}
const productShop = async (req, res,next) => {
    try {
        const loggedIn = req.session.user ? true : false;
        const id = req.query.id;
        const productData = await Product.findOne({ _id: id });
        const categoryData = await Category.find({ is_unList: false });
        const categoryIds = categoryData.map(category => category._id);
        const relatedProduct = await Product.find({ category_id: { $in: categoryIds } });
        const user=await User.findOne({_id:req.session.user});
        return res.status(200).render('singleProductDetials', { product: productData, productData: relatedProduct, cat: categoryData, loggedIn,Name:user })
    } catch (error) {
        console.error(error.message);
        next(error.message)
    }
}
const Shop = async (req, res,next) => {
    try {
        const PAGE_PRODUCT = 12;
        const loggedIn = req.session.user ? true : false;
        const { product, page, category,price,start,end} = req.query;
        const pageNumber = parseInt(page) || 1;
        const categoryData = await Category.find({ is_unList: false });
        const categoryIds = categoryData.map(category => category._id);
        let query = {
          is_blocked: false,
        };
        query.category_id = { $in: categoryIds }
        if (product) {
          query.productName = { $regex: product, $options: 'i' };
        }
        if (category) {
          query.category_id = category;
        }
        let sortQuary={ _id: -1 }
        if(price=='high'){
            sortQuary={salePrice:-1}
        }
        if(price=='low'){
            sortQuary={salePrice:1}
        }
        if(start){
            const startPrice = Number(start.replace('₹', ''))
            const endPrice=Number(end.replace('₹', ''))
            query.salePrice = {$gte: startPrice, $lte: endPrice } 
        }
        const totalProduct = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProduct / PAGE_PRODUCT);
        const productData = await Product.find(query)
          .skip((pageNumber - 1) * PAGE_PRODUCT)
          .limit(PAGE_PRODUCT)
          .sort(sortQuary);
          const user=await User.findOne({_id:req.session.user});
          return res.status(200).render("productShop", { loggedIn, product: productData, categoryData, totalPages, currentPage: pageNumber,totalProduct,price,Name:user ,category:category});
    } catch (error) {
        next(error.message)
    }
}
module.exports = {
    productListLoad,
    addProductPage,
    addProduct,
    editProductPage,
    editProduct,
    deleteProductImage,
    blockProduct,
    unBlockProduct,
    productShop,
    Shop
}
