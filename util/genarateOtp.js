const otpGenarator = require('otp-generator');
const Otp=require('../model/userModel');
 

const genarateOTP=async (email)=> {
    const otp = otpGenarator.generate(4, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
    const newOtp=new Otp({
        email:email,
        otp:otp
    })
    await newOtp.save()
    .then(doc => {
        console.log('OTP saved successfully:', doc);
    })
    .catch(error => {
        console.error('Error saving OTP:', error);
    });
}
module.exports=genarateOTP