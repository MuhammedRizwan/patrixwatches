const otpGenarator = require('otp-generator');
const {Otp} = require('../model/userModel');

const genarateOTP = async (email) => {
const otp = otpGenarator.generate(4, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
    const newOtp = new Otp({
        email: email,
        otp: otp
    });

    await newOtp.save();
}
module.exports = genarateOTP