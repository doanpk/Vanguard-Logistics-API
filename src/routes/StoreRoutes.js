const express = require("express");
const StoreOrderController = require("../controllers/StoreOrderController");
const { verifyToken, requireRole } = require("./authMiddleware");

const router = express.Router();

router.use(verifyToken);
router.use(requireRole("store"));

/**
 * @openapi
 * /api/store/menu:
 *   get:
 *     summary: Get store menu
 *     tags:
 *       - Store Orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Menu retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get("/menu", StoreOrderController.getMenu);

/**
 * @openapi
 * /api/store/menu:
 *   post:
 *     summary: Add item to store menu
 *     tags:
 *       - Store Orders
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Menu item added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post("/menu", StoreOrderController.addMenuItem);

/**
 * @openapi
 * /api/store/orders:
 *   get:
 *     summary: Get incoming orders for store
 *     tags:
 *       - Store Orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Store orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get("/orders", StoreOrderController.getOrders);

/**
 * @openapi
 * /api/store/orders/{id}/accept:
 *   put:
 *     summary: Accept and start preparing an order
 *     tags:
 *       - Store Orders
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
 *         description: Order accepted
 */
router.put("/orders/:id/accept", StoreOrderController.acceptOrder);

router.put("/orders/:id/reject", StoreOrderController.rejectOrder);

router.put("/status", StoreOrderController.toggleStatus);

module.exports = router;
