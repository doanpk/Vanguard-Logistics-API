const OrderModel = require("../models/OrderModel");
const { canTransition } = require("../utils/orderStateMachine");

class DriverOrderService {
  static async getPendingOrders() {
    return await OrderModel.findPendingOrders();
  }

  // Bug 1 Fix: Atomic accept with race condition protection via Model layer
  // Bug 4 Fix: State machine validation before transition
  static async acceptOrder(orderId, driverId) {
    // Fetch order to validate state transition
    const order = await OrderModel.findById(orderId);
    if (!order) {
      const err = new Error("Order not found.");
      err.status = 404;
      throw err;
    }

    // Bug 4: Validate state transition using state machine
    if (!canTransition(order.status, "accepted")) {
      const err = new Error(
        `Cannot accept order. Current status '${order.status}' cannot transition to 'accepted'.`
      );
      err.status = 400;
      throw err;
    }

    // Bug 1: Atomic UPDATE — if another driver already accepted, changes === 0
    const acceptedOrder = await OrderModel.acceptOrder(orderId, driverId);
    if (!acceptedOrder) {
      const err = new Error("Order has already been accepted by another driver.");
      err.status = 409;
      throw err;
    }
    return acceptedOrder;
  }

  // Bug 2 Fix: Verify driver owns the order before completing
  // Bug 4 Fix: State machine validation before transition
  static async completeOrder(orderId, driverId) {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      const err = new Error("Order not found.");
      err.status = 404;
      throw err;
    }

    // Bug 2: Ensure only the assigned driver can complete
    if (order.driver_id !== driverId) {
      const err = new Error("You can only complete your own orders.");
      err.status = 403;
      throw err;
    }

    // Bug 4: Validate state transition using state machine
    if (!canTransition(order.status, "completed")) {
      const err = new Error(
        `Cannot complete order. Current status '${order.status}' cannot transition to 'completed'.`
      );
      err.status = 400;
      throw err;
    }

    const completedOrder = await OrderModel.completeOrder(orderId, driverId);
    if (!completedOrder) {
      const err = new Error("Order not found or cannot be completed by you.");
      err.status = 400;
      throw err;
    }
    return completedOrder;
  }

  static async getDriverOrders(driverId) {
    return await OrderModel.findByDriverId(driverId);
  }
}

module.exports = DriverOrderService;
