const Address = require('../model/addressModel');


const addAddressPage = async (req, res) => {

    try {
        const loggedIn = req.user ? true : false;
        return res.render('addAddress', { loggedIn })
    } catch (error) {
        return res.stautus(500).json({ success: false, error: "Internal Server Error" })
    }
}
const addAddress = async (req, res) => {
    try {
        const { fullName, mobile, pincode, houseName, landMark, townCity, state } = req.body
        const userId = req.user.user._id;
        const address = new Address({
            userId, fullName, mobile, pincode, houseName, landMark, townCity, state
        });
        await address.save();
        res.status(200).redirect("/account");
    } catch (error) {
        res.status(500).send("Internal Server Error. Please try again later.");
    }
};

const deletAddress = async (req, res) => {
    try {
        const addressType = req.query.id;
        const userId = req.user.user._id;
        const deleteResult = await Address.deleteOne({ userId: userId});

        if (deleteResult.deletedCount > 0) {
            return res.status(200).json("Deleted successfully");
        } else {
            return res.status(404).json("Address not found or couldn't be deleted");
        }

    } catch (error) {
        res.status(500).json("Internal Server Error. Please try again later.");
    }
};


const loadEditAddress = async (req, res) => {
    try {
        const userId = req.user.user._id;
        const addressData = await Address.findOne({ userId: userId });
        const loggedIn = req.user.user._id ? true : false;
        return res.render("editAddress", {
            loggedIn,
            address: addressData,
        });
    } catch (error) {
    console.log(error);
        return res.status(500).send("Internal Server Error. Please try again later.");
    }
};


const editAddress = async (req, res) => {
    try {
        const userId = req.user.user._id;
        const addressData = await Address.updateOne(
            { userId: userId },
            {
                $set: {
                    fullName, mobile, pinCode, houseName, landmark, townCity, state,
                },
            }
        );
        return res.status(200).redirect("/account");
    } catch (error) {
        res.status(500).send("Internal Server Error. Please try again later.");
    }
};

module.exports = {
    addAddressPage,
    addAddress,
    deletAddress,
    loadEditAddress,
    editAddress
}

