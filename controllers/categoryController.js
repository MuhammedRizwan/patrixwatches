const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
const fs=require('fs')


const loadCategoryform = async(req,res)=>{
    try{
        res.render("addCategory")
    }
    catch(error){
        console.log(error.message)
    }
}


const addCategory = async (req, res) => {
    try {
        const { name } = req.body;
         console.log(name)
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') }, // Case-insensitive match
        });

        if (existingCategory) {
            return res.render("addCategory", {
                error: "Category with the same name already exists",
            });
        }

        const category = new Category({
            name: name,
            is_listed: true,
        });
    console.log(category)
        const categoryData = await category.save();

        return res.redirect("/admin/category");
    } catch (error) {
        console.error(error.message);
        return res.status(500).send("Internal Server Error");
    }
};



const loadCategory = async(req,res)=>{
    try{
        const categorydata = await Category.find()
        res.render("category", {categorydata,message: "" })
    }catch (error){
        console.log(error.message)
    }
};


const loadEditCategory = async (req,res)=>{
    try{
        const id = req.query.id;
        const categoryData = await Category.findById(id)
                 res.render("editCategory", {category:categoryData})
    }catch(error){
        console.log(error.message)
    }
}



const CategoryEdit = async(req,res) => {
    try{
        let id = req.body.category_id

        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
            _id: { $ne: id } 
          });

          if(existingCategory){
            return res.render("editCategory",{
                error: "Category name already exists",
                category: existingCategory
            })
          }

          if(!req.file){
            const categoryData = await Category.findByIdAndUpdate(
              { _id: id },
              {
                $set: {
                  name: req.body.name,
                //   description: req.body.description
                },
              }
            );
          }
          else{
            const categoryData = await Category.findByIdAndUpdate(
                {_id:id},
                {
                    $set:{
                        name: req.body.name,
                        // image : req.file.filename,
                        // description: req.body.description
                    },
                }
            );
          }

          res.redirect('/admin/category')
        }catch(error){
            console.log(error.message)
        }
    };


    const unlistCategory = async(req, res) =>{
        try{
            const id = req.query.id;
            const categoryvalue = await Category.findById(id)

            if(categoryvalue.is_listed){
                const categoryData = await Category.updateOne(
                    {_id:id},
                    {
                        $set: {
                            is_listed: false
                        },
                    }
                );
            }else{
                const categoryData = await Category.updateOne(
                    {_id: id},
                    {
                        $set:{
                            is_listed: true
                        },
                    }
                );
            }
            res.redirect("/admin/category");
        }catch(error){
            console.log(error.message);
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