const User = require("../models/userModel")
const ErrorHandler = require("../utils/errorHandler")
const catchAsyncErrors = require("../middleware/catchAsyncErrors")
const sendToken = require("../utils/jwtToken")
const sendEmail = require("../utils/sendEmail")
const crypto = require("crypto")
const path = require('path');
const Product = require('../models/productModel')
const pug = require('pug');
const { isAuthenticatedUser } = require("../middleware/auth")
const markdownIt = require('markdown-it');
const md = new markdownIt();
const Recipe = require("../models/recipeModel")

const compiledFunction = pug.compileFile(path.resolve(__dirname, '..', '..', 'frontend', 'components', 'ProductCard', 'productCard.pug'));
// get about page
exports.getAbout = catchAsyncErrors(async(req,res,next)=>{
    res.render("../../frontend/views/about.pug")
})
// get register page
exports.getRegisterPage = catchAsyncErrors(async(req,res,next)=>{
    res.render("../../frontend/views/signup.pug")
})

// Register our user
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password } = req.body;
  
    if (!name || !email || !password) {
        if(!name){
            const message = "Please enter your name";
            return res.render("../../frontend/views/signup.pug", { message: message });
        }
        else if(!email){
            const message = "Please enter your email";
            return res.render("../../frontend/views/signup.pug", { message: message });
        }
        else if(!password){
            const message = "Please enter your password";
            return res.render("../../frontend/views/signup.pug", { message: message });
        }        
        else{
            const message = "Please enter all fields";
            return res.render("../../frontend/views/signup.pug", { message: message });
        }        
    }
  
    const user = await User.create({
      name,
      email,
      password,
    });
  
    const userToVerify = await User.findOne({ email });
    const verifyUserUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/verify?id=${userToVerify._id}`;
  
    const message = `Your verification email is:- \n\n${verifyUserUrl}\n\nIf you didnt request for this email, please ignore`;
  
    try {
      await sendEmail({
        email: user.email,
        subject: `Marike's Online Grocery user verification mail`,
        message,
      });
  
      res.status(200).json({
        success: true,
        message: `Email sent to ${user.email} successfully`,
      });
    } catch (error) {
      await user.save({ validateBeforeSave: false });
      const message = "Enter all the fields";
      return res.render("../../frontend/views/signup.pug", { message: message });
    }
  
    sendToken(user, 201, res);
  });
  

// verify user
exports.verify = catchAsyncErrors(async(req,res,next)=>{
    const userVerify = await User.updateOne({
        _id: req.query.id
    },{
        $set:{isVerified:true}
    })
    res.send(
        "<h1>Your email has been verified.</h1>"
      )
})

// get login page
exports.loginHome = catchAsyncErrors(async(req,res,next)=>{
    res.render('../../frontend/views/login.pug')
})

//login user
exports.loginUser = catchAsyncErrors(async(req,res,next)=>{
    const products = await Product.find()
    const email = req.body.email
    const password = req.body.password
    // checking if user has given password and email both
    if(!email || !password){
        const message = "Invalid username or password"
        res.render("../../frontend/views/login.pug", {message:message})    }
    
    const user = await User.findOne({ email }).select("+password")

    if(!user){
        const message = "Invalid username or password"
        res.render("../../frontend/views/login.pug", {message:message})
        // return next(new ErrorHandler("Invalid email or password",401))
    }
    else{
        const isPasswordMatched = await user.comparePassword(password)
        const isAuthenticatedUser = require("../middleware/auth")
        if(isPasswordMatched){
            const isVerified = user.isVerified
            if(isVerified == "true"){
                sendToken(user,200,res) 
            }
            else{
                const message = "Please verify your email"
                res.render("../../frontend/views/login.pug", {message:message})
            }  
        }
        else{
            const message = "Invalid username or password"
            res.render("../../frontend/views/login.pug", {message:message})        } 
    }
    })

// redirect after login
exports.loginRedirect = catchAsyncErrors(async(req,res,next)=>{
    const products = await Product.find()
    res.redirect('/api/v1/products')
})

// logout our user
exports.logout = catchAsyncErrors(async(req,res,next)=>{
    const products = await Product.find()
    res.cookie("token",null,{
        expires:new Date(Date.now()),
        httpOnly:true,
    })
    res.render("../../frontend/views/login.pug")
})

// get page for forgot password
exports.getForgotPasswordHome = catchAsyncErrors(async(req,res,next)=>{
    res.render("../../frontend/views/forgotPassword.pug")
})

// Forgot password
exports.forgotPassword = catchAsyncErrors(async(req,res,next)=>{
    const user = await User.findOne({email:req.body.email})
    if(user){
        // Get ResetPassword Token
        const resetToken = user.getResetPasswordToken()
        await user.save({validateBeforeSave:false})

        const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`

        const message = `Your password reset token is :- \n\n${resetPasswordUrl} \n\nIf you have not
        requested this email, then please ignore it. `

        try {
            await sendEmail({
                email:user.email,
                subject:`Marike's Online Grocery password reset email`,
                message,
            })

            res.status(200).json({
                success:true,
                message:`Email sent to ${user.email} successfully`,
            })
        } catch (error) {
            user.resetPasswordToken = undefined
            user.resetPasswordExpire = undefined

            await user.save({validateBeforeSave:false})
            return next(new ErrorHandler(error.message, 500))
        }
    }else{
        return next(new ErrorHandler("User not found",404))
    }
})

