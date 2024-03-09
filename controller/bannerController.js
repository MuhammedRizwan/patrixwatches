const Banner=require('../model/bannerModel');

const bannerList=async(req,res)=>{
    try {
        const banner=await Banner.find();
        return res.status(200).render("bannerList",{banner});
    } catch (error) {
        console.log(error.message);
    }
}
const addBannerpage=async (req,res)=>{
    try {
        return res.status(200).render('addBanner')
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success:false,message:"Internal Server Error"})

    }
}

const addBanner=async(req,res)=>{
    try {
        console.log(req.files)
       const {title,description,link}=req.body 
       const newBanner=new Banner({
        title,description,link,image:req.files
       })
       const bannerData=await newBanner.save()
       if(bannerData){
        return res.status(200).redirect('/admin/bannerList')
       }
       return res.status(400).json({message:"Cannot Add Banner"})
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success:false,message:"Internal Server Error"})
    }
}


module.exports={
    bannerList,
    addBannerpage,
    addBanner
}