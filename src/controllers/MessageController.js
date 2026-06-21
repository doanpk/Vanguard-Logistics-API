const MessageModel = require("../models/MessageModel");
const OrderModel = require("../models/OrderModel");
const { success } = require("../utils/responseHelper");

class MessageController {
  static async getOrderMessages(req, res, next) {
    try {
      const orderId = req.params.orderId;
      const userId = req.user.id;
      const role = req.user.role;

      // Verify user has access to this order
      const order = await OrderModel.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (
        (role === 'customer' && order.customer_id !== userId) ||
        (role === 'store' && order.store_id !== userId) ||
        (role === 'driver' && order.driver_id !== userId && order.status !== 'finding_driver')
      ) {
        return res.status(403).json({ error: "Access denied to this order's messages" });
      }

      const messages = await MessageModel.getMessagesByOrderId(orderId);
      return success(res, messages, "Messages retrieved");
    } catch (err) {
      next(err);
    }
  }

  static async addMessage(req, res, next) {
    try {
      const orderId = req.params.orderId;
      const userId = req.user.id;
      const role = req.user.role;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Message content cannot be empty" });
      }

      // Verify user has access to this order
      const order = await OrderModel.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (
        (role === 'customer' && order.customer_id !== userId) ||
        (role === 'store' && order.store_id !== userId) ||
        (role === 'driver' && order.driver_id !== userId)
      ) {
        return res.status(403).json({ error: "Access denied to this order's messages" });
      }

      const message = await MessageModel.addMessage(orderId, userId, role, content);
      return success(res, message, "Message sent successfully");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = MessageController;
