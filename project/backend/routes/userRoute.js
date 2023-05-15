const express = require("express")
const userController = require("../controllers/userController")
const { isAuthenticatedUser , authorizeRoles } = require("../middleware/auth") 
const Product = require("../models/productModel")
const products = Product.find()

const router = express.Router()

// Routes
router.route("/about").get(userController.getAbout)
router.route("/register").post(userController.registerUser).get(userController.getRegisterPage)
router.route("/verify").get(userController.verify)

router.route("/login").post(userController.loginUser,userController.loginRedirect).get(userController.loginHome)

router.route("/password/forgot").post(userController.forgotPassword).get(userController.getForgotPasswordHome)
router.route("/password/reset/:token").post(userController.resetPassword).get(userController.passwordResetPage)
router.route("/logout").get(isAuthenticatedUser,userController.logout)
router.route("/me").get(isAuthenticatedUser, userController.getUserDetails)
router.route("/admin/dashboard").get(isAuthenticatedUser,authorizeRoles("admin"),userController.getDashboard)
router.route("/password/update").post(isAuthenticatedUser, userController.updateUserPassword)
                                .get(isAuthenticatedUser, userController.updatePasswordPage)
router.route("/me/update").post(isAuthenticatedUser, userController.updateProfile)
                            .get(isAuthenticatedUser, userController.updateProfilePage)
router.route("/admin/users").get(isAuthenticatedUser, authorizeRoles("admin"), userController.getAllUser)
router.route("/admin/users/:id").get(isAuthenticatedUser, authorizeRoles("admin"), userController.getSingleUser)
                                .post(isAuthenticatedUser, authorizeRoles("admin"), userController.updateUserRole)
router.route("/admin/users/:id/delete").post(isAuthenticatedUser, authorizeRoles("admin"), userController.deleteUser)
router.route("/recipes").get(userController.getAllRecipe)
router.route("/recipe/new").get(isAuthenticatedUser, userController.enterRecipe).post(isAuthenticatedUser, userController.addRecipe)
router.route("/recipe/:_id").get(userController.getSingleRecipe)
router.route("/recipes/me").get(isAuthenticatedUser, userController.myRecipes)
router.route("/recipes/me/:_id").post(isAuthenticatedUser, userController.deleteRecipe)

module.exports = router