const CustomerOrderService = require("../services/CustomerOrderService");
const StoreOrderService = require("../services/StoreOrderService");
const { success, error } = require("../utils/responseHelper");

class CustomerOrderController {
  static async getStores(req, res, next) {
    try {
      const stores = await StoreOrderService.getAllStores();
      return success(res, stores, "Stores retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  static async getStoreMenu(req, res, next) {
    try {
      const storeId = req.params.id;
      const data = await StoreOrderService.getStoreMenuForCustomer(storeId);
      return success(res, data, "Store menu retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  static async createOrder(req, res, next) {
    try {
      const customerId = req.user.id;
      const { storeId, items, deliveryAddress } = req.body;

      if (!storeId || !deliveryAddress || !items || !Array.isArray(items) || items.length === 0) {
        return error(res, "Store ID, items array, and delivery address are required.", 400);
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