// get password reset page
exports.passwordResetPage = catchAsyncErrors(async(req,res,next)=>{
    res.render("../../frontend/views/passwordReset.pug", {token:req.params.token})
})

// reset password
exports.resetPassword = catchAsyncErrors(async(req,res,next)=>{
    // creating token hash
    const resetPasswordToken = crypto.createHash("sha256")
                                    .update(req.params.token)
                                    .digest("hex")

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
      });
      
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token."
        });
      }

      if(req.body.password === req.body.confirmPassword){
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
      
        await user.save();
      }
      else{
        return res.status(400).json({
            success: false,
            message: "Dont mAtch"
          });
      }
      
      // Send an email to the user notifying them that their password has been changed
      
      res.status(200).json({
        success: true,
        message: "Password reset successfully."
      });
})

// get user details
exports.getUserDetails = catchAsyncErrors(async(req,res,next)=>{
    const user = await User.findById(req.user.id)

    res.render('../../frontend/views/profile.pug',{user})
})

// update password page
exports.updatePasswordPage = catchAsyncErrors(async(req,res,next)=>{
    res.render("../../frontend/views/passwordUpdate.pug")
})

// update user password
exports.updateUserPassword = catchAsyncErrors(async(req,res,next)=>{
    const user = await User.findById(req.user.id).select("+password")

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword)
    if(isPasswordMatched){
        if(req.body.newPassword == req.body.confirmNewPassword){
            user.password = req.body.newPassword
            await user.save()

            sendToken(user,200,res)
        }else{
            return next(new ErrorHandler("Entered new passwords dont match"))
        }
    }else{
        return next(new ErrorHandler("Old password is incorrect",400))
    } 
})

// get page for updating user profile
exports.updateProfilePage = catchAsyncErrors(async(req,res,next)=>{
    res.render("../../frontend/views/profileUpdate.pug")
})

// update User Profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
      name: req.body.name,
      email: req.body.email,
    }
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    })
  
    res.redirect('/api/v1/me')
  })

// Get all users(admin)
exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find()
  
    res.render('../../frontend/views/users-admin.pug',{users:users})
})

// Get single user (admin)
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id)
  
    if (!user) {
      return next(
        new ErrorHander(`User does not exist with Id: ${req.params.id}`)
      )
    }
  
    res.render("../../frontend/views/profiles-admin.pug",{user:user,req})
})

// update User Role -- Admin
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
    };
  
    await User.findByIdAndUpdate(req.params.id, newUserData, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
  
    res.redirect("/api/v1/admin/users")
});

// Delete User --Admin
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);
  
    if (!user) {
      return next(
        new ErrorHander(`User does not exist with Id: ${req.params.id}`, 400)
      );
    }
  
    await User.findByIdAndDelete(req.params.id)
  
    res.redirect("/api/v1/admin/users")
  });

exports.getDashboard = catchAsyncErrors(async(req,res,next)=>{
    res.render('../../frontend/views/dashboard.pug')
})

// render page to enter recipe
exports.enterRecipe = catchAsyncErrors(async(req,res,next)=>{
    res.render("../../frontend/views/recipeForm.pug")
})

// add new recipe
exports.addRecipe = catchAsyncErrors(async(req,res,next)=>{
    const title = req.body.title;
    const date = req.body.date;
    const ingredients = req.body.ingredients
    const instructions = req.body.instructions;

    const recipe = new Recipe({
        title: title,
        date: date,
        author:req.user.id,
        ingredients: ingredients,
        instructions: instructions,
    });

    await recipe.save();

    res.redirect("/api/v1/recipes")

})

// display all recipes
exports.getAllRecipe = catchAsyncErrors(async(req,res,next)=>{
    const recipes = await Recipe.find().populate('author', 'name')
    if (!recipes) {
        return res.status(404).json({
          success: false,
          message: 'No recipes',
        });
    }

    res.render("../../frontend/views/allRecipe.pug", {recipes})
})

// display the particular recipe
exports.getSingleRecipe = catchAsyncErrors(async (req, res, next) => {
    const recipe = await Recipe.findById(req.params._id).populate('author', 'name');
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found',
      });
    }
    const instructionHtml = md.render(recipe.instructions);
    const ingredientHtml = md.render(recipe.ingredients);
    res.render('../../frontend/views/singleRecipe.pug', { ingredientHtml, instructionHtml, recipe });
});

// get recipes of logged in user
exports.myRecipes = catchAsyncErrors(async(req,res,next)=>{
    const recipes = await Recipe.find({author: req.user.id});  
    if (!recipes) {
        return res.status(404).json({
          success: false,
          message: 'You have not created any recipes',
        });
    }

    res.render("../../frontend/views/myRecipes.pug", {recipes})
})

// delete my recipe
exports.deleteRecipe = catchAsyncErrors(async(req,res,next)=>{
    await Recipe.findOneAndDelete(req.params._id)
    res.redirect("/api/v1/recipes/me")
})