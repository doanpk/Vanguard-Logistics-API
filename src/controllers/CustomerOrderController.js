const CustomerOrderService = require("../services/CustomerOrderService");

class CustomerOrderController {
  static async createOrder(req, res) {
    try {
      const customerId = req.user.id; // Taken from JWT
      const newOrder = await CustomerOrderService.createOrder(
        customerId,
        req.body,
      );
      res.status(201).json({
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

  static async getOrders(req, res) {
    try {
      const customerId = req.user.id;
      const orders = await CustomerOrderService.getCustomerOrders(customerId);
      res.status(200).json({
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

  static async getOrderById(req, res) {
    try {
      const customerId = req.user.id;
      const order = await CustomerOrderService.getOrderDetails(
        req.params.id,
        customerId,
      );
      res
        .status(200)
        .json({
          status: "success",
          message: "Order details retrieved",
          data: order,
        });
    } catch (error) {
      const statusCode =
        error.message === "Order not found or access denied." ? 404 : 400;
      res
        .status(statusCode)
        .json({ status: "error", message: error.message, data: null });
    }
  }
}

module.exports = CustomerOrderController;
