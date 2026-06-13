const OrderModel = require("../models/OrderModel");

class DriverOrderService {
  static async getPendingOrders() {
    return await OrderModel.findPendingOrders();
  }

  static async acceptOrder(orderId, driverId) {
    const acceptedOrder = await OrderModel.acceptOrder(orderId, driverId);
    if (!acceptedOrder) {
      throw new Error("Order not found, already accepted, or unavailable.");
    }
    return acceptedOrder;
  }

  static async completeOrder(orderId, driverId) {
    const completedOrder = await OrderModel.completeOrder(orderId, driverId);
    if (!completedOrder) {
      throw new Error("Order not found or cannot be completed by you.");
    }
    return completedOrder;
  }

  static async getDriverOrders(driverId) {
    return await OrderModel.findByDriverId(driverId);
  }
}

module.exports = DriverOrderService;
