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

  static async arriveStore(req, res, next) {
    try {
      const driverId = req.user.id;
      const { id } = req.params;
      const order = await DriverOrderService.arriveStoreOrder(id, driverId);
      return success(res, order, "Driver arrived at store successfully");
    } catch (err) {
      next(err);
    }
  }

  static async pickupOrder(req, res, next) {
    try {
      const driverId = req.user.id;
      const { id } = req.params;
      const order = await DriverOrderService.pickupOrder(id, driverId);
      return success(res, order, "Order picked up successfully");
    } catch (err) {
      next(err);
    }
  }

  static async arriveOrder(req, res, next) {
    try {
      const driverId = req.user.id;
      const { id } = req.params;
      const order = await DriverOrderService.arriveOrder(id, driverId);
      return success(res, order, "Order arrived successfully");
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

  static async failOrder(req, res, next) {
    try {
      const driverId = req.user.id;
      const { id } = req.params;
      const { reason } = req.body;
      const order = await DriverOrderService.failOrder(id, driverId, reason);
      return success(res, order, "Order marked as failed (bom hàng) successfully");
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
