const RESPONSE = require("../config/responseMessage");
const STATUSCODE = require("../config/statusCode");
const Category = require("../models/categoryModel");

const loadCategoryform = async (req, res) => {
  try {
    res.status(STATUSCODE.OK).render("addCategory");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingCategory) {
      return res.status(STATUSCODE.BAD_REQUEST).render("addCategory", {
        error: RESPONSE.CATEGORY_EXISTS,
      });
    }

    const category = new Category({
      name,
      is_listed: true,
    });

    await category.save();
    res.status(STATUSCODE.OK).redirect("/admin/category");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const loadCategory = async (req, res) => {
  try {
    const categorydata = await Category.find();
    res.status(STATUSCODE.OK).render("category", { categorydata, message: "" });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const loadEditCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const categoryData = await Category.findById(id);

    if (!categoryData) {
      return res.status(STATUSCODE.NOT_FOUND).send(RESPONSE.CATEGORY_NOT_FOUND);
    }

    res.status(STATUSCODE.OK).render("editCategory", { category: categoryData });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const CategoryEdit = async (req, res) => {
  try {
    const id = req.body.category_id;
    const { name } = req.body;

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      _id: { $ne: id },
    });

    if (existingCategory) {
      return res.status(STATUSCODE.BAD_REQUEST).render("editCategory", {
        error: RESPONSE.CATEGORY_EXISTS,
        category: existingCategory,
      });
    }

    const updateData = { name };

    await Category.findByIdAndUpdate(id, { $set: updateData });
    res.status(STATUSCODE.OK).redirect("/admin/category");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const unlistCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const categoryvalue = await Category.findById(id);

    if (!categoryvalue) {
      return res.status(STATUSCODE.NOT_FOUND).send(RESPONSE.CATEGORY_NOT_FOUND);
    }

    await Category.updateOne({ _id: id }, { $set: { is_listed: !categoryvalue.is_listed } });
    res.status(STATUSCODE.OK).redirect("/admin/category");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

module.exports = {
  loadCategory,
  addCategory,
  loadEditCategory,
  loadCategoryform,
  unlistCategory,
  CategoryEdit,
};