const express = require("express");
const OrderController = require("../controllers/OrderController");

const router = express.Router();

/**
 * @openapi
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     description: Retrieves a list of all delivery orders in the system, sorted by most recent first. This is an admin/public endpoint.
 *     tags:
 *       - Orders (Admin)
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
 *     summary: Create a new order (admin)
 *     description: Creates a new delivery order directly. This is an admin/public endpoint that accepts customerName and deliveryAddress.
 *     tags:
 *       - Orders (Admin)
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
 *       - Orders (Admin)
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
