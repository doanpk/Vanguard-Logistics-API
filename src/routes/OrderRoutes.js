const express = require("express");
const OrderController = require("../controllers/OrderController");
const { verifyToken, requireRole } = require("./authMiddleware");

const router = express.Router();

// Protect all manager endpoints
router.use(verifyToken);
router.use(requireRole("manager"));

/**
 * @openapi
 * /api/orders/dashboard:
 *   get:
 *     summary: Get manager dashboard statistics
 *     description: Retrieves total orders and count by status.
 *     tags:
 *       - Orders (Manager)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get("/dashboard", OrderController.getDashboard);

/**
 * @openapi
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     description: Retrieves a list of all delivery orders in the system, sorted by most recent first. This is a manager endpoint.
 *     tags:
 *       - Orders (Manager)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", OrderController.getOrders);

/**
 * @openapi
 * /api/orders:
 *   post:
 *     summary: Create a new order (manager)
 *     description: Creates a new delivery order directly. This is a manager endpoint that accepts customerName and deliveryAddress.
 *     tags:
 *       - Orders (Manager)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminCreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request – missing required fields (customerName, deliveryAddress)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", OrderController.createOrder);

/**
 * @openapi
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update an order's status
 *     description: Updates the status of an existing order by its ID. Validates the transition using the order state machine (pending→accepted/cancelled, accepted→completed).
 *     tags:
 *       - Orders (Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the order to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrderStatusRequest'
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request – missing fields or invalid status transition
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:id/status", OrderController.updateOrderStatus);

module.exports = router;
