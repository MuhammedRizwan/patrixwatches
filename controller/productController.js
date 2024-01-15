const Product = require('../model/productModel');
const Category = require('../model/categoryModel');

const productListLoad = async (req, res) => {
    try {
        const productData = await Product.find({})
        res.status(200).render('productList', { product: productData });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}
const addProductPage = async (req, res) => {
    try {
        const categoryData = await Category.find({});
        res.status(200).render('addproduct', { cat: categoryData });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }

}
const addProduct = async (req, res) => {
    try {
        const categoryId = await Category.findOne({ categoryName: req.body.select });
        if (!categoryId) {
            return res.status(404).send('Category not found'); // Respond with a 404 status if category is not found
        }
        const newProduct = new Product({
            productName: req.body.productName,
            brand: req.body.brandName,
            discription: req.body.discription,
            category_id: categoryId._id,
            orginalPrice: req.body.orginalPrice,
            salePrice: req.body.salePrice,
            image: req.files,
            stock: req.body.stock,
        })
        const productData = await newProduct.save();
        if (!productData) {
            return res.status(404).send('Product not found'); // Respond with a 404 status if product is not found
        }
        res.redirect('/admin/addproduct')
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}
const editProductPage = async (req, res) => {
    try {
        const id = req.query.id;
        const productData = await Product.findById({ _id: id });
        if (!productData) {
            return res.status(404).send('Product not found'); // Respond with a 404 status if product is not found
        }
        const categoryData = await Category.find({})
        res.status(200).render('editproduct', { product: productData, cat: categoryData })
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}
const editProduct = async (req, res) => {
    try {
        const id = req.body.id;
        const editProductDta = await Product.findByIdAndUpdate({ _id: id }, {
            $set: {
                productName: req.body.productName,
                brand: req.body.brandName,
                discription: req.body.discription,
                orginalPrice: req.body.orginalPrice,
                salePrice: req.body.salePrice,
                stock: req.body.stock
            }
        });
        const addImage = await Product.findByIdAndUpdate({ _id: id }, { $push: { image: req.files } })
        res.redirect('/admin/productList')
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');

    }
}
const deleteProduct = async (req, res) => {
    try {
        const id = req.params.productId;
        const deleteProduct = await Product.deleteOne({ _id: id });
        res.redirect('/admin/productList')
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}
const deleteProductImage = async (req, res) => {
    try {
        const productId = req.params.productId;
        const productImg = req.params.productImg;
        console.log(productId);
        console.log(productImg);
        const productData = await Product.updateOne({ _id: productId }, { $pull: { image: { filename: productImg } } })
        console.log(productData);
        if (!productData) {
            return res.status(404).send('ProductData not updated'); // Respond with a 404 status if product is not found
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}
module.exports = {
    productListLoad,
    addProductPage,
    addProduct,
    editProductPage,
    editProduct,
    deleteProduct,
    deleteProductImage
}
