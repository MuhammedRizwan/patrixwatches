const nodemailer = require('nodemailer');

const sendVerifyMail = async (req, email, name, user_id) => {
  try {
    const otp = generateOTP(4);
    req.session.otp = otp;
    console.log(req.session.otp, 'otp', email);
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.MAIL_SERVICE,
        pass: process.env.MAIL_PASSWORD,
      },
    });
    const mailOptions = {
      from: process.env.MAIL_SERVICE ,
      to: email,
      subject: 'For verification purpose',
      html: `Hello ${name}, your OTP for verification is: ${otp}`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Email has been sent:', info.response);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

function generateOTP(length) {
  const characters = '0123456789'; // The characters to use for the OTP
  let otp = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    otp += characters[randomIndex];
  }

  return otp;
}

module.exports = {
  sendVerifyMail, // Fix the function name here
};
