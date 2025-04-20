const Product = require("../models/productModel");
const path = require('path')
const fs = require('fs');
const sharp = require('sharp')
const Category = require("../models/categoryModel")
const { Console, log } = require("console");
const User = require("../models/userModel")
const gender = ["gents", "ladies"];


const loadProducts = async (req, res) => {
    try {
        const products = await Product.find();
        const categories = await Category.find()
       
        res.render("product", { products, categories })
    } catch (error) {
        console.log(error.message)
    }
};

const loadProductForm = async (req, res) => {
    try {
        let categories = await Category.find();
        const id = req.params.productId; 

        let product = await Product.findOne({ _id: id });

        if (!product) {
            product = new Product({
            });
        }

        const productImages = product.images || [];

        res.render("addProduct", { categories, productImages });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}

const addProduct = async (req, res) => {
    try {
        const imageData = []
        const imageFiles = req.files

        for (const file of imageFiles) {
            console.log(file, "File received")

            const randomInteger = Math.floor(Math.random() * 20000001)
            const imageDirectory = path.join('public', 'admin-assets', 'imgs', 'productIMG')
            const imgFileName = "cropped" + randomInteger + ".jpg"
            const imagePath = path.join(imageDirectory, imgFileName)

            console.log(imagePath, "Image path");
            

            const croppedImage = await sharp(file.path)
    .resize({
        width: 300, 
        height: 300, 
        fit: "cover",
    })
    .toFile(imagePath);

if (croppedImage) {
    imageData.push(imgFileName);
}

        }

        const { name, category, price, discount_price, description,stock } = req.body;
       

        const addProducts = new Product({

            name,
            description,
            category,
            image: imageData,
            price,
            discount_price,
            stock
        });
        console.log(addProducts)

        await addProducts.save()
        res.redirect("/admin/products")
    } catch (error) {
        console.log(error.message)
        res.status(500).send("Error while adding product")
    }
};







const deleteProduct = async(req,res)=>{
    try {
      const id = req.query.id
      const productData = await Product.deleteOne({_id:id})
      console.log(productData,"product deleted");
      res.redirect("/admin/products")
    } catch (error) {
      console.log(error.message);
    }
  }



  const loadEditProductForm = async (req, res) => {
    try {
        const id = req.query.id;
        const product = await Product.findOne({ _id: id });
        const categories = await Category.find({});

        if (product) {
            res.render("editProduct", { categories, product });
        } else {
            res.redirect("/admin/products");
        }
    } catch (error) {
        console.log(error.message);
    }
};



const storeEditProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.body.product_id })
        let images = [], deleteData ;

        const {
            name,
            category,
            price,
            discountPrice, // Fix typo here
            productColor,
            description,
            stock
        } = req.body;
        

        const sizedata = req.body.sizes;
        if (req.body.deletecheckbox) {
            deleteData.push(req.body.deletecheckbox)


            deleteData = deleteData.flat().map(x => Number(x))
            images = product.image.filter((img, idx) => !deleteData.includes(idx))
        } else {
            images = product.image.map((img) => { return img })
        }
        if (req.files.length != 0) {
            for (const file of req.files) {
                console.log(file, "File rreceived");


                const randomInteger = Math.floor(Math.random() * 20000001)
                const imageDirectory = path.join('public', 'admin-assets', 'imgs', 'productIMG')
                const imgFileName = "cropped" + randomInteger + ".jpg";
                const imagePath = path.join(imageDirectory, imgFileName)


                console.log(imagePath, "Image path")

                const croppedImage = await sharp(file.path)
                .resize({
                    width: 300, 
                    height: 300, 
                    fit: "cover",
                })
                    .toFile(imagePath)

                if (croppedImage) {
                    images.push(imgFileName)
                }
            }
        }
        await Product.findByIdAndUpdate(
            { _id: req.body.product_id },
            {
                $set: {
                    name,
                    category,
                    price,
                    discount_price: discountPrice,
                    productColor,
                    
                    description,
                    stock,
                    image: images,
                },
            }
        )
        res.redirect("/admin/products")

    } catch (error) {
        console.log(error.message)
        res.status(500).render("error", { error: "Internal Server Error" });
    }
}

const removeImage = async (req, res) => {
    try {
        const productId = req.query.productId;
        const filename = req.query.filename;
        await Product.findByIdAndUpdate(productId, {
            $pull: { image: req.query.filename }
        });
        const imagePath = path.join('public', 'admin-assets', 'imgs', 'productIMG', filename);
        await fs.unlink(imagePath);
        console.log('Image removed successfully');
        res.json({ success: true, message: 'Image removed successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Failed to remove image' });
    }
};




module.exports = {
    loadProducts,
    loadProductForm,
    addProduct,
    deleteProduct,
    loadEditProductForm,
    storeEditProduct,
    removeImage

}