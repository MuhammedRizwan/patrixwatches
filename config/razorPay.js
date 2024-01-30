const Razorpay = require('razorpay');

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});
const GenarateOrder = (orderId, total) => {
  var options = {
    amount: total,  // amount in the smallest currency unit
    currency: "INR",
    receipt: String(orderId)
  };
  instance.orders.create(options, function (err, order) {
    return res.status(200).send({orderId:orderId});
  });
}