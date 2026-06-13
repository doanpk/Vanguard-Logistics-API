const express = require("express");
const OrderController = require("../controllers/OrderController");

const router = express.Router();

router.get("/", OrderController.getOrders);
router.post("/", OrderController.createOrder);
router.patch("/:id/status", OrderController.updateOrderStatus);

module.exports = router;
