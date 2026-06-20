const express = require("express");
const CustomerOrderController = require("../controllers/CustomerOrderController");
const { verifyToken, requireRole } = require("./authMiddleware");

const router = express.Router();

// Protect all routes below this line with Authentication and Role Check
router.use(verifyToken);
router.use(requireRole("customer"));

/**
 * @openapi
 * /api/customer/orders:
 *   post:
 *     summary: Create a new delivery order
 *     description: Creates a new delivery order for the authenticated customer. The customer ID is automatically extracted from the JWT token.
 *     tags:
 *       - Customer Orders
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request – missing or invalid fields (pickupAddress, deliveryAddress, itemDescription)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized – no token or invalid token provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden – requires customer role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", CustomerOrderController.createOrder);

/**
 * @openapi
 * /api/customer/orders/smart-create:
 *   post:
 *     summary: Smart Create Order (AI API)
 *     description: Creates a new delivery order by parsing a natural language prompt using Google Gemini AI. It automatically extracts pickup address, delivery address, and item description.
 *     tags:
 *       - Customer Orders
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [prompt]
 *             properties:
 *               prompt:
 *                 type: string
 *                 example: "Giao cho mình 1 ly trà sữa từ 123 Lê Lợi, Quận 1 đến 456 Nguyễn Huệ, Quận 1 nhé"
 *     responses:
 *       201:
 *         description: Smart order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request – missing prompt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error (AI processing failed or API key not set)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/smart-create", CustomerOrderController.smartCreateOrder);

/**
 * @openapi
 * /api/customer/orders:
 *   get:
 *     summary: Get all orders for the logged-in customer
 *     description: Retrieves all delivery orders belonging to the authenticated customer, sorted by most recent first.
 *     tags:
 *       - Customer Orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized – no token or invalid token provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden – requires customer role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", CustomerOrderController.getOrders);

/**
 * @openapi
 * /api/customer/orders/{id}:
 *   get:
 *     summary: Get details of a specific order
 *     description: Retrieves detailed information about a specific order belonging to the authenticated customer. Returns 404 if the order doesn't exist or belongs to another customer.
 *     tags:
 *       - Customer Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the order to retrieve
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized – no token or invalid token provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden – requires customer role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", CustomerOrderController.getOrderById);

/**
 * @openapi
 * /api/customer/orders/{id}/cancel:
 *   put:
 *     summary: Cancel a pending order
 *     description: Cancels a delivery order that is currently in 'pending' status. Only the customer who created the order can cancel it. Orders that have already been accepted or completed cannot be cancelled.
 *     tags:
 *       - Customer Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the order to cancel
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request – order cannot be cancelled (invalid state transition)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized – no token or invalid token provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden – requires customer role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflict – order was modified by another process
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/:id/cancel", CustomerOrderController.cancelOrder);

module.exports = router;
