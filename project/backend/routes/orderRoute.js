const express = require("express");
const orderController = require("../controllers/orderController") 
const router = express.Router();

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

router.route("/order").get(isAuthenticatedUser, orderController.getOrderPage)
router.route("/order").post(isAuthenticatedUser, orderController.processOrder);
router.route("/orders/me").get(isAuthenticatedUser, orderController.myOrders);
router.route("/admin/orders").get(isAuthenticatedUser, authorizeRoles("admin"), orderController.getAllOrders);
router.route("/admin/order/:id").get(isAuthenticatedUser, authorizeRoles("admin"), orderController.getSingleOrder)
router.route("/admin/order/:id/update").post(isAuthenticatedUser, authorizeRoles("admin"), orderController.updateOrder)


module.exports = router;