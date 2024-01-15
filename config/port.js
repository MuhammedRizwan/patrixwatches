module.exports=async()=>{
    await Porty.find({
        min: 8080,
        max: 8090,
        avoids: [8081, 8080, 8082, 8083, 8084]
    });
} 