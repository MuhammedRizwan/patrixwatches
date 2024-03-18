const Address = require('../model/addressModel');
const {User}=require('../model/userModel')

const addAddressPage = async (req, res,next) => {

    try {
        const loggedIn = req.session.user ? true : false;
        const userId = req.session.user._id;
        const addressData = await Address.findOne({ userId: userId });
        const user=await User.findOne({_id:req.session.user});
        return res.render('addAddress', { loggedIn, addressData,Name:user });
    } catch (error) {
        next(error.message)
    }
}
const addAddress = async (req, res,next) => {
    try {
        const { fullName, mobile, pincode, houseName, landMark, townCity, state } = req.body
        const userId = req.session.user._id;
        const address = { fullName, mobile, pincode, houseName, landMark, townCity, state }
        const addressData = await Address.findOne({ userId: userId })
        if(addressData){
            if (addressData.address.length >= 1) {
                address.addressType = "Address 2"
                addressData.address.push(address);
                await addressData.save();
                return res.status(200).redirect("/account");
            }else{
                address.addressType = "Address 1"
                addressData.address.push(address);
                await addressData.save();
                return res.status(200).redirect("/account");
            }
        }
     
        const newAddress = new Address({
            userId, address
        });
        await newAddress.save();
        return res.status(200).redirect("/account");
    } catch (error) {
        next(error.message)
    }
};

const deletAddress = async (req, res,next) => {
    try {
        const addressId = req.query.id;
        const userId = req.session.user._id;
        const deleteResult = await Address.updateOne(
            { userId: userId },
            { $pull: { address: { _id: addressId } } }
        );
        console.log(deleteResult);
        if (deleteResult.modifiedCount > 0) {
            return res.status(200).json({ success: true, message: "Address deleted successfully" });
        } else {
            return res.status(404).json({ success: false, message: "Address not found or couldn't be deleted" });
        }

    } catch (error) {
        next(error.message)
    }
};


const loadEditAddress = async (req, res,next) => {
    try {
        const addressId = req.query.id
        const userId = req.session.user._id;
        const addressData = await Address.findOne({ userId: userId });
        const address = addressData.address.find(item => item._id == addressId);
        const loggedIn = req.session.user ? true : false;
        const user=await User.findOne({_id:req.session.user});
        return res.render("editAddress", {
            loggedIn,
            address,
            Name:user
        });
    } catch (error) {
        next(error.message)
    }
};


const editAddress = async (req, res,next) => {
    try {
        const addressType = req.query.id;
        const userId = req.session.user._id;
        const { fullName, mobile, pinCode, houseName, landMark, townCity, state } = req.body;
        console.log(req.body);
        const addressData = await Address.updateOne(
            { userId: userId, "address.addressType": addressType },
            {
                $set: {
                    "address.$.fullName": fullName,
                    "address.$.mobile": mobile,
                    "address.$.pincode": pinCode,
                    "address.$.houseName": houseName,
                    "address.$.landMark": landMark,
                    "address.$.townCity": townCity,
                    "address.$.state": state
                }
            }
        );
        return res.status(200).redirect("/account");
    } catch (error) {
        next(error.message)
    }
};
const checkOutAddaddress=async (req, res,next) => {
    try {
        const { fullName, mobile, pincode, houseName, landMark, townCity, state } = req.body.requestData
        const userId = req.session.user._id;
        const address = { fullName, mobile, pincode, houseName, landMark, townCity, state }
        const addressData = await Address.findOne({ userId: userId })
        if(addressData){
            console.log(addressData.address);
            if (addressData.address.length >= 1) {
                address.addressType = "Address 2"
                addressData.address.push(address);
                await addressData.save();
                return res.status(200).redirect("/account");
            }else{
                address.addressType = "Address 1"
                addressData.address.push(address);
                await addressData.save();
                return res.status(200).redirect("/account");
            }
        }
     
        const newAddress = new Address({
            userId, address
        });
        await newAddress.save();
    }catch(error){
        next(error.message)

    }
}
module.exports = {
    addAddressPage,
    addAddress,
    deletAddress,
    loadEditAddress,
    editAddress,
    checkOutAddaddress
}

