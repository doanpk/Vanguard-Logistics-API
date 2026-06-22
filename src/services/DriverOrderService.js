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
    if (!canTransition(order.status, "preparing")) {
      const err = new Error(
        `Cannot accept order. Current status '${order.status}' cannot transition to 'preparing'.`
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

  static async arriveStoreOrder(orderId, driverId) {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      const err = new Error("Order not found.");
      err.status = 404;
      throw err;
    }

    if (order.driver_id !== driverId) {
      const err = new Error("You can only update your own orders.");
      err.status = 403;
      throw err;
    }

    if (!canTransition(order.status, "arrived_store")) {
      const err = new Error(
        `Cannot arrive at store. Current status '${order.status}' cannot transition to 'arrived_store'.`
      );
      err.status = 400;
      throw err;
    }

    const arrivedOrder = await OrderModel.arriveStoreOrder(orderId, driverId);
    if (!arrivedOrder) {
      const err = new Error("Order cannot be updated to arrived_store.");
      err.status = 400;
      throw err;
    }
    return arrivedOrder;
  }

  static async pickupOrder(orderId, driverId) {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      const err = new Error("Order not found.");
      err.status = 404;
      throw err;
    }

    if (order.driver_id !== driverId) {
      const err = new Error("You can only pickup your own orders.");
      err.status = 403;
      throw err;
    }

    if (!canTransition(order.status, "delivering")) {
      const err = new Error(
        `Cannot pickup order. Current status '${order.status}' cannot transition to 'delivering'.`
      );
      err.status = 400;
      throw err;
    }

    const pickupedOrder = await OrderModel.pickupOrder(orderId, driverId);
    if (!pickupedOrder) {
      const err = new Error("Order cannot be picked up.");
      err.status = 400;
      throw err;
    }
    return pickupedOrder;
  }

  static async arriveOrder(orderId, driverId) {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      const err = new Error("Order not found.");
      err.status = 404;
      throw err;
    }

    if (order.driver_id !== driverId) {
      const err = new Error("You can only update your own orders.");
      err.status = 403;
      throw err;
    }

    if (!canTransition(order.status, "arrived")) {
      const err = new Error(
        `Cannot arrive at order. Current status '${order.status}' cannot transition to 'arrived'.`
      );
      err.status = 400;
      throw err;
    }

    const arrivedOrder = await OrderModel.arriveOrder(orderId, driverId);
    if (!arrivedOrder) {
      const err = new Error("Order cannot be arrived.");
      err.status = 400;
      throw err;
    }
    return arrivedOrder;
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

    // WALLET LOGIC: Add money to Store and Driver
    const UserModel = require("../models/UserModel");
    if (order.store_id && order.total_price) {
      await UserModel.updateBalance(order.store_id, order.total_price);
    }
    if (order.delivery_fee) {
      await UserModel.updateBalance(driverId, order.delivery_fee);
    }

    return completedOrder;
  }

  // Feature: Bom Hàng (Fail Order)
  static async failOrder(orderId, driverId, reason) {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      const err = new Error("Order not found.");
      err.status = 404;
      throw err;
    }

    if (order.driver_id !== driverId) {
      const err = new Error("You can only fail your own orders.");
      err.status = 403;
      throw err;
    }

    if (!canTransition(order.status, "failed")) {
      const err = new Error(
        `Cannot mark as failed. Current status '${order.status}' cannot transition to 'failed'.`
      );
      err.status = 400;
      throw err;
    }

    const failedOrder = await OrderModel.failOrder(orderId, driverId, order.status);
    if (!failedOrder) {
      const err = new Error("Order not found or cannot be marked as failed by you.");
      err.status = 400;
      throw err;
    }

    // WALLET LOGIC FOR BOM HÀNG:
    // Tiền của Khách đã bị trừ 100% lúc tạo đơn. Do Khách bom hàng, hệ thống thu 100%.
    // Trả tiền món ăn cho Quán (vì Quán đã làm đồ).
    // Trả tiền ship cho Tài xế (vì Tài xế đã chạy).
    const UserModel = require("../models/UserModel");
    if (order.store_id && order.total_price) {
      await UserModel.updateBalance(order.store_id, order.total_price);
    }
    if (order.delivery_fee) {
      await UserModel.updateBalance(driverId, order.delivery_fee);
    }

    // (Optional) Log the reason somewhere, e.g. adding a message to OrderMessages
    if (reason) {
      const MessageModel = require("../models/MessageModel");
      await MessageModel.addMessage(orderId, driverId, "driver", `Hệ thống: Tài xế báo cáo Bom Hàng. Lý do: ${reason}`);
    }

    return failedOrder;
  }

  static async getDriverOrders(driverId) {
    return await OrderModel.findByDriverId(driverId);
  }
}

module.exports = DriverOrderService;
