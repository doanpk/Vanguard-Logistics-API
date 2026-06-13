const express = require("express");
const CustomerOrderController = require("../controllers/CustomerOrderController");
const { verifyToken, requireRole } = require("./authMiddleware");

const router = express.Router();

// Protect all routes below this line with Authentication and Role Check
router.use(verifyToken);
router.use(requireRole("customer"));

router.post("/", CustomerOrderController.createOrder);
router.get("/", CustomerOrderController.getOrders);
router.get("/:id", CustomerOrderController.getOrderById);

module.exports = router;
