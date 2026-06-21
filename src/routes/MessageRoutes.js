const express = require("express");
const MessageController = require("../controllers/MessageController");
const { verifyToken } = require("./authMiddleware");

const router = express.Router();

// Tất cả endpoints đều cần đăng nhập
router.use(verifyToken);

/**
 * @openapi
 * /api/messages/{orderId}:
 *   get:
 *     summary: Get all messages for an order
 *     tags:
 *       - Messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/:orderId", MessageController.getOrderMessages);

/**
 * @openapi
 * /api/messages/{orderId}:
 *   post:
 *     summary: Send a message to an order group chat
 *     tags:
 *       - Messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.post("/:orderId", MessageController.addMessage);

module.exports = router;
