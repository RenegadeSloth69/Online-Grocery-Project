const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CartItem',
    required: true
  }],
  address1: {
    type: String,
    required: true
  },
  address2: String,
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zipcode: {
    type: String,
    required: true
  },
  absTotal: {
    type: Number,
    required: true
  },
  razorpay_payment_id: {
    type: String
  },
  razorpay_order_id: {
    type: String
  },
  razorpay_signature: {
    type: String
  },
  status:{
    type:String,
    default: "Order Pending",
    required: true,
  },
  deliveredAt:{
    type:Date,    
  }
}, {
  timestamps: true
});


module.exports = mongoose.model("Order", orderSchema);