const CustomerOrderService = require("../services/CustomerOrderService");
const { success, error } = require("../utils/responseHelper");

class CustomerOrderController {
  // Feature 2: Input validation for create order
  static async createOrder(req, res, next) {
    try {
      const customerId = req.user.id; // Taken from JWT

      // Feature 2: Validate required fields
      const { pickupAddress, deliveryAddress, itemDescription } = req.body;
      const errors = [];
      if (!pickupAddress || pickupAddress.trim().length === 0) {
        errors.push("Pickup address is required.");
      }
      if (!deliveryAddress || deliveryAddress.trim().length === 0) {
        errors.push("Delivery address is required.");
      }
      if (!itemDescription || itemDescription.trim().length === 0) {
        errors.push("Item description is required.");
      }
      if (errors.length > 0) {
        return error(res, errors.join(" "), 400);
      }

      const newOrder = await CustomerOrderService.createOrder(
        customerId,
        req.body,
      );
      return success(res, newOrder, "Order created successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  // AI API Integration: Smart Create Order using natural language
  static async smartCreateOrder(req, res, next) {
    try {
      const customerId = req.user.id;
      const { prompt } = req.body;

      if (!prompt || prompt.trim().length === 0) {
        return error(res, "Prompt is required.", 400);
      }

      const newOrder = await CustomerOrderService.smartCreateOrder(
        customerId,
        prompt
      );
      return success(res, newOrder, "Smart order created successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  static async getOrders(req, res, next) {
    try {
      const customerId = req.user.id;
      const orders = await CustomerOrderService.getCustomerOrders(customerId);
      return success(res, orders, "Orders retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  static async getOrderById(req, res, next) {
    try {
      const customerId = req.user.id;
      const order = await CustomerOrderService.getOrderDetails(
        req.params.id,
        customerId,
      );
      return success(res, order, "Order details retrieved");
    } catch (err) {
      next(err);
    }
  }

  // Feature 1: Cancel order controller method
  static async cancelOrder(req, res, next) {
    try {
      const customerId = req.user.id;
      const { id } = req.params;
      const cancelledOrder = await CustomerOrderService.cancelOrder(
        id,
        customerId,
      );
      return success(res, cancelledOrder, "Order cancelled successfully");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CustomerOrderController;
