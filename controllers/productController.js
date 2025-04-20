const Product = require("../models/productModel");
const path = require("path");
const fs = require("fs").promises;
const sharp = require("sharp");
const Category = require("../models/categoryModel");
const STATUSCODE = require("../config/statusCode");
const RESPONSE = require("../config/responseMessage");


const loadProducts = async (req, res) => {
  try {
    const products = await Product.find();
    const categories = await Category.find();
    res.status(STATUSCODE.OK).render("product", { products, categories });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const loadProductForm = async (req, res) => {
  try {
    const categories = await Category.find();
    const id = req.params.productId;
    const product = await Product.findById(id) || { images: [] };
    res.status(STATUSCODE.OK).render("addProduct", { categories, productImages: product.images });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const addProduct = async (req, res) => {
  try {
    const imageData = [];
    for (const file of req.files) {
      const randomInteger = Math.floor(Math.random() * 20000001);
      const imgFileName = `cropped${randomInteger}.jpg`;
      const imagePath = path.join("public", "admin-assets", "imgs", "productIMG", imgFileName);

      await sharp(file.path)
        .resize({ width: 300, height: 300, fit: "cover" })
        .toFile(imagePath);

      imageData.push(imgFileName);
    }

    const { name, category, price, discount_price, description, stock } = req.body;
    const addProducts = new Product({
      name,
      description,
      category,
      image: imageData,
      price,
      discount_price,
      stock,
    });

    await addProducts.save();
    res.status(STATUSCODE.OK).redirect("/admin/products");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.ERROR_ADDING_PRODUCT);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const id = req.query.id;
    await Product.deleteOne({ _id: id });
    res.status(STATUSCODE.OK).redirect("/admin/products");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const loadEditProductForm = async (req, res) => {
  try {
    const id = req.query.id;
    const product = await Product.findById(id);
    const categories = await Category.find();

    if (product) {
      res.status(STATUSCODE.OK).render("editProduct", { categories, product });
    } else {
      res.status(STATUSCODE.NOT_FOUND).redirect("/admin/products");
    }
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const storeEditProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.body.product_id);
    if (!product) {
      return res.status(STATUSCODE.NOT_FOUND).send(RESPONSE.PRODUCT_NOT_FOUND);
    }

    const { name, category, price, discountPrice, productColor, description, stock, deletecheckbox } = req.body;
    let images = product.image;

    if (deletecheckbox) {
      const deleteIndices = Array.isArray(deletecheckbox) ? deletecheckbox.map(Number) : [Number(deletecheckbox)];
      images = product.image.filter((_, idx) => !deleteIndices.includes(idx));
    }

    if (req.files.length > 0) {
      for (const file of req.files) {
        const randomInteger = Math.floor(Math.random() * 20000001);
        const imgFileName = `cropped${randomInteger}.jpg`;
        const imagePath = path.join("public", "admin-assets", "imgs", "productIMG", imgFileName);

        await sharp(file.path)
          .resize({ width: 300, height: 300, fit: "cover" })
          .toFile(imagePath);

        images.push(imgFileName);
      }
    }

    await Product.findByIdAndUpdate(req.body.product_id, {
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
    });

    res.status(STATUSCODE.OK).redirect("/admin/products");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).render("error", { error: RESPONSE.SERVER_ERROR });
  }
};

const removeImage = async (req, res) => {
  try {
    const { productId, filename } = req.query;
    await Product.findByIdAndUpdate(productId, { $pull: { image: filename } });
    const imagePath = path.join("public", "admin-assets", "imgs", "productIMG", filename);
    await fs.unlink(imagePath);
    res.status(STATUSCODE.OK).json({ success: true, message: RESPONSE.IMAGE_REMOVED });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).json({ success: false, message: RESPONSE.IMAGE_REMOVAL_FAILED });
  }
};

module.exports = {
  loadProducts,
  loadProductForm,
  addProduct,
  deleteProduct,
  loadEditProductForm,
  storeEditProduct,
  removeImage,
};