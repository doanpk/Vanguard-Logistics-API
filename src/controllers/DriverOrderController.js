const DriverOrderService = require("../services/DriverOrderService");

class DriverOrderController {
  static async getPendingOrders(req, res) {
    try {
      const orders = await DriverOrderService.getPendingOrders();
      res
        .status(200)
        .json({
          status: "success",
          message: "Pending orders retrieved",
          data: orders,
        });
    } catch (error) {
      res
        .status(500)
        .json({ status: "error", message: error.message, data: null });
    }
  }

  static async acceptOrder(req, res) {
    try {
      const driverId = req.user.id;
      const { id } = req.params;
      const order = await DriverOrderService.acceptOrder(id, driverId);
      res
        .status(200)
        .json({
          status: "success",
          message: "Order accepted successfully",
          data: order,
        });
    } catch (error) {
      const statusCode = error.message.includes("not found") ? 404 : 400;
      res
        .status(statusCode)
        .json({ status: "error", message: error.message, data: null });
    }
  }

  static async completeOrder(req, res) {
    try {
      const driverId = req.user.id;
      const { id } = req.params;
      const order = await DriverOrderService.completeOrder(id, driverId);
      res
        .status(200)
        .json({
          status: "success",
          message: "Order completed successfully",
          data: order,
        });
    } catch (error) {
      const statusCode = error.message.includes("not found") ? 404 : 400;
      res
        .status(statusCode)
        .json({ status: "error", message: error.message, data: null });
    }
  }

  static async getMyOrders(req, res) {
    try {
      const driverId = req.user.id;
      const orders = await DriverOrderService.getDriverOrders(driverId);
      res
        .status(200)
        .json({
          status: "success",
          message: "Driver orders retrieved",
          data: orders,
        });
    } catch (error) {
      res
        .status(500)
        .json({ status: "error", message: error.message, data: null });
    }
  }
}

module.exports = DriverOrderController;
