const DriverOrderService = require("../services/DriverOrderService");
const { success } = require("../utils/responseHelper");

class DriverOrderController {
  static async getPendingOrders(req, res, next) {
    try {
      const orders = await DriverOrderService.getPendingOrders();
      return success(res, orders, "Pending orders retrieved");
    } catch (err) {
      next(err);
    }
  }

  static async acceptOrder(req, res, next) {
    try {
      const driverId = req.user.id;
      const { id } = req.params;
      const order = await DriverOrderService.acceptOrder(id, driverId);
      return success(res, order, "Order accepted successfully");
    } catch (err) {
      next(err);
    }
  }

  static async completeOrder(req, res, next) {
    try {
      const driverId = req.user.id;
      const { id } = req.params;
      const order = await DriverOrderService.completeOrder(id, driverId);
      return success(res, order, "Order completed successfully");
    } catch (err) {
      next(err);
    }
  }

  static async getMyOrders(req, res, next) {
    try {
      const driverId = req.user.id;
      const orders = await DriverOrderService.getDriverOrders(driverId);
      return success(res, orders, "Driver orders retrieved");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DriverOrderController;
