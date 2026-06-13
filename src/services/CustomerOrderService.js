const OrderModel = require("../models/OrderModel");

class CustomerOrderService {
  static async createOrder(customerId, data) {
    const { pickupAddress, deliveryAddress, itemDescription } = data;
    if (!pickupAddress || !deliveryAddress) {
      throw new Error("Pickup address and delivery address are required.");
    }
    return await OrderModel.create(
      customerId,
      pickupAddress,
      deliveryAddress,
      itemDescription,
    );
  }

  static async getCustomerOrders(customerId) {
    return await OrderModel.findByCustomerId(customerId);
  }

  static async getOrderDetails(id, customerId) {
    const order = await OrderModel.findByIdAndCustomerId(id, customerId);
    if (!order) {
      throw new Error("Order not found or access denied.");
    }
    return order;
  }
}

module.exports = CustomerOrderService;
