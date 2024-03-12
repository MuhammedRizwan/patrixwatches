const Category = require('../model/categoryModel');

const addCategoryPage = async (req, res,next) => {
    try {
        return res.status(200).render('addCategory')
    } catch (error) {
   next(error.message)
    }
}
const addCategory = async (req, res,next) => {
    try {
        const categoryExist = await Category.aggregate([
            {
                $match: { categoryName: req.body.categoryName }
            },
            {
                $limit: 1
            }
        ])
        if (categoryExist.length > 0) {
            return res.status(400).render('addCategory', { message: "Category Already Exist" })
        } else {
            const category = new Category({
                categoryName: req.body.categoryName,
                discription: req.body.discription,
            })
            const categoryData = await category.save();
            if (!categoryData) {
                return res.status(404).send('category  not Added'); // Respond with a 404 status if product is not found
            }
            return res.status(200).redirect('/admin/categoryList');
        }
    } catch (error) {
        next(error.message)
    }
}
const category = async (req, res,next) => {
    try {
        const categoryData = await Category.find({});
        return res.status(200).render('categoryList', { cat: categoryData });
    } catch (error) {
        next(error.message)
    }
}
const listCategory = async (req, res,next) => {
    try {
        const { userId } = req.body;
        const categoryData = await Category.findByIdAndUpdate(userId, { is_unList: false });
        if (!categoryData) {
            return res.status(404).send('category  not updated'); // Respond with a 404 status if product is not found
        } else {
            return res.status(200).json({ success: true, message: 'Category listed successfully' });
        }
    } catch (error) {
        next(error.message)
    }
};
const unListCategory = async (req, res,next) => {
    try {
        const { userId } = req.body;
        const categoryData = await Category.findByIdAndUpdate(userId, { is_unList: true });
        if (!categoryData) {
            return res.status(404).send('category  not updated'); // Respond with a 404 status if product is not found
        } else {
            return res.status(200).json({ success: true, message: 'User unlisted successfully' });
        }

    } catch (error) {
        next(error.message)
    }
};
const editCategoryPage = async (req, res,next) => {
    try {
        const id = req.query.id;
        const categoryData = await Category.findById({ _id: id });
        if (!categoryData) {
            return res.status(404).send('category not found'); // Respond with a 404 status if product is not found
        }
        res.status(200).render('editCategory', { cat: categoryData });
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}
const editCategory = async (req, res,next) => {
    try {
        const categoryExist=await Category.findOne({categoryName:req.body.CategoryName})
        if(categoryExist){
            return res.render('editCategory',{message:"category Already Exist",cat:categoryExist});
        }
        const categoryData = await Category.updateOne({ _id: req.body.id }, {
            $set: {
                categoryName: req.body.CategoryName,
                is_unList: req.body.list, discription: req.body.discription
            }
        });
        if (!categoryData) {
            return res.status(404).send('category not updated'); // Respond with a 404 status if product is not found
        }
        return res.status(200).redirect('/admin/categoryList');

    } catch (error) {
        next(error.message)
    }
}

module.exports = {
    category,
    listCategory,
    unListCategory,
    addCategoryPage,
    addCategory,
    editCategoryPage,
    editCategory
}
