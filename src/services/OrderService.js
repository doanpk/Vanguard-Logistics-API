const OrderModel = require("../models/OrderModel");
const { canTransition } = require("../utils/orderStateMachine");

class OrderService {
  static async getAllOrders() {
    return await OrderModel.getAll();
  }

  static async getDashboard() {
    const orders = await OrderModel.getAll();
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const accepted = orders.filter(o => o.status === 'accepted').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    
    return {
      total,
      stats: { pending, accepted, completed, cancelled }
    };
  }

  static async createOrder(orderData) {
    if (!orderData.customerName || !orderData.deliveryAddress) {
      const err = new Error("Customer Name and Delivery Address are required.");
      err.status = 400;
      throw err;
    }
    return await OrderModel.create(orderData);
  }

  // Bug 4 Fix: Validate state transition using state machine before updating
  static async updateOrderStatus(id, status) {
    if (!id || !status) {
      const err = new Error("Order ID and Status are required.");
      err.status = 400;
      throw err;
    }

    // Fetch current order to validate transition
    const order = await OrderModel.findById(id);
    if (!order) {
      const err = new Error("Order not found.");
      err.status = 404;
      throw err;
    }

    // Bug 4: Validate state transition using state machine
    if (!canTransition(order.status, status)) {
      const err = new Error(
        `Invalid status transition from '${order.status}' to '${status}'.`
      );
      err.status = 400;
      throw err;
    }

    const updatedOrder = await OrderModel.updateStatus(id, status);
    if (!updatedOrder) {
      const err = new Error("Failed to update order status.");
      err.status = 500;
      throw err;
    }
    return updatedOrder;
  }
}

module.exports = OrderService;
