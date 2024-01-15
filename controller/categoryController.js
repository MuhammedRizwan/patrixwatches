const Category = require('../model/categoryModel');

const addCategoryPage = async (req, res) => {
    try {
        res.status(200).render('addCategory')

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}
const addCategory = async (req, res) => {
    try {
        const category = new Category({
            categoryName: req.body.categoryName,
            discription: req.body.discription,
        })
        const categoryData = await category.save();
        if (!categoryData) {
            return res.status(404).send('category  not Added'); // Respond with a 404 status if product is not found
        }
        res.redirect('/admin/categoryList');

    } catch (error) {
        console.log(error.message);
        if (error.name === 'ValidationError') {
            // Handle specific validation errors here
            return res.status(400).send('Validation Error: Invalid data');
        }

        res.status(500).send('Internal Server Error'); // Respond with a 500 status for other errors
    }
}
const category = async (req, res) => {
    try {
        const categoryData = await Category.find({});
        res.status(200).render('categoryList', { cat: categoryData });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}
const listCategory = async (req, res) => {
    try {
        const { userId } = req.body;

        const categoryData = await Category.findByIdAndUpdate(userId, { is_unList: false });
        if (!categoryData) {
            return res.status(404).send('category  not updated'); // Respond with a 404 status if product is not found
        }

        res.json({ message: 'Category listed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error listing user', error });
    }
};
const unListCategory = async (req, res) => {
    try {
        const { userId } = req.body;
        const categoryData = await Category.findByIdAndUpdate(userId, { is_unList: true });
        if (!categoryData) {
            return res.status(404).send('category  not updated'); // Respond with a 404 status if product is not found
        }
        res.json({ message: 'User unlisted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error unlisting user', error });
    }
};
const editCategoryPage = async (req, res) => {
    try {
        const id = req.query.id;
        const categoryData = await Category.findById({ _id: id });
        if (!categoryData) {
            return res.status(404).send('category not found'); // Respond with a 404 status if product is not found
        }
        res.status(200).render('editCategory', { cat: categoryData });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}
const editCategory = async (req, res) => {
    try {

        const categoryData = await Category.updateOne({ _id: req.body.id }, {
            $set: {
                categoryName: req.body.CategoryName,
                is_unList: req.body.list, discription: req.body.discription
            }
        });
        if (!categoryData) {
            return res.status(404).send('category not updated'); // Respond with a 404 status if product is not found
        }
        res.status(200).redirect('/admin/categoryList');

    } catch (error) {
        console.log(error.message)
        res.status(500).send('Internal Server Error');
    }
}
const deleteCategory = async (req, res) => {
    try {
        const id = req.query.id;
        await Category.deleteOne({ _id: id });
        res.redirect('/admin/categoryList');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error')
    }
}
module.exports = {
    category,
    listCategory,
    unListCategory,
    addCategoryPage,
    deleteCategory,
    addCategory,
    editCategoryPage,
    editCategory
}
