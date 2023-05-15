const ErrorHandler = require("../utils/errorHandler")
const catchAsyncErrors = require("./catchAsyncErrors")
const jwt = require("jsonwebtoken")
const User = require("../models/userModel")
const path = require('path');
const Product = require('../models/productModel')
const pug = require('pug');

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;
  let isUserAuthenticated = false;
  let isUserAdmin = false

  if (token) {
    try {
      // Verify the JWT token
      const decodedData = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user by ID
      const user = await User.findById(decodedData.id);
      const checkUserRole = user.role
      if (user) {
        if(checkUserRole == "admin"){
          isUserAdmin = true
        }
        // If the user exists, set the isUserAuthenticated variable to true
        isUserAuthenticated = true;
        // Set the user object on req.user
        req.user = user;
      }
    } catch (error) {
      // Do nothing if there is an error verifying the JWT token
    }
  }

  // Add the isUserAuthenticated variable to the locals object
  res.locals.isUserAuthenticated = isUserAuthenticated;
  res.locals.isUserAdmin = isUserAdmin;

  next();
});


exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role: ${req.user.role} is not allowed to access this resouce `,
          403
        )
      )
    }

    next()
  }
}