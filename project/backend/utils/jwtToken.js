// Creating token and saving in cookies
const Product = require("../models/productModel")
const products = Product.find()
const sendToken = (user,statusCode,res)=>{
    const token = user.getJWTToken()

    // options for cookie
    const options = {
        expires:new Date(
            Date.now() + process.env.COOKIE_EXPIRE * 24 *60*60*1000
        ),
        httpOnly:true,
    }

    res.cookie('token', token, options).status(statusCode).redirect(user.role === "admin"?'/api/v1/products':'/api/v1/products');

}

module.exports = sendToken