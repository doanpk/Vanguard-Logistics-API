const OrderModel = require("../models/OrderModel");

class OrderService {
  static async getAllOrders() {
    return await OrderModel.getAll();
  }

  static async createOrder(orderData) {
    if (!orderData.customerName || !orderData.deliveryAddress) {
      throw new Error("Customer Name and Delivery Address are required.");
    }
    return await OrderModel.create(orderData);
  }

  static async updateOrderStatus(id, status) {
    if (!id || !status) {
      throw new Error("Order ID and Status are required.");
    }
    const updatedOrder = await OrderModel.updateStatus(id, status);
    if (!updatedOrder) {
      throw new Error("Order not found.");
    }
    return updatedOrder;
  }
}

module.exports = OrderService;
