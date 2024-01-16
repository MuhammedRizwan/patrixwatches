const {User} = require('../model/userModel');
const bcrypt = require('bcrypt');
const jwt=require('jsonwebtoken');
// const randomstring=require('randomstring');
// const nodemailer=require('nodemailer');

// const securePassword=async(password)=>{
//     try {
//         const passwordHash=await bcrypt.hash(password,10);
//         return passwordHash;
//     } catch (error) {
//         console.log(error.message);
//     }
// }

const genarateToken=(user)=>{
  
    return jwt.sign({user},process.env.SECRETKEY,{expiresIn:'2h'})
}
const adminLoginPage = async (req, res) => {
    try {
        res.status(200).render('adminLogin');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}
// const addUserMail=async (name,email,password,user_id)=>{
//     try {
//         const transporter=nodemailer.createTransport({
//             host:'smtp.gmail.com',
//             port:587,
//             secure:false,
//             auth:{
//                 user:process.env.MAIL,
//                 pass:process.env.PASS
//             }
//         });

//         const mailOptions={
//             from:process.env.MAIL,
//             to:email,
//             subject:'Admin add you and Verify mail',
//             html:'<p>Hii '+name+' , please click here to <a href="http://127.0.0.1:8000/verify?id='+user_id+'">Verify </a> Your mail.</p><br><br> <b>Email:-</b>'+email+'<br><b>Password:-</b>'+password
//         }
//         transporter.sendMail(mailOptions,function(error,info){
//             if(error){
//                 console.log(error);
//             }
//             else{
//                 console.log("Email has been sent:-",info.response);
//             }
//         })
//     } catch (error) {
//         console.log(error.message);
//     }
// }

const adminLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const adminData = await User.findOne({ email: email })
        if (adminData) {
            const matchPassword = await bcrypt.compare(password, adminData.password);
            if (matchPassword) {
                if (adminData.is_admin === 0) {
                    res.status(404).render('adminLogin', { message: "your are not a admin" })
                } else {
                    const token=genarateToken(adminData);
                    const options = {
                        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                        httpOnly: true
                    }
                    res.status(200).cookie("token", token, options).redirect('/admin/home');
                }
            }
            else {
                res.status(404).render('adminLogin', { message: "invalid password" })
            }
        } else {
            res.status(404).render('adminLogin', { message: "invalid Email" })
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}
const Dashboard = async (req, res) => {
    try {
        const userData = await User.find({ is_admin: 0 });
        res.status(200).render('adminDashboard', { users: userData });
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Internal Server Error');
    }
}
const userList = async (req, res) => {
    try {
        const userData = await User.find({ is_admin: 0 });
        res.status(200).render('user', { users: userData });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}
const Logout = async (req, res) => {
    try {
        res.clearCookie("token").redirect('/admin');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}
const blockUser = async (req, res) => {
    try {
        const userId = req.body.userId; // Assuming you send the user ID in the request body
        const userData = await User.findByIdAndUpdate(userId, { is_block: true });
        if (!userData) {
            return res.status(404).send('User not found'); // Inform if the user was not found
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const unblockUser = async (req, res) => {
    try {
        const userId = req.body.userId;
        const userData = await User.findByIdAndUpdate(userId, { is_block: false });
        if (!userData) {
            return res.status(404).send('User not found');
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};
// const newUserPage=async (req,res)=>{
// //     try {
//         res.render('newUser')
//     } catch (error) {
//         console.log(error.message);
//     }
// }
// const newUser=async (req,res)=>{
//     try {
//         const name=req.body.name;
//         const email=req.body.email;
//         const phone=req.body.phone;
//         const image=req.file.filename;
//         const password=randomstring.generate(8);

//         const spassword=await securePassword(password)
//         const user=new User({
//             name:name,
//             email:email,
//             phone:phone,
//             image:image,
//             password:spassword,
//             is_admin:0
//         })
//         const userData=await user.save();
//         if(userData){
//             addUserMail(name,email,password,userData._id);
//             res.redirect('/admin/home')
//         }else{
//             res.render('newUser',{message:"something Wrong"})
//         }
//     } catch (error) {
//         console.log(error.message);
//     }
// }
// const editUserPage=async(req,res)=>{ 
//     try {
//         const id=req.query.id;
//         const userData=await User.findById({_id:id});
//         if(userData){
//             res.render('editUser',{users:userData})
//         }else{
//             res.redirect('/admin/home')
//         }

//     } catch (error) {
//         console.log(error.message);
//     }
// }
// const editUser=async (req,res)=>{
//     try {
//         const id=req.query.id;
//         const UserData=await User.updateOne({_id:id},{$set:{name:req.body.name,
//             email:req.body.email,phone:req.body.phone,is_verified:req.body.verify}});
//         res.redirect('/admin/home');
//     } catch (error) {
//         console.log(error.message);
//     }
// }
const deleteUser = async (req, res) => {
    try {
        const id = req.params.userId;
        console.log(id);
        const userData = await User.deleteOne({ _id: id });
        if (userData.deletedCount === 0) {
            return res.status(404).send('User not found or already deleted');
        }

        res.status(200).send('User deleted successfully');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}
module.exports = {
    adminLoginPage,
    adminLogin,
    Dashboard,
    userList,
    Logout,
    // newUserPage,
    // newUser,
    // editUserPage,
    // editUser,
    deleteUser,
    blockUser,
    unblockUser
}

