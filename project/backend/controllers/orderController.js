const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Cart = require("../models/cartModel")
const Razorpay = require("razorpay")

const razorpay = new Razorpay({
  key_id: 'rzp_test_QDkcVoQ6q5YV4l',
  key_secret: 'KLwnPj3asqQ7aBwmtNoViI8D',
});

// get order page
exports.getOrderPage = catchAsyncErrors(async(req,res,next)=>{
  try {
    const cartItems = await Cart.find({ user: req.user.id }).populate('product');
    const absTotal = cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
    res.render('../../frontend/views/ordering.pug', { cart: cartItems, absTotal });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
})

// process payment and create order when payment is successful
exports.processOrder = catchAsyncErrors(async(req,res,next)=>{
  const { name, address1, address2, city, state, zipcode, card_number, card_expiry, card_cvc, absTotal } = req.body;
  const email = req.user.email
  const options = {
    amount: absTotal * 100, // Razorpay requires the amount in paise
    currency: 'INR',
    receipt: 'order_rcptid_11',
    payment_capture: 1,
  };

  try {
    const response = await razorpay.orders.create(options);

    // create an array of product ids from the user's cart
    const cartItems = await Cart.find({ user: req.user.id }).populate('product', '_id stock');
    const productIds = cartItems.map(item => item.product._id);

    // retrieve the product objects from the database
    const products = await Product.find({ _id: { $in: productIds } });

    // update the stock property of each product object
    products.forEach(product => {
      const cartItem = cartItems.find(item => item.product._id.equals(product._id));
      product.stock -= 1;
    });

    // save the updated product objects back to the database
    await Promise.all(products.map(product => product.save()));

    // create a new order object to save into the database
    const newOrder = new Order({
      name,
      email,
      address1,
      address2,
      city,
      state,
      zipcode,
      absTotal,
      products: productIds, // pass the array of product ids to the model
      razorpay_order_id: response.id
    });

    // save the order object into the database
    await newOrder.save();
    // clear the cart items once the order is placed
    await Cart.deleteMany({ user: req.user.id });

    res.render('../../frontend/views/orderConfirmation.pug', { order_id: response.id, name, email });
  } catch (error) {
    res.render('../../frontend/views/orderError.pug', { error });
  }
});


// get Single Order
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id)

  if (!order) {
    return next(new ErrorHandler("Order not found with this Id", 404));
  }

  res.render("../../frontend/views/viewSingleOrder.pug", {order})
});

// get logged in user  Orders
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
  try {
    const orders = await Order.find({ email: req.user.email }).sort({ createdAt: 'desc' });
    const productIds = orders.map(order => order.products);
    let products = [];
    for (let ids of productIds) {
      let prodNames = [];
      for (let id of ids) {
        const prod = await Product.findById(id);
        prodNames.push(prod.name);
      }
      products.push(prodNames);
      prodNames = []
    }
    res.render('../../frontend/views/myOrders.pug', { orders, products });
  } catch (error) {
    console.error(error);
  }
});

// get all Orders -- Admin
exports.getAllOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find();

  let totalAmount = 0;

  orders.forEach((order) => {
    totalAmount += order.absTotal;
  });

  res.render("../../frontend/views/viewOrders.pug", {orders, totalAmount})
});

// update Order Status -- Admin
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found with this Id", 404));
  }

  if(order.status === "Order Pending"){
    await order.updateOne({status: "Shipped"})
  }

  if (order.status === "Shipped") {
    await order.updateOne({status: "Delivered"})
    order.deliveredAt = Date.now();
  }

  await order.save({ validateBeforeSave: false });
  res.redirect("/api/v1/admin/orders")
});

async function updateStock(id, quantity) {
  const product = await Product.findById(id);

  product.Stock -= quantity;

  await product.save({ validateBeforeSave: false });
}