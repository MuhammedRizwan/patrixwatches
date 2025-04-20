const User = require("../models/userModel")
const Address = require("../models/addressModel")

//get register
const loadAddress = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const userData = await User.findById(userId);

        if (userData) {
            const addressData = await Address.find({ user: userId });
            res.render("userAddress", { userData, addressData }); // Add userData here
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.log(error.message);
    }
};


const loadAddAddress = async(req,res) => {
    try{
        const userId = req.session.user_id
        const userData = await User.findById(userId)
        if(userData){
            res.render("addAddress", {userData})
        }else{
            res.redirect('/login')
        }
    }catch(error){
        console.log(error.message)
    }
}


const addAddress = async(req,res)=>{
    try{
        const userId = req.session.user_id
        const{ houseName,street,city,state,pincode} = req.body

        const address = new Address({
            user: userId,
            houseName,
            street,
            city,
            state,
            pincode,
            is_listed: true
        })
        const addressData = await address.save()
        res.redirect("/userAddress")
    }catch(error) {
        console.log(error.message);
    }
}

const editAddress = async(req,res)=>{
    try{
        const id = req.body.address_id
        const { houseName,street,city,state,pincode } = req.body
        const updateData = await Address.findByIdAndUpdate(
            { _id: id },
            {
                $set: {
                    houseName,
                    street,
                    city,
                    state,
                    pincode,
                    is_listed:true
                },
            }
        )
        res.redirect("/userAddress")
    }
    catch(error){
        console.log(error.message)
    }
}



const deleteAddress = async (req, res) => {
    try {
        const id = req.query.id;
        const addressData = await Address.findOneAndUpdate(
            { _id: id },
            {
                $set: {
                    is_listed: false,
                },
            }
        );
        res.redirect("/userAddress");
    } catch (error) {
        console.log(error.message);
    }
};



const loadEditAddress = async(req,res) => {
    try{
        const userId = req.session.user_id
        const userData = await User.findById(userId)
        const id = req.query.id
        const address = await Address.findById(id)

        res.render("editAddress", { userData, Address: address})
    }catch(error) {
        console.log(error.message)
    }
}




module.exports = {
    loadAddress,
    loadAddAddress,
    addAddress,
    editAddress,
    deleteAddress,
    loadEditAddress
}