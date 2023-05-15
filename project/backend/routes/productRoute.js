const express = require("express")
const productController = require("../controllers/productController")
const { isAuthenticatedUser,authorizeRoles } = require("../middleware/auth")


const router = express.Router()

// Routes
router.route("/products").get(isAuthenticatedUser,productController.getAllProducts)
router.route("/add-to-cart").post(isAuthenticatedUser, productController.addToCart)
router.route("/cart").get(isAuthenticatedUser,productController.displayCart)
router.route("/cart/:id").delete(isAuthenticatedUser, productController.removeFromCart)
                        .put(isAuthenticatedUser, productController.updateCart)
router.route("/admin/products").get(isAuthenticatedUser,authorizeRoles("admin"),productController.adminProduct)
router.route("/admin/product/new").post(isAuthenticatedUser,authorizeRoles("admin"), productController.createProduct).get(isAuthenticatedUser, authorizeRoles("admin"), productController.addProductDash)
router.route("/admin/product/:id").post(isAuthenticatedUser,authorizeRoles("admin"), productController.updateProduct)
                                    .get(isAuthenticatedUser,authorizeRoles("admin"), productController.productUpdateRedirect)
router.route("/admin/product/:id/delete").post(isAuthenticatedUser,authorizeRoles("admin"), productController.deleteProduct)
router.route("/product/:id").get(isAuthenticatedUser,productController.getProductDetails)
router.route("/product/:id/reviews").post(isAuthenticatedUser, productController.createProductReview)
router.route("/reviews").get(isAuthenticatedUser, productController.getProductReviews)

module.exports = router