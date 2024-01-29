const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id:process.env.RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});
const GenarateOrder=(orderId,total)=>{
    return new Promise.all((resolve,reject)=>{
        var options = {
            amount: total,  // amount in the smallest currency unit
            currency: "INR",
            receipt: String(orderId)
          };
          instance.orders.create(options, function(err, order) {
            console.log(order);
          });
    })
}