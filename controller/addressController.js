const Address = require('../model/addressModel');
const { updateOne } = require('../model/productModel');


const addAddressPage = async (req, res) => {

    try {
        const loggedIn = req.session.user ? true : false;
        const userId = req.session.user._id;
        const addressData = await Address.findOne({ userId: userId });
        return res.render('addAddress', { loggedIn, addressData });
    } catch (error) {
        return res.stautus(500).json({ success: false, error: "Internal Server Error" })
    }
}
const addAddress = async (req, res) => {
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
        res.status(500).send("Internal Server Error. Please try again later.");
    }
};

const deletAddress = async (req, res) => {
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
        res.status(500).json("Internal Server Error. Please try again later.");
    }
};


const loadEditAddress = async (req, res) => {
    try {
        const addressId = req.query.id
        const userId = req.session.user._id;
        const addressData = await Address.findOne({ userId: userId });
        const address = addressData.address.find(item => item._id == addressId);
        const loggedIn = req.session.user ? true : false;
        return res.render("editAddress", {
            loggedIn,
            address,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send("Internal Server Error. Please try again later.");
    }
};


const editAddress = async (req, res) => {
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
        console.log(error.message);
        res.status(500).send("Internal Server Error. Please try again later.");
    }
};
const checkOutAddaddress=async (req, res) => {
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
        console.log(error.message);
        res.status(500).send("Internal Server Error. Please try again later.");

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

