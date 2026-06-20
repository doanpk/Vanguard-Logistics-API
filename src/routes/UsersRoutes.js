const express = require("express");
const UsersController = require("../controllers/UsersController");
const { verifyToken } = require("./authMiddleware");

const router = express.Router();

router.use(verifyToken);

/**
 * @openapi
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get("/profile", UsersController.getProfile);

/**
 * @openapi
 * /api/users/wallet/deposit:
 *   post:
 *     summary: Deposit money into wallet
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Deposited successfully
 */
router.post("/wallet/deposit", UsersController.deposit);

// Admin-only user management routes
const { requireRole } = require("./authMiddleware");
router.get("/all", requireRole("manager"), UsersController.getAllUsers);
router.put("/:id/lock", requireRole("manager"), UsersController.lockUser);
router.put("/:id/unlock", requireRole("manager"), UsersController.unlockUser);

module.exports = router;
