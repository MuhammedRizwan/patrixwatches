const User = require("../models/userModel");
const Address = require("../models/addressModel");
const STATUSCODE = require("../config/statusCode");
const RESPONSE = require("../config/responseMessage");


const loadAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findById(userId);

    if (!userData) {
      return res.status(STATUSCODE.OK).redirect("/login");
    }

    const addressData = await Address.find({ user: userId });
    res.status(STATUSCODE.OK).render("userAddress", { userData, addressData });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const loadAddAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findById(userId);

    if (!userData) {
      return res.status(STATUSCODE.OK).redirect("/login");
    }

    res.status(STATUSCODE.OK).render("addAddress", { userData });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const addAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { houseName, street, city, state, pincode } = req.body;

    const userData = await User.findById(userId);
    if (!userData) {
      return res.status(STATUSCODE.OK).redirect("/login");
    }

    const address = new Address({
      user: userId,
      houseName,
      street,
      city,
      state,
      pincode,
      is_listed: true,
    });

    await address.save();
    res.status(STATUSCODE.OK).redirect("/userAddress");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const editAddress = async (req, res) => {
  try {
    const id = req.body.address_id;
    const { houseName, street, city, state, pincode } = req.body;

    const address = await Address.findById(id);
    if (!address) {
      return res.status(STATUSCODE.NOT_FOUND).send(RESPONSE.ADDRESS_NOT_FOUND);
    }

    await Address.findByIdAndUpdate(id, {
      $set: { houseName, street, city, state, pincode, is_listed: true },
    });

    res.status(STATUSCODE.OK).redirect("/userAddress");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const deleteAddress = async (req, res) => {
  try {
    const id = req.query.id;
    const addressData = await Address.findById(id);

    if (!addressData) {
      return res.status(STATUSCODE.NOT_FOUND).send(RESPONSE.ADDRESS_NOT_FOUND);
    }

    await Address.findByIdAndUpdate(id, { $set: { is_listed: false } });
    res.status(STATUSCODE.OK).redirect("/userAddress");
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

const loadEditAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findById(userId);

    if (!userData) {
      return res.status(STATUSCODE.OK).redirect("/login");
    }

    const id = req.query.id;
    const address = await Address.findById(id);

    if (!address) {
      return res.status(STATUSCODE.NOT_FOUND).send(RESPONSE.ADDRESS_NOT_FOUND);
    }

    res.status(STATUSCODE.OK).render("editAddress", { userData, Address: address });
  } catch (error) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).send(RESPONSE.SERVER_ERROR);
  }
};

module.exports = {
  loadAddress,
  loadAddAddress,
  addAddress,
  editAddress,
  deleteAddress,
  loadEditAddress,
};