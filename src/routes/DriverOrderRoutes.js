const express = require("express");
const DriverOrderController = require("../controllers/DriverOrderController");
const { verifyToken, requireRole } = require("./authMiddleware");

const router = express.Router();

// Protect all driver endpoints
router.use(verifyToken);
router.use(requireRole("driver"));

router.get("/orders/pending", DriverOrderController.getPendingOrders);
router.put("/orders/:id/accept", DriverOrderController.acceptOrder);
router.put("/orders/:id/complete", DriverOrderController.completeOrder);
router.get("/my-orders", DriverOrderController.getMyOrders);

module.exports = router;
