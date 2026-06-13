const OrderService = require("../services/OrderService");

class OrderController {
  static async getOrders(req, res) {
    try {
      const orders = await OrderService.getAllOrders();
      res
        .status(200)
        .json({
          status: "success",
          message: "Orders retrieved successfully",
          data: orders,
        });
    } catch (error) {
      res
        .status(500)
        .json({ status: "error", message: error.message, data: null });
    }
  }

  static async createOrder(req, res) {
    try {
      const newOrder = await OrderService.createOrder(req.body);
      res
        .status(201)
        .json({
          status: "success",
          message: "Order created successfully",
          data: newOrder,
        });
    } catch (error) {
      res
        .status(400)
        .json({ status: "error", message: error.message, data: null });
    }
  }

  static async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedOrder = await OrderService.updateOrderStatus(id, status);
      res
        .status(200)
        .json({
          status: "success",
          message: "Order status updated successfully",
          data: updatedOrder,
        });
    } catch (error) {
      const statusCode = error.message === "Order not found." ? 404 : 400;
      res
        .status(statusCode)
        .json({ status: "error", message: error.message, data: null });
    }
  }
}

module.exports = OrderController;
