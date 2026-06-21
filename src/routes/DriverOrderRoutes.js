const express = require("express");
const DriverOrderController = require("../controllers/DriverOrderController");
const { verifyToken, requireRole } = require("./authMiddleware");

const router = express.Router();

// Protect all driver endpoints
router.use(verifyToken);
router.use(requireRole("driver"));

/**
 * @openapi
 * /api/driver/orders/pending:
 *   get:
 *     summary: Get all pending orders available for pickup
 *     description: Retrieves a list of all delivery orders with status "pending" that have not yet been assigned to a driver. Only accessible by users with the driver role.
 *     tags:
 *       - Driver Operations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending orders retrieved successfully
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
 *         description: Forbidden – requires driver role
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
router.get("/orders/pending", DriverOrderController.getPendingOrders);

/**
 * @openapi
 * /api/driver/orders/{id}/accept:
 *   put:
 *     summary: Accept a pending order
 *     description: Assigns the authenticated driver to a pending order. Uses an atomic UPDATE to prevent race conditions when multiple drivers try to accept the same order simultaneously.
 *     tags:
 *       - Driver Operations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the order to accept
 *     responses:
 *       200:
 *         description: Order accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request – invalid state transition
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
 *         description: Forbidden – requires driver role
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
 *       409:
 *         description: Conflict – order has already been accepted by another driver
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/orders/:id/accept", DriverOrderController.acceptOrder);

/**
 * @openapi
 * /api/driver/orders/{id}/pickup:
 *   put:
 *     summary: Pickup an order from store
 *     description: Driver picks up the order from the store, changing status to delivering.
 *     tags:
 *       - Driver Operations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order picked up successfully
 */
router.put("/orders/:id/pickup", DriverOrderController.pickupOrder);

/**
 * @openapi
 * /api/driver/orders/{id}/arrive:
 *   put:
 *     summary: Arrive at delivery location
 *     description: Driver arrives at the delivery location, changing status to arrived.
 *     tags:
 *       - Driver Operations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order arrived successfully
 */
router.put("/orders/:id/arrive", DriverOrderController.arriveOrder);

/**
 * @openapi
 * /api/driver/orders/{id}/complete:
 *   put:
 *     summary: Mark an accepted order as completed
 *     description: Marks an order as completed. The order must be in "accepted" status and assigned to the authenticated driver. Drivers cannot complete orders assigned to other drivers.
 *     tags:
 *       - Driver Operations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the order to complete
 *     responses:
 *       200:
 *         description: Order completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request – invalid state transition (only accepted orders can be completed)
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
 *         description: Forbidden – requires driver role, or you can only complete your own orders
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
router.put("/orders/:id/complete", DriverOrderController.completeOrder);

/**
 * @openapi
 * /api/driver/my-orders:
 *   get:
 *     summary: Get all orders assigned to the logged-in driver
 *     description: Retrieves all delivery orders that have been accepted by or completed by the authenticated driver.
 *     tags:
 *       - Driver Operations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver orders retrieved successfully
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
 *         description: Forbidden – requires driver role
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
router.get("/my-orders", DriverOrderController.getMyOrders);

module.exports = router;
