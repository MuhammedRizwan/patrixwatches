const nodemailer = require('nodemailer');


const sendVerifyMail = async (name, email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.MAIL,
                pass: process.env.PASS
            }
        });

        const mailOptions = {
            from: process.env.MAIL,
            to: email,
            subject: 'For OTP Verification',
            html: '<p>Hii ' + name + ' ,<br> your OTP :' + otp + '</p>'

        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }
            else {
                console.log("Email has been sent:-", info.response);
            }
        })
    } catch (error) {
        console.log(error.message);
    }
}
module.exports=sendVerifyMail
